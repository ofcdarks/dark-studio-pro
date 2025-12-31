import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Images, Upload, Download, Loader2, CheckCircle, Image } from "lucide-react";
import { useState } from "react";

const BatchImages = () => {
  const [prompts, setPrompts] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const batchJobs = [
    { id: 1, prompts: 5, completed: 5, status: "completed" },
    { id: 2, prompts: 10, completed: 7, status: "processing" },
    { id: 3, prompts: 8, completed: 0, status: "pending" },
  ];

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Imagens em Lote</h1>
            <p className="text-muted-foreground">
              Gere múltiplas imagens de uma vez com prompts em massa
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Images className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Prompts em Lote</h3>
                </div>
                <Textarea
                  placeholder="Cole seus prompts aqui (um por linha)...&#10;&#10;Exemplo:&#10;Mysterious ancient temple at night&#10;Futuristic city skyline&#10;Dark forest with fog"
                  value={prompts}
                  onChange={(e) => setPrompts(e.target.value)}
                  className="bg-secondary border-border min-h-48 mb-4 font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Images className="w-4 h-4 mr-2" />
                    Processar Lote
                  </Button>
                  <Button variant="outline" className="border-border text-muted-foreground hover:bg-secondary">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </Button>
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="font-semibold text-foreground mb-4">Resultados</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
                    <div key={index} className="aspect-square bg-secondary rounded-lg flex items-center justify-center relative group">
                      <Image className="w-8 h-8 text-muted-foreground" />
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="ghost" size="icon" className="text-primary">
                          <Download className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Trabalhos em Lote</h3>
                <div className="space-y-3">
                  {batchJobs.map((job) => (
                    <div key={job.id} className="p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Lote #{job.id}</span>
                        {job.status === "completed" && (
                          <CheckCircle className="w-4 h-4 text-success" />
                        )}
                        {job.status === "processing" && (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        )}
                      </div>
                      <div className="h-2 bg-secondary rounded-full mb-2">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(job.completed / job.prompts) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {job.completed}/{job.prompts} imagens
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BatchImages;
