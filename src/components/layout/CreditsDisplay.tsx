import { useCredits } from "@/hooks/useCredits";
import { Coins, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface CreditsDisplayProps {
  collapsed?: boolean;
  showRefresh?: boolean;
  className?: string;
}

export function CreditsDisplay({ collapsed = false, showRefresh = true, className }: CreditsDisplayProps) {
  const { balance, loading, refreshBalance } = useCredits();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshBalance]);

  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <Coins className="w-5 h-5 text-primary" />
          {loading && (
            <Loader2 className="w-3 h-3 text-primary absolute -top-1 -right-1 animate-spin" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Coins className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Créditos</span>
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : (
              <span className="text-primary font-semibold">{balance.toLocaleString()}</span>
            )}
            {showRefresh && !loading && (
              <button
                onClick={refreshBalance}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Atualizar créditos"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Comprar Créditos
        </Button>
      </div>
    </div>
  );
}
