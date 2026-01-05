import { useBackgroundImageGeneration } from "@/hooks/useBackgroundImageGeneration";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Image, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export const BackgroundGenerationIndicator = () => {
  const { state, cancelGeneration } = useBackgroundImageGeneration();
  const navigate = useNavigate();
  const location = useLocation();

  // Não mostrar na página /prompts - lá já tem o progresso na interface
  if (!state.isGenerating || location.pathname === '/prompts') return null;

  const percentage = state.totalImages > 0 
    ? Math.round((state.completedImages / state.totalImages) * 100) 
    : 0;

  // Calcular tempo restante
  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  const avgTimePerImage = state.completedImages > 0 ? elapsed / state.completedImages : 10;
  const remaining = state.totalImages - state.completedImages;
  const estimatedRemaining = Math.round(remaining * avgTimePerImage);
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-card border border-primary/30 rounded-lg shadow-lg p-4 w-80 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate('/prompts')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Image className="h-5 w-5 text-primary" />
            <Loader2 className="h-3 w-3 text-primary animate-spin absolute -top-1 -right-1" />
          </div>
          <span className="text-sm font-medium text-foreground">
            Gerando imagens em background
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            cancelGeneration();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Progress value={percentage} className="h-2 mb-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{state.completedImages}/{state.totalImages} imagens</span>
        <span>{percentage}%</span>
        {estimatedRemaining > 0 && state.completedImages > 0 && (
          <span>~{formatTime(estimatedRemaining)} restante</span>
        )}
      </div>

      {state.currentPrompt && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
          "{state.currentPrompt.substring(0, 50)}..."
        </p>
      )}
    </div>
  );
};
