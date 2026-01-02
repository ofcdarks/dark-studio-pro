import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Film, Copy, Check, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";

interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
}

const STYLES = [
  { value: "photorealistic", label: "Fotorealista" },
  { value: "cinematic", label: "Cinematográfico" },
  { value: "3d-render", label: "3D Render" },
  { value: "anime", label: "Anime/Ilustração" },
  { value: "dark-moody", label: "Dark/Moody" },
  { value: "vibrant", label: "Vibrante/Colorido" },
];

const SceneGenerator = () => {
  // Persisted states
  const [script, setScript] = usePersistedState("scene_script", "");
  const [title, setTitle] = usePersistedState("scene_title", "");
  const [niche, setNiche] = usePersistedState("scene_niche", "");
  const [style, setStyle] = usePersistedState("scene_style", "photorealistic");
  const [estimatedScenes, setEstimatedScenes] = usePersistedState("scene_estimatedScenes", "8");
  const [scenes, setScenes] = usePersistedState<ScenePrompt[]>("scene_scenes", []);
  
  // Non-persisted states
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error("Cole o roteiro para gerar prompts de cenas");
      return;
    }

    setIsGenerating(true);
    setScenes([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-scenes", {
        body: {
          script,
          title,
          niche,
          style,
          estimatedScenes: parseInt(estimatedScenes),
        },
      });

      if (error) throw error;

      if (data.success) {
        setScenes(data.scenes);
        toast.success(`${data.totalScenes} prompts de cenas gerados!`);
      } else {
        throw new Error(data.error || "Erro ao gerar cenas");
      }
    } catch (error) {
      console.error("Error generating scenes:", error);
      toast.error("Erro ao gerar prompts de cenas");
    } finally {
      setIsGenerating(false);
    }
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

  return (
    <MainLayout>
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

          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Cenas</h1>
            <p className="text-muted-foreground">
              Gere prompts de imagem para cada cena do seu roteiro
            </p>
          </div>

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
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STYLES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="scenes">Número de Cenas</Label>
                      <Input
                        id="scenes"
                        type="number"
                        min="2"
                        max="30"
                        value={estimatedScenes}
                        onChange={(e) => setEstimatedScenes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="script">Roteiro Completo</Label>
                    <Textarea
                      id="script"
                      placeholder="Cole seu roteiro aqui..."
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      className="mt-1 min-h-64"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {script.split(/\s+/).filter(w => w).length} palavras
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
                        Gerar Prompts de Cenas
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
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SceneGenerator;
