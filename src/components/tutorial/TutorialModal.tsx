import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Rocket, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TutorialStep } from "@/hooks/useTutorial";

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  steps: TutorialStep[];
  onComplete: () => void;
}

export function TutorialModal({
  open,
  onOpenChange,
  title,
  description,
  steps,
  onComplete,
}: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    setCurrentStep(0);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-amber-500/20 bg-gradient-to-br from-background via-background to-amber-950/10">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-border/50">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
              <Rocket className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Passo {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="text-5xl mb-4">{step.icon || "📚"}</div>
            
            {/* Title */}
            <h3 className="text-xl font-semibold text-foreground">
              {step.title}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {step.description}
            </p>
            
            {/* Image placeholder */}
            {step.image && (
              <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
                <img src={step.image} alt={step.title} className="rounded-lg max-h-48 mx-auto" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          <div className="flex gap-1.5">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentStep
                    ? "bg-amber-500 w-4"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={handleNext}
            className={cn(
              currentStep === steps.length - 1
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                : ""
            )}
          >
            {currentStep === steps.length - 1 ? (
              <>
                Começar!
                <Rocket className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Button to reopen tutorial
export function TutorialHelpButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("h-8 px-2 text-muted-foreground hover:text-amber-500", className)}
    >
      <HelpCircle className="w-4 h-4 mr-1" />
      <span className="text-xs">Tutorial</span>
    </Button>
  );
}
