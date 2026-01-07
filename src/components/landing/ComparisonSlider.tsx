import { useState, useRef } from "react";
import { Smartphone, Monitor, AlertTriangle, Check, GripVertical } from "lucide-react";

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
      className="relative w-full max-w-3xl mx-auto h-64 md:h-80 rounded-xl overflow-hidden cursor-ew-resize select-none border border-border"
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
        className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center mb-4 border border-zinc-600">
            <Smartphone className="w-8 h-8 text-zinc-400" />
          </div>
          <h4 className="text-lg md:text-xl font-bold text-zinc-300 mb-2">CapCut</h4>
          <p className="text-sm text-zinc-500 mb-4">Edição no celular</p>
          
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Templates genéricos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Marca d'água</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Limitado a 1080p</span>
            </div>
          </div>

          {/* Simulated low quality overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHJlY3Qgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-50 pointer-events-none" />
        </div>
      </div>

      {/* DaVinci Side (Right - Pro) */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-background to-orange-900/30"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h4 className="text-lg md:text-xl font-bold text-foreground mb-2">DaVinci Resolve 20</h4>
          <p className="text-sm text-purple-300 mb-4">Workflow profissional</p>
          
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>Color grading Hollywood</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>Exportação XML nativa</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary" />
              <span>4K HDR sem limites</span>
            </div>
          </div>

          {/* Premium glow effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-purple-500 to-primary" />
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-foreground cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle grip */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground flex items-center justify-center shadow-lg">
          <GripVertical className="w-5 h-5 text-background" />
        </div>
        
        {/* Labels */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-muted-foreground">
          Arraste para comparar
        </div>
      </div>
    </div>
  );
};
