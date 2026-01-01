import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Sparkles, Play } from "lucide-react";
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
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

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
      {/* Premium Background Image with Gloss Effect */}
      <motion.div 
        style={{ scale }}
        className="absolute inset-0 z-0"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80')`,
          }}
        />
        {/* Gloss overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/85 to-background/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 animate-gradient-slow" />
      </motion.div>

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(32, 95%, 45%, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/60 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto px-6 relative z-10 text-center">
        {/* Operators Online with glass effect */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl glass mb-8"
        >
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm text-muted-foreground font-medium">Operadores online</span>
          </div>
          <div className="flex -space-x-2">
            <AnimatePresence mode="popLayout">
              {visibleOperators.map((operator) => (
                <motion.div 
                  key={operator.initials} 
                  initial={{ opacity: 0, scale: 0 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0 }} 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center border-2 border-background text-xs font-bold text-primary-foreground shadow-lg"
                >
                  {operator.initials}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Badge with shimmer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.1 }} 
          className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/40 text-primary mb-6 overflow-hidden"
        >
          <div className="absolute inset-0 animate-shimmer" />
          <Sparkles className="w-4 h-4 relative z-10" />
          <span className="text-sm font-bold relative z-10">PLATAFORMA EXCLUSIVA</span>
        </motion.div>

        {/* Title with enhanced gradient */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
        >
          Escale seu Canal Dark<br />
          <span className="relative">
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              para $10K+/mês
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Ferramentas de IA, automação completa e estratégias comprovadas para dominar o YouTube sem aparecer.
        </motion.p>

        {/* CTAs with glow effects */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }} 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link to="/auth">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-500 to-primary rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity animate-gradient" />
              <Button variant="hero" size="xl" className="relative w-full sm:w-auto">
                <Zap className="w-5 h-5" />
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
          <a href="#demo">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto group">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Ver Demonstração
              </Button>
            </motion.div>
          </a>
        </motion.div>

        {/* Trust badges with glass effect */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }} 
          className="flex flex-wrap justify-center gap-6 text-muted-foreground"
        >
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full glass"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm">Pagamento Seguro</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full glass"
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm">Acesso Imediato</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full glass"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">Suporte 24/7</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20" />
    </section>
  );
};

export default HeroSection;