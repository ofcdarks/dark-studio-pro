import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IntroNiche } from "@/lib/xmlGenerator";

interface NicheVisualPreviewProps {
  niche: IntroNiche;
  className?: string;
}

// Configurações visuais específicas para cada nicho
const NICHE_VISUALS: Record<string, {
  gradient: string;
  elements: React.ReactNode;
  overlay?: string;
}> = {
  ancient_civilizations: {
    gradient: "from-amber-900/80 via-yellow-800/60 to-stone-900/80",
    overlay: "bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M30 0L60 30L30 60L0 30z\" fill=\"none\" stroke=\"%23d4a574\" stroke-opacity=\"0.1\"/%3E%3C/svg%3E')]",
    elements: (
      <>
        {/* Pirâmide */}
        <motion.div
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[45px] border-l-transparent border-r-transparent border-b-amber-600/60" />
          <div className="absolute inset-0 w-0 h-0 border-l-[30px] border-r-[30px] border-b-[45px] border-l-transparent border-r-transparent border-b-yellow-500/20 animate-pulse" />
        </motion.div>
        
        {/* Hieróglifos flutuantes */}
        {['𓂀', '𓃀', '𓆣', '𓇳', '𓊪'].map((symbol, i) => (
          <motion.span
            key={i}
            className="absolute text-amber-500/40 text-lg font-bold"
            style={{
              left: `${15 + i * 18}%`,
              top: `${20 + (i % 3) * 15}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          >
            {symbol}
          </motion.span>
        ))}
        
        {/* Sol/Luz dourada */}
        <motion.div
          className="absolute top-2 right-4 w-8 h-8 rounded-full bg-gradient-radial from-yellow-400/60 to-transparent"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Partículas de areia */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 10, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </>
    ),
  },
  health: {
    gradient: "from-emerald-800/70 via-green-600/50 to-teal-700/70",
    elements: (
      <>
        {/* Coração pulsante */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          <span className="text-4xl">💚</span>
        </motion.div>
        
        {/* Ondas de energia/bem-estar */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-400/30"
            initial={{ width: 40, height: 40, opacity: 0 }}
            animate={{
              width: [40, 80 + ring * 20],
              height: [40, 80 + ring * 20],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2,
              delay: ring * 0.4,
              repeat: Infinity,
            }}
          />
        ))}
        
        {/* Folhas flutuantes */}
        {['🍃', '🌿', '🌱'].map((leaf, i) => (
          <motion.span
            key={i}
            className="absolute text-xl"
            style={{
              left: `${20 + i * 30}%`,
              bottom: '15%',
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
            }}
          >
            {leaf}
          </motion.span>
        ))}
        
        {/* Gráfico de batimentos */}
        <motion.svg
          className="absolute bottom-2 left-2 w-16 h-8"
          viewBox="0 0 60 30"
        >
          <motion.path
            d="M0,15 L10,15 L15,5 L20,25 L25,10 L30,20 L35,15 L60,15"
            fill="none"
            stroke="rgba(74, 222, 128, 0.5)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.svg>
      </>
    ),
  },
  emotional_stories: {
    gradient: "from-rose-900/70 via-pink-800/50 to-purple-900/70",
    elements: (
      <>
        {/* Coração quebrado/emocional */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl filter drop-shadow-lg">💔</span>
        </motion.div>
        
        {/* Lágrimas/gotas caindo */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-3 rounded-full bg-gradient-to-b from-blue-300/60 to-transparent"
            style={{
              left: `${20 + i * 15}%`,
              top: '20%',
            }}
            animate={{
              y: [0, 60],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          />
        ))}
        
        {/* Luz suave/bokeh */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-pink-400/20 blur-sm"
            style={{
              width: 8 + i * 4,
              height: 8 + i * 4,
              left: `${10 + i * 25}%`,
              top: `${15 + (i % 2) * 50}%`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
            }}
          />
        ))}
        
        {/* Texto emotivo */}
        <motion.p
          className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] text-rose-300/60 italic font-serif whitespace-nowrap"
          animate={{
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          "histórias que tocam a alma..."
        </motion.p>
        
        {/* Moldura vintage */}
        <div className="absolute inset-2 border border-rose-400/20 rounded-lg pointer-events-none" />
      </>
    ),
  },
  // Nichos existentes com previews
  biblical: {
    gradient: "from-amber-700/70 via-yellow-600/50 to-orange-800/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-4xl">✝️</span>
        </motion.div>
        {/* Raios de luz */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-0.5 h-12 bg-gradient-to-b from-yellow-400/40 to-transparent origin-top"
            style={{ rotate: `${i * 60}deg` }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </>
    ),
  },
  psychology: {
    gradient: "from-indigo-800/70 via-purple-700/50 to-blue-900/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          <span className="text-4xl">🧠</span>
        </motion.div>
        {/* Sinapses */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-400/60"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </>
    ),
  },
  curiosities: {
    gradient: "from-cyan-800/70 via-teal-600/50 to-blue-800/70",
    elements: (
      <>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-4xl">🤯</span>
        </motion.div>
        {/* Interrogações */}
        {['❓', '❗', '💡'].map((symbol, i) => (
          <motion.span
            key={i}
            className="absolute text-lg"
            style={{ left: `${20 + i * 30}%`, top: '20%' }}
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
          >
            {symbol}
          </motion.span>
        ))}
      </>
    ),
  },
};

export const NicheVisualPreview = ({ niche, className }: NicheVisualPreviewProps) => {
  const visual = NICHE_VISUALS[niche];
  
  if (!visual) return null;
  
  return (
    <motion.div
      className={cn(
        "relative w-full h-24 rounded-lg overflow-hidden",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradiente de fundo */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        visual.gradient
      )} />
      
      {/* Overlay pattern */}
      {visual.overlay && (
        <div className={cn("absolute inset-0 opacity-30", visual.overlay)} />
      )}
      
      {/* Vinheta */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40" />
      
      {/* Elementos animados */}
      {visual.elements}
      
      {/* Borda sutil */}
      <div className="absolute inset-0 border border-white/10 rounded-lg pointer-events-none" />
    </motion.div>
  );
};
