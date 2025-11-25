/**
 * AI Tool Generator Service
 *
 * Converts natural language prompts into ToolComposition JSON using Gemini API.
 * Supports streaming responses for real-time canvas updates.
 */

import { VertexAI } from '@google-cloud/vertexai';
import type { ToolComposition } from '../../domain/hivelab/tool-composition.types';
import { SYSTEM_PROMPT, generateInstanceId, type StreamingMessage } from './prompts/tool-generation.prompt';

/**
 * Configuration for Gemini model
 */
export interface AIGeneratorConfig {
  project: string;
  location: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Options for tool generation
 */
export interface GenerateToolOptions {
  prompt: string;
  templateId?: string;
  constraints?: {
    maxElements?: number;
    allowedCategories?: string[];
  };
}

/**
 * Result from tool generation
 */
export interface GenerateToolResult {
  composition: ToolComposition;
  explanation: string;
  suggestedName: string;
  suggestedDescription: string;
}

/**
 * Streaming chunk from Gemini
 */
export interface StreamingChunk {
  type: 'element_added' | 'generation_complete' | 'error' | 'status';
  element?: any;
  composition?: ToolComposition;
  status?: string;
  error?: string;
}

/**
 * AI Tool Generator Service
 *
 * Uses Gemini API (via Vertex AI) to generate ToolComposition from natural language.
 */
export class AIToolGeneratorService {
  private vertex: VertexAI;
  private config: AIGeneratorConfig;

  constructor(config: AIGeneratorConfig) {
    this.config = {
      model: 'gemini-1.5-pro',
      temperature: 0.7,
      maxOutputTokens: 4096,
      ...config
    };

    this.vertex = new VertexAI({
      project: this.config.project!,
      location: this.config.location!
    });
  }

  /**
   * Generate tool composition from prompt (non-streaming)
   */
  async generateTool(options: GenerateToolOptions): Promise<GenerateToolResult> {
    const model = this.vertex.preview.getGenerativeModel({
      model: this.config.model!,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
        candidateCount: 1
      }
    });

    // Construct user prompt
    const userPrompt = this.buildUserPrompt(options);

