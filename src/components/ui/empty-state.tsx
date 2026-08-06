import React, { ReactNode } from "react";
import Link from "next/link";
import { FolderOpen, Plus, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionIcon: ActionIcon = Plus,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className = "",
  children,
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 ring-8 ring-teal-50/50 dark:ring-teal-950/20">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>

      {(actionLabel || secondaryActionLabel || children) && (
        <div className="flex flex-wrap gap-3 justify-center items-center">
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-medium text-sm transition focus-ring shadow-sm"
            >
              <ActionIcon className="w-4 h-4" aria-hidden="true" />
              {actionLabel}
            </Link>
          )}

          {actionLabel && !actionHref && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-medium text-sm transition focus-ring shadow-sm"
            >
              <ActionIcon className="w-4 h-4" aria-hidden="true" />
              {actionLabel}
            </button>
          )}

          {secondaryActionLabel && secondaryActionHref && (
            <Link
              href={secondaryActionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-medium text-sm transition focus-ring"
            >
              {secondaryActionLabel}
            </Link>
          )}

          {secondaryActionLabel && !secondaryActionHref && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-medium text-sm transition focus-ring"
            >
              {secondaryActionLabel}
            </button>
          )}

          {children}
        </div>
      )}
    </div>
  );
}
