#!/usr/bin/env python3
"""
Goose System - Fine-Tuning Script

Fine-tunes a small language model (Phi-3-mini) on HiveLab tool generation data
using LoRA (Low-Rank Adaptation) via Unsloth for 4x faster training.

Requirements:
    pip install unsloth transformers datasets peft trl

Usage:
    # On Google Colab (free T4 GPU):
    python fine-tune.py

    # Or locally with CUDA:
    python fine-tune.py --local

    # Export to GGUF for Ollama:
    python fine-tune.py --export-gguf

Output:
    ./goose-model/          # Fine-tuned model
    ./goose-model.gguf      # Quantized model for Ollama
"""

import argparse
import json
import os
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════

CONFIG = {
    # Model
    "base_model": "unsloth/Phi-3-mini-4k-instruct",
    "max_seq_length": 2048,
    "load_in_4bit": True,

    # LoRA
    "lora_r": 16,
    "lora_alpha": 16,
    "lora_dropout": 0,
    "target_modules": ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],

    # Training
    "batch_size": 2,
    "gradient_accumulation_steps": 4,
    "learning_rate": 2e-4,
    "num_epochs": 3,
    "warmup_steps": 5,
    "max_steps": -1,  # -1 = use num_epochs

    # Output
    "output_dir": "./goose-model",
    "gguf_output": "./goose-model.gguf",
}

# System prompt for Goose
SYSTEM_PROMPT = """You are Goose, an AI that generates HiveLab tools from natural language descriptions.

HiveLab tools are composed of visual elements that can be connected to create interactive experiences for campus communities.

OUTPUT FORMAT:
You must output valid JSON with this exact structure:
{"elements":[{"type":"<element-type>","instanceId":"<unique-id>","config":{...},"position":{"x":<number>,"y":<number>},"size":{"width":<number>,"height":<number>}}],"connections":[{"from":{"instanceId":"<source-id>","port":"<output-port>"},"to":{"instanceId":"<target-id>","port":"<input-port>"}}],"name":"<tool-name>","description":"<brief-description>","layout":"grid"}

RULES:
1. Always output valid JSON only - no explanations or markdown
2. Use only valid element types: poll-element, rsvp-button, countdown-timer, leaderboard, chart-display, result-list, form-builder, counter, timer, search-input, filter-selector, date-picker, availability-heatmap, member-list, space-events, announcement
3. Required configs: poll-element needs question+options, rsvp-button needs eventName, countdown-timer needs targetDate, chart-display needs chartType
4. Keep tools simple - 1-4 elements maximum"""


# ═══════════════════════════════════════════════════════════════════
# DATA LOADING
# ═══════════════════════════════════════════════════════════════════

def load_training_data(data_dir: str) -> list[dict]:
    """Load training data from JSONL files."""
    examples = []

    # Load all JSONL files
    data_path = Path(data_dir)
    for jsonl_file in data_path.glob("*.jsonl"):
        if "validation" in jsonl_file.name:
            continue  # Skip validation for training

        with open(jsonl_file, "r") as f:
            for line in f:
                if line.strip():
                    examples.append(json.loads(line))

    print(f"Loaded {len(examples)} training examples")
    return examples


def format_for_training(example: dict) -> str:
    """Format a training example for Phi-3 instruction format."""
    prompt = example["prompt"]
    output = json.dumps(example["output"], separators=(",", ":"))

    # Phi-3 instruction format
    return f"""<|system|>
{SYSTEM_PROMPT}
<|end|>
<|user|>
{prompt}
<|end|>
<|assistant|>
{output}
<|end|>"""


# ═══════════════════════════════════════════════════════════════════
# FINE-TUNING
# ═══════════════════════════════════════════════════════════════════

