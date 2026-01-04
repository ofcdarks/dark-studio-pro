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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Zap, Star, Info, Copy, Check } from "lucide-react";
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
  const durationNum = parseInt(duration || "1");
  
  // Duração mínima = solicitada, máxima = solicitada + 3 minutos
  const minDuration = durationNum;
  const maxDuration = durationNum + 3;
  const targetDuration = durationNum + 1; // Alvo: +1 minuto para garantir conteúdo suficiente
  
  const estimatedWords = targetDuration * wordsPerMinute;
  const estimatedParts = Math.max(1, Math.ceil(targetDuration / 3));
  
  // Credit calculation based on CREDIT_PRICING from documentation
  // SCRIPT_PER_MINUTE: { base: 2, gemini: 2.4, claude: 2.8 }
  const getCreditsForModel = () => {
    switch (aiModel) {
      case "gemini-flash":
        return Math.ceil(targetDuration * 2.4);
      case "gemini-pro":
        return Math.ceil(targetDuration * 2.6);
      case "claude-sonnet":
        return Math.ceil(targetDuration * 2.8);
      case "gpt-5":
        return Math.ceil(targetDuration * 3.0);
      default:
        return Math.ceil(targetDuration * 2);
    }
  };
  const estimatedCredits = getCreditsForModel();

  // Result state
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

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
    setGeneratedScript(null);
    
    try {
      // Build the CTA instructions conforme documentação
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (metade do vídeo)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      // Construir prompt com duração exata - Passo 4: Geração de Roteiros
      const prompt = `
Gere um roteiro completo para um vídeo com o título: "${videoTitle}"

📏 ESPECIFICAÇÕES CRÍTICAS DE DURAÇÃO:
- Duração MÍNIMA OBRIGATÓRIA: ${minDuration} minutos
- Duração ALVO: ${targetDuration} minutos (~${estimatedWords} palavras)
- Duração MÁXIMA PERMITIDA: ${maxDuration} minutos
- Palavras por minuto de narração: ${wordsPerMinute}

⚠️ REGRA DE OURO: O roteiro NUNCA pode ter menos de ${minDuration} minutos. É MELHOR passar um pouco do que faltar conteúdo!

- Partes: ${estimatedParts} partes de ~${Math.ceil(targetDuration / estimatedParts)} minutos cada
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
          duration: targetDuration,
          minDuration: minDuration,
          maxDuration: maxDuration,
          language,
          userId: user.id,
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

      const scriptContent = typeof data?.result === 'string' ? data.result : JSON.stringify(data?.result, null, 2);
      setGeneratedScript(scriptContent);

      // Salvar roteiro na tabela generated_scripts conforme documentação
      const { error: saveError } = await supabase
        .from('generated_scripts')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          title: videoTitle,
          content: scriptContent,
          duration: targetDuration,
          language,
          model_used: aiModel,
          credits_used: data?.creditsUsed || estimatedCredits
        });

      if (saveError) {
        console.error("[GenerateScript] Error saving script:", saveError);
        toast.error("Roteiro gerado mas erro ao salvar");
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

      toast.success(`Roteiro gerado com sucesso! (${data?.creditsUsed || estimatedCredits} créditos)`);
      
    } catch (error) {
      console.error("[GenerateScript] Error generating script:", error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  // Função para limpar marcações de partes do roteiro
  const cleanScriptForCopy = (script: string): string => {
    return script
      // Remove linhas de título com # (ex: # TÍTULO DO VÍDEO)
      .replace(/^#+ .+$/gm, '')
      // Remove marcações de partes (ex: ## PARTE 1 - HOOK, PARTE 2:, etc)
      .replace(/^##?\s*(PARTE|PART|Part)\s*\d+.*$/gim, '')
      // Remove marcações de tempo entre colchetes (ex: [00:00 - 00:30])
      .replace(/\[\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\]/g, '')
      // Remove instruções entre colchetes (ex: [PAUSA], [Instruções])
      .replace(/\[.*?\]/g, '')
      // Remove linhas com --- (separadores)
      .replace(/^-{3,}$/gm, '')
      // Remove múltiplas linhas em branco consecutivas
      .replace(/\n{3,}/g, '\n\n')
      // Remove espaços extras no início e fim
      .trim();
  };

  const handleCopyScript = async () => {
    if (generatedScript) {
      const cleanScript = cleanScriptForCopy(generatedScript);
      await navigator.clipboard.writeText(cleanScript);
      toast.success("Roteiro copiado (sem marcações)!");
    }
  };

  const handleClose = () => {
    setGeneratedScript(null);
    onOpenChange(false);
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-primary/30">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">
              {generatedScript ? "Roteiro Gerado" : "Gerar Roteiro com Agente"}
            </DialogTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1.5">
              <Zap className="w-4 h-4 mr-1.5" />
              Custo estimado: {estimatedCredits} créditos
            </Badge>
          </div>
        </DialogHeader>

        {generatedScript ? (
          // Exibir roteiro gerado
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{videoTitle}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Roteiro
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] w-full rounded-lg border border-border bg-secondary/30 p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {generatedScript}
              </pre>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 text-sm"
              >
                Fechar
              </Button>
              <Button
                onClick={() => setGeneratedScript(null)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm"
              >
                Gerar Outro Roteiro
              </Button>
            </div>
          </div>
        ) : (
          // Formulário de geração
          <>
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
                    Alvo: ~{estimatedWords.toLocaleString()} palavras ({targetDuration} min)
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
                    ~{Math.ceil(targetDuration / estimatedParts)} min/parte
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
                    <SelectItem value="claude-sonnet">Claude 4 Sonnet</SelectItem>
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
                onClick={handleClose}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
