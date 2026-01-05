import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { THUMBNAIL_STYLES } from "@/lib/thumbnailStyles";
import { useToast } from "@/hooks/use-toast";

interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
  estimatedTime?: string;
  timecode?: string;
  endTimecode?: string;
  generatedImage?: string;
  generatingImage?: boolean;
}

interface BackgroundGenerationState {
  isGenerating: boolean;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  currentSceneIndex: number | null;
  currentPrompt: string | null;
  startTime: number | null;
  scenes: ScenePrompt[];
  style: string;
  failedIndexes: number[];
  rateLimitHit: boolean;
}

interface BackgroundImageGenerationContextType {
  state: BackgroundGenerationState;
  startGeneration: (scenes: ScenePrompt[], style: string, pendingIndexes: number[]) => void;
  cancelGeneration: () => void;
  getUpdatedScenes: () => ScenePrompt[];
  clearState: () => void;
  syncScenes: (scenes: ScenePrompt[]) => void;
}

const initialState: BackgroundGenerationState = {
  isGenerating: false,
  totalImages: 0,
  completedImages: 0,
  failedImages: 0,
  currentSceneIndex: null,
  currentPrompt: null,
  startTime: null,
  scenes: [],
  style: 'cinematic',
  failedIndexes: [],
  rateLimitHit: false,
};

const BackgroundImageGenerationContext = createContext<BackgroundImageGenerationContextType | null>(null);

