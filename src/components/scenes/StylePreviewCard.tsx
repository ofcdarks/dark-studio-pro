import { motion } from "framer-motion";
import { ThumbnailStyle } from "@/lib/thumbnailStyles";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StylePreviewCardProps {
  style: ThumbnailStyle;
  isSelected: boolean;
  onClick: () => void;
}

// Visual representations for each 3D style
const styleVisuals: Record<string, React.ReactNode> = {
  "3d-cinematic-miniature": (
    <div className="relative w-full h-full bg-gradient-to-b from-sky-400 to-sky-600 overflow-hidden">
      {/* Mountains */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="absolute bottom-0 left-1/4 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[30px] border-l-transparent border-r-transparent border-b-emerald-700" />
        <div className="absolute bottom-0 left-1/2 w-0 h-0 border-l-[25px] border-r-[25px] border-b-[40px] border-l-transparent border-r-transparent border-b-emerald-600" />
        <div className="absolute bottom-0 right-1/4 w-0 h-0 border-l-[18px] border-r-[18px] border-b-[28px] border-l-transparent border-r-transparent border-b-emerald-800" />
      </div>
      {/* Sun */}
      <motion.div 
        className="absolute top-3 right-4 w-6 h-6 bg-yellow-300 rounded-full shadow-lg"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Tilt-shift blur effect */}
      <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-white/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-white/30 to-transparent" />
    </div>
  ),
  
  "isometrico-arquitetonico": (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden flex items-center justify-center">
      {/* Isometric building */}
      <svg viewBox="0 0 60 50" className="w-16 h-14">
        {/* Left face */}
        <polygon points="30,10 10,22 10,42 30,30" fill="#64748b" />
        {/* Right face */}
        <polygon points="30,10 50,22 50,42 30,30" fill="#94a3b8" />
        {/* Top face */}
        <polygon points="30,10 10,22 30,30 50,22" fill="#cbd5e1" />
        {/* Windows */}
        <rect x="15" y="26" width="4" height="4" fill="#0ea5e9" />
        <rect x="22" y="26" width="4" height="4" fill="#0ea5e9" />
        <rect x="34" y="26" width="4" height="4" fill="#0ea5e9" />
        <rect x="41" y="26" width="4" height="4" fill="#0ea5e9" />
      </svg>
    </div>
  ),
  
  "low-poly-stylized": (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden flex items-center justify-center">
      {/* Low poly crystal */}
      <svg viewBox="0 0 50 50" className="w-12 h-12">
        <polygon points="25,5 10,20 15,40 35,40 40,20" fill="#a855f7" />
        <polygon points="25,5 10,20 25,25" fill="#c084fc" />
        <polygon points="25,5 40,20 25,25" fill="#d8b4fe" />
        <polygon points="10,20 15,40 25,25" fill="#7c3aed" />
        <polygon points="40,20 35,40 25,25" fill="#8b5cf6" />
        <polygon points="15,40 35,40 25,25" fill="#6d28d9" />
      </svg>
      {/* Floating particles */}
      <motion.div 
        className="absolute top-2 left-3 w-2 h-2 bg-white/50 rotate-45"
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-4 right-4 w-1.5 h-1.5 bg-white/50 rotate-45"
        animate={{ y: [0, -3, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      />
    </div>
  ),
  
  "claymation-3d": (
    <div className="relative w-full h-full bg-amber-100 overflow-hidden flex items-center justify-center">
      {/* Clay character */}
      <div className="relative">
        {/* Body */}
        <div className="w-10 h-12 bg-orange-400 rounded-[40%] shadow-inner" />
        {/* Head */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 bg-orange-300 rounded-full shadow-inner" />
        {/* Eyes */}
        <div className="absolute -top-3 left-2 w-2 h-2 bg-white rounded-full">
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-black rounded-full" />
        </div>
        <div className="absolute -top-3 right-2 w-2 h-2 bg-white rounded-full">
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-black rounded-full" />
        </div>
        {/* Smile */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1.5 border-b-2 border-orange-700 rounded-b-full" />
      </div>
    </div>
  ),
  
  "voxel-art": (
    <div className="relative w-full h-full bg-sky-300 overflow-hidden flex items-center justify-center">
      {/* Voxel grid */}
      <div className="grid grid-cols-4 gap-0.5">
        {[...Array(16)].map((_, i) => {
          const colors = ["bg-green-500", "bg-green-600", "bg-green-400", "bg-amber-600"];
          const heights = ["h-3", "h-4", "h-5", "h-6"];
          return (
            <motion.div
              key={i}
              className={`w-3 ${heights[i % 4]} ${colors[i % 4]} border border-black/20`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            />
          );
        })}
      </div>
    </div>
  ),
  
  "anime-3d": (
    <div className="relative w-full h-full bg-gradient-to-b from-pink-200 to-purple-300 overflow-hidden flex items-center justify-center">
      {/* Anime character silhouette */}
      <div className="relative">
        {/* Hair */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-6 bg-purple-600 rounded-t-full" />
        <div className="absolute -top-1 left-0 w-3 h-8 bg-purple-600 rounded-full -rotate-12" />
        <div className="absolute -top-1 right-0 w-3 h-8 bg-purple-600 rounded-full rotate-12" />
        {/* Face */}
        <div className="w-10 h-10 bg-[#fce4d6] rounded-full" />
        {/* Eyes */}
        <div className="absolute top-3 left-2 w-2.5 h-3 bg-violet-500 rounded-full">
          <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full" />
        </div>
        <div className="absolute top-3 right-2 w-2.5 h-3 bg-violet-500 rounded-full">
          <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
      {/* Sparkles */}
      <motion.div 
        className="absolute top-2 right-3 text-yellow-300 text-xs"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        ✦
      </motion.div>
    </div>
  ),
  
  "pixar-disney": (
    <div className="relative w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 overflow-hidden flex items-center justify-center">
      {/* Pixar-style lamp */}
      <div className="relative">
        {/* Lamp base */}
        <div className="w-8 h-1.5 bg-gray-700 rounded-full" />
        {/* Lamp arm */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1 h-6 bg-gray-600 -rotate-12 origin-bottom" />
        {/* Lamp head */}
        <div className="absolute -top-8 left-2 w-5 h-4 bg-gray-500 rounded-t-full transform -rotate-45" />
        {/* Light glow */}
        <motion.div 
          className="absolute -top-10 left-0 w-8 h-8 bg-yellow-200/50 rounded-full blur-sm"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      {/* Stars */}
      <div className="absolute top-2 left-3 text-white/60 text-[8px]">★</div>
      <div className="absolute top-4 right-4 text-white/40 text-[6px]">★</div>
      <div className="absolute bottom-6 left-5 text-white/50 text-[7px]">★</div>
    </div>
  ),
};

// Fallback for styles without custom visual
const DefaultStyleVisual = ({ style }: { style: ThumbnailStyle }) => (
  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
    <span className="text-3xl">{style.icon}</span>
  </div>
);

export const StylePreviewCard = ({ style, isSelected, onClick }: StylePreviewCardProps) => {
  const visual = styleVisuals[style.id];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
        isSelected 
          ? "border-primary ring-2 ring-primary/30" 
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Preview Visual */}
      <div className="aspect-video w-full">
        {visual || <DefaultStyleVisual style={style} />}
      </div>
      
      {/* Info */}
      <div className="p-3 bg-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{style.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{style.description}</p>
          </div>
        </div>
      </div>
      
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
};
