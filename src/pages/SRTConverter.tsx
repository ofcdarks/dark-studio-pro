import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Download, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";

const SRTConverter = () => {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Entrada</h3>
                </div>
                <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-secondary">
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
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-secondary">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-secondary">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="O resultado da conversão aparecerá aqui..."
                value={outputText}
                onChange={(e) => setOutputText(e.target.value)}
                className="bg-secondary border-border min-h-80 font-mono text-sm"
                readOnly
              />
            </Card>
          </div>

          <Card className="p-6 mt-6">
            <h3 className="font-semibold text-foreground mb-4">Opções de Conversão</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
                <RefreshCw className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm">Sincronizar Tempo</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
                <FileText className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm">SRT para TXT</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
                <FileText className="w-5 h-5 mb-2 text-primary" />
                <span className="text-sm">TXT para SRT</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 border-border text-foreground hover:bg-secondary flex-col">
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
