"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
} from "@hive/ui";
import { useAdminAuth } from "@/lib/auth";

interface EventSource {
  type: "campuslabs" | "presence" | "generic_rss" | "atom";
  url: string;
  enabled: boolean;
  syncFrequency: "daily" | "weekly";
  lastSyncAt?: string;
}

interface School {
  id: string;
  name: string;
  shortName?: string;
  domain: string;
  campusId: string;
  status: "waitlist" | "beta" | "active" | "suspended";
  location: {
    city: string;
    state: string;
    country: string;
  };
  emailDomains: {
    student: string[];
    faculty: string[];
    staff: string[];
    alumni: string[];
  };
  eventSources: EventSource[];
  brandColors?: {
    primary: string;
    secondary: string;
  };
  maxUsers?: number;
  welcomeMessage?: string;
  stats?: {
    studentCount: number;
    facultyCount: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_SCHOOL: Partial<School> = {
  name: "",
  domain: "",
  status: "waitlist",
  location: { city: "", state: "", country: "USA" },
  emailDomains: { student: [], faculty: [], staff: [], alumni: [] },
  eventSources: [],
  brandColors: { primary: "#FFD700", secondary: "#0A0A0A" },
};

export function SchoolManagementDashboard() {
  const { admin } = useAdminAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<School>>(DEFAULT_SCHOOL);
  const [saving, setSaving] = useState(false);

  const fetchSchools = useCallback(async () => {
    if (!admin) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/schools", {
        headers: { Authorization: `Bearer ${admin.id}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch schools");
      }

      const data = await response.json();
      setSchools(data.schools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schools");
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setFormData(school);
    setIsCreating(false);
  };

  const handleNewSchool = () => {
    setSelectedSchool(null);
    setFormData(DEFAULT_SCHOOL);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!admin) return;
    setSaving(true);
    setError(null);

    try {
      const url = isCreating
        ? "/api/admin/schools"
        : `/api/admin/schools/${selectedSchool?.id}`;
      const method = isCreating ? "POST" : "PATCH";

      // For new schools, generate ID from name
      const payload = isCreating
        ? {
            ...formData,
            id: formData.name
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, ""),
          }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.id}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save school");
      }

      await fetchSchools();
      setSelectedSchool(null);
      setIsCreating(false);
      setFormData(DEFAULT_SCHOOL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save school");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schoolId: string) => {
    if (!admin || !confirm("Are you sure you want to suspend this school?"))
      return;

    try {
      const response = await fetch(`/api/admin/schools/${schoolId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${admin.id}` },
      });

      if (!response.ok) {
        throw new Error("Failed to suspend school");
      }

      await fetchSchools();
      setSelectedSchool(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend school");
    }
  };

  const updateFormField = (field: string, value: unknown) => {
    setFormData((prev) => {
      const keys = field.split(".");
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      // Handle nested fields like "location.city"
      const [parent, child] = keys;
      return {
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: value,
        },
      };
    });
  };

  const updateEmailDomain = (type: string, domains: string) => {
    setFormData((prev) => {
      const currentDomains = prev.emailDomains || { student: [], faculty: [], staff: [], alumni: [] };
      return {
        ...prev,
        emailDomains: {
          ...currentDomains,
          [type]: domains
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean),
        },
      };
    });
  };

  const addEventSource = () => {
    setFormData((prev) => ({
      ...prev,
      eventSources: [
        ...(prev.eventSources || []),
        {
          type: "campuslabs" as const,
          url: "",
          enabled: true,
          syncFrequency: "weekly" as const,
        },
      ],
    }));
  };

  const updateEventSource = (index: number, field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      eventSources: (prev.eventSources || []).map((source, i) =>
        i === index ? { ...source, [field]: value } : source
      ),
    }));
  };

  const removeEventSource = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      eventSources: (prev.eventSources || []).filter((_, i) => i !== index),
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "beta":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "waitlist":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading schools...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">School Management</h2>
        <Button onClick={handleNewSchool} variant="default">
          + Add School
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* School List */}
        <Card className="border-gray-700 bg-gray-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white">Schools ({schools.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSelectSchool(school)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedSchool?.id === school.id
                      ? "bg-amber-500/20 border border-amber-500/30"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{school.name}</div>
                      <div className="text-sm text-gray-400">
                        {school.domain}
                      </div>
                    </div>
                    <Badge className={getStatusColor(school.status)}>
                      {school.status}
                    </Badge>
                  </div>
                </button>
              ))}
              {schools.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No schools configured
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* School Form */}
        <Card className="border-gray-700 bg-gray-900/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">
              {isCreating
                ? "Add New School"
                : selectedSchool
                ? `Edit: ${selectedSchool.name}`
                : "Select a School"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isCreating || selectedSchool) && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-gray-300">School Name</Label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => updateFormField("name", e.target.value)}
                      placeholder="University of Example"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Primary Domain</Label>
                    <Input
                      value={formData.domain || ""}
                      onChange={(e) => updateFormField("domain", e.target.value)}
                      placeholder="example.edu"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Short Name</Label>
                    <Input
                      value={formData.shortName || ""}
                      onChange={(e) =>
                        updateFormField("shortName", e.target.value)
                      }
                      placeholder="UE"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Status</Label>
                    <select
                      value={formData.status || "waitlist"}
                      onChange={(e) => updateFormField("status", e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-gray-800 border border-gray-700 text-white"
                    >
                      <option value="waitlist">Waitlist</option>
                      <option value="beta">Beta</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label className="text-gray-300 mb-2 block">Location</Label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      value={formData.location?.city || ""}
                      onChange={(e) =>
                        updateFormField("location.city", e.target.value)
                      }
                      placeholder="City"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Input
                      value={formData.location?.state || ""}
                      onChange={(e) =>
                        updateFormField("location.state", e.target.value)
                      }
                      placeholder="State"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <Input
                      value={formData.location?.country || "USA"}
                      onChange={(e) =>
                        updateFormField("location.country", e.target.value)
                      }
                      placeholder="Country"
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                {/* Email Domains */}
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    Email Domains (comma-separated)
                  </Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-gray-500 text-sm">Student</Label>
                      <Input
                        value={formData.emailDomains?.student?.join(", ") || ""}
                        onChange={(e) =>
                          updateEmailDomain("student", e.target.value)
                        }
                        placeholder="example.edu, mail.example.edu"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Faculty</Label>
                      <Input
                        value={formData.emailDomains?.faculty?.join(", ") || ""}
                        onChange={(e) =>
                          updateEmailDomain("faculty", e.target.value)
                        }
                        placeholder="example.edu"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Staff</Label>
                      <Input
                        value={formData.emailDomains?.staff?.join(", ") || ""}
                        onChange={(e) =>
                          updateEmailDomain("staff", e.target.value)
                        }
                        placeholder="example.edu"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-500 text-sm">Alumni</Label>
                      <Input
                        value={formData.emailDomains?.alumni?.join(", ") || ""}
                        onChange={(e) =>
                          updateEmailDomain("alumni", e.target.value)
                        }
                        placeholder="alumni.example.edu"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Sources */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-gray-300">RSS/Atom Event Sources</Label>
                    <Button
                      onClick={addEventSource}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      + Add Source
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(formData.eventSources || []).map((source, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-800 rounded-lg space-y-3"
                      >
                        <div className="grid gap-3 md:grid-cols-4">
                          <select
                            value={source.type}
                            onChange={(e) =>
                              updateEventSource(index, "type", e.target.value)
                            }
                            className="h-10 px-3 rounded-md bg-gray-700 border border-gray-600 text-white"
                          >
                            <option value="campuslabs">CampusLabs</option>
                            <option value="presence">Presence</option>
                            <option value="generic_rss">Generic RSS</option>
                            <option value="atom">Atom</option>
                          </select>
                          <Input
                            value={source.url}
                            onChange={(e) =>
                              updateEventSource(index, "url", e.target.value)
                            }
                            placeholder="https://school.campuslabs.com/engage/events.rss"
                            className="md:col-span-2 bg-gray-700 border-gray-600 text-white"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-sm text-gray-400">
                              <input
                                type="checkbox"
                                checked={source.enabled}
                                onChange={(e) =>
                                  updateEventSource(
                                    index,
                                    "enabled",
                                    e.target.checked
                                  )
                                }
                                className="rounded"
                              />
                              Enabled
                            </label>
                            <Button
                              onClick={() => removeEventSource(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <select
                            value={source.syncFrequency}
                            onChange={(e) =>
                              updateEventSource(
                                index,
                                "syncFrequency",
                                e.target.value
                              )
                            }
                            className="h-8 px-2 text-sm rounded-md bg-gray-700 border border-gray-600 text-white"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                          {source.lastSyncAt && (
                            <span className="text-xs text-gray-500">
                              Last sync:{" "}
                              {new Date(source.lastSyncAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(formData.eventSources || []).length === 0 && (
                      <div className="text-center text-gray-500 py-4 border border-dashed border-gray-700 rounded-lg">
                        No event sources configured
                      </div>
                    )}
                  </div>
                </div>

                {/* Brand Colors */}
                <div>
                  <Label className="text-gray-300 mb-2 block">
                    Brand Colors (optional)
                  </Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.brandColors?.primary || "#FFD700"}
                        onChange={(e) =>
                          updateFormField("brandColors.primary", e.target.value)
                        }
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <div>
                        <div className="text-sm text-gray-400">Primary</div>
                        <div className="text-white">
                          {formData.brandColors?.primary || "#FFD700"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.brandColors?.secondary || "#0A0A0A"}
                        onChange={(e) =>
                          updateFormField("brandColors.secondary", e.target.value)
                        }
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <div>
                        <div className="text-sm text-gray-400">Secondary</div>
                        <div className="text-white">
                          {formData.brandColors?.secondary || "#0A0A0A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    {saving ? "Saving..." : isCreating ? "Create School" : "Save Changes"}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedSchool(null);
                      setIsCreating(false);
                      setFormData(DEFAULT_SCHOOL);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  {selectedSchool && selectedSchool.id !== "ub-buffalo" && (
                    <Button
                      onClick={() => handleDelete(selectedSchool.id)}
                      variant="destructive"
                      className="ml-auto"
                    >
                      Suspend School
                    </Button>
                  )}
                </div>
              </div>
            )}
            {!isCreating && !selectedSchool && (
              <div className="text-center text-gray-500 py-8">
                Select a school from the list or click &quot;Add School&quot; to create
                a new one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
