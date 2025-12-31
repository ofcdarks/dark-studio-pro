import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useStorage = () => {
  const { user } = useAuth();
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [storageLimit, setStorageLimit] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const fetchStorage = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('storage_used, storage_limit')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setStorageUsed(data.storage_used || 0);
        setStorageLimit(data.storage_limit || 1);
      }
    } catch (error) {
      console.error('Error fetching storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStorage = () => {
    fetchStorage();
  };

  useEffect(() => {
    if (user) {
      fetchStorage();
    }
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStorage();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const usagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  return {
    storageUsed,
    storageLimit,
    usagePercent,
    loading,
    refreshStorage,
  };
};
