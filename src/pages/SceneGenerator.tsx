import { useState, useMemo, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Film, Copy, Check, Image, Images, Download, ArrowRight, Upload, FileText, Sparkles, CheckCircle2, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addBrandingFooter } from "@/lib/utils";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import BatchImageGenerator from "@/components/scenes/BatchImageGenerator";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { StyleSelector } from "@/components/scenes/StyleSelector";
import { getStyleById } from "@/lib/thumbnailStyles";

interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
}

const WORDS_PER_SCENE_OPTIONS = [
  { value: "25", label: "25 palavras" },
  { value: "30", label: "30 palavras" },
  { value: "35", label: "35 palavras" },
  { value: "40", label: "40 palavras" },
  { value: "50", label: "50 palavras" },
  { value: "60", label: "60 palavras" },
  { value: "75", label: "75 palavras" },
  { value: "100", label: "100 palavras" },
  { value: "custom", label: "Personalizado..." },
];

const SceneGenerator = () => {
  // Credit deduction hook
  const { executeWithDeduction, getEstimatedCost } = useCreditDeduction();
  
  // Tab state
  const [activeTab, setActiveTab] = usePersistedState("scene_active_tab", "scenes");
  
  // Persisted states
  const [script, setScript] = usePersistedState("scene_script", "");
  const [title, setTitle] = usePersistedState("scene_title", "");
  const [niche, setNiche] = usePersistedState("scene_niche", "");
  const [style, setStyle] = usePersistedState("scene_style", "photorealistic");
  const [wordsPerScene, setWordsPerScene] = usePersistedState("scene_wordsPerScene", "40");
  const [scenes, setScenes] = usePersistedState<ScenePrompt[]>("scene_scenes", []);
  const [batchPrompts, setBatchPrompts] = usePersistedState("batch_prompts", "");
  
  // Non-persisted states
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCustomWps, setShowCustomWps] = useState(false);
  const [customWps, setCustomWps] = useState("");
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"generating" | "complete">("generating");
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current value is custom
  const isCustomValue = !WORDS_PER_SCENE_OPTIONS.some(opt => opt.value === wordsPerScene && opt.value !== "custom");

  // Handle words per scene selection
  const handleWordsPerSceneChange = (value: string) => {
    if (value === "custom") {
      setShowCustomWps(true);
      setCustomWps(wordsPerScene === "custom" ? "" : wordsPerScene);
    } else {
      setWordsPerScene(value);
      setShowCustomWps(false);
    }
  };

  // Apply custom WPS
  const applyCustomWps = () => {
    const num = parseInt(customWps);
    if (num >= 10 && num <= 500) {
      setWordsPerScene(customWps);
      setShowCustomWps(false);
    } else {
      toast.error("Digite um valor entre 10 e 500 palavras");
    }
  };

  // Handle TXT file - shared logic for upload and drop
  const processFile = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      toast.error("Por favor, selecione um arquivo .txt");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setScript(content);
        toast.success(`Arquivo "${file.name}" carregado com sucesso!`);
      }
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
    };
    reader.readAsText(file);
  };

  // Handle TXT file upload via input
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    processFile(file);
    
    // Reset input to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Calculate estimated scenes based on word count
  const wordCount = useMemo(() => {
    return script.split(/\s+/).filter(w => w).length;
  }, [script]);

  const estimatedScenes = useMemo(() => {
    const wps = parseInt(wordsPerScene);
    if (wordCount === 0 || wps === 0) return 0;
    return Math.ceil(wordCount / wps);
  }, [wordCount, wordsPerScene]);

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error("Cole o roteiro para gerar prompts de cenas");
      return;
    }

    // Calcular créditos baseado em lotes de 10 cenas
    const scenesMultiplier = Math.ceil(estimatedScenes / 10);
    
    setIsGenerating(true);
    setScenes([]);
    setProgressModalOpen(true);
    setGenerationStatus("generating");
    setGenerationProgress(0);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      const { result, success, error } = await executeWithDeduction(
        {
          operationType: 'generate_scenes',
          multiplier: scenesMultiplier,
          details: { estimatedScenes, wordsPerScene: parseInt(wordsPerScene) },
          showToast: true
        },
        async () => {
          const { data, error } = await supabase.functions.invoke("generate-scenes", {
            body: {
              script,
              title,
              niche,
              style,
              estimatedScenes,
              wordsPerScene: parseInt(wordsPerScene),
            },
          });

          if (error) throw error;
          if (!data.success) throw new Error(data.error || "Erro ao gerar cenas");
          
          return data;
        }
      );

      clearInterval(progressInterval);

      if (!success) {
        if (error !== 'Saldo insuficiente') {
          toast.error(error || "Erro ao gerar prompts de cenas");
        }
        setProgressModalOpen(false);
        return;
      }

      if (result) {
        setScenes(result.scenes);
        setGenerationProgress(100);
        setGenerationStatus("complete");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating scenes:", error);
      toast.error("Erro ao gerar prompts de cenas");
      setProgressModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseProgressModal = () => {
    setProgressModalOpen(false);
  };

  const handleGoToBatch = () => {
    const prompts = scenes.map(s => s.imagePrompt).join("\n\n");
    setBatchPrompts(prompts);
    setProgressModalOpen(false);
    setActiveTab("batch");
  };

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllPrompts = () => {
    const allPrompts = scenes.map(s => `CENA ${s.number}:\n${s.imagePrompt}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    toast.success("Todos os prompts copiados!");
  };

  const downloadTxt = () => {
    const content = addBrandingFooter(scenes.map(s => s.imagePrompt).join("\n\n"));
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts-cenas-${title || "video"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo TXT baixado!");
  };

  const sendToBatchGenerator = () => {
    const prompts = scenes.map(s => s.imagePrompt).join("\n\n");
    setBatchPrompts(prompts);
    setActiveTab("batch");
    toast.success("Prompts enviados para Imagens em Lote!");
  };

  return (
    <>
      <SEOHead
        title="Gerador de Cenas"
        description="Gere prompts de imagem para cada cena do seu roteiro com IA."
        noindex={true}
      />
      <MainLayout>
        <PermissionGate permission="gerador_cenas" featureName="Gerador de Cenas">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["scene_script", "scene_title", "scene_niche", "scene_scenes"]}
            label="Cenas anteriores"
            onClear={() => {
              setScript("");
              setTitle("");
              setNiche("");
              setScenes([]);
            }}
          />

          <div className="mb-6 mt-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Cenas</h1>
              <p className="text-muted-foreground">
                Gere prompts de imagem para cada cena do seu roteiro ou imagens em lote
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="scenes" className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                Prompts de Cenas
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <Images className="w-4 h-4" />
                Imagens em Lote
              </TabsTrigger>
            </TabsList>

            {/* Scenes Tab */}
            <TabsContent value="scenes">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Film className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Roteiro</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Título do Vídeo</Label>
                          <Input
                            id="title"
                            placeholder="Ex: Como ganhar dinheiro online"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="niche">Nicho</Label>
                          <Input
                            id="niche"
                            placeholder="Ex: Marketing Digital"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Estilo Visual</Label>
                          <div className="mt-1">
                            <StyleSelector 
                              selectedStyleId={style} 
                              onStyleSelect={setStyle} 
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Palavras por Cena</Label>
                          {showCustomWps ? (
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="number"
                                min="10"
                                max="500"
                                placeholder="Ex: 45"
                                value={customWps}
                                onChange={(e) => setCustomWps(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") applyCustomWps();
                                  if (e.key === "Escape") setShowCustomWps(false);
                                }}
                                className="flex-1"
                                autoFocus
                              />
                              <Button size="sm" onClick={applyCustomWps}>
                                OK
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setShowCustomWps(false)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Select 
                              value={isCustomValue ? "custom" : wordsPerScene} 
                              onValueChange={handleWordsPerSceneChange}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue>
                                  {isCustomValue ? `${wordsPerScene} palavras` : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {WORDS_PER_SCENE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>

                      {/* Estimated scenes info */}
                      {wordCount > 0 && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{wordCount}</span> palavras ÷{" "}
                            <span className="font-medium">{wordsPerScene}</span> = aproximadamente{" "}
                            <span className="font-bold text-primary">{estimatedScenes}</span> cenas
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="script">Roteiro Completo</Label>
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".txt"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="script-file-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 text-xs"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Carregar TXT
                            </Button>
                          </div>
                        </div>
                        <div
                          className={`relative mt-1 ${isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-md" : ""}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Textarea
                            id="script"
                            placeholder="Cole seu roteiro aqui, carregue ou arraste um arquivo .txt..."
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            className={`min-h-64 transition-colors ${isDragging ? "bg-primary/5 border-primary" : ""}`}
                          />
                          {isDragging && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-md pointer-events-none">
                              <div className="flex flex-col items-center gap-2 text-primary">
                                <Upload className="w-8 h-8" />
                                <span className="font-medium">Solte o arquivo .txt aqui</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {wordCount} palavras
                        </p>
                      </div>

                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !script.trim()}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando prompts...
                          </>
                        ) : (
                          <>
                            <Image className="w-4 h-4 mr-2" />
                            Gerar Prompts de Cenas {estimatedScenes > 0 && `(~${estimatedScenes})`}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Results */}
                <div>
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Cenas Geradas</h3>
                      {scenes.length > 0 && (
                        <Button variant="outline" size="sm" onClick={copyAllPrompts}>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar Todos
                        </Button>
                      )}
                    </div>

                    {scenes.length === 0 ? (
                      <div className="text-center py-8">
                        <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Os prompts de cenas aparecerão aqui
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                          {scenes.map((scene, index) => (
                            <div
                              key={index}
                              className="p-3 bg-secondary/50 rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">
                                  Cena {scene.number}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => copyPrompt(scene.imagePrompt, index)}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-3 h-3 text-success" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {scene.text.substring(0, 100)}...
                              </p>
                              <p className="text-sm text-foreground">
                                {scene.imagePrompt.substring(0, 150)}...
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={downloadTxt}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar TXT
                          </Button>
                          <Button
                            className="w-full"
                            onClick={sendToBatchGenerator}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Gerar Imagens em Lote
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Batch Image Generation Tab */}
            <TabsContent value="batch">
              <BatchImageGenerator initialPrompts={batchPrompts} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Progress/Complete Modal */}
      <Dialog open={progressModalOpen} onOpenChange={setProgressModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {generationStatus === "generating" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Gerando Prompts de Cenas
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Prompts Gerados com Sucesso!
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {generationStatus === "generating" ? (
              <>
                <div className="flex items-center justify-center py-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                      <img 
                        src="/src/assets/logo_1.gif" 
                        alt="Processando" 
                        className="w-full h-full object-cover scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Analisando roteiro e gerando prompts otimizados...
                  </p>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <p>Estimativa: ~{estimatedScenes} cenas</p>
                  <p>{wordCount} palavras • {wordsPerScene} palavras/cena</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-1">
                      {scenes.length}
                    </div>
                    <p className="text-sm text-muted-foreground">prompts gerados</p>
                  </div>
                </div>

                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Preview do primeiro prompt:</p>
                  <p className="text-sm text-foreground line-clamp-3">
                    {scenes[0]?.imagePrompt || "..."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      downloadTxt();
                      handleCloseProgressModal();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar TXT
                  </Button>
                  <Button
                    className="w-full"
                    onClick={handleGoToBatch}
                  >
                    <Images className="w-4 h-4 mr-2" />
                    Gerar Imagens em Lote
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={handleCloseProgressModal}
                  >
                    Ver Prompts Detalhados
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

        </PermissionGate>
      </MainLayout>
    </>
  );
};

export default SceneGenerator;
