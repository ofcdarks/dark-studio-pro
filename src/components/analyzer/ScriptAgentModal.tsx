import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScriptFormulaAnalysis {
  motivoSucesso: string;
  formula: string;
  estrutura: {
    hook: string;
    desenvolvimento: string;
    climax: string;
    cta: string;
  };
  tempoTotal: string;
  gatilhosMentais: string[];
}

interface ScriptAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: ScriptFormulaAnalysis | null;
  baseTranscription: string;
}

export const ScriptAgentModal = ({
  open,
  onOpenChange,
  formula,
  baseTranscription,
}: ScriptAgentModalProps) => {
  const [agentName, setAgentName] = useState("Agente História 2");
  const [videoTitle, setVideoTitle] = useState("");
  const [duration, setDuration] = useState("5");
  const [parts, setParts] = useState("3");
  const [language, setLanguage] = useState("pt-BR");
  const [ctaInicio, setCtaInicio] = useState(false);
  const [ctaMeio, setCtaMeio] = useState(false);
  const [ctaFinal, setCtaFinal] = useState(true);
  const [aiModel, setAiModel] = useState("gpt-4.1");
  const [additionalTopic, setAdditionalTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const { toast } = useToast();

  const estimatedWords = Math.round(parseInt(duration) * 130);
  const partDuration = Math.round(parseInt(duration) / parseInt(parts));

  const handleGenerateScript = async () => {
    if (!videoTitle.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o título do vídeo",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (aproximadamente na metade)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate_script_with_formula",
          prompt: `Gere um roteiro completo para o vídeo: "${videoTitle}"
          
          FÓRMULA BASE IDENTIFICADA:
          ${formula?.formula || "Estrutura padrão de vídeo viral"}
          
          ESTRUTURA A SEGUIR:
          - Hook: ${formula?.estrutura.hook || "Gancho impactante nos primeiros 10 segundos"}
          - Desenvolvimento: ${formula?.estrutura.desenvolvimento || "Conteúdo em blocos com micro-ganchos"}
          - Clímax: ${formula?.estrutura.climax || "Revelação principal"}
          - CTA: ${formula?.estrutura.cta || "Chamada para ação natural"}
          
          GATILHOS MENTAIS A USAR:
          ${formula?.gatilhosMentais?.join(", ") || "Curiosidade, Urgência, Exclusividade"}
          
          CONFIGURAÇÕES:
          - Duração: ${duration} minutos (~${estimatedWords} palavras)
          - Partes: ${parts} (cada uma com ~${partDuration} minutos)
          - Idioma: ${language === "pt-BR" ? "Português Brasileiro" : language}
          - CTAs em: ${ctaPositions.join(", ")}
          ${additionalTopic ? `- Contexto adicional: ${additionalTopic}` : ""}
          
          ${baseTranscription ? `TRANSCRIÇÃO DE REFERÊNCIA:\n${baseTranscription.substring(0, 2000)}...` : ""}`,
          language,
        },
      });

      if (response.error) throw response.error;

      setGeneratedScript(response.data.result);
      toast({ title: "Roteiro gerado!", description: "Seu roteiro foi criado com sucesso" });
    } catch (error) {
      console.error("Error generating script:", error);
      // Mock script for demo
      setGeneratedScript(`# ${videoTitle}

## PARTE 1 - HOOK (0:00 - 0:30)

[ABERTURA IMPACTANTE]
"Você sabia que existe um segredo que mudou completamente a forma como..."

---

## PARTE 2 - DESENVOLVIMENTO (0:30 - ${Math.round(parseInt(duration) * 0.7)}:00)

[BLOCO 1 - Contexto]
Apresentação do problema principal...

[BLOCO 2 - Revelação]
A descoberta surpreendente...

[BLOCO 3 - Aplicação]
Como você pode usar isso...

---

## PARTE 3 - CLÍMAX E CTA (${Math.round(parseInt(duration) * 0.7)}:00 - ${duration}:00)

[REVELAÇÃO FINAL]
O momento de maior impacto...

${ctaFinal ? "[CTA]\n\"Se você gostou deste conteúdo, deixe seu like e se inscreva...\"" : ""}

---

📊 Estatísticas do Roteiro:
- Duração estimada: ${duration} minutos
- Palavras: ~${estimatedWords}
- Partes: ${parts}
- Gatilhos: ${formula?.gatilhosMentais?.slice(0, 3).join(", ") || "Curiosidade, Urgência"}`);
      toast({ title: "Roteiro gerado", description: "Dados de demonstração" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Gerar Roteiro com Agente</DialogTitle>
            <Badge variant="outline" className="text-primary border-primary">
              <Zap className="w-3 h-3 mr-1" />
              Custo estimado: 14 créditos
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Name */}
          <div>
            <Label className="text-sm font-medium">Agente *</Label>
            <Input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="mt-1 bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Agente selecionado para gerar o roteiro
            </p>
          </div>

          {/* Video Title */}
          <div>
            <Label className="text-sm font-medium">Título do Vídeo *</Label>
            <Input
              placeholder="Cole aqui o título do vídeo para o qual deseja gerar o roteiro..."
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="mt-1 bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O agente irá analisar o título e gerar um roteiro completo seguindo a estrutura do vídeo viral original.
            </p>
          </div>

          {/* Duration, Parts, Language */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Duração (min) *</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Palavras: ~{estimatedWords}{" "}
                <span className="text-primary">(duração ajustada: {Math.round(estimatedWords / 130)} min)</span>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Partes (Automático)</Label>
              <Input
                type="number"
                value={parts}
                onChange={(e) => setParts(e.target.value)}
                className="mt-1 bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Partes de {partDuration} minutos cada
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Idioma do Roteiro *</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1 bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200] bg-popover" position="popper" sideOffset={4}>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CTA Options */}
          <div className="bg-secondary/50 p-4 rounded-lg">
            <p className="font-medium text-foreground mb-3">Call to Action (CTA) – Onde incluir?</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cta-inicio"
                  checked={ctaInicio}
                  onCheckedChange={(checked) => setCtaInicio(checked as boolean)}
                />
                <Label htmlFor="cta-inicio" className="text-sm">
                  CTA no Início (primeiros 30 segundos)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cta-meio"
                  checked={ctaMeio}
                  onCheckedChange={(checked) => setCtaMeio(checked as boolean)}
                />
                <Label htmlFor="cta-meio" className="text-sm">
                  CTA no Meio (aproximadamente na metade do vídeo)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cta-final"
                  checked={ctaFinal}
                  onCheckedChange={(checked) => setCtaFinal(checked as boolean)}
                />
                <Label htmlFor="cta-final" className="text-sm">
                  CTA no Final (últimos 30 segundos)
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Marque onde deseja incluir chamadas para ação (like, subscribe, comentar, etc.)
            </p>
          </div>

          {/* AI Model */}
          <div>
            <Label className="text-sm font-medium">Modelo de IA</Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger className="mt-1 bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-popover" position="popper" sideOffset={4}>
                <SelectItem value="gpt-4.1">
                  <div className="flex items-center gap-2">
                    GPT-4.1
                    <Star className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Recomendado</span>
                  </div>
                </SelectItem>
                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Topic */}
          <div>
            <Label className="text-sm font-medium">Tópico Adicional (Opcional)</Label>
            <Textarea
              placeholder="Se desejar, adicione informações adicionais sobre o tópico ou contexto específico..."
              value={additionalTopic}
              onChange={(e) => setAdditionalTopic(e.target.value)}
              className="mt-1 bg-secondary border-border min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Opcional: Use apenas se quiser fornecer contexto adicional além do título
            </p>
          </div>

          {/* Generated Script Preview */}
          {generatedScript && (
            <div className="bg-secondary/50 p-4 rounded-lg">
              <p className="font-medium text-foreground mb-2">Roteiro Gerado:</p>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground max-h-[300px] overflow-y-auto">
                {generatedScript}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateScript}
            disabled={generating}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Roteiro"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
