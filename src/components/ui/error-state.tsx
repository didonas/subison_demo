"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home, LucideIcon } from "lucide-react";

interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  homeHref?: string;
  homeLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function ErrorState({
  icon: Icon = AlertCircle,
  title = "Something went wrong",
  message = "We encountered an unexpected issue while processing your request. Please try again or contact the clinic if the problem persists.",
  onRetry,
  retryLabel = "Try Again",
  homeHref = "/",
  homeLabel = "Return Home",
  className = "",
  children,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 ring-8 ring-red-50/60 dark:ring-red-950/30">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mb-6 leading-relaxed">{message}</p>

      <div className="flex flex-wrap gap-3 justify-center items-center">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm transition focus-ring shadow-sm"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {retryLabel}
          </button>
        )}

        {homeHref && (
          <Link
            href={homeHref}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-medium text-sm transition focus-ring"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            {homeLabel}
          </Link>
        )}

        {children}
      </div>
    </div>
  );
}
