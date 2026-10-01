import { cn } from "@/lib/utils";
import type { RecordStatus } from "@/lib/master-store";

const map: Record<RecordStatus, { label: string; cls: string; dot: string }> = {
  active: {
    label: "Active",
    cls: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
  },
  expiring: {
    label: "Expiring Soon",
    cls: "bg-warning/10 text-warning border-warning/25",
    dot: "bg-warning",
  },
  expired: {
    label: "Expired",
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: RecordStatus;
  label?: string;
  className?: string;
}) {
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        m.cls,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {label ?? m.label}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        active
          ? "bg-success/10 text-success border-success/20"
          : "bg-muted text-muted-foreground border-border",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground")}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
