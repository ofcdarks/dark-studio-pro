import { BarChart3 } from "lucide-react";

interface Metric {
  label: string;
  value: string | number;
}

interface MetricsCardProps {
  title: string;
  icon?: React.ReactNode;
  metrics: Metric[];
}

export function MetricsCard({ title, icon, metrics }: MetricsCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon || <BarChart3 className="w-5 h-5 text-primary" />}
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-secondary/50 rounded-lg p-4"
          >
            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-xl font-bold text-foreground">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
