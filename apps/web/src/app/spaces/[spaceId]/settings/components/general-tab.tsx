"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { Card, Input, cn } from "@hive/ui";

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
}

export function GeneralTab({ form, setForm, variants }: GeneralTabProps) {
  return (
    <motion.div
      key="general"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
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
