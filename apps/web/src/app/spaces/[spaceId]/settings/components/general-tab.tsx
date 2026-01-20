"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { Card, Input, cn, toast } from "@hive/ui";
import { PhotoIcon, ArrowPathIcon, TrashIcon } from "@heroicons/react/24/outline";
import { secureApiFetch } from "@/lib/secure-auth-utils";
import { useParams } from "next/navigation";

export interface SpaceSettingsForm {
  name: string;
  description: string;
  category: string;
  joinPolicy: "open" | "approval" | "invite_only";
  visibility: "public" | "private";
  allowRSS: boolean;
  requireApproval: boolean;
}

interface GeneralTabProps {
  form: SpaceSettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SpaceSettingsForm>>;
  variants?: Variants;
  avatarUrl?: string;
  bannerUrl?: string;
  onAvatarChange?: (url: string | null) => void;
  onBannerChange?: (url: string | null) => void;
}

function ImageUploader({
  label,
  currentUrl,
  onUpload,
  onRemove,
  aspectRatio,
  fieldName,
  endpoint,
  spaceId,
}: {
  label: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
  aspectRatio: "square" | "banner";
  fieldName: string;
  endpoint: string;
  spaceId: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", "Please use JPEG, PNG, or WebP");
      return;
    }

    // Validate file size (5MB for avatar, 10MB for banner)
    const maxSize = aspectRatio === "square" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File too large", `Maximum size is ${aspectRatio === "square" ? "5MB" : "10MB"}`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      const res = await fetch(`/api/spaces/${spaceId}/${endpoint}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      const newUrl = data.data?.iconUrl || data.data?.avatarUrl || data.data?.bannerUrl || data.iconUrl || data.avatarUrl || data.bannerUrl;
      if (newUrl) {
        onUpload(newUrl);
        toast.success("Uploaded!", `${label} updated successfully`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error("Upload failed", message);
    } finally {
      setUploading(false);
      // Reset input
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/${endpoint}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to remove");
      }

      onRemove();
      toast.success("Removed!", `${label} removed successfully`);
    } catch (error) {
      toast.error("Failed to remove", "Please try again");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-300">
        {label}
      </label>
      <div
        className={cn(
          "relative group overflow-hidden rounded-xl border border-white/[0.06] bg-neutral-800/30",
          aspectRatio === "square" ? "w-24 h-24" : "w-full h-32"
        )}
      >
        {currentUrl ? (
          <>
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {uploading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <PhotoIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="p-2 rounded-lg bg-white/10 hover:bg-red-500/50 text-white transition-colors"
              >
                {removing ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <TrashIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-full flex flex-col items-center justify-center text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors"
          >
            {uploading ? (
              <ArrowPathIcon className="w-6 h-6 animate-spin mb-1" />
            ) : (
              <PhotoIcon className="w-6 h-6 mb-1" />
            )}
            <span className="text-xs">
              {uploading ? "Uploading..." : `Upload ${label}`}
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
      <p className="text-xs text-neutral-500">
        {aspectRatio === "square"
          ? "Square image, max 5MB (JPEG, PNG, WebP)"
          : "16:9 ratio recommended, max 10MB (JPEG, PNG, WebP)"}
      </p>
    </div>
  );
}

export function GeneralTab({ form, setForm, variants, avatarUrl, bannerUrl, onAvatarChange, onBannerChange }: GeneralTabProps) {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId || "";

  const [localAvatarUrl, setLocalAvatarUrl] = React.useState(avatarUrl);
  const [localBannerUrl, setLocalBannerUrl] = React.useState(bannerUrl);

  React.useEffect(() => {
    setLocalAvatarUrl(avatarUrl);
    setLocalBannerUrl(bannerUrl);
  }, [avatarUrl, bannerUrl]);

  const handleAvatarUpload = (url: string) => {
    setLocalAvatarUrl(url);
    onAvatarChange?.(url);
  };

  const handleAvatarRemove = () => {
    setLocalAvatarUrl(undefined);
    onAvatarChange?.(null);
  };

  const handleBannerUpload = (url: string) => {
    setLocalBannerUrl(url);
    onBannerChange?.(url);
  };

  const handleBannerRemove = () => {
    setLocalBannerUrl(undefined);
    onBannerChange?.(null);
  };

  return (
    <motion.div
      key="general"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      {/* Branding Card */}
      <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white mb-6">
          Space Branding
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploader
            label="Avatar"
            currentUrl={localAvatarUrl}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            aspectRatio="square"
            fieldName="avatar"
            endpoint="upload-avatar"
            spaceId={spaceId}
          />

          <ImageUploader
            label="Banner"
            currentUrl={localBannerUrl}
            onUpload={handleBannerUpload}
            onRemove={handleBannerRemove}
            aspectRatio="banner"
            fieldName="banner"
            endpoint="upload-banner"
            spaceId={spaceId}
          />
        </div>
      </Card>

      {/* General Settings Card */}
      <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white mb-6">
          General Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Space Name
            </label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="bg-neutral-800/50 border-neutral-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:border-white/30 focus:ring-1 focus:ring-white/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
              className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="club">Club</option>
              <option value="academic">Academic</option>
              <option value="student_org">Student Org</option>
              <option value="residential">Residential</option>
              <option value="university_org">University Org</option>
              <option value="greek_life">Greek Life</option>
              <option value="sports">Sports</option>
              <option value="arts">Arts</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Visibility
            </label>
            <select
              value={form.visibility}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  visibility: e.target.value as "public" | "private",
                }))
              }
              className="w-full bg-neutral-800/50 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="public">Public - Anyone can discover</option>
              <option value="private">Private - Invite only</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-sm font-medium text-white">Require Approval</p>
              <p className="text-xs text-neutral-500">
                New members must be approved
              </p>
            </div>
            <button
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  requireApproval: !prev.requireApproval,
                }))
              }
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                form.requireApproval ? "bg-life-gold" : "bg-[var(--bg-muted)]"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                  form.requireApproval ? "left-6" : "left-1"
                )}
              />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
