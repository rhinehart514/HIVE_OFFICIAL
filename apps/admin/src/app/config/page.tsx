"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import {
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

/* ── types ─────────────────────────────────────────────────────── */

interface AppConfig {
  key: string;
  value: unknown;
  description: string;
  category: string;
  updatedAt?: string;
  updatedBy?: string;
}

const CATEGORIES = ["access", "ui", "features", "testing"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  access: "Access",
  ui: "UI",
  features: "Features",
  testing: "Testing",
};

/* ── default configs to seed ───────────────────────────────────── */

const DEFAULT_CONFIGS: Omit<AppConfig, "updatedAt" | "updatedBy">[] = [
  // Access
  { key: "access_gate_enabled", value: true, description: "Require access code to sign up", category: "access" },
  { key: "allowed_email_domains", value: ["buffalo.edu"], description: "Email domains allowed to register", category: "access" },
  { key: "maintenance_mode", value: false, description: "Show maintenance page to all non-admin users", category: "access" },
  { key: "maintenance_message", value: "", description: "Message shown during maintenance", category: "access" },
  // UI
  { key: "landing_headline", value: "Your Club Is Already Here", description: "Landing page headline", category: "ui" },
  { key: "landing_subheadline", value: "", description: "Landing page subheadline", category: "ui" },
  { key: "accent_color", value: "#FFD700", description: "Primary accent color", category: "ui" },
  { key: "show_beta_badge", value: true, description: "Show beta badge in nav", category: "ui" },
  // Features
  { key: "events_enabled", value: true, description: "Enable events in spaces", category: "features" },
  { key: "chat_enabled", value: true, description: "Enable chat in spaces", category: "features" },
  { key: "create_enabled", value: true, description: "Enable Create/HiveLab", category: "features" },
  { key: "posts_enabled", value: true, description: "Enable posts in spaces", category: "features" },
  // Testing
  { key: "test_user_emails", value: [] as string[], description: "Emails that bypass access gate for testing", category: "testing" },
  { key: "debug_mode", value: false, description: "Show debug info in console", category: "testing" },
  { key: "force_onboarding", value: false, description: "Force all users through onboarding again", category: "testing" },
];

/* ── value editor ──────────────────────────────────────────────── */

function ValueEditor({
  value,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => { onChange(!value); }}
          className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-[#FFD700]" : "bg-white/20"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${value ? "translate-x-5" : ""}`}
          />
        </button>
        <span className="text-sm text-white/70">{value ? "Enabled" : "Disabled"}</span>
        <div className="ml-auto flex gap-2">
          <button onClick={onSave} disabled={saving} className="p-1.5 rounded-md bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30 disabled:opacity-50">
            <CheckIcon className="h-4 w-4" />
          </button>
          <button onClick={onCancel} className="p-1.5 rounded-md bg-white/10 text-white/50 hover:bg-white/20">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50"
        />
        <button onClick={onSave} disabled={saving} className="p-1.5 rounded-md bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30 disabled:opacity-50">
          <CheckIcon className="h-4 w-4" />
        </button>
        <button onClick={onCancel} className="p-1.5 rounded-md bg-white/10 text-white/50 hover:bg-white/20">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const text = JSON.stringify(value, null, 2);
    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* invalid json, keep typing */ }
          }}
          rows={3}
          className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-[#FFD700]/50 resize-y"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onSave} disabled={saving} className="px-3 py-1 rounded-md bg-[#FFD700]/20 text-[#FFD700] text-sm hover:bg-[#FFD700]/30 disabled:opacity-50">
            Save
          </button>
          <button onClick={onCancel} className="px-3 py-1 rounded-md bg-white/10 text-white/50 text-sm hover:bg-white/20">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    const text = JSON.stringify(value, null, 2);
    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch { /* invalid json */ }
          }}
          rows={5}
          className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-[#FFD700]/50 resize-y"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onSave} disabled={saving} className="px-3 py-1 rounded-md bg-[#FFD700]/20 text-[#FFD700] text-sm hover:bg-[#FFD700]/30 disabled:opacity-50">
            Save
          </button>
          <button onClick={onCancel} className="px-3 py-1 rounded-md bg-white/10 text-white/50 text-sm hover:bg-white/20">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // String
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FFD700]/50"
      />
      <button onClick={onSave} disabled={saving} className="p-1.5 rounded-md bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700]/30 disabled:opacity-50">
        <CheckIcon className="h-4 w-4" />
      </button>
      <button onClick={onCancel} className="p-1.5 rounded-md bg-white/10 text-white/50 hover:bg-white/20">
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── value display ─────────────────────────────────────────────── */

