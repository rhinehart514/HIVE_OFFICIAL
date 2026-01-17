"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { Button, Card, cn, toast, HiveConfirmModal } from "@hive/ui";
import { secureApiFetch } from "@/lib/secure-auth-utils";

interface DangerTabProps {
  spaceId: string;
  hasProvisionalAccess: boolean;
  variants?: Variants;
}

export function DangerTab({
  spaceId,
  hasProvisionalAccess,
  variants,
}: DangerTabProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteSpace = async () => {
    if (!spaceId) return;

    try {
      setIsDeleting(true);
      const res = await secureApiFetch(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "PROVISIONAL_ACCESS_RESTRICTED") {
          toast.error(
            "Action restricted",
            "Space deletion is disabled while your leader verification is pending."
          );
          return;
        }
        throw new Error(data.error || "Failed to delete");
      }

      toast.success(
        "Space deleted",
        "The space has been permanently deleted."
      );
      router.push("/spaces");
    } catch (error) {
      toast.error(
        "Failed to delete",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <motion.div
        key="danger"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Card className="p-6 bg-neutral-900/60 backdrop-blur-sm border-red-500/20">
          <h2 className="text-lg font-semibold text-red-400 mb-4">
            Danger Zone
          </h2>
          <p className="text-neutral-400 mb-4">
            These actions are irreversible. Please be certain.
          </p>

          {hasProvisionalAccess && (
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 mb-4">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-400 mb-1">
                    Verification Pending
                  </h3>
                  <p className="text-sm text-amber-400/70">
                    Destructive actions like space deletion are disabled while
                    your leader verification is in progress. This usually takes
                    less than 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            <h3 className="font-medium text-white mb-2">Delete Space</h3>
            <p className="text-sm text-neutral-400 mb-3">
              Permanently delete this space and all its content. This cannot be
              undone.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={hasProvisionalAccess}
              className={cn(
                "border-red-500/50 text-red-400 hover:bg-red-500/10",
                hasProvisionalAccess &&
                  "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <TrashIcon className="h-4 w-4 mr-1.5" />
              Delete Space
            </Button>
          </div>
        </Card>
      </motion.div>

      <HiveConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Space"
        description="Are you sure you want to delete this space? All content, members, and history will be permanently lost. This action cannot be undone."
        confirmText="Delete Space"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteSpace}
      />
    </>
  );
}
