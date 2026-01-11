import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Plan limits for viral detection
const PLAN_LIMITS = {
  free: 1,
  pro: 5, // Start Creator
  turbo: 10, // Turbo Maker
  master: null, // Master Pro - unlimited
  admin: null, // Admin - unlimited
} as const;

interface UsageData {
  currentCount: number;
  dailyLimit: number | null;
  remaining: number | null;
  canUse: boolean;
}

export function useViralDetectionUsage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's role to determine plan
  const { data: userRole } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data?.role as string;
    },
    enabled: !!user,
  });

  // Fetch user's subscription to determine specific plan tier
  const { data: subscription } = useQuery({
    queryKey: ["user-subscription-tier", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Determine limit based on role and subscription
  const getDailyLimit = (): number | null => {
    if (!userRole) return PLAN_LIMITS.free;
    
    if (userRole === "admin") return PLAN_LIMITS.admin;
    
    if (userRole === "pro") {
      // Check specific plan tier from subscription
      const planName = subscription?.plan_name?.toLowerCase() || "";
      
      if (planName.includes("master")) return PLAN_LIMITS.master;
      if (planName.includes("turbo")) return PLAN_LIMITS.turbo;
      if (planName.includes("start")) return PLAN_LIMITS.pro;
      
      // Default pro to start creator limits
      return PLAN_LIMITS.pro;
    }
    
    return PLAN_LIMITS.free;
  };

  // Fetch current usage for today
  const { data: usage, isLoading } = useQuery({
    queryKey: ["viral-detection-usage", user?.id],
    queryFn: async (): Promise<UsageData> => {
      if (!user) {
        return { currentCount: 0, dailyLimit: 1, remaining: 1, canUse: true };
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("viral_detection_usage")
        .select("usage_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();
      
      if (error) throw error;
      
      const currentCount = data?.usage_count || 0;
      const dailyLimit = getDailyLimit();
      const remaining = dailyLimit !== null ? Math.max(0, dailyLimit - currentCount) : null;
      const canUse = dailyLimit === null || currentCount < dailyLimit;
      
      return { currentCount, dailyLimit, remaining, canUse };
    },
    enabled: !!user,
  });

  // Increment usage mutation
  const incrementUsage = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const today = new Date().toISOString().split('T')[0];
      const dailyLimit = getDailyLimit();
      
      // Check if already at limit
      if (dailyLimit !== null && usage && usage.currentCount >= dailyLimit) {
        throw new Error(`Você atingiu o limite de ${dailyLimit} verificação(ões) por dia`);
      }

      // Upsert usage record
      const { data: existingUsage } = await supabase
        .from("viral_detection_usage")
        .select("id, usage_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (existingUsage) {
        const { error } = await supabase
          .from("viral_detection_usage")
          .update({ 
            usage_count: existingUsage.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq("id", existingUsage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("viral_detection_usage")
          .insert({
            user_id: user.id,
            usage_date: today,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral-detection-usage"] });
    },
  });

  return {
    usage: usage || { currentCount: 0, dailyLimit: 1, remaining: 1, canUse: true },
    isLoading,
    incrementUsage,
    getDailyLimit,
    userRole,
    isPaidPlan: userRole === "pro" || userRole === "admin",
  };
}
