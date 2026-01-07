import { useState, useRef } from "react";
import { Smartphone, Monitor, AlertTriangle, Check, GripVertical, DollarSign, Rocket, Volume2, VolumeX } from "lucide-react";
import amateurImg from "@/assets/comparison-amateur.jpg";

export const ComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
    setIsMuted(false);
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
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Top black bar */}
      <div className="bg-black py-4 px-5 sm:px-6 flex items-center justify-between rounded-t-xl border border-b-0 border-border">
        <div className="flex flex-col gap-1.5">
          <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-destructive text-[10px] sm:text-xs font-bold text-destructive-foreground w-fit">
            ANTES
          </div>
          <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-red-500/20 border border-red-500/30 flex items-center gap-1 sm:gap-1.5 w-fit">
            <DollarSign className="w-3 h-3 text-red-400" />
            <span className="text-red-400 text-[10px] sm:text-xs font-bold">R$34,90/mês</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 items-end">
          <div className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-emerald-500 text-[10px] sm:text-xs font-bold text-emerald-400 w-fit">
            DEPOIS
          </div>
          <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center gap-1 sm:gap-1.5 w-fit">
            <Rocket className="w-3 h-3 text-green-400" />
            <span className="text-green-400 text-[10px] sm:text-xs font-bold">100% GRÁTIS</span>
          </div>
        </div>
      </div>

      {/* Video comparison area */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-video cursor-ew-resize select-none border-x border-border"
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

          {/* Low quality grain overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHJlY3Qgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9zdmc+')] opacity-40 pointer-events-none" />
        </div>

        {/* DaVinci Side (Right - Pro) - Video Background */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          {/* Video background with sound */}
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://downloads.blackmagicdesign.com/videos/products/davinciresolve/landing/hero/20250331-6882b0/hero.hd.1080p.mp4" type="video/mp4" />
          </video>

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
      </div>

      {/* Bottom black bar */}
      <div className="bg-black py-4 px-5 sm:px-6 flex items-center justify-between rounded-b-xl border border-t-0 border-border">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-foreground">DaVinci Resolve 20</h4>
            <p className="text-[10px] sm:text-xs text-zinc-400">Color grading Hollywood</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs border border-primary/30">
              <Check className="w-3 h-3" />
              Cores cinematográficas
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs border border-primary/30">
              <Check className="w-3 h-3" />
              Profundidade real
            </span>
          </div>
          
          {/* Mute/Unmute Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
