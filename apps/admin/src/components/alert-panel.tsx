"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Wrench,
} from "lucide-react";

interface AlertRule {
  id: string;
  name: string;
  type: string;
  threshold: number;
  comparison: string;
  window: string;
  enabled: boolean;
  priority: string;
  triggerCount: number;
}

interface TriggeredAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  type: string;
  priority: string;
  currentValue: number;
  threshold: number;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
}

interface AlertStats {
  totalRules: number;
  enabledRules: number;
  activeAlerts: number;
  criticalAlerts: number;
}

const ALERT_TYPES = [
  { value: "error_spike", label: "Error Spike", icon: AlertCircle },
  { value: "low_signups", label: "Low Signups", icon: TrendingDown },
  { value: "high_reports", label: "High Reports", icon: MessageSquare },
  { value: "inactive_spaces", label: "Inactive Spaces", icon: Users },
  { value: "tool_queue_backlog", label: "Tool Queue Backlog", icon: Wrench },
  { value: "churn_spike", label: "Churn Spike", icon: TrendingDown },
];

const COMPARISONS = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
];

const WINDOWS = [
  { value: "1h", label: "1 hour" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

const PRIORITIES = ["low", "medium", "high", "critical"];

export function AlertPanel() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "error_spike",
    threshold: 10,
    comparison: "gt",
    window: "1h",
    priority: "medium",
    enabled: true,
  });

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/alerts");
      const data = await response.json();

      if (data.success) {
        setRules(data.data.rules);
        setTriggeredAlerts(data.data.triggeredAlerts);
        setStats(data.data.stats);
      } else {
        setError(data.error?.message || "Failed to fetch alerts");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleSaveRule = async () => {
    try {
      const response = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          id: editingRule?.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setEditingRule(null);
        resetForm();
        fetchAlerts();
      } else {
        setError(data.error?.message || "Failed to save rule");
      }
    } catch {
      setError("Failed to save rule");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this alert rule?")) return;

    try {
      const response = await fetch(`/api/admin/alerts?id=${ruleId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        fetchAlerts();
      } else {
        setError(data.error?.message || "Failed to delete rule");
      }
    } catch {
      setError("Failed to delete rule");
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch("/api/admin/alerts/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchAlerts();
      } else {
        setError(data.error?.message || "Failed to acknowledge alert");
      }
    } catch {
      setError("Failed to acknowledge alert");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "error_spike",
      threshold: 10,
      comparison: "gt",
      window: "1h",
      priority: "medium",
      enabled: true,
    });
  };

  const openEditDialog = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      threshold: rule.threshold,
      comparison: rule.comparison,
      window: rule.window,
      priority: rule.priority,
      enabled: rule.enabled,
    });
    setShowCreateDialog(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20";
      default:
        return "text-blue-400 bg-blue-500/20";
    }
  };

  const getAlertIcon = (type: string) => {
    const alertType = ALERT_TYPES.find((t) => t.value === type);
    return alertType?.icon || AlertCircle;
  };

  const spinClass = loading ? "animate-spin" : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">
            Alert Management
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Configure alert rules and manage triggered alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${spinClass}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditingRule(null);
                  resetForm();
                }}
              >
                <Plus className="h-4 w-4" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Edit Alert Rule" : "Create Alert Rule"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., High Error Rate Alert"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Alert Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData({ ...formData, type: v })
                      }
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) =>
                        setFormData({ ...formData, priority: v })
                      }
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Comparison</Label>
                    <Select
                      value={formData.comparison}
                      onValueChange={(v) =>
                        setFormData({ ...formData, comparison: v })
                      }
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPARISONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold">Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={formData.threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          threshold: Number(e.target.value),
                        })
                      }
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Time Window</Label>
                    <Select
                      value={formData.window}
                      onValueChange={(v) =>
                        setFormData({ ...formData, window: v })
                      }
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WINDOWS.map((w) => (
                          <SelectItem key={w.value} value={w.value}>
                            {w.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Enabled</Label>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRule}>
                    {editingRule ? "Save Changes" : "Create Rule"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.totalRules}
                  </p>
                  <p className="text-xs text-zinc-500">Total Rules</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.enabledRules}
                  </p>
                  <p className="text-xs text-zinc-500">Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.activeAlerts}
                  </p>
                  <p className="text-xs text-zinc-500">Active Alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-400">
                    {stats.criticalAlerts}
                  </p>
                  <p className="text-xs text-zinc-500">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triggered Alerts */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {triggeredAlerts.filter((a) => !a.acknowledged).length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                    <p>No active alerts</p>
                  </div>
                ) : (
                  triggeredAlerts
                    .filter((a) => !a.acknowledged)
                    .map((alert) => {
                      const Icon = getAlertIcon(alert.type);
                      return (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-1.5 rounded ${getPriorityColor(alert.priority)}`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-100">
                                  {alert.ruleName}
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                  {alert.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant="outline"
                                    className={getPriorityColor(alert.priority)}
                                  >
                                    {alert.priority}
                                  </Badge>
                                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(
                                      alert.triggeredAt
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAcknowledge(alert.id)}
                              className="text-zinc-400 hover:text-zinc-100"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Alert Rules */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alert Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <BellOff className="h-8 w-8 mx-auto mb-2" />
                  <p>No alert rules configured</p>
                </div>
              ) : (
                rules.map((rule) => {
                  const Icon = getAlertIcon(rule.type);
                  const comparison = COMPARISONS.find(
                    (c) => c.value === rule.comparison
                  );
                  const window = WINDOWS.find((w) => w.value === rule.window);

                  return (
                    <div
                      key={rule.id}
                      className={`p-3 rounded-lg border ${
                        rule.enabled
                          ? "bg-zinc-800/50 border-zinc-700"
                          : "bg-zinc-900/30 border-zinc-800 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded bg-zinc-700/50">
                            <Icon className="h-4 w-4 text-zinc-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-100">
                              {rule.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {comparison?.label} {rule.threshold} in{" "}
                              {window?.label}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={getPriorityColor(rule.priority)}
                          >
                            {rule.priority}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(rule)}
                            className="text-zinc-400 hover:text-zinc-100"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {rule.triggerCount > 0 && (
                        <div className="mt-2 text-xs text-zinc-500">
                          Triggered {rule.triggerCount} times
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
