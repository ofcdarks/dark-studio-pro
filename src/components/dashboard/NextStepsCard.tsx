import { Rocket, Video, Settings, BarChart3 } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Video,
    text: "Analise seu primeiro vídeo viral usando o Analisador de Vídeos",
  },
  {
    number: 2,
    icon: Settings,
    text: "Configure suas chaves de API (Gemini, Claude, OpenAI) nas Configurações",
  },
  {
    number: 3,
    icon: BarChart3,
    text: "Acompanhe o desempenho dos seus vídeos na seção Analytics",
  },
];

export function NextStepsCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Rocket className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Próximos Passos</h3>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex items-center gap-4 p-3 bg-secondary/50 rounded-lg"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              {step.number}
            </div>
            <step.icon className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
