import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subLabel?: string;
  status?: "default" | "active" | "warning";
  action?: React.ReactNode;
  progress?: {
    value: number;
    max: number;
  };
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  subLabel,
  status = "default",
  action,
  progress,
}: StatsCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {status === "active" && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-success text-success-foreground">
            ATIVO
          </span>
        )}
        {subLabel && !status && (
          <span className="text-xs text-muted-foreground">{subLabel}</span>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
      {progress && (
        <div className="space-y-1">
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(progress.value / progress.max) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {((progress.value / progress.max) * 100).toFixed(1)}% usado
          </p>
        </div>
      )}
      {action}
    </div>
  );
}
