"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  UsersIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, cn } from "@hive/ui";
import type { SpaceSettingsForm } from "./general-tab";

interface MembersTabProps {
  spaceId: string;
  variants?: Variants;
}

export function MembersTab({ spaceId, variants }: MembersTabProps) {
  const router = useRouter();

  return (
    <motion.div
      key="members"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white mb-4">
          Member Management
        </h2>
        <p className="text-neutral-400 mb-4">
          View and manage space members, promote to admin, or remove members.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/spaces/${spaceId}/members`)}
          className="border-neutral-700 text-neutral-300 hover:bg-white/5"
        >
          <UsersIcon className="h-4 w-4 mr-1.5" />
          Manage Members
        </Button>
      </Card>
    </motion.div>
  );
}

interface PermissionsTabProps {
  variants?: Variants;
}

export function PermissionsTab({ variants }: PermissionsTabProps) {
  return (
    <motion.div
      key="permissions"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white mb-4">Permissions</h2>
        <p className="text-neutral-400 mb-4">
          Configure what different roles can do in your space.
        </p>
        <div className="p-4 bg-neutral-800/30 rounded-lg border border-neutral-700/50">
          <p className="text-sm text-neutral-500">
            Advanced permissions coming soon.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

interface IntegrationsTabProps {
  spaceId: string;
  form: SpaceSettingsForm;
  setForm: React.Dispatch<React.SetStateAction<SpaceSettingsForm>>;
  variants?: Variants;
}

export function IntegrationsTab({
  spaceId,
  form,
  setForm,
  variants,
}: IntegrationsTabProps) {
  const router = useRouter();

  return (
    <motion.div
      key="integrations"
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <h2 className="text-lg font-semibold text-white mb-4">Integrations</h2>
        <p className="text-neutral-400 mb-4">
          Enable tools like calendar, polls, and custom HiveLab tools.
        </p>

        <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/50 mb-3">
          <div>
            <p className="text-sm font-medium text-white">RSS Feed</p>
            <p className="text-xs text-neutral-500">
              Allow members to subscribe to updates
            </p>
          </div>
          <button
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                allowRSS: !prev.allowRSS,
              }))
            }
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors",
              form.allowRSS ? "bg-life-gold" : "bg-[var(--bg-muted)]"
            )}
          >
            <span
              className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                form.allowRSS ? "left-6" : "left-1"
              )}
            />
          </button>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push(`/spaces/${spaceId}/tools`)}
          className="border-neutral-700 text-neutral-300 hover:bg-white/5"
        >
          <WrenchIcon className="h-4 w-4 mr-1.5" />
          Manage Tools
        </Button>
      </Card>
    </motion.div>
  );
}
