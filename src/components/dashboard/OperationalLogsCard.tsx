import { Zap, ClipboardList, Activity } from "lucide-react";
import { motion } from "framer-motion";

export function OperationalLogsCard() {
  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Registros Operacionais</h3>
      </div>
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
        <p className="text-muted-foreground text-xs">
          Nenhum registro operacional ainda.
        </p>
        <p className="text-muted-foreground/60 text-[10px] mt-1">
          Suas atividades aparecerão aqui
        </p>
      </motion.div>
    </div>
  );
}