import { cn } from "@/lib/utils";

type Status = "pending" | "selected" | "expired";

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-orange-50 text-orange-600",
  },
  selected: {
    label: "Acteur choisi",
    className: "bg-green-50 text-success",
  },
  expired: {
    label: "Expiré",
    className: "bg-gray-100 text-gray-400",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-pill text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
