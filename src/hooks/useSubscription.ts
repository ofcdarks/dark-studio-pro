import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SubscriptionData {
  subscribed: boolean;
  plan: string | null;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
}

export function useSubscription() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSubscription() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;

        setSubscription({
          subscribed: data?.subscribed || false,
          plan: data?.plan || null,
          productId: data?.product_id || null,
          priceId: data?.price_id || null,
          subscriptionEnd: data?.subscription_end || null,
        });
      } catch (err) {
        console.error("Error checking subscription:", err);
        setError(err instanceof Error ? err.message : "Failed to check subscription");
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [session?.access_token]);

  const getPlanDisplayName = (): string => {
    if (!subscription?.subscribed) return "Free";
    
    const planName = subscription.plan?.toLowerCase();
    if (planName?.includes("pro") || planName?.includes("profissional")) return "Pro";
    if (planName?.includes("expert")) return "Expert";
    if (planName?.includes("master")) return "Master";
    
    return subscription.plan || "Pro";
  };

  return {
    subscription,
    loading,
    error,
    isSubscribed: subscription?.subscribed || false,
    planName: getPlanDisplayName(),
  };
}
