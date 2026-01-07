import { useState, useRef } from "react";
import { Smartphone, Monitor, AlertTriangle, Check, GripVertical } from "lucide-react";
import amateurImg from "@/assets/comparison-amateur.jpg";
import cinematicImg from "@/assets/comparison-cinematic.jpg";

export const ComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 5), 95);
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none border border-border shadow-2xl"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchMove={handleTouchMove}
    >
      {/* CapCut Side (Left - Amateur) */}
      <div 
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {/* Amateur image background */}
        <img 
          src={amateurImg} 
          alt="Amateur CapCut editing" 
          className="absolute inset-0 w-full h-full object-cover filter saturate-50 brightness-110"
        />
        
        {/* Overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-700/80 backdrop-blur flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h4 className="text-base md:text-lg font-bold text-zinc-200">CapCut</h4>
                <p className="text-xs text-zinc-400">Edição amadora</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs">
                <AlertTriangle className="w-3 h-3" />
                Cores lavadas
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs">
                <AlertTriangle className="w-3 h-3" />
                Sem profundidade
              </span>
            </div>
          </div>
        </div>

        {/* Low quality grain overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHJlY3Qgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-40 pointer-events-none" />
      </div>

      {/* DaVinci Side (Right - Pro) */}
      <div 
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        {/* Cinematic image background */}
        <img 
          src={cinematicImg} 
          alt="DaVinci Resolve cinematic grading" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Monitor className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-base md:text-lg font-bold text-foreground">DaVinci Resolve 20</h4>
                <p className="text-xs text-purple-300">Color grading Hollywood</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
                <Check className="w-3 h-3" />
                Cores cinematográficas
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
                <Check className="w-3 h-3" />
                Profundidade real
              </span>
            </div>
          </div>
        </div>

        {/* Premium top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-primary" />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-foreground cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle grip */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-foreground flex items-center justify-center shadow-xl shadow-black/50 border-2 border-background">
          <GripVertical className="w-5 h-5 text-background" />
        </div>
        
        {/* Labels */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-foreground bg-background/80 backdrop-blur px-3 py-1.5 rounded-full border border-border">
          ← Arraste →
        </div>
      </div>

      {/* Corner labels */}
      <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-destructive/80 backdrop-blur text-xs font-bold text-destructive-foreground">
        ANTES
      </div>
      <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur text-xs font-bold text-primary-foreground">
        DEPOIS
      </div>
    </div>
  );
};