function ValueDisplay({ value }: { value: unknown }) {
  if (typeof value === "boolean") {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
        {value ? "Enabled" : "Disabled"}
      </span>
    );
  }
  if (Array.isArray(value)) {
    return <span className="text-sm text-white/70 font-mono">{JSON.stringify(value)}</span>;
  }
  if (typeof value === "object" && value !== null) {
    return <span className="text-sm text-white/70 font-mono">{JSON.stringify(value)}</span>;
  }
  return <span className="text-sm text-white/70">{String(value || "—")}</span>;
}

/* ── config card ───────────────────────────────────────────────── */

function ConfigCard({ config, onSave }: { config: AppConfig; onSave: (key: string, value: unknown) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState<unknown>(config.value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config.key, editValue);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium text-white font-mono">{config.key}</h3>
          <p className="text-xs text-white/40 mt-0.5">{config.description}</p>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditValue(config.value); setEditing(true); }}
            className="p-1.5 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-3">
        {editing ? (
          <ValueEditor
            value={editValue}
            onChange={setEditValue}
            onCancel={() => setEditing(false)}
            onSave={handleSave}
            saving={saving}
          />
        ) : (
          <ValueDisplay value={config.value} />
        )}
      </div>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────────────── */

export default function AppConfigPage() {
  const router = useRouter();
  const { admin, loading, isAuthenticated } = useAdminAuth();
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [activeTab, setActiveTab] = useState<Category>("access");
  const [fetching, setFetching] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  const loadConfigs = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetchWithAuth("/api/admin/config");
      const data = await res.json();
      if (data.success) {
        setConfigs(data.configs || []);
      }
    } catch (err) {
      console.error("Failed to load configs", err);
    } finally {
      setFetching(false);
    }
  }, []);

  // Seed missing defaults
  const seedDefaults = useCallback(async (existingConfigs: AppConfig[]) => {
    const existingKeys = new Set(existingConfigs.map((c) => c.key));
    const missing = DEFAULT_CONFIGS.filter((d) => !existingKeys.has(d.key));
    if (missing.length === 0) return;

    setSeeding(true);
    try {
      await Promise.all(
        missing.map((cfg) =>
          fetchWithAuth("/api/admin/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cfg),
          })
        )
      );
      await loadConfigs();
    } finally {
      setSeeding(false);
    }
  }, [loadConfigs]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConfigs();
    }
  }, [isAuthenticated, loadConfigs]);

  // Seed after first load
  useEffect(() => {
    if (!fetching && configs.length >= 0 && isAuthenticated) {
      seedDefaults(configs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetching]);

  const handleSave = async (key: string, value: unknown) => {
    const res = await fetchWithAuth(`/api/admin/config/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const data = await res.json();
    if (data.success) {
      setConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, value } : c))
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  if (!admin) return null;

  const filteredConfigs = configs.filter((c) => c.category === activeTab);

  return (
    <div className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="flex items-center gap-3 h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <Cog6ToothIcon className="h-5 w-5 text-[#FFD700]" />
          <h1 className="text-lg font-semibold text-white">App Config</h1>
          <button
            onClick={loadConfigs}
            disabled={fetching || seeding}
            className="ml-auto p-2 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${fetching || seeding ? "animate-spin" : ""}`} />
          </button>
        </header>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 p-1 rounded-lg bg-white/5 w-fit">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === cat
                    ? "bg-[#FFD700]/20 text-[#FFD700]"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Config cards */}
        <div className="p-6">
          {fetching && configs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-[#FFD700]" />
            </div>
          ) : filteredConfigs.length === 0 ? (
            <p className="text-white/40 text-sm py-8 text-center">
              No configs in this category yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {filteredConfigs.map((config) => (
                <ConfigCard key={config.key} config={config} onSave={handleSave} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
