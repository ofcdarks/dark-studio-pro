import { useState } from "react";
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
import { Loader2, Zap, Star, Info } from "lucide-react";
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
  const estimatedWords = parseInt(duration || "1") * wordsPerMinute;
  const estimatedParts = Math.max(1, Math.ceil(parseInt(duration || "1") / 3));
  
  // Credit calculation based on CREDIT_PRICING from documentation
  // SCRIPT_PER_MINUTE: { base: 2, gemini: 2.4, claude: 2.8 }
  const getCreditsForModel = () => {
    const durationNum = parseInt(duration || "1");
    switch (aiModel) {
      case "gemini-flash":
      case "gemini-pro":
        return Math.ceil(durationNum * 2.4);
      case "gpt-5":
        return Math.ceil(durationNum * 2.8);
      default:
        return Math.ceil(durationNum * 2);
    }
  };
  const estimatedCredits = getCreditsForModel();

  // Max duration is 8 min for efficiency
  const maxDuration = 8;
  const adjustedDuration = parseInt(duration || "1") > maxDuration ? maxDuration : parseInt(duration || "1");
  const showDurationWarning = parseInt(duration || "1") > maxDuration;

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
      // Build the CTA instructions conforme documentação
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (metade do vídeo)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      // Construir prompt conforme documentação - Passo 4: Geração de Roteiros
      const prompt = `
Gere um roteiro completo para um vídeo com o título: "${videoTitle}"

ESPECIFICAÇÕES DO VÍDEO:
- Duração: ${adjustedDuration} minutos (~${estimatedWords} palavras)
- Partes: ${estimatedParts} partes de ~${Math.ceil(adjustedDuration / estimatedParts)} minutos cada
- Idioma: ${language === "pt-BR" ? "Português (Brasil)" : language === "en-US" ? "English (US)" : "Español"}
- Incluir CTA em: ${ctaPositions.length > 0 ? ctaPositions.join(", ") : "final do vídeo"}

${additionalContext ? `CONTEXTO ADICIONAL:\n${additionalContext}` : ""}

Gere um roteiro completo seguindo a estrutura e fórmula do agente, otimizado para engajamento viral.
      `.trim();

      // Enviar dados do agente conforme documentação
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate_script_with_formula",
          prompt,
          model: aiModel,
          duration: adjustedDuration,
          language,
          // Dados do agente conforme estrutura da documentação
          agentData: {
            name: agent.name,
            niche: agent.niche,
            sub_niche: agent.sub_niche,
            formula: agent.formula,
            formula_structure: agent.formula_structure,
            mental_triggers: agent.mental_triggers,
          },
        },
      });

      if (error) {
        console.error("[GenerateScript] Error:", error);
        throw error;
      }

      // Verificar erros de créditos (402) ou rate limit (429)
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Update agent usage count conforme documentação
      const { error: updateError } = await supabase
        .from("script_agents")
        .update({ 
          times_used: (agent.times_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", agent.id);

      if (updateError) {
        console.error("[GenerateScript] Error updating agent:", updateError);
      }

      // Log do resultado
      console.log("[GenerateScript] Script generated successfully, credits used:", data?.creditsUsed);

      toast.success(`Roteiro gerado com sucesso! (${data?.creditsUsed || estimatedCredits} créditos)`);
      onOpenChange(false);
      
      // TODO: Navegar para aba de roteiros gerados ou exibir resultado
      
    } catch (error) {
      console.error("[GenerateScript] Error generating script:", error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/30">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">
              Gerar Roteiro com Agente
            </DialogTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1.5">
              <Zap className="w-4 h-4 mr-1.5" />
              Custo estimado: {estimatedCredits} créditos
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Agent Name (read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Agente <span className="text-primary">*</span>
            </Label>
            <Input
              value={agent.name}
              readOnly
              className="bg-secondary/50 border-border h-11 text-sm opacity-80 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Agente selecionado para gerar o roteiro
            </p>
          </div>

          {/* Video Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Título do Vídeo <span className="text-primary">*</span>
            </Label>
            <Input
              placeholder="Cole aqui o título do vídeo para o qual deseja gerar o roteiro..."
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="bg-secondary/50 border-border h-11 text-sm placeholder:text-muted-foreground/60"
            />
            <p className="text-xs text-muted-foreground">
              O agente irá analisar o título e gerar um roteiro completo seguindo a estrutura do vídeo viral original.
            </p>
          </div>

          {/* Duration, Parts, Language - 3 columns */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Duração (min) <span className="text-primary">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                max="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-secondary/50 border-border h-11 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Palavras: ~{estimatedWords.toLocaleString()}
                {showDurationWarning && (
                  <span className="text-primary block mt-0.5">
                    (máx. ajustado: {maxDuration} min)
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Partes (Automático)
              </Label>
              <Input
                value={estimatedParts}
                readOnly
                className="bg-secondary/50 border-border h-11 text-sm opacity-80 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                ~{Math.ceil(adjustedDuration / estimatedParts)} min/parte
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                Idioma do Roteiro <span className="text-primary">*</span>
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-secondary/50 border-border h-11 text-sm">
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

          {/* CTA Options Section */}
          <div className="bg-secondary/30 p-4 rounded-lg border border-border">
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Call to Action (CTA) – Onde incluir?
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="cta-inicio"
                  checked={ctaInicio}
                  onCheckedChange={(checked) => setCtaInicio(checked === true)}
                  className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="cta-inicio" className="text-sm cursor-pointer text-foreground">
                  CTA no Início (primeiros 30 segundos)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="cta-meio"
                  checked={ctaMeio}
                  onCheckedChange={(checked) => setCtaMeio(checked === true)}
                  className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="cta-meio" className="text-sm cursor-pointer text-foreground">
                  CTA no Meio (aproximadamente na metade do vídeo)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="cta-final"
                  checked={ctaFinal}
                  onCheckedChange={(checked) => setCtaFinal(checked === true)}
                  className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="cta-final" className="text-sm cursor-pointer text-foreground">
                  CTA no Final (últimos 30 segundos)
                </label>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Marque onde deseja incluir chamadas para ação (like, subscribe, comentar, etc.)
            </p>
          </div>

          {/* AI Model Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Modelo de IA
            </Label>
            <Select value={aiModel} onValueChange={setAiModel}>
              <SelectTrigger className="bg-secondary/50 border-primary/50 h-11 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-flash">
                  <span className="flex items-center gap-2">
                    Gemini 2.5 Flash
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    <span className="text-xs text-primary font-medium">Recomendado</span>
                  </span>
                </SelectItem>
                <SelectItem value="gemini-pro">Gemini 2.5 Pro (2025)</SelectItem>
                <SelectItem value="gpt-5">GPT-5 (2025)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Contexto Adicional
            </Label>
            <Textarea
              placeholder="Opcional: Use apenas se quiser fornecer contexto adicional além do título."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              className="bg-secondary/50 border-border min-h-[80px] text-sm resize-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 text-sm border-border hover:bg-secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateScript}
            disabled={generating || !videoTitle.trim()}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando Roteiro...
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
