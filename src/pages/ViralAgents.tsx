import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus, Play, Settings, Zap, FileText, Mic, Image } from "lucide-react";

const agents = [
  { name: "Gerador de Roteiros", description: "Cria roteiros otimizados para vídeos virais", icon: FileText, status: "active" },
  { name: "Analisador de Títulos", description: "Sugere títulos com alto potencial de CTR", icon: Zap, status: "active" },
  { name: "Criador de Thumbnails", description: "Gera descrições para thumbnails impactantes", icon: Image, status: "inactive" },
  { name: "Otimizador de SEO", description: "Melhora tags e descrições para descoberta", icon: Bot, status: "active" },
];

const ViralAgents = () => {
  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Agentes Virais</h1>
              <p className="text-muted-foreground">
                Assistentes de IA especializados para criação de conteúdo
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Agente
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent, index) => (
              <Card key={index} className="p-6">
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
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    agent.status === "active" 
                      ? "bg-success/20 text-success" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {agent.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Play className="w-4 h-4 mr-2" />
                    Executar
                  </Button>
                  <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:bg-secondary">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ViralAgents;
