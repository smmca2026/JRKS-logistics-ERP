import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { BookingStatus, PayState } from "@/lib/ops-store";

/** Indian-formatted currency, compact and readable for office staff. */
export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const tones = {
  blue: "from-[#2563eb] to-[#1d4ed8]",
  green: "from-[#10b981] to-[#059669]",
  amber: "from-[#f59e0b] to-[#d97706]",
  violet: "from-[#8b5cf6] to-[#7c3aed]",
  cyan: "from-[#06b6d4] to-[#0891b2]",
  rose: "from-[#f43f5e] to-[#e11d48]",
  slate: "from-[#475569] to-[#334155]",
} as const;

export type SummaryTone = keyof typeof tones;

export function SummaryCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone?: SummaryTone;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tabular-nums text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const bookingTone: Record<BookingStatus, string> = {
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Booked: "bg-blue-50 text-blue-700 border-blue-200",
  "In Transit": "bg-amber-50 text-amber-700 border-amber-200",
  "Reached Destination": "bg-violet-50 text-violet-700 border-violet-200",
  Unloaded: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        bookingTone[status] || "bg-slate-50 text-slate-700 border-slate-200",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "Booked" && "bg-blue-600",
          status === "In Transit" && "bg-amber-500",
          status === "Reached Destination" && "bg-violet-600",
          status === "Unloaded" && "bg-cyan-600",
          (status === "Completed" || status === "Delivered") && "bg-emerald-600",
          status === "Cancelled" && "bg-red-600",
          (status === "Draft" || status === "Closed") && "bg-slate-500",
        )}
      />
      {status}
    </span>
  );
}

const payTone: Record<PayState, { cls: string; dot: string; label: string }> = {
  cleared: {
    cls: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    label: "Cleared",
  },
  partial: {
    cls: "bg-warning/10 text-warning border-warning/25",
    dot: "bg-warning",
    label: "Partial",
  },
  pending: {
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
    label: "Pending",
  },
};

export function PayStateBadge({ state, label }: { state: PayState; label?: string }) {
  const m = payTone[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        m.cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {label ?? m.label}
    </span>
  );
}
