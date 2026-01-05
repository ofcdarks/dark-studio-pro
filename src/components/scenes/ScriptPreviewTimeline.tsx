import { useMemo, useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Clock, FileText, Scissors, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ScriptPreviewTimelineProps {
  script: string;
  wordsPerScene: number;
  wpm: number;
  className?: string;
  onSyncAudio?: (newWpm: number) => void;
}

interface PreviewScene {
  number: number;
  text: string;
  wordCount: number;
  durationSeconds: number;
  startTime: number;
  endTime: number;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m${secs}s` : `${secs}s`;
};

const formatTimecode = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Dividir script em cenas estimadas baseado em palavras
function estimateScenes(script: string, wordsPerScene: number, wpm: number): PreviewScene[] {
  const words = script.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const scenes: PreviewScene[] = [];
  let currentTime = 0;
  let sceneNumber = 1;
  
  // Dividir em chunks de aproximadamente wordsPerScene palavras
  for (let i = 0; i < words.length; i += wordsPerScene) {
    const sceneWords = words.slice(i, i + wordsPerScene);
    const text = sceneWords.join(' ');
    const wordCount = sceneWords.length;
    const durationSeconds = (wordCount / wpm) * 60;
    
    scenes.push({
      number: sceneNumber++,
      text,
      wordCount,
      durationSeconds,
      startTime: currentTime,
      endTime: currentTime + durationSeconds,
    });
    
    currentTime += durationSeconds;
  }
  
  return scenes;
}

export function ScriptPreviewTimeline({ 
  script, 
  wordsPerScene, 
  wpm, 
  className = "",
  onSyncAudio
}: ScriptPreviewTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showSyncInput, setShowSyncInput] = useState(false);
  const [audioDuration, setAudioDuration] = useState("");
  
  const previewScenes = useMemo(() => 
    estimateScenes(script, wordsPerScene, wpm), 
    [script, wordsPerScene, wpm]
  );
  
  const totalDuration = useMemo(() => 
    previewScenes.reduce((acc, scene) => acc + scene.durationSeconds, 0), 
    [previewScenes]
  );
  
  const totalWords = useMemo(() => 
    previewScenes.reduce((acc, scene) => acc + scene.wordCount, 0), 
    [previewScenes]
  );

  const timelineData = useMemo(() => {
    return previewScenes.map(scene => ({
      ...scene,
      widthPercent: Math.max((scene.durationSeconds / totalDuration) * 100, 2),
    }));
  }, [previewScenes, totalDuration]);

  // Gerar marcadores de tempo
  const timeMarkers = useMemo(() => {
    if (totalDuration === 0) return [0];
    const markers: number[] = [0];
    const interval = totalDuration <= 60 ? 10 : totalDuration <= 180 ? 30 : 60;
    for (let t = interval; t < totalDuration; t += interval) {
      markers.push(t);
    }
    markers.push(totalDuration);
    return markers;
  }, [totalDuration]);

  // Formatar input de tempo enquanto digita (máscara MM:SS)
  const handleDurationChange = (value: string) => {
    // Remove tudo que não for número
    const numbersOnly = value.replace(/\D/g, '');
    
    if (numbersOnly.length <= 2) {
      setAudioDuration(numbersOnly);
    } else {
      // Formata como MM:SS
      const mins = numbersOnly.slice(0, -2) || '0';
      const secs = numbersOnly.slice(-2);
      setAudioDuration(`${mins}:${secs}`);
    }
  };

  // Sincronizar com duração do áudio
  const handleSyncAudio = () => {
    if (!audioDuration.trim()) {
      toast.error("Insira a duração do áudio");
      return;
    }

    let durationSeconds = 0;
    
    if (audioDuration.includes(":")) {
      const parts = audioDuration.split(":");
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      durationSeconds = mins * 60 + secs;
    } else {
      durationSeconds = parseFloat(audioDuration) || 0;
    }
    
    if (durationSeconds <= 0) {
      toast.error("Duração inválida");
      return;
    }
    
    // Calcular WPM baseado na duração real
    const calculatedWpm = Math.round(totalWords / (durationSeconds / 60));
    const clampedWpm = Math.max(80, Math.min(250, calculatedWpm));
    
    if (onSyncAudio) {
      onSyncAudio(clampedWpm);
      toast.success(`WPM ajustado para ${clampedWpm} (${totalWords} palavras em ${formatTimecode(durationSeconds)})`);
    }
    
    setShowSyncInput(false);
    setAudioDuration("");
  };

  if (!script.trim() || previewScenes.length === 0) {
    return null;
  }

  return (
    <Card className={`p-4 border-dashed border-primary/30 bg-primary/5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Preview da Timeline</span>
          <Badge variant="outline" className="text-xs">
            Estimativa
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onSyncAudio && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
              onClick={() => setShowSyncInput(!showSyncInput)}
            >
              <Timer className="w-3 h-3 mr-1" />
              Sincronizar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showDetails ? "Ocultar" : "Detalhes"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Recolher" : "Expandir"}
          </Button>
        </div>
      </div>

      {/* Sync Audio Input */}
      {showSyncInput && onSyncAudio && (
        <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Duração real do áudio (MM:SS)
              </Label>
              <Input
                placeholder="Ex: 15:30"
                value={audioDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="h-8 text-sm bg-background"
                onKeyDown={(e) => e.key === 'Enter' && handleSyncAudio()}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSyncAudio}
              className="h-8 bg-amber-500 hover:bg-amber-600 text-black"
            >
              Aplicar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            O WPM será recalculado para sincronizar as cenas com a duração real da narração.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">{totalWords} palavras</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">~{previewScenes.length} cenas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-primary font-medium">{formatTime(totalDuration)}</span>
          <span className="text-muted-foreground">@ {wpm} WPM</span>
        </div>
      </div>

      {/* Timeline visual */}
      <ScrollArea className="w-full">
        <div className="min-w-[400px] pb-2">
          {/* Barra de cenas */}
          <TooltipProvider delayDuration={100}>
            <div className={`flex rounded-lg overflow-hidden border border-border/50 bg-background/30 ${isExpanded ? 'h-20' : 'h-10'}`}>
              {timelineData.map((scene, index) => {
                const colors = [
                  'from-primary/60 to-primary/40',
                  'from-blue-500/60 to-blue-500/40',
                  'from-green-500/60 to-green-500/40',
                  'from-amber-500/60 to-amber-500/40',
                  'from-purple-500/60 to-purple-500/40',
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <Tooltip key={scene.number}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          relative flex flex-col items-center justify-center
                          bg-gradient-to-b ${colorClass}
                          border-r border-background/20 last:border-r-0
                          cursor-pointer hover:brightness-125 transition-all
                          overflow-hidden
                        `}
                        style={{ width: `${scene.widthPercent}%`, minWidth: '16px' }}
                      >
                        <div className="text-center px-0.5">
                          <span className={`font-bold text-white drop-shadow-md ${isExpanded ? 'text-sm' : 'text-[9px]'}`}>
                            {scene.number}
                          </span>
                          {isExpanded && scene.widthPercent > 5 && (
                            <>
                              <span className="block text-[9px] text-white/90 drop-shadow">
                                {formatTime(scene.durationSeconds)}
                              </span>
                              <span className="block text-[8px] text-white/70">
                                {scene.wordCount}w
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <div className="space-y-1">
                        <p className="font-bold">Cena {scene.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimecode(scene.startTime)} → {formatTimecode(scene.endTime)}
                        </p>
                        <p className="text-xs">
                          <span className="text-primary font-medium">{formatTime(scene.durationSeconds)}</span>
                          {" • "}
                          <span className="text-muted-foreground">{scene.wordCount} palavras</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-3 border-t pt-1 mt-1">
                          "{scene.text.substring(0, 120)}..."
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Marcadores de tempo */}
          <div className="relative h-4 mt-1">
            {timeMarkers.map((time, i) => {
              const position = (time / totalDuration) * 100;
              return (
                <div 
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{ 
                    left: `${position}%`,
                    transform: i === timeMarkers.length - 1 ? 'translateX(-100%)' : 
                               i === 0 ? 'translateX(0)' : 'translateX(-50%)'
                  }}
                >
                  <div className="w-px h-1 bg-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground">
                    {formatTimecode(time)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Detalhes expandidos - mostra duração de cada cena */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border/50 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {previewScenes.map((scene) => (
              <div 
                key={scene.number}
                className="flex items-center gap-2 p-2 rounded bg-secondary/30"
              >
                <span className="font-bold text-primary min-w-[24px] text-center">{scene.number}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {formatTimecode(scene.startTime)} → {formatTimecode(scene.endTime)}
                    </Badge>
                    <span className="text-primary font-medium">{formatTime(scene.durationSeconds)}</span>
                  </div>
                  <p className="text-muted-foreground line-clamp-1 text-[10px] mt-0.5">
                    {scene.wordCount}w • {scene.text.substring(0, 40)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-[10px] text-muted-foreground mt-2">
        💡 Esta é uma estimativa. A IA ajustará os cortes baseada em transições narrativas naturais.
      </p>
    </Card>
  );
}