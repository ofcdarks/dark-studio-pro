import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Mic, Play, Download, Pause, Volume2 } from "lucide-react";
import { useState } from "react";

const voices = [
  { id: "roger", name: "Roger - Masculino" },
  { id: "sarah", name: "Sarah - Feminino" },
  { id: "charlie", name: "Charlie - Masculino" },
  { id: "laura", name: "Laura - Feminino" },
  { id: "george", name: "George - Masculino" },
];

const VoiceGenerator = () => {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speed, setSpeed] = useState([1]);

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Voz</h1>
            <p className="text-muted-foreground">
              Converta texto em áudio com vozes realistas
            </p>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Texto para Áudio</h3>
            </div>
            <Textarea
              placeholder="Digite ou cole o texto que deseja converter em áudio..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-secondary border-border min-h-40 mb-4"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Voz</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Velocidade: {speed[0]}x
                </label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="mt-4"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                <Play className="w-4 h-4 mr-2" />
                Gerar Áudio
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Áudios Gerados</h3>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                  <Button variant="ghost" size="icon" className="text-primary">
                    <Play className="w-5 h-5" />
                  </Button>
                  <div className="flex-1">
                    <div className="h-2 bg-secondary rounded-full">
                      <div className="h-full w-1/3 bg-primary rounded-full" />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">0:00 / 1:23</span>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default VoiceGenerator;
