import { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const springConfig = { damping: 25, stiffness: 700 };
  const cursorX = useSpring(mousePosition.x, springConfig);
  const cursorY = useSpring(mousePosition.y, springConfig);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      {/* Custom Mouse Shape - Like reference image */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            scale: isHovering ? 1.3 : 1,
          }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Mouse body - pill shape */}
          <svg 
            width="32" 
            height="48" 
            viewBox="0 0 32 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Mouse outline */}
            <rect 
              x="2" 
              y="2" 
              width="28" 
              height="44" 
              rx="14" 
              stroke="hsl(0, 0%, 70%)" 
              strokeWidth="2.5"
              fill="hsl(220, 15%, 10%)"
            />
            
            {/* Inner subtle gradient */}
            <rect 
              x="4" 
              y="4" 
              width="24" 
              height="40" 
              rx="12" 
              fill="url(#mouseGradient)"
              opacity="0.3"
            />
            
            {/* Scroll wheel / amber accent */}
            <motion.rect 
              x="13" 
              y="10" 
              width="6" 
              height="12" 
              rx="3"
              fill="hsl(38, 92%, 50%)"
              animate={{
                opacity: [0.8, 1, 0.8],
                filter: isHovering 
                  ? ["drop-shadow(0 0 4px hsl(38, 92%, 50%))", "drop-shadow(0 0 8px hsl(38, 92%, 50%))", "drop-shadow(0 0 4px hsl(38, 92%, 50%))"]
                  : ["drop-shadow(0 0 2px hsl(38, 92%, 50%))", "drop-shadow(0 0 4px hsl(38, 92%, 50%))", "drop-shadow(0 0 2px hsl(38, 92%, 50%))"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Divider line */}
            <line 
              x1="6" 
              y1="26" 
              x2="26" 
              y2="26" 
              stroke="hsl(0, 0%, 40%)" 
              strokeWidth="1"
              opacity="0.5"
            />

            <defs>
              <linearGradient id="mouseGradient" x1="16" y1="4" x2="16" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(220, 15%, 20%)" />
                <stop offset="1" stopColor="hsl(220, 15%, 8%)" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.div>

      {/* Cursor glow trail */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        <motion.div
          animate={{
            scale: isHovering ? 2 : 1,
            opacity: isHovering ? 0.4 : 0.15,
          }}
          transition={{ duration: 0.3 }}
          className="w-16 h-16 bg-primary/40 rounded-full blur-xl"
        />
      </motion.div>

      {/* Hide default cursor globally */}
      <style>{`
        @media (min-width: 768px) {
          * {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default CustomCursor;