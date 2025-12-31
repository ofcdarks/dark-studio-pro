import { Lightbulb, Sparkles } from "lucide-react";

export function DirectivesCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Diretivas</h3>
      </div>
      <div className="bg-secondary/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground mb-2">
              Comece Sua Jornada Viral
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você ainda não analisou nenhum vídeo. Use o Analisador de Vídeos para descobrir os segredos por trás de vídeos que geraram milhões de views. Analise pelo menos 5-10 vídeos virais do seu nicho para entender os padrões de sucesso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
