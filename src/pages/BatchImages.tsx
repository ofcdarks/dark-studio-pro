import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Images, Upload, Download, Loader2, CheckCircle, Image, Trash2, X } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface BatchJob {
  id: string;
  prompts: string[];
  completed: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  results: string[];
}

const BatchImages = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessBatch = async () => {
    if (!prompts.trim()) {
      toast.error('Cole os prompts (um por linha)');
      return;
    }

    if (!user) {
      toast.error('Faça login para processar imagens');
      return;
    }

    const promptList = prompts.split('\n').filter(p => p.trim());
    if (promptList.length === 0) {
      toast.error('Nenhum prompt válido encontrado');
      return;
    }

    const jobId = Date.now().toString();
    const newJob: BatchJob = {
      id: jobId,
      prompts: promptList,
      completed: 0,
      status: 'processing',
      results: []
    };

    setBatchJobs(prev => [newJob, ...prev]);
    setIsProcessing(true);

    try {
      const jobResults: string[] = [];

      for (let i = 0; i < promptList.length; i++) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-image', {
            body: { prompt: promptList[i] }
          });

          if (error) throw error;

          if (data.imageUrl) {
            jobResults.push(data.imageUrl);

            // Save to database
            await supabase.from('generated_images').insert({
              user_id: user.id,
              prompt: promptList[i],
              image_url: data.imageUrl
            });
          }

          // Update progress
          setBatchJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { ...job, completed: i + 1, results: [...jobResults] }
              : job
          ));
        } catch (err) {
          console.error(`Error generating image ${i + 1}:`, err);
        }
      }

      // Mark as completed
      setBatchJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', results: jobResults }
          : job
      ));

      setResults(prev => [...jobResults, ...prev]);
      toast.success(`${jobResults.length} imagens geradas!`);
      setPrompts('');
    } catch (error) {
      console.error('Batch processing error:', error);
      setBatchJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'error' }
          : job
      ));
      toast.error('Erro no processamento em lote');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // Parse CSV - assume prompts are in first column
        const lines = content.split('\n')
          .map(line => line.split(',')[0]?.replace(/"/g, '').trim())
          .filter(line => line);
        setPrompts(lines.join('\n'));
        toast.success(`${lines.length} prompts importados!`);
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadImage = (url: string, index: number) => {
    window.open(url, '_blank');
  };

  const handleCancelJob = (jobId: string) => {
    setBatchJobs(prev => prev.filter(job => job.id !== jobId));
  };

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

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.txt"
            className="hidden"
          />

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
                  <Button 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleProcessBatch}
                    disabled={isProcessing || !prompts.trim()}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Images className="w-4 h-4 mr-2" />
                    )}
                    Processar Lote
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-border text-muted-foreground hover:bg-secondary"
                    onClick={handleImportCSV}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Importar CSV
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {prompts.split('\n').filter(p => p.trim()).length} prompts prontos
                </p>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="font-semibold text-foreground mb-4">Resultados</h3>
                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <Image className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">As imagens geradas aparecerão aqui</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {results.map((url, index) => (
                      <div 
                        key={index} 
                        className="aspect-square bg-secondary rounded-lg relative group overflow-hidden"
                      >
                        <img 
                          src={url} 
                          alt={`Generated ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-primary"
                            onClick={() => handleDownloadImage(url, index)}
                          >
                            <Download className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Trabalhos em Lote</h3>
                {batchJobs.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Nenhum trabalho em processamento
                  </p>
                ) : (
                  <div className="space-y-3">
                    {batchJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">
                            Lote #{job.id.slice(-4)}
                          </span>
                          <div className="flex items-center gap-2">
                            {job.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-success" />
                            )}
                            {job.status === 'processing' && (
                              <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            )}
                            {job.status === 'processing' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCancelJob(job.id)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full mb-2">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(job.completed / job.prompts.length) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {job.completed}/{job.prompts.length} imagens
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default BatchImages;
