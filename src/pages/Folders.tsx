import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus, Clock, File, MoreVertical } from "lucide-react";

const folders = [
  { name: "Vídeos Analisados", items: 24, updated: "Há 2 horas" },
  { name: "Roteiros Salvos", items: 12, updated: "Há 1 dia" },
  { name: "Ideias de Conteúdo", items: 45, updated: "Há 3 dias" },
  { name: "Referências Virais", items: 18, updated: "Há 1 semana" },
];

const Folders = () => {
  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Pastas e Histórico</h1>
              <p className="text-muted-foreground">
                Organize seus projetos e acesse o histórico de atividades
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Pasta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {folders.map((folder, index) => (
              <Card key={index} className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{folder.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <File className="w-4 h-4" />
                  <span>{folder.items} itens</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{folder.updated}</span>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Histórico de Atividades</h3>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">Vídeo analisado: "Os Mistérios do Egito Antigo"</p>
                    <p className="text-xs text-muted-foreground">Há {index + 1} hora{index > 0 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Folders;
