import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const FloatingElements = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -180]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Gradient orbs */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-[100px]"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[30%] right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-500/10 via-primary/10 to-transparent blur-[120px]"
      />
      <motion.div
        style={{ y: y3 }}
        className="absolute top-[60%] left-[20%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent blur-[80px]"
      />

      {/* Floating geometric shapes */}
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute top-[15%] right-[15%] w-24 h-24 border border-primary/20 rounded-xl"
      />
      <motion.div
        style={{ y: y2, rotate: rotate2 }}
        className="absolute top-[45%] left-[8%] w-16 h-16 border border-primary/15 rounded-full"
      />
      <motion.div
        style={{ y: y3, rotate: rotate1 }}
        className="absolute top-[75%] right-[20%] w-20 h-20 border border-primary/10"
      />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
    </div>
  );
};

export default FloatingElements;
