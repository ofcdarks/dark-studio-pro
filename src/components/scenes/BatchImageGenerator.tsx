import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Loader2, Images, Download, Trash2, RefreshCw, AlertCircle, Sparkles, Copy, Check, ChevronLeft, ChevronRight, X, History, Clock, Save, Wand2, Edit3, FolderDown, RotateCcw, AlertTriangle, ImageIcon, Coins } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";
import { THUMBNAIL_STYLES, THUMBNAIL_STYLE_CATEGORIES, getStylesByCategory } from "@/lib/thumbnailStyles";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { saveBatchImageToCache, getAllBatchCachedImages, getBatchCacheStats, clearBatchImageCache } from "@/lib/imageCache";
import { useImageFXUsage } from "@/hooks/useImageFXUsage";
import { useNavigate } from "react-router-dom";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string | null;
  status: "pending" | "generating" | "success" | "error";
  error?: string;
  wasRewritten?: boolean;
}

interface BatchHistory {
  id: string;
  title: string | null;
  prompts: string;
  style_id: string | null;
  style_name: string | null;
  prompt_count: number;
  success_count: number | null;
  created_at: string;
}

interface BatchImageGeneratorProps {
  initialPrompts?: string;
}

const BatchImageGenerator = ({ initialPrompts = "" }: BatchImageGeneratorProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { deduct, checkBalance, getEstimatedCost, CREDIT_COSTS } = useCreditDeduction();
  
  const [promptsText, setPromptsText] = useState(initialPrompts);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  
  // ImageFX usage tracking
  const { currentCount, monthLimit, remaining, isLimitReached, incrementUsage, refresh: refreshUsage } = useImageFXUsage();
  
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  
  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<BatchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Edit prompt state
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const [editPromptText, setEditPromptText] = useState("");
  const [isRegeneratingEdit, setIsRegeneratingEdit] = useState(false);
  
  // Cache state
  const [cacheStats, setCacheStats] = useState<{ count: number; lastUpdated: Date | null }>({ count: 0, lastUpdated: null });
  const [loadingCache, setLoadingCache] = useState(false);

  // Verificar saldo ao carregar
  useEffect(() => {
    const checkCredits = async () => {
      const cost = getEstimatedCost('batch_images');
      const { hasBalance } = await checkBalance(cost);
      setInsufficientCredits(!hasBalance);
    };
    if (user) checkCredits();
  }, [user, checkBalance, getEstimatedCost]);

  // Load cache stats on mount
  useEffect(() => {
    const loadCacheStats = async () => {
      const stats = await getBatchCacheStats();
      setCacheStats(stats);
    };
    loadCacheStats();
  }, []);

  // Update promptsText when initialPrompts changes
  useEffect(() => {
    if (initialPrompts && initialPrompts !== promptsText) {
      setPromptsText(initialPrompts);
    }
  }, [initialPrompts]);

  // Keyboard navigation for preview
  useEffect(() => {
    if (!previewOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const successImages = images.filter(img => img.status === "success" && img.imageUrl);
      if (e.key === "ArrowLeft") {
        setPreviewIndex(prev => (prev > 0 ? prev - 1 : successImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setPreviewIndex(prev => (prev < successImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setPreviewOpen(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewOpen, images]);

  // Load history
  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("batch_generation_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Save to history
  const saveToHistory = async (successCount: number) => {
    if (!user) return;
    
    const style = THUMBNAIL_STYLES.find(s => s.id === selectedStyle);
    
    try {
      await supabase.from("batch_generation_history").insert({
        user_id: user.id,
        prompts: promptsText,
        style_id: selectedStyle || null,
        style_name: style?.name || null,
        prompt_count: parsePrompts().length,
        success_count: successCount,
      });
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  // Load prompts from history
  const loadFromHistory = (item: BatchHistory) => {
    setPromptsText(item.prompts);
    if (item.style_id) {
      setSelectedStyle(item.style_id);
    }
    setHistoryOpen(false);
    toast.success("Prompts carregados do histórico");
  };

  // Delete history item
  const deleteHistoryItem = async (id: string) => {
    try {
      await supabase.from("batch_generation_history").delete().eq("id", id);
      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success("Item removido do histórico");
    } catch (error) {
      console.error("Error deleting history item:", error);
      toast.error("Erro ao remover item");
    }
  };

  const parsePrompts = () => {
    // Split by double newline or numbered lines
    const lines = promptsText.trim().split(/\n\n+|\n(?=\d+[\.\)\-])/);
    return lines
      .map(line => line.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter(line => line.length > 0);
  };

  const getStylePrefix = () => {
    if (!selectedStyle) return "";
    const style = THUMBNAIL_STYLES.find(s => s.id === selectedStyle);
    return style ? style.promptPrefix + " " : "";
  };

  const handleStartGeneration = async () => {
    const prompts = parsePrompts();
    if (prompts.length === 0) {
      toast.error("Cole pelo menos um prompt de texto");
      return;
    }

    // Check ImageFX usage limit
    if (monthLimit !== null && remaining !== null) {
      if (remaining < prompts.length) {
        toast.error(`Limite de imagens atingido! Você tem ${remaining} imagens restantes este mês.`);
        return;
      }
    }

    // Calcular custo total (4 créditos por imagem)
    const totalCost = prompts.length * CREDIT_COSTS.batch_images;
    
    // Deduzir créditos antes
    const deductionResult = await deduct({
      operationType: 'batch_images',
      customAmount: totalCost,
      details: { imageCount: prompts.length },
      showToast: true
    });

    if (!deductionResult.success) {
      setInsufficientCredits(true);
      return;
    }

    const stylePrefix = getStylePrefix();
    
    // Initialize all images as pending
    const initialImages: GeneratedImage[] = prompts.map((prompt, index) => ({
      id: `img-${Date.now()}-${index}`,
      prompt: stylePrefix + prompt,
      imageUrl: null,
      status: "pending"
    }));

    setImages(initialImages);
    setIsGenerating(true);
    setCurrentIndex(0);

    const BATCH_SIZE = 5; // Processar 5 imagens em paralelo
    let successCount = 0;
    let refundAmount = 0;

    // Helper function to generate a single image with retries
    // The backend already handles prompt rewriting for blocked content
    const generateSingleImage = async (imageData: GeneratedImage, index: number): Promise<{ index: number; success: boolean; imageUrl?: string; wasRewritten?: boolean }> => {
      const maxRetries = 4; // More retries to allow backend rewriting
      let retries = 0;
      let lastError = "";
      
      while (retries <= maxRetries) {
        try {
          // Invoke with longer timeout for rewriting scenarios
          const { data, error } = await supabase.functions.invoke("generate-imagefx", {
            body: { 
              prompt: imageData.prompt,
              aspectRatio: "LANDSCAPE",
              numberOfImages: 1
            }
          });

          if (error) {
            const bodyText = (error as any)?.context?.body;
            let errMsg = error.message;
            if (bodyText) {
              try {
                const parsed = JSON.parse(bodyText);
                errMsg = parsed?.error || error.message;
              } catch {}
            }
            lastError = errMsg;
            
            // Check for rate limit - wait longer
            if (errMsg.includes("Limite de requisições") || errMsg.includes("429")) {
              const waitTime = 6000 + retries * 4000; // 6s, 10s, 14s, 18s
              console.log(`[Batch] Rate limited on image ${index + 1}, waiting ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
              continue;
            }
            
            // Content blocked - backend should handle rewrite, give it time
            if (errMsg.includes("bloqueado") || errMsg.includes("inseguro")) {
              console.log(`[Batch] Prompt blocked for image ${index + 1}, backend will rewrite...`);
              // Give backend more time to rewrite (it does 2 attempts internally)
              const waitTime = 4000 + retries * 2000;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
              continue;
            }
            
            // Auth error - don't retry
            if (errMsg.includes("autenticação") || errMsg.includes("cookies")) {
              console.error(`[Batch] Auth error for image ${index + 1}:`, errMsg);
              return { index, success: false };
            }
            
            retries++;
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }

          if ((data as any)?.error) {
            const errMsg = (data as any).error;
            lastError = errMsg;
            
            if (errMsg.includes("Limite de requisições")) {
              const waitTime = 6000 + retries * 4000;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
              continue;
            }
            
            // Content blocked
            if (errMsg.includes("bloqueado") || errMsg.includes("inseguro")) {
              const waitTime = 4000 + retries * 2000;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries++;
              continue;
            }
            
            retries++;
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }

          // Handle both response formats
          const imageUrl = data.imageUrl || data.images?.[0]?.url;
          const wasRewritten = data.images?.[0]?.wasRewritten || false;
          
          if (imageUrl) {
            if (wasRewritten) {
              console.log(`[Batch] Image ${index + 1} generated with rewritten prompt`);
            }
            return { index, success: true, imageUrl, wasRewritten };
          }
          
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error: any) {
          lastError = error?.message || "Erro desconhecido";
          retries++;
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      console.warn(`[Batch] Image ${index + 1} failed after ${maxRetries} retries: ${lastError}`);
      return { index, success: false };
    };

    // Process in batches of BATCH_SIZE in parallel
    for (let batchStart = 0; batchStart < initialImages.length; batchStart += BATCH_SIZE) {
      const batchIndexes = Array.from(
        { length: Math.min(BATCH_SIZE, initialImages.length - batchStart) },
        (_, i) => batchStart + i
      );

      // Mark batch as generating
      setImages(prev => prev.map((img, idx) => 
        batchIndexes.includes(idx) ? { ...img, status: "generating" } : img
      ));
      setCurrentIndex(batchStart);

      // Start all requests in parallel and update as each completes
      const tasks = batchIndexes.map(async (idx) => {
        const result = await generateSingleImage(initialImages[idx], idx);
        
        // Update immediately when each image completes
        if (result.success && result.imageUrl) {
          successCount++;
          const imageId = initialImages[result.index].id;
          setImages(prev => prev.map((img, i) => 
            i === result.index ? { ...img, status: "success", imageUrl: result.imageUrl, wasRewritten: result.wasRewritten } : img
          ));
          
          // Save to cache
          saveBatchImageToCache(imageId, result.imageUrl, initialImages[result.index].prompt, result.wasRewritten).catch(err => {
            console.warn('Failed to save to cache:', err);
          });
        } else {
          refundAmount += CREDIT_COSTS.batch_images; // Contabilizar para reembolso
          setImages(prev => prev.map((img, i) => 
            i === result.index ? { ...img, status: "error", error: "Falha após várias tentativas" } : img
          ));
        }
        
        return result;
      });

      await Promise.allSettled(tasks);
    }

    setIsGenerating(false);
    
    // Update cache stats
    const stats = await getBatchCacheStats();
    setCacheStats(stats);
    
    // Increment ImageFX usage counter
    if (successCount > 0) {
      await incrementUsage(successCount);
      await refreshUsage();
    }
    
    // Reembolsar créditos das imagens que falharam
    if (refundAmount > 0 && deductionResult.shouldRefund) {
      const { refundCredits } = await import("@/lib/creditToolsMap");
      await refundCredits(
        user!.id,
        refundAmount,
        'batch_images',
        undefined,
        `Reembolso por ${refundAmount / CREDIT_COSTS.batch_images} imagens que falharam`
      );
      toast.info(`${refundAmount} créditos reembolsados por imagens que falharam`);
    }
    
    // Save to history with actual success count
    await saveToHistory(successCount);
    
    setInsufficientCredits(false);
    toast.success(`Geração concluída! ${successCount}/${initialImages.length} imagens geradas.`);
  };

  const handleRetry = async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    // Check limit before retry
    if (isLimitReached) {
      toast.error("Limite de imagens atingido! Faça upgrade para continuar.");
      return;
    }

    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, status: "generating", error: undefined } : img
    ));

    try {
      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
        body: { 
          prompt: image.prompt,
          aspectRatio: "LANDSCAPE"
        }
      });

      if (error) throw error;

      // Handle both response formats
      const imageUrl = data.imageUrl || data.images?.[0]?.url;
      const wasRewritten = data.images?.[0]?.wasRewritten || false;
      
      if (data.success && imageUrl) {
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, status: "success", imageUrl, wasRewritten } : img
        ));
        
        // Increment usage
        await incrementUsage(1);
        await refreshUsage();
        
        if (wasRewritten) {
          toast.success("Imagem regenerada com prompt adaptado!");
        } else {
          toast.success("Imagem regenerada!");
        }
      } else {
        throw new Error(data.error || "Falha ao gerar imagem");
      }
    } catch (error: any) {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, status: "error", error: error.message } : img
      ));
      toast.error("Erro ao regenerar imagem");
    }
  };

  const handleRemove = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imagem-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Erro ao baixar imagem");
    }
  };

  const handleDownloadAll = async () => {
    const successImages = images.filter(img => img.status === "success" && img.imageUrl);
    for (let i = 0; i < successImages.length; i++) {
      await handleDownload(successImages[i].imageUrl!, i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    toast.success(`${successImages.length} imagens baixadas!`);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    const successImages = images.filter(img => img.status === "success" && img.imageUrl);
    if (successImages.length === 0) {
      toast.error("Nenhuma imagem para baixar");
      return;
    }

    toast.info("Preparando ZIP...");

    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("imagens");

      for (let i = 0; i < successImages.length; i++) {
        const img = successImages[i];
        if (!img.imageUrl) continue;

        let base64Data = img.imageUrl;
        
        // If it's a URL, fetch it
        if (img.imageUrl.startsWith("http")) {
          const response = await fetch(img.imageUrl);
          const blob = await response.blob();
          base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }

        // Remove data URL prefix if present
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        imgFolder?.file(`imagem_${String(i + 1).padStart(3, "0")}.png`, base64Content, { base64: true });
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imagens_lote_${format(new Date(), "yyyy-MM-dd_HH-mm")}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`ZIP com ${successImages.length} imagens baixado!`);
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast.error("Erro ao criar ZIP");
    }
  };

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setImages([]);
    setPromptsText("");
    setSelectedStyle("");
  };

  // Edit prompt and regenerate
  const openEditPrompt = (image: GeneratedImage) => {
    setEditingImage(image);
    setEditPromptText(image.prompt);
  };

  const handleEditAndRegenerate = async () => {
    if (!editingImage || !editPromptText.trim()) return;

    // Check limit before regenerate
    if (isLimitReached) {
      toast.error("Limite de imagens atingido! Faça upgrade para continuar.");
      return;
    }

    setIsRegeneratingEdit(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
        body: { 
          prompt: editPromptText,
          aspectRatio: "LANDSCAPE",
          numberOfImages: 1
        }
      });

      if (error) throw error;

      const imageUrl = data.imageUrl || data.images?.[0]?.url;
      const wasRewritten = data.images?.[0]?.wasRewritten || false;
      
      if (data.success && imageUrl) {
        setImages(prev => prev.map(img => 
          img.id === editingImage.id 
            ? { ...img, status: "success", imageUrl, prompt: editPromptText, wasRewritten } 
            : img
        ));
        
        // Save to cache
        await saveBatchImageToCache(editingImage.id, imageUrl, editPromptText, wasRewritten);
        
        // Increment usage
        await incrementUsage(1);
        await refreshUsage();
        
        toast.success(wasRewritten ? "Imagem regenerada com prompt adaptado!" : "Imagem regenerada!");
        setEditingImage(null);
      } else {
        throw new Error(data.error || "Falha ao gerar imagem");
      }
    } catch (error: any) {
      toast.error("Erro ao regenerar: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsRegeneratingEdit(false);
    }
  };

  // Recover images from cache
  const handleRecoverFromCache = async () => {
    setLoadingCache(true);
    try {
      const cachedImages = await getAllBatchCachedImages();
      
      if (cachedImages.length === 0) {
        toast.info("Nenhuma imagem em cache");
        setLoadingCache(false);
        return;
      }

      const recoveredImages: GeneratedImage[] = cachedImages.map((cached, index) => ({
        id: cached.id,
        prompt: cached.prompt,
        imageUrl: cached.imageData,
        status: "success" as const,
        wasRewritten: cached.wasRewritten,
      }));

      setImages(recoveredImages);
      toast.success(`${recoveredImages.length} imagens recuperadas do cache!`);
    } catch (error) {
      console.error("Error recovering from cache:", error);
      toast.error("Erro ao recuperar imagens do cache");
    } finally {
      setLoadingCache(false);
    }
  };

  const openPreview = (index: number) => {
    // Find the index in successImages array
    const successImages = images.filter(img => img.status === "success" && img.imageUrl);
    const originalImage = images[index];
    const previewIdx = successImages.findIndex(img => img.id === originalImage.id);
    if (previewIdx !== -1) {
      setPreviewIndex(previewIdx);
      setPreviewOpen(true);
    }
  };

  const successImages = images.filter(img => img.status === "success" && img.imageUrl);
  const currentPreviewImage = successImages[previewIndex];

  const promptCount = parsePrompts().length;
  const successCount = successImages.length;
  const errorCount = images.filter(img => img.status === "error").length;
  const rewrittenCount = images.filter(img => img.wasRewritten).length;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Images className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Prompts de Imagem</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadHistory();
                setHistoryOpen(true);
              }}
            >
              <History className="w-4 h-4 mr-1" />
              Histórico
            </Button>
          </div>

          <div className="space-y-4">
            {/* Style Selector */}
            <div>
              <Label>Estilo de Arte</Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um estilo (opcional)" />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <SelectItem value="none">Sem estilo (usar prompts puros)</SelectItem>
                  {THUMBNAIL_STYLE_CATEGORIES.map(category => (
                    <div key={category.id}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50 sticky top-0">
                        {category.icon} {category.name}
                      </div>
                      {getStylesByCategory(category.id).map(style => (
                        <SelectItem key={style.id} value={style.id}>
                          <span className="flex items-center gap-2">
                            <span>{style.icon}</span>
                            <span>{style.name}</span>
                            <span className="text-xs text-muted-foreground">- {style.description}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {selectedStyle && selectedStyle !== "none" && (
                <p className="text-xs text-muted-foreground mt-1.5 bg-secondary/30 p-2 rounded">
                  <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                  Prefixo: {getStylePrefix().substring(0, 80)}...
                </p>
              )}
            </div>

            {/* Prompts Input */}
            <div>
              <Label htmlFor="prompts">
                Prompts (um por linha ou separados por linha em branco)
              </Label>
              <Textarea
                id="prompts"
                placeholder={`1. Um astronauta flutuando no espaço com a Terra ao fundo
2. Uma floresta encantada com luzes mágicas
3. Um carro esportivo em uma estrada de montanha ao pôr do sol

Ou simplesmente:

Um astronauta flutuando no espaço

Uma floresta encantada

Um carro esportivo na montanha`}
                value={promptsText}
                onChange={(e) => setPromptsText(e.target.value)}
                className="mt-1 min-h-[300px] font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  {promptCount} prompt{promptCount !== 1 ? "s" : ""} detectado{promptCount !== 1 ? "s" : ""}
                </p>
                {promptsText && (
                  <Button variant="ghost" size="sm" onClick={() => setPromptsText("")}>
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* ImageFX Usage Indicator */}
            {monthLimit !== null && (
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Uso Mensal ImageFX</span>
                  </div>
                  <span className={`text-sm font-bold ${isLimitReached ? 'text-destructive' : remaining !== null && remaining < 10 ? 'text-amber-500' : 'text-foreground'}`}>
                    {currentCount}/{monthLimit}
                  </span>
                </div>
                <Progress 
                  value={(currentCount / monthLimit) * 100} 
                  className={`h-2 ${isLimitReached ? '[&>div]:bg-destructive' : remaining !== null && remaining < 10 ? '[&>div]:bg-amber-500' : ''}`}
                />
                {remaining !== null && (
                  <p className={`text-xs mt-1.5 ${isLimitReached ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isLimitReached 
                      ? "Limite atingido! Faça upgrade para continuar gerando."
                      : `${remaining} imagens restantes este mês`
                    }
                  </p>
                )}
              </div>
            )}

            {/* Limit Reached Warning */}
            {isLimitReached && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Limite de imagens atingido</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Você atingiu o limite de {monthLimit} imagens/mês do plano FREE.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => navigate('/plans')}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Fazer Upgrade
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleStartGeneration}
              disabled={isGenerating || promptCount === 0 || isLimitReached}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando {currentIndex + 1}/{images.length}...
                </>
              ) : (
                <>
                  <Images className="w-4 h-4 mr-2" />
                  Gerar {promptCount} Imagen{promptCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Imagens Geradas</h3>
              {images.length > 0 && (
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {successCount}/{images.length} ✓
                  </Badge>
                  {rewrittenCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30">
                          <Wand2 className="w-2.5 h-2.5 mr-0.5" />
                          {rewrittenCount} adaptados
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Prompts reescritos automaticamente para segurança</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {errorCount} erros
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {/* Cache Recovery Button */}
              {cacheStats.count > 0 && images.length === 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRecoverFromCache}
                      disabled={loadingCache}
                    >
                      {loadingCache ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3 mr-1" />
                      )}
                      Recuperar ({cacheStats.count})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Recuperar {cacheStats.count} imagens do cache</p>
                    {cacheStats.lastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        Último: {format(cacheStats.lastUpdated, "dd/MM HH:mm")}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
              {successCount > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleDownloadZip}>
                    <FolderDown className="w-3 h-3 mr-1" />
                    ZIP
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                    <Download className="w-3 h-3 mr-1" />
                    Baixar Todas
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClear}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12">
              <Images className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground mb-2">
                Cole seus prompts e clique em gerar
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                As imagens serão geradas em lote usando o ImageFX
              </p>
              {cacheStats.count > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRecoverFromCache}
                  disabled={loadingCache}
                  className="mx-auto"
                >
                  {loadingCache ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Recuperar {cacheStats.count} imagens do cache
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-2">
              <div className="grid grid-cols-2 gap-3">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative rounded-lg overflow-hidden border border-border bg-secondary/30 group"
                  >
                    {/* Image or Placeholder */}
                    <div 
                      className={`aspect-video relative ${image.status === "success" ? "cursor-pointer" : ""}`}
                      onClick={() => image.status === "success" && openPreview(index)}
                    >
                      {image.status === "success" && image.imageUrl ? (
                        <img
                          src={image.imageUrl}
                          alt={`Imagem ${index + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : image.status === "generating" ? (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : image.status === "error" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-destructive/10 p-2">
                          <AlertCircle className="w-6 h-6 text-destructive mb-1" />
                          <p className="text-xs text-destructive text-center line-clamp-2">
                            {image.error || "Erro"}
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <Images className="w-6 h-6 text-muted-foreground opacity-30" />
                        </div>
                      )}

                      {/* Number Badge */}
                      <div className="absolute top-1 left-1 flex items-center gap-1">
                        <div className="bg-background/80 backdrop-blur-sm rounded px-1.5 py-0.5">
                          <span className="text-xs font-medium">{index + 1}</span>
                        </div>
                        {image.wasRewritten && (
                          <div className="bg-amber-500/90 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
                            <Wand2 className="w-2.5 h-2.5 text-white" />
                            <span className="text-[10px] font-medium text-white">Adaptado</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {image.status === "success" && image.imageUrl && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditPrompt(image);
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar prompt e regenerar</TooltipContent>
                            </Tooltip>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(image.imageUrl!, index);
                              }}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {image.status === "error" && (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6"
                            onClick={() => handleRetry(image.id)}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPrompt(image.prompt, image.id);
                          }}
                        >
                          {copiedId === image.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(image.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Prompt Preview */}
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {image.prompt.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl p-0 bg-background/95 backdrop-blur-sm border-border">
          {currentPreviewImage && (
            <div className="relative">
              {/* Close button */}
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Navigation arrows */}
              {successImages.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/80 backdrop-blur-sm"
                    onClick={() => setPreviewIndex(prev => (prev > 0 ? prev - 1 : successImages.length - 1))}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-background/80 backdrop-blur-sm"
                    onClick={() => setPreviewIndex(prev => (prev < successImages.length - 1 ? prev + 1 : 0))}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Image */}
              <div className="flex items-center justify-center p-4">
                <img
                  src={currentPreviewImage.imageUrl!}
                  alt={`Preview ${previewIndex + 1}`}
                  className="max-h-[70vh] w-auto rounded-lg shadow-2xl"
                />
              </div>

              {/* Info bar */}
              <div className="p-4 border-t border-border bg-background/80">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {previewIndex + 1} / {successImages.length}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {currentPreviewImage.prompt}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPrompt(currentPreviewImage.prompt, currentPreviewImage.id)}
                    >
                      {copiedId === currentPreviewImage.id ? (
                        <Check className="w-4 h-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1" />
                      )}
                      Copiar Prompt
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(currentPreviewImage.imageUrl!, previewIndex)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Gerações
            </DialogTitle>
          </DialogHeader>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">Nenhuma geração no histórico</p>
              <p className="text-xs text-muted-foreground mt-1">
                As gerações serão salvas automaticamente
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {item.prompt_count} prompts
                          </Badge>
                          {item.style_name && (
                            <Badge variant="secondary" className="text-xs">
                              {item.style_name}
                            </Badge>
                          )}
                          {item.success_count !== null && (
                            <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                              {item.success_count} ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {item.prompts.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadFromHistory(item)}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Carregar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteHistoryItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Prompt Modal */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Editar Prompt e Regenerar
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingImage?.imageUrl && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-muted-foreground">Imagem Atual</Label>
                  {editingImage.wasRewritten && (
                    <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600 border-amber-500/30">
                      <Wand2 className="w-2.5 h-2.5 mr-1" />
                      Prompt adaptado
                    </Badge>
                  )}
                </div>
                <div className="aspect-video rounded-lg overflow-hidden border border-border relative">
                  <img 
                    src={editingImage.imageUrl} 
                    alt="Imagem atual" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
                    <span className="text-xs font-medium">
                      Imagem #{images.findIndex(img => img.id === editingImage.id) + 1}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label>Novo Prompt</Label>
              <Textarea
                value={editPromptText}
                onChange={(e) => setEditPromptText(e.target.value)}
                placeholder="Descreva a imagem desejada..."
                className="mt-1.5 min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Modifique o prompt acima e clique em regenerar para criar uma nova imagem
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setEditingImage(null)}
              disabled={isRegeneratingEdit}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEditAndRegenerate}
              disabled={isRegeneratingEdit || !editPromptText.trim()}
            >
              {isRegeneratingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerar Imagem
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchImageGenerator;
