import { BookOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DailyQuoteCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Palavra do Dia</h3>
      </div>
      <div className="bg-secondary/50 rounded-lg p-4">
        <p className="text-foreground italic leading-relaxed mb-3">
          "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus."
        </p>
        <div className="flex items-center justify-between">
          <span className="text-primary font-medium text-sm">Filipenses 4:7</span>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