    // Generate
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will convert user prompts into ToolComposition JSON following the schema and examples provided.' }]
        },
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ]
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the final generation_complete message
    const parsed = this.parseResponse(text);

    if (parsed.type !== 'generation_complete' || !parsed.composition) {
      throw new Error('Invalid response from AI model: missing composition');
    }

    return {
      composition: parsed.composition,
      explanation: parsed.status || 'Tool generated successfully',
      suggestedName: parsed.composition.name,
      suggestedDescription: parsed.composition.description
    };
  }

  /**
   * Generate tool composition with streaming (for real-time canvas updates)
   */
  async *generateToolStreaming(options: GenerateToolOptions): AsyncGenerator<StreamingChunk, void, undefined> {
    const model = this.vertex.preview.getGenerativeModel({
      model: this.config.model!,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxOutputTokens,
        candidateCount: 1
      }
    });

    // Construct user prompt
    const userPrompt = this.buildUserPrompt(options);

    // Start streaming
    const streamingResp = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I will convert user prompts into ToolComposition JSON following the schema and examples provided.' }]
        },
        {
          role: 'user',
          parts: [{ text: userPrompt }]
        }
      ]
    });

    let buffer = '';

    try {
      for await (const chunk of streamingResp.stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
        buffer += text;

        // Try to parse JSON chunks from buffer
        const chunks = this.extractJSONChunks(buffer);

        for (const jsonStr of chunks.valid) {
          try {
            const parsed = JSON.parse(jsonStr);

            // Validate chunk type
            if (parsed.type === 'element_added') {
              yield {
                type: 'element_added',
                element: parsed.element,
                status: parsed.status || 'Adding element...'
              };
            } else if (parsed.type === 'generation_complete') {
              yield {
                type: 'generation_complete',
                composition: parsed.composition
              };
              return; // Done streaming
            }
          } catch (parseError) {
            console.error('[AIToolGenerator] Failed to parse JSON chunk:', parseError);
            // Continue - might be partial chunk
          }
        }

        // Keep unparsed remainder in buffer
        buffer = chunks.remainder;
      }

      // If buffer still has content, try final parse
      if (buffer.trim()) {
        try {
          const final = JSON.parse(buffer);
          if (final.type === 'generation_complete') {
            yield {
              type: 'generation_complete',
              composition: final.composition
            };
          }
        } catch (e) {
          throw new Error('Failed to parse final response from AI');
        }
      }
    } catch (error) {
      console.error('[AIToolGenerator] Streaming error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error during generation'
      };
    }
  }

  /**
   * Build user prompt from options
   */
  private buildUserPrompt(options: GenerateToolOptions): string {
    let prompt = `User request: "${options.prompt}"`;

    if (options.constraints?.maxElements) {
      prompt += `\n\nConstraint: Use at most ${options.constraints.maxElements} elements.`;
    }

    if (options.constraints?.allowedCategories?.length) {
      prompt += `\n\nConstraint: Only use elements from these categories: ${options.constraints.allowedCategories.join(', ')}.`;
    }

    if (options.templateId) {
      prompt += `\n\nHint: Consider starting from template "${options.templateId}" and customizing it.`;
    }

    prompt += `\n\nGenerate the tool using the streaming protocol (emit element_added messages, then generation_complete).`;

    return prompt;
  }

  /**
   * Parse response text into StreamingChunk
   */
  private parseResponse(text: string): StreamingChunk {
    // Try to extract JSON from text (might have markdown code blocks)
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error('No JSON found in response');
    }

    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return parsed;
    } catch (e) {
      throw new Error(`Failed to parse JSON: ${e}`);
    }
  }

  /**
   * Extract valid JSON objects from streaming buffer
   */
  private extractJSONChunks(buffer: string): { valid: string[]; remainder: string } {
    const valid: string[] = [];
    let remainder = buffer;

    // Try to find complete JSON objects in buffer
    // Look for patterns like ```json {...} ```
    const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = codeBlockRegex.exec(buffer)) !== null) {
      if (match[1]) {
        valid.push(match[1]);
      }
      remainder = buffer.slice(match.index + match[0].length);
    }

    // If no code blocks found, try raw JSON
    if (valid.length === 0) {
      const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/g;
      while ((match = jsonRegex.exec(buffer)) !== null) {
        try {
          JSON.parse(match[0]); // Validate it's valid JSON
          valid.push(match[0]);
          remainder = buffer.slice(match.index + match[0].length);
        } catch (e) {
          // Not valid JSON yet, might be partial
        }
      }
    }

    return { valid, remainder };
  }

  /**
   * Validate generated composition
   */
  validateComposition(composition: ToolComposition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!composition.name || composition.name.trim() === '') {
      errors.push('Tool name is required');
    }

    if (!composition.description || composition.description.trim() === '') {
      errors.push('Tool description is required');
    }

    if (!composition.elements || composition.elements.length === 0) {
      errors.push('Tool must have at least one element');
    }

    if (composition.elements) {
      composition.elements.forEach((element, index) => {
        if (!element.elementId) {
          errors.push(`Element ${index} missing elementId`);
        }
        if (!element.instanceId) {
          errors.push(`Element ${index} missing instanceId`);
        }
        if (!element.position) {
          errors.push(`Element ${index} missing position`);
        }
        if (!element.size) {
          errors.push(`Element ${index} missing size`);
        }
      });
    }

    if (composition.connections) {
      composition.connections.forEach((conn, index) => {
        if (!conn.from?.instanceId || !conn.to?.instanceId) {
          errors.push(`Connection ${index} missing instanceId`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create default AI generator instance for Firebase/GCP
 */
export function createAIToolGenerator(config?: Partial<AIGeneratorConfig>): AIToolGeneratorService {
  const defaultConfig: AIGeneratorConfig = {
    project: process.env.GOOGLE_CLOUD_PROJECT || 'hive-production',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    model: 'gemini-1.5-pro',
    temperature: 0.7,
    maxOutputTokens: 4096,
    ...config
  };

  return new AIToolGeneratorService(defaultConfig);
}
