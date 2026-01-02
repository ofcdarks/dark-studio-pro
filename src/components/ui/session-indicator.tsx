import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, X, RotateCcw } from "lucide-react";

interface SessionIndicatorProps {
  storageKeys: string[];
  onClear?: () => void;
  label?: string;
}

export function SessionIndicator({ storageKeys, onClear, label = "Sessão anterior" }: SessionIndicatorProps) {
  const [hasData, setHasData] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkForData = () => {
      const hasSavedData = storageKeys.some(key => {
        const value = localStorage.getItem(key);
        if (!value) return false;
        try {
          const parsed = JSON.parse(value);
          // Check if the value is meaningful (not empty string, empty array, or null)
          if (parsed === "" || parsed === null) return false;
          if (Array.isArray(parsed) && parsed.length === 0) return false;
          if (typeof parsed === "object" && Object.keys(parsed).length === 0) return false;
          return true;
        } catch {
          return value && value !== '""' && value !== "null" && value !== "[]";
        }
      });
      setHasData(hasSavedData);
    };

    checkForData();
  }, [storageKeys]);

  const handleClear = () => {
    storageKeys.forEach(key => localStorage.removeItem(key));
    setHasData(false);
    onClear?.();
  };

  if (!hasData || dismissed) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
      <History className="w-4 h-4 text-primary" />
      <span className="text-sm text-foreground">{label}</span>
      <Badge variant="secondary" className="text-xs">Dados restaurados</Badge>
      <div className="flex items-center gap-1 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={handleClear}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Limpar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