def fine_tune(args):
    """Run fine-tuning with Unsloth."""
    try:
        from unsloth import FastLanguageModel
        from datasets import Dataset
        from trl import SFTTrainer
        from transformers import TrainingArguments
    except ImportError:
        print("Missing dependencies. Install with:")
        print("  pip install unsloth transformers datasets peft trl")
        return

    print("=" * 60)
    print("GOOSE SYSTEM - Fine-Tuning")
    print("=" * 60)

    # Load model
    print(f"\nLoading base model: {CONFIG['base_model']}")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=CONFIG["base_model"],
        max_seq_length=CONFIG["max_seq_length"],
        load_in_4bit=CONFIG["load_in_4bit"],
        dtype=None,  # Auto-detect
    )

    # Add LoRA adapters
    print("\nAdding LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=CONFIG["lora_r"],
        target_modules=CONFIG["target_modules"],
        lora_alpha=CONFIG["lora_alpha"],
        lora_dropout=CONFIG["lora_dropout"],
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )

    # Load training data
    print("\nLoading training data...")
    data_dir = args.data_dir or str(
        Path(__file__).parent.parent.parent /
        "packages/core/src/hivelab/goose/training/data"
    )
    examples = load_training_data(data_dir)

    # Format examples
    formatted = [{"text": format_for_training(ex)} for ex in examples]
    dataset = Dataset.from_list(formatted)

    print(f"Training on {len(dataset)} examples")

    # Training arguments
    training_args = TrainingArguments(
        output_dir=CONFIG["output_dir"],
        per_device_train_batch_size=CONFIG["batch_size"],
        gradient_accumulation_steps=CONFIG["gradient_accumulation_steps"],
        learning_rate=CONFIG["learning_rate"],
        num_train_epochs=CONFIG["num_epochs"],
        warmup_steps=CONFIG["warmup_steps"],
        max_steps=CONFIG["max_steps"],
        fp16=not args.local,  # Use fp16 on GPU
        bf16=args.local,  # Use bf16 on Apple Silicon
        logging_steps=10,
        save_steps=100,
        save_total_limit=2,
        optim="adamw_8bit",
        seed=42,
    )

    # Create trainer
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=CONFIG["max_seq_length"],
        args=training_args,
    )

    # Train
    print("\nStarting training...")
    print("-" * 40)
    trainer.train()

    # Save model
    print("\nSaving fine-tuned model...")
    model.save_pretrained(CONFIG["output_dir"])
    tokenizer.save_pretrained(CONFIG["output_dir"])

    print(f"\nModel saved to: {CONFIG['output_dir']}")

    # Export to GGUF if requested
    if args.export_gguf:
        export_gguf(model, tokenizer)

    print("\n" + "=" * 60)
    print("Fine-tuning complete!")
    print("=" * 60)


def export_gguf(model, tokenizer):
    """Export model to GGUF format for Ollama."""
    print("\nExporting to GGUF format...")

    try:
        model.save_pretrained_gguf(
            CONFIG["gguf_output"].replace(".gguf", ""),
            tokenizer,
            quantization_method="q4_k_m",
        )
        print(f"GGUF model saved to: {CONFIG['gguf_output']}")
    except Exception as e:
        print(f"GGUF export failed: {e}")
        print("You can export manually with llama.cpp")


# ═══════════════════════════════════════════════════════════════════
# INFERENCE TEST
# ═══════════════════════════════════════════════════════════════════

def test_inference(args):
    """Test the fine-tuned model with sample prompts."""
    try:
        from unsloth import FastLanguageModel
    except ImportError:
        print("Missing unsloth. Install with: pip install unsloth")
        return

    print("Loading fine-tuned model...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=CONFIG["output_dir"],
        max_seq_length=CONFIG["max_seq_length"],
        load_in_4bit=True,
    )

    FastLanguageModel.for_inference(model)

    test_prompts = [
        "create a poll about favorite study spots",
        "event signup with countdown timer",
        "feedback form with results chart",
    ]

    print("\n" + "=" * 60)
    print("INFERENCE TEST")
    print("=" * 60)

    for prompt in test_prompts:
        print(f"\nPrompt: {prompt}")
        print("-" * 40)

        formatted_prompt = f"""<|system|>
{SYSTEM_PROMPT}
<|end|>
<|user|>
{prompt}
<|end|>
<|assistant|>
"""

        inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.3,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Extract just the assistant response
        if "<|assistant|>" in response:
            response = response.split("<|assistant|>")[-1].strip()

        print(f"Output: {response[:500]}...")

        # Validate JSON
        try:
            parsed = json.loads(response)
            print(f"✓ Valid JSON with {len(parsed.get('elements', []))} elements")
        except json.JSONDecodeError:
            print("✗ Invalid JSON output")


# ═══════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Goose System - Fine-tune a model for HiveLab tool generation"
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Run on local machine (uses bf16 for Apple Silicon)",
    )
    parser.add_argument(
        "--export-gguf",
        action="store_true",
        help="Export to GGUF format for Ollama after training",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test inference with the fine-tuned model",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        help="Path to training data directory",
    )

    args = parser.parse_args()

    if args.test:
        test_inference(args)
    else:
        fine_tune(args)


if __name__ == "__main__":
    main()
