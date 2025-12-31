import { useState, useEffect } from "react";
import { useCredits } from "@/hooks/useCredits";
import { Coins, Loader2, RefreshCw, History, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getToolInfo } from "@/lib/creditToolsMap";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CreditsDisplayProps {
  collapsed?: boolean;
  showRefresh?: boolean;
  className?: string;
}

interface CreditUsageItem {
  id: string;
  operation_type: string;
  credits_used: number;
  model_used: string | null;
  created_at: string;
  details: unknown;
}

interface CreditTransactionItem {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

type HistoryItem = {
  id: string;
  type: 'usage' | 'transaction';
  operation: string;
  amount: number;
  description: string | null;
  created_at: string;
  toolInfo: { name: string; icon: string; description: string };
};

export function CreditsDisplay({ collapsed = false, showRefresh = true, className }: CreditsDisplayProps) {
  const { balance, loading, refreshBalance } = useCredits();
  const { user } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshBalance]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);

    try {
      // Fetch both usage and transactions
      const [usageResult, transactionsResult] = await Promise.all([
        supabase
          .from('credit_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30)
      ]);

      const usageItems: HistoryItem[] = (usageResult.data || []).map((item: CreditUsageItem) => ({
        id: item.id,
        type: 'usage' as const,
        operation: item.operation_type,
        amount: -item.credits_used,
        description: item.model_used || null,
        created_at: item.created_at,
        toolInfo: getToolInfo(item.operation_type),
      }));

      const transactionItems: HistoryItem[] = (transactionsResult.data || []).map((item: CreditTransactionItem) => ({
        id: item.id,
        type: 'transaction' as const,
        operation: item.transaction_type,
        amount: item.transaction_type === 'add' ? item.amount : -item.amount,
        description: item.description,
        created_at: item.created_at,
        toolInfo: getToolInfo(item.transaction_type),
      }));

      // Combine and sort by date
      const combined = [...usageItems, ...transactionItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistoryItems(combined.slice(0, 50));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setHistoryOpen(true);
    fetchHistory();
  };

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
    <>
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Créditos</span>
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
            {loading ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin mt-1" />
            ) : (
              <p className="text-primary font-bold text-2xl">{balance.toLocaleString()}</p>
            )}
          </div>
        </div>
        
        <Button 
          variant="default" 
          size="sm" 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Comprar Créditos
        </Button>
        
        <button
          onClick={handleOpenHistory}
          className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-1"
        >
          <History className="w-3 h-3" />
          Ver Histórico
        </button>
      </div>

      {/* History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Créditos
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : historyItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico encontrado
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATA</TableHead>
                    <TableHead>FERRAMENTA</TableHead>
                    <TableHead>CRÉDITOS</TableHead>
                    <TableHead>DETALHES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyItems.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.toolInfo.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.toolInfo.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.toolInfo.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "flex items-center gap-1 w-fit",
                            item.amount >= 0 
                              ? "bg-success/20 text-success" 
                              : "bg-destructive/20 text-destructive"
                          )}
                        >
                          {item.amount >= 0 ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {item.amount >= 0 ? '+' : ''}{item.amount.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">
                        {item.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
