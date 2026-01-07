import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Download, 
  Film, 
  Lightbulb, 
  Target,
  Rocket,
  Clock,
  Palette,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";

interface ViralScene {
  number: number;
  description: string;
  narration: string;
  imagePrompt: string;
  duration: string;
}

interface ViralAnalysisResult {
  title: string;
  summary: string;
  visualStyle: string;
  scenes: ViralScene[];
  viralityKeys: string[];
  strategy: string;
}

interface ViralVideoAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyScenes?: (scenes: { number: number; text: string; imagePrompt: string; wordCount: number }[]) => void;
}

export const ViralVideoAnalysisModal = ({ 
  open, 
  onOpenChange,
  onApplyScenes 
}: ViralVideoAnalysisModalProps) => {
  const { executeWithDeduction } = useCreditDeduction();
  
  const [videoDescription, setVideoDescription] = useState("");
  const [originalNiche, setOriginalNiche] = useState("");
  const [targetNiche, setTargetNiche] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ViralAnalysisResult | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!videoDescription.trim()) {
      toast.error("Descreva o vídeo viral que deseja analisar");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 10, 90));
    }, 500);

    try {
      const { result: aiResult, success, error } = await executeWithDeduction(
        {
          operationType: 'viral_analysis',
          multiplier: 2,
          details: { type: 'viral_video_analysis' },
          showToast: true
        },
        async () => {
          const systemPrompt = `Você é um especialista em vídeos virais de animação 3D. Sua tarefa é analisar descrições de vídeos virais e criar uma nova história original mantendo a mesma essência, tom emocional e potencial de viralidade, mas com personagens, ambiente e trama completamente diferentes.

REGRAS IMPORTANTES:
1. Cada cena deve ter NO MÁXIMO 5 segundos
2. Os prompts de imagem devem seguir o estilo: "3D minimalist render, soft pastel colors, Pixar/Blender aesthetic, soft studio lighting, expressive characters, emotional storytelling"
3. A narração deve ser curta, emocional ou simbólica
4. Foque em criar uma história com ALTO POTENCIAL VIRAL

Responda APENAS em JSON válido com esta estrutura exata:
{
  "title": "Título tentativo do novo vídeo",
  "summary": "Resumo narrativo geral em 2-3 frases",
  "visualStyle": "Descrição do estilo visual",
  "scenes": [
    {
      "number": 1,
      "description": "Descrição visual detalhada da cena (ambiente, ação, câmera)",
      "narration": "Frase curta emocional ou simbólica",
      "imagePrompt": "Prompt preciso para gerar a imagem em estilo 3D minimalista",
      "duration": "5s"
    }
  ],
  "viralityKeys": ["chave1", "chave2", "chave3"],
  "strategy": "Estratégia para manter a essência viral na nova versão"
}`;

          const userPrompt = `Analise o seguinte vídeo viral de animação 3D e crie uma nova história original:

DESCRIÇÃO DO VÍDEO ORIGINAL:
${videoDescription}

${originalNiche ? `NICHO ORIGINAL: ${originalNiche}` : ''}
${targetNiche ? `NICHO DESEJADO PARA NOVA VERSÃO: ${targetNiche}` : ''}

Crie uma história completamente nova que mantenha:
- O mesmo ritmo emocional
- O potencial de viralidade
- A estética 3D minimalista
- Mas com personagens, ambiente e trama DIFERENTES

Divida em cenas de máximo 5 segundos cada. Para cada cena, forneça:
1. Descrição visual detalhada
2. Narração sugerida (frase curta e emocional)
3. Prompt de imagem para render 3D minimalista

Ao final, explique as chaves de viralidade detectadas e a estratégia para replicar o impacto.`;

          const { data, error } = await supabase.functions.invoke("ai-assistant", {
            body: {
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              model: "gemini-2.5-pro",
              type: "viral_analysis"
            }
          });

          if (error) throw error;
          
          // Parse JSON response
          const responseText = data.response || data.content || "";
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("Resposta inválida da IA");
          
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        }
      );

      clearInterval(progressInterval);

      if (!success) {
        if (error !== 'Saldo insuficiente') {
          toast.error(error || "Erro na análise");
        }
        return;
      }

      setProgress(100);
      setResult(aiResult);
      toast.success("Análise completa!");
    } catch (err) {
      console.error("Error analyzing viral video:", err);
      toast.error("Erro ao analisar vídeo viral");
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success("Copiado!");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadAnalysis = () => {
    if (!result) return;

    let content = `# ${result.title}\n\n`;
    content += `## Resumo Narrativo\n${result.summary}\n\n`;
    content += `## Estilo Visual\n${result.visualStyle}\n\n`;
    content += `## Cenas\n\n`;
    
    result.scenes.forEach(scene => {
      content += `### Cena ${scene.number} (${scene.duration})\n`;
      content += `**Descrição:** ${scene.description}\n`;
      content += `**Narração:** "${scene.narration}"\n`;
      content += `**Prompt:** ${scene.imagePrompt}\n\n`;
    });

    content += `## Chaves de Viralidade\n`;
    result.viralityKeys.forEach(key => {
      content += `- ${key}\n`;
    });
    content += `\n## Estratégia\n${result.strategy}\n`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analise-viral-${result.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Análise baixada!");
  };

  const handleApplyScenes = () => {
    if (!result || !onApplyScenes) return;

    const scenes = result.scenes.map(scene => ({
      number: scene.number,
      text: scene.narration,
      imagePrompt: scene.imagePrompt,
      wordCount: scene.narration.split(/\s+/).length
    }));

    onApplyScenes(scenes);
    onOpenChange(false);
    toast.success("Cenas aplicadas ao gerador!");
  };

  const copyAllPrompts = () => {
    if (!result) return;
    const prompts = result.scenes.map(s => `CENA ${s.number}:\n${s.imagePrompt}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(prompts);
    toast.success("Todos os prompts copiados!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="w-5 h-5 text-primary" />
            Análise de Vídeo Viral 3D
          </DialogTitle>
          <DialogDescription>
            Analise um vídeo viral e gere uma nova história original com potencial de viralização
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {!result ? (
            <div className="space-y-6 py-4">
              {/* Input Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="video-description" className="text-base font-medium">
                    Descrição do Vídeo Viral
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Descreva detalhadamente o vídeo viral de animação 3D que deseja analisar
                  </p>
                  <Textarea
                    id="video-description"
                    placeholder="Ex: Um pequeno robô solitário encontra uma planta em um mundo pós-apocalíptico. Ele cuida dela com carinho até que ela floresce, trazendo cor ao mundo cinza..."
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="original-niche">Nicho Original (opcional)</Label>
                    <Input
                      id="original-niche"
                      placeholder="Ex: Motivacional, Infantil, Drama"
                      value={originalNiche}
                      onChange={(e) => setOriginalNiche(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="target-niche">Nicho Desejado (opcional)</Label>
                    <Input
                      id="target-niche"
                      placeholder="Ex: Bíblico, Psicologia, Histórias"
                      value={targetNiche}
                      onChange={(e) => setTargetNiche(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Progress */}
              {isAnalyzing && (
                <Card className="p-6 bg-muted/50">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-medium">Analisando vídeo viral...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Identificando padrões de viralidade e criando nova história...
                  </p>
                </Card>
              )}

              {/* Action Button */}
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !videoDescription.trim()}
                className="w-full h-12 text-base"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar e Criar Nova História
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Title & Summary */}
              <Card className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="secondary" className="mb-2">Nova História</Badge>
                    <h3 className="text-xl font-bold">{result.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.title, "title")}
                  >
                    {copiedSection === "title" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-muted-foreground">{result.summary}</p>
              </Card>

              {/* Visual Style */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Estilo Visual</h4>
                </div>
                <p className="text-sm text-muted-foreground">{result.visualStyle}</p>
              </Card>

              {/* Scenes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    Cenas ({result.scenes.length})
                  </h4>
                  <Button variant="outline" size="sm" onClick={copyAllPrompts}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copiar Prompts
                  </Button>
                </div>

                <div className="space-y-4">
                  {result.scenes.map((scene) => (
                    <Card key={scene.number} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Cena {scene.number}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {scene.duration}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(scene.imagePrompt, `scene-${scene.number}`)}
                        >
                          {copiedSection === `scene-${scene.number}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Descrição</p>
                          <p className="text-sm">{scene.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Narração</p>
                          <p className="text-sm italic text-primary">"{scene.narration}"</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Prompt de Imagem</p>
                          <p className="text-xs font-mono bg-muted p-2 rounded">{scene.imagePrompt}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Virality Keys */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  <h4 className="font-semibold">Chaves de Viralidade Detectadas</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.viralityKeys.map((key, index) => (
                    <Badge key={index} variant="secondary">{key}</Badge>
                  ))}
                </div>
              </Card>

              {/* Strategy */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h4 className="font-semibold">Estratégia de Viralização</h4>
                </div>
                <p className="text-sm text-muted-foreground">{result.strategy}</p>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={downloadAnalysis} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Análise
                </Button>
                {onApplyScenes && (
                  <Button onClick={handleApplyScenes} className="flex-1">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Aplicar Cenas
                  </Button>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
