"use client";

import { cn } from "../../../lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../atoms/card";

import type { ReactNode } from "react";


export interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Elevated stat card with optional delta and icon slot.
 */
export function StatCard({
  label,
  value,
  delta,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "w-full rounded-xl border border-border-default bg-background-tertiary",
        className,
      )}
    >
      <CardHeader className="space-y-3 p-5 md:p-6">
        <div className="flex items-center justify-between text-sm font-medium text-text-tertiary">
          <CardTitle className="text-sm font-medium tracking-wide text-text-secondary">
            {label}
          </CardTitle>
          {icon ? (
            <div className="text-text-muted">{icon}</div>
          ) : null}
        </div>

        <div className="text-3xl font-semibold text-text-primary md:text-4xl">
          {value}
        </div>

        {delta ? (
          <CardDescription className="text-sm text-text-secondary">
            {delta}
          </CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  );
}

