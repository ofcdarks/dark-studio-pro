import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Image, 
  Wand2, 
  Copy, 
  Save, 
  History, 
  Loader2, 
  Film, 
  Clock, 
  FileText, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  Download,
  ImagePlus,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { THUMBNAIL_STYLES, THUMBNAIL_STYLE_CATEGORIES } from "@/lib/thumbnailStyles";
import logoGif from "@/assets/logo.gif";

interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
  estimatedTime?: string;
  timecode?: string; // início
  endTimecode?: string; // fim
  generatedImage?: string;
  generatingImage?: boolean;
}

interface SceneHistory {
  id: string;
  title: string | null;
  script: string;
  total_scenes: number;
  total_words: number;
  estimated_duration: string | null;
  model_used: string | null;
  style: string | null;
  scenes: ScenePrompt[];
  credits_used: number;
  created_at: string;
}

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet" },
  { value: "gemini-2.5-pro-preview-06-05", label: "Gemini 2.5 Pro" },
];

// Calcular tempo estimado baseado em palavras (média 150 palavras/min para narração)
const calculateEstimatedTime = (wordCount: number): string => {
  const minutes = wordCount / 150;
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const WORDS_PER_MINUTE = 150;

const wordCountToSeconds = (wordCount: number): number => (wordCount / WORDS_PER_MINUTE) * 60;

const formatTimecode = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// Calcular timecode baseado em posição no roteiro
const calculateTimecode = (scenes: ScenePrompt[], currentIndex: number): string => {
  let totalSeconds = 0;
  for (let i = 0; i < currentIndex; i++) {
    totalSeconds += wordCountToSeconds(scenes[i].wordCount);
  }
  return formatTimecode(totalSeconds);
};

const PromptsImages = () => {
  // Persisted states
  const [script, setScript] = usePersistedState("prompts_script", "");
  const [style, setStyle] = usePersistedState("prompts_style", "cinematic");
  const [model, setModel] = usePersistedState("prompts_model", "gpt-4o");
  const [wordsPerScene, setWordsPerScene] = usePersistedState("prompts_wordsPerScene", "80");
  const [generatedScenes, setGeneratedScenes] = usePersistedState<ScenePrompt[]>("prompts_scenes", []);
  
  // Non-persisted states
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const [imageBatchTotal, setImageBatchTotal] = useState(0);
  const [imageBatchDone, setImageBatchDone] = useState(0);
  const [previewScene, setPreviewScene] = useState<ScenePrompt | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progress, setProgress] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar histórico de prompts de cenas
  const { data: sceneHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["scene-prompts-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("scene_prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        scenes: (item.scenes as unknown as ScenePrompt[]) || []
      })) as SceneHistory[];
    },
    enabled: !!user,
  });

  // Buscar prompts salvos (mantendo funcionalidade existente)
  const { data: savedPrompts } = useQuery({
    queryKey: ["saved-prompts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Gerar prompts de cenas
  const handleGenerate = async () => {
    if (!script.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um roteiro",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGeneratedScenes([]);
    setProgress(0);
    
    const wordCount = script.split(/\s+/).filter(Boolean).length;
    const estimatedScenes = Math.ceil(wordCount / (parseInt(wordsPerScene) || 80));
    const totalBatches = Math.ceil(estimatedScenes / 10);
    
    setLoadingMessage(`Analisando ${wordCount} palavras...`);
    setProgress(10);

    try {
      setLoadingMessage(`Processando ~${estimatedScenes} cenas em ${totalBatches} lote(s)...`);
      setProgress(30);
      
      const response = await supabase.functions.invoke("generate-scenes", {
        body: { 
          script,
          model,
          style,
          wordsPerScene: parseInt(wordsPerScene) || 80,
          maxScenes: 500
        },
      });

      setLoadingMessage("Finalizando...");
      setProgress(80);

      // Check for errors in response
      if (response.error) {
        throw new Error(response.error.message || "Erro na função");
      }

      // Check for error in data
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      const { scenes, totalScenes, creditsUsed } = response.data;
      
      if (!scenes || scenes.length === 0) {
        throw new Error("Nenhuma cena foi gerada. Tente novamente.");
      }
      
      // Enriquecer cenas com tempo e timecode
      let cumulativeSeconds = 0;
      const enrichedScenes: ScenePrompt[] = scenes.map((scene: ScenePrompt) => {
        const startSeconds = cumulativeSeconds;
        const durationSeconds = wordCountToSeconds(scene.wordCount);
        const endSeconds = startSeconds + durationSeconds;
        cumulativeSeconds = endSeconds;

        return {
          ...scene,
          estimatedTime: calculateEstimatedTime(scene.wordCount),
          timecode: formatTimecode(startSeconds),
          endTimecode: formatTimecode(endSeconds),
        };
      });

      setGeneratedScenes(enrichedScenes);
      setProgress(100);

      // Calcular duração total
      const totalWords = enrichedScenes.reduce((acc: number, s: ScenePrompt) => acc + s.wordCount, 0);
      const estimatedDuration = calculateEstimatedTime(totalWords);

      // Salvar no histórico
      if (user) {
        await supabase.from("scene_prompts").insert([{
          user_id: user.id,
          title: `Roteiro ${new Date().toLocaleDateString('pt-BR')}`,
          script,
          total_scenes: totalScenes,
          total_words: totalWords,
          estimated_duration: estimatedDuration,
          model_used: model,
          style,
          scenes: JSON.parse(JSON.stringify(enrichedScenes)),
          credits_used: creditsUsed
        }]);
      }

      queryClient.invalidateQueries({ queryKey: ["scene-prompts-history"] });

      toast({
        title: "Prompts gerados!",
        description: `${totalScenes} cenas analisadas. Créditos: ${creditsUsed}`,
      });
    } catch (error: any) {
      console.error("Error generating scenes:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar os prompts",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Gerar imagens para próximas 5 cenas (em sequência)
  const handleGenerateAllImages = async () => {
    if (generatedScenes.length === 0) return;

    const pendingIndexes = generatedScenes
      .map((s, idx) => ({ s, idx }))
      .filter(({ s }) => !s.generatedImage)
      .map(({ idx }) => idx);

    if (pendingIndexes.length === 0) return;

    const batchSize = 5;
    const batchIndexes = pendingIndexes.slice(0, batchSize);

    setGeneratingImages(true);
    setImageBatchTotal(batchIndexes.length);
    setImageBatchDone(0);

    const updatedScenes = [...generatedScenes];
    let processed = 0;

    for (let i = 0; i < batchIndexes.length; i++) {
      const sceneIndex = batchIndexes[i];
      setCurrentGeneratingIndex(sceneIndex);

      try {
        const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
        const fullPrompt = stylePrefix
          ? `${stylePrefix} ${updatedScenes[sceneIndex].imagePrompt}`
          : updatedScenes[sceneIndex].imagePrompt;

        const { data, error } = await supabase.functions.invoke("generate-imagefx", {
          body: {
            prompt: fullPrompt,
            aspectRatio: "LANDSCAPE",
            numberOfImages: 1,
          },
        });

        if (error) {
          const bodyText = (error as any)?.context?.body;
          if (bodyText) {
            try {
              const parsed = JSON.parse(bodyText);
              throw new Error(parsed?.error || error.message);
            } catch {
              throw new Error(error.message);
            }
          }
          throw new Error(error.message);
        }

        if ((data as any)?.error) {
          throw new Error((data as any).error);
        }

        const url = (data as any)?.images?.[0]?.url;
        if (url) {
          updatedScenes[sceneIndex] = {
            ...updatedScenes[sceneIndex],
            generatedImage: url,
          };
          setGeneratedScenes([...updatedScenes]);
        }

        processed += 1;
        setImageBatchDone(processed);
      } catch (error: any) {
        console.error(`Error generating image for scene ${sceneIndex + 1}:`, error);
        toast({
          title: `Erro na cena ${sceneIndex + 1}`,
          description: error?.message || "Não foi possível gerar a imagem",
          variant: "destructive",
        });
        // Para o lote ao primeiro erro (evita spam)
        break;
      }
    }

    setImageBatchDone(processed);
    setCurrentGeneratingIndex(null);
    setGeneratingImages(false);

    const generatedCount = updatedScenes.filter(s => s.generatedImage).length;
    toast({
      title: "Lote concluído!",
      description: `${generatedCount}/${updatedScenes.length} imagens criadas` ,
    });
  };

  // Regenerar imagem individual
  const handleRegenerateImage = async (index: number) => {
    const scene = generatedScenes[index];
    if (!scene) return;

    setCurrentGeneratingIndex(index);
    
    try {
      const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
      const fullPrompt = stylePrefix 
        ? `${stylePrefix} ${scene.imagePrompt}`
        : scene.imagePrompt;

      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
        body: {
          prompt: fullPrompt,
          aspectRatio: "LANDSCAPE",
          numberOfImages: 1
        }
      });

      if (error) {
        const bodyText = (error as any)?.context?.body;
        if (bodyText) {
          try {
            const parsed = JSON.parse(bodyText);
            throw new Error(parsed?.error || error.message);
          } catch {
            throw new Error(error.message);
          }
        }
        throw new Error(error.message);
      }

      if ((data as any)?.error) {
        throw new Error((data as any).error);
      }

      const url = (data as any)?.images?.[0]?.url;
      if (url) {
        const updatedScenes = [...generatedScenes];
        updatedScenes[index] = {
          ...updatedScenes[index],
          generatedImage: url
        };
        setGeneratedScenes(updatedScenes);
        
        toast({
          title: "Imagem regenerada!",
          description: `Cena ${scene.number} atualizada`,
        });
      }
    } catch (error: any) {
      console.error(`Error regenerating image for scene ${index + 1}:`, error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível regenerar a imagem",
        variant: "destructive",
      });
    } finally {
      setCurrentGeneratingIndex(null);
    }
  };

  // Copiar prompt individual
  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copiado!",
      description: "Prompt copiado para a área de transferência",
    });
  };

  // Copiar todos os prompts
  const copyAllPrompts = () => {
    const allPrompts = generatedScenes
      .map(s => `[Cena ${s.number} - ${s.timecode}]\n${s.imagePrompt}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    toast({
      title: "Copiado!",
      description: "Todos os prompts copiados",
    });
  };

  // Baixar prompts como TXT
  const downloadPrompts = () => {
    const content = generatedScenes
      .map(s => `=== CENA ${s.number} ===\nTimecode: ${s.timecode}\nDuração: ${s.estimatedTime}\nPalavras: ${s.wordCount}\n\nTexto:\n${s.text}\n\nPrompt de Imagem:\n${s.imagePrompt}`)
      .join("\n\n" + "=".repeat(50) + "\n\n");
    
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts-cenas-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download iniciado!",
      description: "Arquivo TXT com os prompts",
    });
  };

  // Carregar histórico
  const loadFromHistory = (history: SceneHistory) => {
    setScript(history.script);
    setStyle(history.style || "cinematic");
    setGeneratedScenes(history.scenes);
    toast({
      title: "Carregado!",
      description: "Roteiro carregado do histórico",
    });
  };

  // Deletar do histórico
  const deleteFromHistory = async (id: string) => {
    try {
      await supabase.from("scene_prompts").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["scene-prompts-history"] });
      toast({
        title: "Excluído!",
        description: "Removido do histórico",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir",
        variant: "destructive",
      });
    }
  };

  // Estatísticas do roteiro atual
  const scriptStats = {
    words: script.split(/\s+/).filter(Boolean).length,
    estimatedScenes: Math.ceil(script.split(/\s+/).filter(Boolean).length / (parseInt(wordsPerScene) || 80)),
    estimatedDuration: calculateEstimatedTime(script.split(/\s+/).filter(Boolean).length)
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["prompts_script", "prompts_scenes"]}
            label="Roteiro anterior"
            onClear={() => {
              setScript("");
              setGeneratedScenes([]);
            }}
          />

          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Prompts para Cenas</h1>
            <p className="text-muted-foreground">
              Analise seu roteiro e gere prompts de imagem otimizados para cada cena com direção de produção audiovisual
            </p>
          </div>

          <Tabs defaultValue="generator" className="space-y-6">
            <TabsList className="bg-secondary">
              <TabsTrigger value="generator" className="gap-2">
                <Film className="w-4 h-4" />
                Gerador
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Área de Input */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Wand2 className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Análise de Roteiro</h3>
                    </div>

                    <Textarea
                      placeholder="Cole seu roteiro aqui... A IA irá analisar e dividir em cenas com prompts de imagem otimizados."
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      className="bg-secondary border-border min-h-48 mb-4 font-mono text-sm"
                    />

                    {/* Estatísticas em tempo real */}
                    {script.trim() && (
                      <div className="flex flex-wrap gap-4 mb-4 p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            <strong className="text-foreground">{scriptStats.words}</strong> palavras
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            ~<strong className="text-foreground">{scriptStats.estimatedScenes}</strong> cenas
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            ~<strong className="text-foreground">{scriptStats.estimatedDuration}</strong> duração
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Estilo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {THUMBNAIL_STYLE_CATEGORIES.map((category) => (
                            <div key={category.id}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                {category.icon} {category.name}
                              </div>
                              {THUMBNAIL_STYLES.filter(s => s.category === category.id).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{s.icon}</span>
                                    <span>{s.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Modelo IA" />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder="Palavras/cena"
                        value={wordsPerScene}
                        onChange={(e) => setWordsPerScene(e.target.value)}
                        className="bg-secondary border-border"
                        min={30}
                        max={200}
                      />

                      <Button 
                        onClick={handleGenerate}
                        disabled={generating || !script.trim()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {generating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Analisar
                      </Button>
                    </div>
                  </Card>

                  {/* Cenas Geradas */}
                  {generatedScenes.length > 0 && (
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Film className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-foreground">
                            {generatedScenes.length} Cenas Analisadas
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={downloadPrompts}>
                            <Download className="w-4 h-4 mr-2" />
                            Baixar TXT
                          </Button>
                          <Button variant="outline" size="sm" onClick={copyAllPrompts}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar Todos
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleGenerateAllImages}
                            disabled={generatingImages || generatedScenes.every(s => s.generatedImage)}
                            className="bg-primary text-primary-foreground"
                          >
                            {generatingImages ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Gerando {imageBatchDone}/{imageBatchTotal}
                              </>
                            ) : (
                              <>
                                <ImagePlus className="w-4 h-4 mr-2" />
                                Gerar próximas {Math.min(5, generatedScenes.filter(s => !s.generatedImage).length)}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Grid de imagens - sempre visível */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            Imagens das Cenas ({generatedScenes.filter(s => s.generatedImage).length}/{generatedScenes.length})
                          </h4>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                          {generatedScenes.map((scene, index) => (
                            <div 
                              key={`img-${scene.number}`}
                              className="group relative aspect-video rounded-lg overflow-hidden bg-secondary border border-border"
                            >
                              {scene.generatedImage ? (
                                <>
                                  <img 
                                    src={scene.generatedImage} 
                                    alt={`Cena ${scene.number}`}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setPreviewScene(scene)}
                                  />
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegenerateImage(index);
                                    }}
                                    disabled={currentGeneratingIndex === index}
                                  >
                                    {currentGeneratingIndex === index ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3" />
                                    )}
                                  </Button>
                                </>
                              ) : currentGeneratingIndex === index ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  <span className="text-[10px] text-muted-foreground">Gerando...</span>
                                </div>
                              ) : (
                                <button 
                                  className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-secondary/80 transition-colors"
                                  onClick={() => handleRegenerateImage(index)}
                                  disabled={generatingImages}
                                >
                                  <ImagePlus className="w-5 h-5 text-muted-foreground/50" />
                                  <span className="text-[10px] text-muted-foreground">Gerar</span>
                                </button>
                              )}
                              <div className="absolute bottom-1 left-1 bg-background/80 px-1.5 py-0.5 rounded">
                                <div className="text-xs font-bold leading-none">{scene.number}</div>
                                {scene.timecode && (
                                  <div className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
                                    {scene.timecode}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {generatedScenes.map((scene, index) => (
                            <div 
                              key={scene.number}
                              className="p-4 bg-secondary/50 rounded-lg border border-border/50"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-primary/20 text-primary">
                                    Cena {scene.number}
                                  </Badge>
                                  <Badge variant="outline" className="font-mono">
                                    {scene.timecode}{scene.endTimecode ? `–${scene.endTimecode}` : ""}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {scene.wordCount} palavras • {scene.estimatedTime}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setExpandedScene(expandedScene === index ? null : index)}
                                  >
                                    {expandedScene === index ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-8 w-8", copiedIndex === index && "text-green-500")}
                                    onClick={() => copyPrompt(scene.imagePrompt, index)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRegenerateImage(index)}
                                    disabled={currentGeneratingIndex === index}
                                    title="Regenerar imagem"
                                  >
                                    {currentGeneratingIndex === index ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {expandedScene === index && (
                                <div className="mb-3 p-3 bg-background rounded border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">Texto da Cena:</p>
                                  <p className="text-sm text-foreground">{scene.text}</p>
                                </div>
                              )}

                              <div className="p-3 bg-background rounded border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Prompt de Imagem:</p>
                                <p className="text-sm text-foreground font-mono leading-relaxed">
                                  {scene.imagePrompt}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  )}
                </div>

                {/* Sidebar - Prompts Salvos */}
                <div>
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Save className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Prompts Salvos</h3>
                    </div>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 pr-2">
                        {savedPrompts && savedPrompts.length > 0 ? (
                          savedPrompts.map((item) => (
                            <div 
                              key={item.id} 
                              className="p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                            >
                              <h4 className="font-medium text-foreground text-sm mb-1">{item.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8 text-sm">
                            Nenhum prompt salvo
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Histórico de Análises</h3>
                </div>

                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : sceneHistory && sceneHistory.length > 0 ? (
                  <div className="space-y-4">
                    {sceneHistory.map((history) => (
                      <div 
                        key={history.id}
                        className="p-4 bg-secondary/50 rounded-lg border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-foreground mb-1">
                              {history.title || "Roteiro sem título"}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                {history.total_scenes} cenas
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {history.total_words} palavras
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {history.estimated_duration}
                              </Badge>
                              {history.model_used && (
                                <Badge className="text-xs bg-primary/20 text-primary">
                                  {AI_MODELS.find(m => m.value === history.model_used)?.label || history.model_used}
                                </Badge>
                              )}
                              {history.style && (
                                <Badge variant="secondary" className="text-xs">
                                  {THUMBNAIL_STYLES.find(s => s.id === history.style)?.name || history.style}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpandedHistory(expandedHistory === history.id ? null : history.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => loadFromHistory(history)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteFromHistory(history.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(history.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>

                        {expandedHistory === history.id && (
                          <div className="mt-4 space-y-3">
                            <div className="p-3 bg-background rounded border border-border">
                              <p className="text-xs text-muted-foreground mb-1">Roteiro Original:</p>
                              <p className="text-sm text-foreground line-clamp-4">{history.script}</p>
                            </div>
                            
                            <div className="grid gap-3">
                              {history.scenes.slice(0, 3).map((scene) => (
                                <div key={scene.number} className="p-3 bg-background rounded border border-border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-primary/20 text-primary text-xs">
                                      Cena {scene.number}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {scene.wordCount} palavras
                                    </span>
                                  </div>
                                  <p className="text-xs text-foreground font-mono line-clamp-2">
                                    {scene.imagePrompt}
                                  </p>
                                </div>
                              ))}
                              {history.scenes.length > 3 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  + {history.scenes.length - 3} cenas...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma análise no histórico</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Suas análises de roteiro aparecerão aqui
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Preview da Imagem */}
      <Dialog open={!!previewScene} onOpenChange={() => setPreviewScene(null)}>
        <DialogContent className="max-w-4xl bg-card border-primary/50 rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Badge className="bg-primary/20 text-primary">Cena {previewScene?.number}</Badge>
              <span className="text-sm text-muted-foreground font-mono">
                {previewScene?.timecode}{previewScene?.endTimecode ? `–${previewScene?.endTimecode}` : ""}
              </span>
              <span className="text-sm text-muted-foreground">
                {previewScene?.wordCount} palavras • {previewScene?.estimatedTime}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Imagem ampliada */}
            {previewScene?.generatedImage && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
                <img 
                  src={previewScene.generatedImage} 
                  alt={`Cena ${previewScene.number}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Prompt usado */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground">Prompt de Imagem</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    if (previewScene?.imagePrompt) {
                      navigator.clipboard.writeText(previewScene.imagePrompt);
                      toast({
                        title: "Copiado!",
                        description: "Prompt copiado para a área de transferência",
                      });
                    }
                  }}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
              </div>
              <p className="text-sm text-foreground font-mono leading-relaxed">
                {previewScene?.imagePrompt}
              </p>
            </div>

            {/* Texto da cena */}
            <div className="p-4 bg-secondary/50 rounded-lg border border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Texto da Cena</p>
              <p className="text-sm text-foreground leading-relaxed">
                {previewScene?.text}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={generating} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-card border-primary/50 rounded-xl shadow-xl" hideCloseButton>
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            {/* Logo com efeito de pulso */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="relative w-20 h-20 rounded-full border-2 border-primary/50 overflow-hidden bg-card flex items-center justify-center">
                <img 
                  src={logoGif} 
                  alt="Loading" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Mensagem de progresso */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Analisando Roteiro
              </h3>
              <p className="text-sm text-muted-foreground">
                {loadingMessage}
              </p>
            </div>

            {/* Barra de progresso */}
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2 bg-secondary" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Processando com IA
                </span>
                <span className="text-xs font-medium text-primary">
                  {progress}%
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PromptsImages;
