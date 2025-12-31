import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, Wand2, Copy, Save, History } from "lucide-react";
import { useState } from "react";

const savedPrompts = [
  { title: "Thumbnail Mistério", prompt: "Dark mysterious ancient temple with glowing hieroglyphics..." },
  { title: "Cena Espacial", prompt: "Cinematic view of a distant galaxy with nebulas..." },
  { title: "Documento Antigo", prompt: "Aged parchment with mysterious symbols and markings..." },
];

const PromptsImages = () => {
  const [prompt, setPrompt] = useState("");

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Prompts e Imagens</h1>
            <p className="text-muted-foreground">
              Crie e gerencie prompts para geração de imagens
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Gerador de Prompts</h3>
                </div>
                <Textarea
                  placeholder="Descreva a imagem que você quer criar..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-secondary border-border min-h-32 mb-4"
                />
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Image className="w-4 h-4 mr-2" />
                    Gerar Imagem
                  </Button>
                  <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:bg-secondary">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:bg-secondary">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </Card>

              <Card className="p-6 mt-6">
                <h3 className="font-semibold text-foreground mb-4">Imagens Geradas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((_, index) => (
                    <div key={index} className="aspect-square bg-secondary rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Prompts Salvos</h3>
                </div>
                <div className="space-y-3">
                  {savedPrompts.map((item, index) => (
                    <div key={index} className="p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                      <h4 className="font-medium text-foreground text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
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

export default PromptsImages;
