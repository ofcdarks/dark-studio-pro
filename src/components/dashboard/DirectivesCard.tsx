import { Lightbulb, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function DirectivesCard() {
  return (
    <div className="group h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Diretivas</h3>
      </div>
      <motion.div 
        className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-4"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm mb-2">
              Comece Sua Jornada Viral
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você ainda não analisou nenhum vídeo. Use o Analisador de Vídeos para descobrir os segredos por trás de vídeos que geraram milhões de views.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}