export const BackgroundImageGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BackgroundGenerationState>(initialState);
  const cancelRef = useRef(false);
  const scenesRef = useRef<ScenePrompt[]>([]);
  const { toast } = useToast();

  // Manter ref sincronizada
  useEffect(() => {
    scenesRef.current = state.scenes;
  }, [state.scenes]);

  const generateSingleImage = useCallback(async (
    sceneIndex: number, 
    scenes: ScenePrompt[], 
    style: string
  ): Promise<{ index: number; success: boolean; imageUrl?: string; rateLimited?: boolean }> => {
    const maxRetries = 3;
    let retries = 0;
    let lastError = "";
    let wasRateLimited = false;

    while (retries <= maxRetries) {
      if (cancelRef.current) {
        return { index: sceneIndex, success: false };
      }

      try {
        const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
        const fullPrompt = stylePrefix
          ? `${stylePrefix} ${scenes[sceneIndex].imagePrompt}`
          : scenes[sceneIndex].imagePrompt;

        const { data, error } = await supabase.functions.invoke("generate-imagefx", {
          body: {
            prompt: fullPrompt,
            aspectRatio: "LANDSCAPE",
            numberOfImages: 1,
          },
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
          
          if (errMsg.includes("autenticação") || errMsg.includes("cookies")) {
            throw new Error("AUTH_ERROR");
          }
          
          if (errMsg.includes("Limite de requisições") || errMsg.includes("429")) {
            wasRateLimited = true;
            const waitTime = 5000 + retries * 3000;
            console.log(`[Background] Rate limited on scene ${sceneIndex}, waiting ${waitTime}ms (retry ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
            continue;
          }
          
          const waitTime = 2000 + retries * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }

        if ((data as any)?.error) {
          const errMsg = (data as any).error;
          lastError = errMsg;
          
          if (errMsg.includes("autenticação") || errMsg.includes("cookies")) {
            throw new Error("AUTH_ERROR");
          }
          
          if (errMsg.includes("Limite de requisições")) {
            wasRateLimited = true;
            const waitTime = 5000 + retries * 3000;
            console.log(`[Background] Rate limited on scene ${sceneIndex}, waiting ${waitTime}ms (retry ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            retries++;
            continue;
          }
          
          retries++;
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        const url = (data as any)?.images?.[0]?.url;
        if (url) {
          return { index: sceneIndex, success: true, imageUrl: url };
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error: any) {
        if (error.message === "AUTH_ERROR") throw error;
        lastError = error.message;
        retries++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.warn(`[Background] Scene ${sceneIndex} failed after ${maxRetries} retries: ${lastError}`);
    return { index: sceneIndex, success: false, rateLimited: wasRateLimited };
  }, []);

  const startGeneration = useCallback(async (
    scenes: ScenePrompt[], 
    style: string, 
    pendingIndexes: number[]
  ) => {
    if (state.isGenerating) {
      toast({ 
        title: "Geração já em andamento", 
        description: "Aguarde a conclusão ou cancele a geração atual" 
      });
      return;
    }

    cancelRef.current = false;
    scenesRef.current = [...scenes];
    
    setState({
      isGenerating: true,
      totalImages: pendingIndexes.length,
      completedImages: 0,
      failedImages: 0,
      currentSceneIndex: pendingIndexes[0] ?? null,
      currentPrompt: scenes[pendingIndexes[0]]?.imagePrompt ?? null,
      startTime: Date.now(),
      scenes: [...scenes],
      style,
      failedIndexes: [],
      rateLimitHit: false,
    });

    const BATCH_SIZE = 5;
    let processed = 0;
    let failed = 0;
    let rateLimitEncountered = false;
    const failedIdxs: number[] = [];
    let errorOccurred = false;

    for (let batchStart = 0; batchStart < pendingIndexes.length && !errorOccurred && !cancelRef.current; batchStart += BATCH_SIZE) {
      const batchIndexes = pendingIndexes.slice(batchStart, batchStart + BATCH_SIZE);

      if (cancelRef.current) break;

      try {
        // Iniciar todas as 5 requisições em paralelo
        const promises = batchIndexes.map(idx => generateSingleImage(idx, scenesRef.current, style));
        
        // Processar resultados conforme vão chegando (exibição sequencial)
        for (let i = 0; i < promises.length; i++) {
          if (cancelRef.current) break;
          
          try {
            const result = await promises[i];
            
            if (result.success && result.imageUrl) {
              const { index, imageUrl } = result;
              processed++;
              
              // Atualizar estado imediatamente quando cada imagem fica pronta
              setState(prev => {
                const updatedScenes = [...prev.scenes];
                updatedScenes[index] = { ...updatedScenes[index], generatedImage: imageUrl };
                scenesRef.current = updatedScenes;
                
                return {
                  ...prev,
                  scenes: updatedScenes,
                  completedImages: processed,
                  currentSceneIndex: index,
                  currentPrompt: prev.scenes[index]?.imagePrompt ?? null,
                };
              });
            } else {
              // Falha na geração
              failed++;
              failedIdxs.push(result.index);
              if (result.rateLimited) {
                rateLimitEncountered = true;
              }
              
              setState(prev => ({
                ...prev,
                failedImages: failed,
                failedIndexes: [...failedIdxs],
                rateLimitHit: rateLimitEncountered,
              }));
            }
          } catch (error: any) {
            if (error.message === "AUTH_ERROR") {
              toast({
                title: "Erro de autenticação",
                description: "Atualize os cookies do ImageFX nas configurações.",
                variant: "destructive",
              });
              errorOccurred = true;
              break;
            }
            // Continuar com outras imagens do batch
          }
        }
      } catch (error: any) {
        if (error.message === "AUTH_ERROR") {
          toast({
            title: "Erro de autenticação",
            description: "Atualize os cookies do ImageFX nas configurações.",
            variant: "destructive",
          });
          errorOccurred = true;
        }
      }
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      currentSceneIndex: null,
      currentPrompt: null,
      startTime: null,
      failedIndexes: failedIdxs,
      rateLimitHit: rateLimitEncountered,
    }));

    if (cancelRef.current) {
      toast({
        title: "Geração cancelada",
        description: `${processed} imagens foram geradas antes do cancelamento`,
      });
    } else if (!errorOccurred) {
      if (rateLimitEncountered && failed > 0) {
        toast({
          title: "⏳ Limite de requisições atingido",
          description: `${processed} imagens criadas, ${failed} falharam. Aguarde 30s e clique em "Gerar Mídias Perdidas" para continuar.`,
          variant: "destructive",
        });
      } else if (failed > 0) {
        toast({
          title: "Geração parcial",
          description: `${processed}/${pendingIndexes.length} imagens criadas. ${failed} falharam - clique em "Gerar Mídias Perdidas" para tentar novamente.`,
        });
      } else {
        toast({
          title: "Todas as imagens geradas!",
          description: `${processed}/${pendingIndexes.length} imagens criadas com sucesso`,
        });
      }
    }
  }, [state.isGenerating, generateSingleImage, toast]);

  const cancelGeneration = useCallback(() => {
    cancelRef.current = true;
    toast({ title: "Cancelando...", description: "Aguarde o lote atual finalizar" });
  }, [toast]);

  const getUpdatedScenes = useCallback(() => {
    return scenesRef.current;
  }, []);

  const clearState = useCallback(() => {
    cancelRef.current = true;
    setState(initialState);
    scenesRef.current = [];
  }, []);

  const syncScenes = useCallback((scenes: ScenePrompt[]) => {
    if (!state.isGenerating) {
      scenesRef.current = scenes;
      setState(prev => ({ ...prev, scenes }));
    }
  }, [state.isGenerating]);

  return (
    <BackgroundImageGenerationContext.Provider value={{
      state,
      startGeneration,
      cancelGeneration,
      getUpdatedScenes,
      clearState,
      syncScenes,
    }}>
      {children}
    </BackgroundImageGenerationContext.Provider>
  );
};

export const useBackgroundImageGeneration = () => {
  const context = useContext(BackgroundImageGenerationContext);
  if (!context) {
    throw new Error('useBackgroundImageGeneration must be used within BackgroundImageGenerationProvider');
  }
  return context;
};
