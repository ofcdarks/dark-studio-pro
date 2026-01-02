import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { Sparkles, Star, Crown, Flame, Zap, Diamond } from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: 'primary' | 'amber' | 'orange';
}

const FloatingElements = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const [particles, setParticles] = useState<Particle[]>([]);

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y4 = useTransform(scrollYProgress, [0, 1], [0, -600]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const rotate3 = useTransform(scrollYProgress, [0, 1], [0, 270]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      color: ['primary', 'amber', 'orange'][Math.floor(Math.random() * 3)] as Particle['color']
    }));
    setParticles(newParticles);
  }, []);

  const colorClasses = {
    primary: 'bg-primary',
    amber: 'bg-amber-400',
    orange: 'bg-orange-400'
  };

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Premium gradient orbs with enhanced animations */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-[5%] left-[2%] w-[600px] h-[600px] rounded-full blur-[120px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute top-[25%] right-[5%] w-[700px] h-[700px] rounded-full blur-[140px]"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, 30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-br from-purple-500/15 via-primary/15 to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute top-[55%] left-[15%] w-[500px] h-[500px] rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.1, 0.18, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div className="w-full h-full bg-gradient-to-br from-emerald-500/15 via-primary/10 to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: y4 }}
        className="absolute top-[75%] right-[20%] w-[450px] h-[450px] rounded-full blur-[90px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      >
        <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent" />
      </motion.div>

      {/* Floating geometric shapes with enhanced styling */}
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute top-[12%] right-[12%] w-28 h-28"
      >
        <div className="w-full h-full border border-primary/25 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent backdrop-blur-sm" />
      </motion.div>

      <motion.div
        style={{ y: y2, rotate: rotate2 }}
        className="absolute top-[40%] left-[6%] w-20 h-20"
      >
        <div className="w-full h-full border border-primary/20 rounded-full bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-sm" />
      </motion.div>

      <motion.div
        style={{ y: y3, rotate: rotate1 }}
        className="absolute top-[70%] right-[18%] w-24 h-24"
      >
        <div className="w-full h-full border border-primary/15 rotate-45 bg-gradient-to-br from-orange-500/5 to-transparent" />
      </motion.div>

      <motion.div
        style={{ y: y4, rotate: rotate3 }}
        className="absolute top-[85%] left-[25%] w-16 h-16"
      >
        <div className="w-full h-full border border-primary/20 rounded-xl bg-gradient-to-br from-primary/8 to-transparent backdrop-blur-sm" />
      </motion.div>

      {/* Floating icon badges */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-[18%] left-[8%]"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 5, 0],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/30 flex items-center justify-center">
          <Crown className="w-7 h-7 text-primary" />
        </div>
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute top-[32%] right-[8%]"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -8, 0],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 backdrop-blur-sm border border-amber-500/30 flex items-center justify-center">
          <Star className="w-6 h-6 text-amber-400" />
        </div>
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute top-[58%] left-[5%]"
        animate={{
          y: [0, -18, 0],
          x: [0, 10, 0],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center">
          <Flame className="w-5 h-5 text-emerald-400" />
        </div>
      </motion.div>

      <motion.div
        style={{ y: y4 }}
        className="absolute top-[78%] right-[12%]"
        animate={{
          y: [0, 12, 0],
          rotate: [0, 10, 0],
          opacity: [0.5, 0.85, 0.5],
        }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/5 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
      </motion.div>

      <motion.div
        style={{ y: y1 }}
        className="absolute top-[45%] right-[25%]"
        animate={{
          y: [0, -20, 0],
          scale: [0.9, 1.1, 0.9],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      >
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 backdrop-blur-sm border border-cyan-500/30 flex items-center justify-center">
          <Diamond className="w-4 h-4 text-cyan-400" />
        </div>
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute top-[65%] left-[30%]"
        animate={{
          y: [0, 15, 0],
          x: [0, -10, 0],
          opacity: [0.45, 0.75, 0.45],
        }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-rose-500/20 to-rose-500/5 backdrop-blur-sm border border-rose-500/30 flex items-center justify-center">
          <Zap className="w-4 h-4 text-rose-400" />
        </div>
      </motion.div>

      {/* Animated floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${colorClasses[particle.color]}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -50 - Math.random() * 30, 0],
            x: [0, (Math.random() - 0.5) * 40, 0],
            opacity: [0.15, 0.6, 0.15],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Sparkle effects */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${8 + Math.random() * 84}%`,
            top: `${8 + Math.random() * 84}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: "easeInOut",
          }}
        >
          <Sparkles className="w-3 h-3 text-primary/50" />
        </motion.div>
      ))}

      {/* Premium grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(38, 92%, 50%, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, hsl(38, 92%, 50%, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Diagonal lines accent */}
      <div 
        className="absolute inset-0 opacity-[0.008]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            hsl(38, 92%, 50%, 0.3) 100px,
            hsl(38, 92%, 50%, 0.3) 101px
          )`
        }}
      />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />
      
      {/* Corner vignettes */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_top_left,transparent_0%,hsl(var(--background))_70%)]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_bottom_right,transparent_0%,hsl(var(--background))_70%)]" />
    </div>
  );
};

export default FloatingElements;