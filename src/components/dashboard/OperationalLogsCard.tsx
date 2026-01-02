import { Zap, ClipboardList, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

interface OperationalLogsCardProps {
  logs?: ActivityLog[];
}

export function OperationalLogsCard({ logs = [] }: OperationalLogsCardProps) {
  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Registros Operacionais</h3>
      </div>
      
      {logs.length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <motion.div 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-2 h-2 text-primary" />
            </motion.div>
          </div>
          <p className="text-muted-foreground text-xs">Nenhum registro operacional ainda.</p>
          <p className="text-muted-foreground/60 text-[10px] mt-1">Suas atividades aparecerão aqui</p>
        </motion.div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              className="p-3 bg-secondary/30 border border-border/30 rounded-lg"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-foreground font-medium">{log.action}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {log.description && (
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{log.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}