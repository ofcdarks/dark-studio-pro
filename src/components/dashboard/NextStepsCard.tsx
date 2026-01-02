import { Rocket, Video, Settings, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    icon: Video,
    text: "Analise seu primeiro vídeo viral",
  },
  {
    number: 2,
    icon: Settings,
    text: "Configure suas chaves de API",
  },
  {
    number: 3,
    icon: BarChart3,
    text: "Acompanhe na seção Analytics",
  },
];

export function NextStepsCard() {
  return (
    <div className="group h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Próximos Passos</h3>
      </div>
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <motion.div
            key={step.number}
            className="flex items-center gap-3 p-3 bg-secondary/30 border border-border/30 rounded-lg transition-all duration-200 hover:bg-secondary/50 hover:border-primary/20 cursor-pointer"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs">
              {step.number}
            </div>
            <step.icon className="w-4 h-4 text-primary/70 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{step.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}