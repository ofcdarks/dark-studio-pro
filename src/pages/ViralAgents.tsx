import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus, Play, Settings, Zap, FileText, Mic, Image, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const agents = [
  { 
    id: "script", 
    name: "Gerador de Roteiros", 
    description: "Cria roteiros otimizados para vídeos virais", 
    icon: FileText, 
    type: "generate_script",
    placeholder: "Descreva o tema do vídeo que você quer criar..."
  },
  { 
    id: "titles", 
    name: "Analisador de Títulos", 
    description: "Sugere títulos com alto potencial de CTR", 
    icon: Zap,
    type: "generate_titles",
    placeholder: "Descreva o conteúdo do seu vídeo..."
  },
  { 
    id: "niche", 
    name: "Analisador de Nicho", 
    description: "Analisa tendências e oportunidades de nicho", 
    icon: Bot,
    type: "analyze_niche",
    placeholder: "Qual nicho você quer analisar?"
  },
];

const ViralAgents = () => {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRunAgent = async (agentId: string, type: string) => {
    if (!input.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma descrição",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setActiveAgent(agentId);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type,
          prompt: input,
        },
      });

      if (response.error) throw response.error;
      setResult(response.data.result);

      toast({
        title: "Concluído!",
        description: "O agente processou sua solicitação",
      });
    } catch (error) {
      console.error("Error running agent:", error);
      toast({
        title: "Erro",
        description: "Não foi possível executar o agente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Agentes Virais</h1>
            <p className="text-muted-foreground">
              Assistentes de IA especializados para criação de conteúdo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {agents.map((agent) => (
              <Card key={agent.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <agent.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <textarea
                    placeholder={agent.placeholder}
                    className="w-full p-3 bg-secondary border border-border rounded-lg text-sm text-foreground resize-none"
                    rows={3}
                    value={activeAgent === agent.id ? input : ""}
                    onChange={(e) => {
                      setActiveAgent(agent.id);
                      setInput(e.target.value);
                    }}
                  />
                  <Button 
                    onClick={() => handleRunAgent(agent.id, agent.type)}
                    disabled={loading && activeAgent === agent.id}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading && activeAgent === agent.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Executar
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {result && (
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Resultado do Agente</h3>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-foreground">
                  {result}
                </pre>
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ViralAgents;
