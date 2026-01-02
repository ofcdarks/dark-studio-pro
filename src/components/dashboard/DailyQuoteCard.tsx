import { BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function DailyQuoteCard() {
  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Palavra do Dia</h3>
      </div>
      <motion.div 
        className="relative bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-4 overflow-hidden"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {/* Decorative quote mark */}
        <div className="absolute top-2 right-3 text-4xl text-primary/10 font-serif">"</div>
        
        <p className="text-foreground/90 italic text-sm leading-relaxed mb-3 relative z-10">
          "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus."
        </p>
        <div className="flex items-center justify-between relative z-10">
          <span className="text-primary font-medium text-xs">— Filipenses 4:7</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}