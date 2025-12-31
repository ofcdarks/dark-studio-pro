import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface CreditUsage {
  id: string;
  operation_type: string;
  credits_used: number;
  model_used: string | null;
  created_at: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [usage, setUsage] = useState<CreditUsage[]>([]);

  const fetchBalance = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Se não existir, criar com 50 créditos (FREE plan)
      if (!data) {
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({ user_id: user.id, balance: 50 });
        
        if (!insertError) {
          setBalance(50);
        }
      } else {
        setBalance(Math.ceil(data.balance));
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (limit = 20) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchUsage = async (limit = 20) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setUsage(data || []);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const refreshBalance = () => {
    fetchBalance();
  };

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  return {
    balance,
    loading,
    transactions,
    usage,
    refreshBalance,
    fetchTransactions,
    fetchUsage,
  };
};
