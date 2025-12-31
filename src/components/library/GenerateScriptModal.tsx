import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  based_on_title: string | null;
  formula: string | null;
  formula_structure: any;
  mental_triggers: string[] | null;
  times_used: number;
}

interface GenerateScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: ScriptAgent | null;
}

export const GenerateScriptModal = ({
  open,
  onOpenChange,
  agent,
}: GenerateScriptModalProps) => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  
  // Form state
  const [videoTitle, setVideoTitle] = useState("");
  const [duration, setDuration] = useState("5");
  const [language, setLanguage] = useState("pt-BR");
  const [aiModel, setAiModel] = useState("gemini-flash");
  const [additionalContext, setAdditionalContext] = useState("");
  
  // CTA options
  const [ctaInicio, setCtaInicio] = useState(false);
  const [ctaMeio, setCtaMeio] = useState(false);
  const [ctaFinal, setCtaFinal] = useState(true);

  // Calculated values
  const wordsPerMinute = 130;
  const estimatedWords = parseInt(duration) * wordsPerMinute;
  const estimatedParts = Math.max(1, Math.ceil(parseInt(duration) / 3));
  const estimatedCredits = Math.ceil(parseInt(duration) * 2.8);

  // Adjust duration if needed (max 8 min for efficiency)
  const adjustedDuration = parseInt(duration) > 8 ? 8 : parseInt(duration);
  const showDurationWarning = parseInt(duration) !== adjustedDuration;

  const handleGenerateScript = async () => {
    if (!videoTitle.trim()) {
      toast.error("Por favor, insira o título do vídeo");
      return;
    }

    if (!user || !agent) {
      toast.error("Erro ao gerar roteiro");
      return;
    }

    setGenerating(true);
    try {
      // Build the CTA instructions
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (metade do vídeo)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      const prompt = `
Gere um roteiro completo para um vídeo com o título: "${videoTitle}"

FÓRMULA DO AGENTE:
${agent.formula || "Hook + Desenvolvimento + Clímax + CTA"}

ESTRUTURA BASE:
${agent.formula_structure ? JSON.stringify(agent.formula_structure, null, 2) : "Usar estrutura padrão de vídeo viral"}

GATILHOS MENTAIS A USAR:
${agent.mental_triggers?.join(", ") || "Curiosidade, Urgência, Prova Social"}

ESPECIFICAÇÕES:
- Duração: ${adjustedDuration} minutos (~${estimatedWords} palavras)
- Partes: ${estimatedParts} partes de ~${Math.ceil(adjustedDuration / estimatedParts)} minutos cada
- Idioma: ${language === "pt-BR" ? "Português (Brasil)" : language === "en-US" ? "English (US)" : "Español"}
- Incluir CTA em: ${ctaPositions.length > 0 ? ctaPositions.join(", ") : "final do vídeo"}

${additionalContext ? `CONTEXTO ADICIONAL:\n${additionalContext}` : ""}

Por favor, gere um roteiro completo seguindo a estrutura e fórmula do agente, otimizado para engajamento viral.
      `.trim();

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          action: "generate_script_with_formula",
          prompt,
          model: aiModel,
        },
      });

      if (error) throw error;

      // Update agent usage count
      await supabase
        .from("script_agents")
        .update({ times_used: (agent.times_used || 0) + 1 })
        .eq("id", agent.id);

      toast.success("Roteiro gerado com sucesso!");
      
      // Store the generated script or navigate to results
      // For now, just close the modal and show success
      onOpenChange(false);
      
      // TODO: Navigate to generated scripts tab or show the result
      
    } catch (error) {
      console.error("Error generating script:", error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold">
            Gerar Roteiro com Agente
          </DialogTitle>
          <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1">
            <Zap className="w-4 h-4 mr-1" />
            Custo estimado: {estimatedCredits} créditos
          </Badge>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Name (read-only) */}
          <div>
            <Label className="text-base font-semibold">Agente *</Label>
            <Input
              value={agent.name}
              readOnly
              className="mt-2 bg-secondary border-border h-12 text-base opacity-70"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Agente selecionado para gerar o roteiro
            </p>
          </div>

          {/* Video Title */}
          <div>
            <Label className="text-base font-semibold">Título do Vídeo *</Label>
            <Input
              placeholder="Cole aqui o título do vídeo para o qual deseja gerar o roteiro..."
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="mt-2 bg-secondary border-border h-12 text-base"
            />
            <p className="text-sm text-muted-foreground mt-1">
              O agente irá analisar o título e gerar um roteiro completo seguindo a estrutura do vídeo viral original.
            </p>
          </div>

          {/* Duration, Parts, Language */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-base font-semibold">Duração (min) *</Label>
              <Input
                type="number"
                min="1"
                max="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2 bg-secondary border-border h-12 text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Palavras: ~{estimatedWords.toLocaleString()}
                {showDurationWarning && (
                  <span className="text-primary"> (duração ajustada: {adjustedDuration} min)</span>
                )}
              </p>
            </div>

            <div>
              <Label className="text-base font-semibold">Partes (Automático)</Label>
              <Input
                value={estimatedParts}
                readOnly
                className="mt-2 bg-secondary border-border h-12 text-base opacity-70"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Partes de ~{Math.ceil(adjustedDuration / estimatedParts)} minutos cada
              </p>
            </div>

            <div>
              <Label className="text-base font-semibold">Idioma do Roteiro *</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-2 bg-secondary border-border h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CTA Options */}
          <div className="bg-secondary/50 p-5 rounded-xl border border-border">
            <Label className="text-base font-semibold mb-4 block">
              Call to Action (CTA) – Onde incluir?
            </Label>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="cta-inicio"
                  checked={ctaInicio}
                  onCheckedChange={(checked) => setCtaInicio(checked === true)}
                />
                <label htmlFor="cta-inicio" className="text-base cursor-pointer">
                  CTA no Início (primeiros 30 segundos)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="cta-meio"
                  checked={ctaMeio}
                  onCheckedChange={(checked) => setCtaMeio(checked === true)}
                />
                <label htmlFor="cta-meio" className="text-base cursor-pointer">
                  CTA no Meio (aproximadamente na metade do vídeo)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="cta-final"
                  checked={ctaFinal}
                  onCheckedChange={(checked) => setCtaFinal(checked === true)}
                />
                <label htmlFor="cta-final" className="text-base cursor-pointer">
                  CTA no Final (últimos 30 segundos)
                </label>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-3">
              Marque onde deseja incluir chamadas para ação (like, subscribe, comentar, etc.)
            </p>
          </div>

          {/* AI Model Selection */}
          <div>
            <Label className="text-base font-semibold">Modelo de IA</Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger className="mt-2 bg-secondary border-border h-12 text-base border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-flash">
                  <span className="flex items-center gap-2">
                    Gemini 2.5 Flash
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="text-primary">Recomendado</span>
                  </span>
                </SelectItem>
                <SelectItem value="gemini-pro">Gemini 2.5 Pro (2025)</SelectItem>
                <SelectItem value="gpt-5">GPT-5 (2025)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Context */}
          <div>
            <Label className="text-base font-semibold">Contexto Adicional</Label>
            <Textarea
              placeholder="Opcional: Use apenas se quiser fornecer contexto adicional além do título."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="mt-2 bg-secondary border-border min-h-[100px] text-base"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-base"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateScript}
            disabled={generating || !videoTitle.trim()}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
