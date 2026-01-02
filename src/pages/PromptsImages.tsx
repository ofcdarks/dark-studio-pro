import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Image, Wand2, Copy, Save, History, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";

const PromptsImages = () => {
  // Persisted states
  const [prompt, setPrompt] = usePersistedState("prompts_prompt", "");
  const [promptTitle, setPromptTitle] = usePersistedState("prompts_promptTitle", "");
  const [generatedImage, setGeneratedImage] = usePersistedState<string | null>("prompts_generatedImage", null);
  
  // Non-persisted states
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: generatedImages } = useQuery({
    queryKey: ["generated-images", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("generated_images")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const savePromptMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from("saved_prompts").insert({
        user_id: user.id,
        title: promptTitle || "Prompt sem título",
        prompt: prompt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-prompts"] });
      setPromptTitle("");
      toast({
        title: "Prompt salvo!",
        description: "O prompt foi salvo com sucesso",
      });
    },
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um prompt",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await supabase.functions.invoke("generate-image", {
        body: { prompt },
      });

      if (response.error) throw response.error;

      const images = response.data.images;
      if (images && images.length > 0) {
        const imageUrl = images[0].image_url.url;
        setGeneratedImage(imageUrl);

        // Save to database
        await supabase.from("generated_images").insert({
          user_id: user?.id,
          prompt: prompt,
          image_url: imageUrl,
        });

        queryClient.invalidateQueries({ queryKey: ["generated-images"] });

        toast({
          title: "Imagem gerada!",
          description: "A imagem foi gerada com sucesso",
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a imagem",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copiado!",
      description: "Prompt copiado para a área de transferência",
    });
  };

  const loadPrompt = (savedPrompt: { title: string; prompt: string }) => {
    setPrompt(savedPrompt.prompt);
    setPromptTitle(savedPrompt.title);
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["prompts_prompt", "prompts_generatedImage"]}
            label="Prompt anterior"
            onClear={() => {
              setPrompt("");
              setPromptTitle("");
              setGeneratedImage(null);
            }}
          />

          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Prompts e Imagens</h1>
            <p className="text-muted-foreground">
              Crie e gerencie prompts para geração de imagens
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Gerador de Imagens</h3>
                </div>
                <Input
                  placeholder="Título do prompt (opcional)"
                  value={promptTitle}
                  onChange={(e) => setPromptTitle(e.target.value)}
                  className="bg-secondary border-border mb-3"
                />
                <Textarea
                  placeholder="Descreva a imagem que você quer criar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-secondary border-border min-h-32 mb-4"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Image className="w-4 h-4 mr-2" />
                    )}
                    Gerar Imagem
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyPrompt} className="border-border text-muted-foreground hover:bg-secondary">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => savePromptMutation.mutate()}
                    disabled={!prompt.trim()}
                    className="border-border text-muted-foreground hover:bg-secondary"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              {generatedImage && (
                <Card className="p-6 mt-6">
                  <h3 className="font-semibold text-foreground mb-4">Imagem Gerada</h3>
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full rounded-lg"
                  />
                </Card>
              )}

              <Card className="p-6 mt-6">
                <h3 className="font-semibold text-foreground mb-4">Imagens Geradas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {generatedImages && generatedImages.length > 0 ? (
                    generatedImages.map((img) => (
                      <div key={img.id} className="aspect-square bg-secondary rounded-lg overflow-hidden">
                        {img.image_url ? (
                          <img src={img.image_url} alt={img.prompt} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5, 6].map((_, index) => (
                      <div key={index} className="aspect-square bg-secondary rounded-lg flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Prompts Salvos</h3>
                </div>
                <div className="space-y-3">
                  {savedPrompts && savedPrompts.length > 0 ? (
                    savedPrompts.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => loadPrompt(item)}
                        className="p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <h4 className="font-medium text-foreground text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum prompt salvo ainda
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PromptsImages;
