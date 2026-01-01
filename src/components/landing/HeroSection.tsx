import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const allOperators = [
  { initials: "JM" }, { initials: "AL" }, { initials: "CS" }, { initials: "RB" },
  { initials: "MF" }, { initials: "LP" }, { initials: "TS" }, { initials: "GR" },
  { initials: "DV" }, { initials: "FC" }, { initials: "PN" }, { initials: "KM" },
];

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [visibleOperators, setVisibleOperators] = useState(allOperators.slice(0, 8));

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleOperators(prev => {
        const indexToReplace = Math.floor(Math.random() * prev.length);
        const currentInitials = prev.map(op => op.initials);
        const availableOperators = allOperators.filter(op => !currentInitials.includes(op.initials));
        if (availableOperators.length === 0) return prev;
        const newOperator = availableOperators[Math.floor(Math.random() * availableOperators.length)];
        const newList = [...prev];
        newList[indexToReplace] = newOperator;
        return newList;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px]" />

      <motion.div style={{ y, opacity }} className="container mx-auto px-6 relative z-10 text-center">
        {/* Operators Online */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-muted-foreground font-medium">Operadores online</span>
          </div>
          <div className="flex -space-x-2">
            <AnimatePresence mode="popLayout">
              {visibleOperators.map((operator) => (
                <motion.div key={operator.initials} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center border-2 border-background text-xs font-bold text-primary-foreground">
                  {operator.initials}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">PLATAFORMA EXCLUSIVA</span>
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
          Escale seu Canal Dark<br />
          <span className="text-gradient">para $10K+/mês</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Ferramentas de IA, automação completa e estratégias comprovadas para dominar o YouTube sem aparecer.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/auth">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              <Zap className="w-5 h-5" />
              Começar Agora
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <a href="#demo">
            <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
              Ver Demonstração
            </Button>
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap justify-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /><span className="text-sm">Pagamento Seguro</span></div>
          <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /><span className="text-sm">Acesso Imediato</span></div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
