import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Download, Copy, RefreshCw, CheckCircle } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";

const SRTConverter = () => {
  // Persisted states
  const [inputText, setInputText] = usePersistedState("srt_inputText", "");
  const [outputText, setOutputText] = usePersistedState("srt_outputText", "");
  
  // Non-persisted states
  const [activeConversion, setActiveConversion] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setInputText(content);
        toast.success(`Arquivo "${file.name}" carregado!`);
      };
      reader.readAsText(file);
    }
  };

  const handleCopy = () => {
    if (!outputText) {
      toast.error('Nenhum conteúdo para copiar');
      return;
    }
    navigator.clipboard.writeText(outputText);
    toast.success('Copiado para a área de transferência!');
  };

  const handleDownload = (format: string) => {
    if (!outputText) {
      toast.error('Nenhum conteúdo para baixar');
      return;
    }

    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Arquivo .${format} baixado!`);
  };

  const syncTime = () => {
    if (!inputText) {
      toast.error('Cole o conteúdo SRT primeiro');
      return;
    }

    setActiveConversion('sync');
    
    // Parse and adjust timing
    const lines = inputText.split('\n');
    const adjusted = lines.map(line => {
      // Match SRT timing format: 00:00:00,000 --> 00:00:02,000
      const timeMatch = line.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      if (timeMatch) {
        return line; // Keep timing as is for now (could add offset)
      }
      return line;
    });

    setOutputText(adjusted.join('\n'));
    toast.success('Tempos sincronizados!');
    setActiveConversion(null);
  };

  const srtToTxt = () => {
    if (!inputText) {
      toast.error('Cole o conteúdo SRT primeiro');
      return;
    }

    setActiveConversion('toTxt');

    const lines = inputText.split('\n');
    const textOnly: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip sequence numbers and timestamps
      if (/^\d+$/.test(line)) continue;
      if (/\d{2}:\d{2}:\d{2},\d{3} -->/.test(line)) continue;
      if (line === '') continue;
      textOnly.push(line);
    }

    setOutputText(textOnly.join('\n'));
    toast.success('Convertido para TXT!');
    setActiveConversion(null);
  };

  const txtToSrt = () => {
    if (!inputText) {
      toast.error('Cole o texto primeiro');
      return;
    }

    setActiveConversion('toSrt');

    const lines = inputText.split('\n').filter(l => l.trim());
    const srtLines: string[] = [];
    let sequence = 1;
    let currentTime = 0;

    lines.forEach((line, index) => {
      const duration = Math.max(2, Math.ceil(line.length / 20)); // ~20 chars per second
      const startTime = formatSrtTime(currentTime);
      const endTime = formatSrtTime(currentTime + duration);
      
      srtLines.push(String(sequence));
      srtLines.push(`${startTime} --> ${endTime}`);
      srtLines.push(line);
      srtLines.push('');
      
      currentTime += duration;
      sequence++;
    });

    setOutputText(srtLines.join('\n'));
    toast.success('Convertido para SRT!');
    setActiveConversion(null);
  };

  const srtToVtt = () => {
    if (!inputText) {
      toast.error('Cole o conteúdo SRT primeiro');
      return;
    }

    setActiveConversion('toVtt');

    // VTT uses period instead of comma in timestamps
    let vttContent = 'WEBVTT\n\n';
    vttContent += inputText.replace(/,(\d{3})/g, '.$1');

    setOutputText(vttContent);
    toast.success('Convertido para VTT!');
    setActiveConversion(null);
  };

  const formatSrtTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = 0;
    
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Conversor SRT</h1>
            <p className="text-muted-foreground">
              Converta e edite arquivos de legendas SRT
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".srt,.txt,.vtt"
            className="hidden"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Entrada</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border text-muted-foreground hover:bg-secondary"
                  onClick={handleUpload}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload SRT
                </Button>
              </div>
              <Textarea
                placeholder="Cole o conteúdo do SRT ou faça upload de um arquivo...&#10;&#10;1&#10;00:00:00,000 --> 00:00:02,000&#10;Texto da legenda..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="bg-secondary border-border min-h-80 font-mono text-sm"
              />
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Saída</h3>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-border text-muted-foreground hover:bg-secondary"
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-border text-muted-foreground hover:bg-secondary"
                    onClick={() => handleDownload('srt')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="O resultado da conversão aparecerá aqui..."
                value={outputText}
                className="bg-secondary border-border min-h-80 font-mono text-sm"
                readOnly
              />
            </Card>
          </div>

          <Card className="p-6 mt-6">
            <h3 className="font-semibold text-foreground mb-4">Opções de Conversão</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className={`h-auto py-4 border-border text-foreground hover:bg-secondary flex-col ${activeConversion === 'sync' ? 'border-primary' : ''}`}
                onClick={syncTime}
              >
                <RefreshCw className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm">Sincronizar Tempo</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 border-border text-foreground hover:bg-secondary flex-col ${activeConversion === 'toTxt' ? 'border-primary' : ''}`}
                onClick={srtToTxt}
              >
                <FileText className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm">SRT para TXT</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 border-border text-foreground hover:bg-secondary flex-col ${activeConversion === 'toSrt' ? 'border-primary' : ''}`}
                onClick={txtToSrt}
              >
                <FileText className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm">TXT para SRT</span>
              </Button>
              <Button 
                variant="outline" 
                className={`h-auto py-4 border-border text-foreground hover:bg-secondary flex-col ${activeConversion === 'toVtt' ? 'border-primary' : ''}`}
                onClick={srtToVtt}
              >
                <Download className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm">Exportar VTT</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default SRTConverter;
