import { Zap, ClipboardList } from "lucide-react";

export function OperationalLogsCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Registros Operacionais</h3>
      </div>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ClipboardList className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">
          Nenhum registro operacional ainda.
        </p>
      </div>
    </div>
  );
}
