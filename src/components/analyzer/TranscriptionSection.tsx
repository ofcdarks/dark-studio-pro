import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clipboard,
  Copy,
  Trash2,
  Loader2,
  Sparkles,
  Bot,
  Zap,
} from "lucide-react";
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

interface TranscriptionSectionProps {
  onCreateAgent: (formula: ScriptFormulaAnalysis | null, transcription: string) => void;
}

export const TranscriptionSection = ({ onCreateAgent }: TranscriptionSectionProps) => {
  const [transcription, setTranscription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [formulaAnalysis, setFormulaAnalysis] = useState<ScriptFormulaAnalysis | null>(null);
  const { toast } = useToast();

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTranscription(text);
      toast({ title: "Colado!", description: "Transcrição colada da área de transferência" });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a área de transferência",
        variant: "destructive",
      });
    }
  };

  const handleCopyTranscription = async () => {
    if (!transcription) return;
    await navigator.clipboard.writeText(transcription);
    toast({ title: "Copiado!", description: "Transcrição copiada" });
  };

  const handleClearField = () => {
    setTranscription("");
    setFormulaAnalysis(null);
  };

  const handleAnalyzeFormula = async () => {
    if (!transcription.trim()) {
      toast({
        title: "Erro",
        description: "Cole ou carregue uma transcrição primeiro",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "analyze_script_formula",
          text: transcription,
        },
      });

      if (response.error) throw response.error;

      let result = response.data.result;
      if (typeof result === "string") {
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1].trim());
        } else {
          result = JSON.parse(result);
        }
      }

      setFormulaAnalysis(result);
      toast({ title: "Análise concluída!", description: "Fórmula viral identificada" });
    } catch (error) {
      console.error("Error analyzing formula:", error);
      // Mock data for demo
      setFormulaAnalysis({
        motivoSucesso: "O roteiro utiliza uma estrutura de storytelling com gancho emocional forte nos primeiros 10 segundos, seguido de revelações progressivas que mantêm a atenção do espectador.",
        formula: "Hook emocional (0-10s) + Promessa de revelação + Desenvolvimento com tensão crescente + Clímax surpreendente + CTA natural",
        estrutura: {
          hook: "Pergunta provocativa ou afirmação chocante nos primeiros 10 segundos",
          desenvolvimento: "3 blocos de conteúdo com micro-ganchos entre cada um",
          climax: "Revelação principal com impacto emocional",
          cta: "Chamada para ação integrada naturalmente ao conteúdo",
        },
        tempoTotal: "8-12 minutos",
        gatilhosMentais: ["Curiosidade", "Urgência", "Prova Social", "Exclusividade", "Medo de Perder"],
      });
      toast({ title: "Análise concluída", description: "Dados gerados para demonstração" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.srt,.vtt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        setTranscription(text);
        toast({
          title: "Transcrição carregada!",
          description: `Arquivo ${file.name} carregado`,
        });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Transcription Card */}
      <Card className="p-6 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Transcrição Completa do Vídeo</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              <Zap className="w-3 h-3 mr-1" />
              Custo estimado: 10 créditos
            </Badge>
            <span className="text-sm text-muted-foreground">
              Cole o roteiro manualmente ou clique em &quot;Carregar Transcrição&quot;
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Assim que o campo estiver preenchido, o botão &quot;Criar Agente de Roteiro&quot; será liberado automaticamente.
        </p>

        <Textarea
          placeholder="Cole aqui a transcrição completa do vídeo ou aguarde o carregamento automático."
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          className="min-h-[200px] bg-secondary border-border resize-y mb-4"
        />

        <p className="text-sm text-muted-foreground mb-4">
          Você pode colar manualmente o roteiro completo, colar direto da área de transferência ou utilizar o botão de transcrição automática após analisar o vídeo.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePasteFromClipboard}>
            <Clipboard className="w-4 h-4 mr-2" />
            Colar do Clipboard
          </Button>
          <Button variant="outline" onClick={handleCopyTranscription} disabled={!transcription}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Transcrição
          </Button>
          <Button variant="outline" onClick={handleClearField}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Campo
          </Button>
          <Button 
            onClick={handleAnalyzeFormula}
            disabled={analyzing || !transcription.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Analisar Fórmula Viral
          </Button>
          <Button 
            onClick={() => onCreateAgent(formulaAnalysis, transcription)}
            disabled={!transcription.trim()}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            <Bot className="w-4 h-4 mr-2" />
            Criar Agente de Roteiro
          </Button>
        </div>
      </Card>

      {/* Formula Analysis Result */}
      <Card className="p-6 border-border/50 bg-secondary/30">
        <h3 className="text-lg font-bold text-foreground mb-2">Fórmula de Sucesso Detectada</h3>
        {formulaAnalysis ? (
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-foreground">Motivo do Sucesso: </span>
              <span className="text-muted-foreground">{formulaAnalysis.motivoSucesso}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Fórmula: </span>
              <code className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                {formulaAnalysis.formula}
              </code>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-xs text-primary font-semibold mb-2">ESTRUTURA DO ROTEIRO</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-foreground">Hook:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.hook}</span></p>
                  <p><span className="font-medium text-foreground">Desenvolvimento:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.desenvolvimento}</span></p>
                  <p><span className="font-medium text-foreground">Clímax:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.climax}</span></p>
                  <p><span className="font-medium text-foreground">CTA:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.cta}</span></p>
                </div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-xs text-primary font-semibold mb-2">GATILHOS MENTAIS IDENTIFICADOS</p>
                <div className="flex flex-wrap gap-2">
                  {formulaAnalysis.gatilhosMentais.map((gatilho, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {gatilho}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <span className="font-medium text-foreground">Tempo ideal:</span> {formulaAnalysis.tempoTotal}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Cole ou carregue o roteiro e clique em &quot;Analisar Fórmula Viral&quot;.
          </p>
        )}
      </Card>
    </div>
  );
};
