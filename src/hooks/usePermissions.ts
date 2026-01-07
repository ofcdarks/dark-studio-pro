import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export type PermissionKey =
  | "analisador_videos"
  | "gerador_cenas"
  | "agentes_virais"
  | "gerador_voz"
  | "prompts_imagens"
  | "biblioteca_viral"
  | "explorar_nicho"
  | "canais_monitorados"
  | "analytics_youtube"
  | "buscar_canais"
  | "analisador_canal"
  | "conversor_srt"
  | "analytics"
  | "pastas";

interface Permissions {
  [key: string]: boolean;
}

interface UsePermissionsReturn {
  permissions: Permissions;
  loading: boolean;
  hasPermission: (key: PermissionKey) => boolean;
  planName: string | null;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    if (!user || subscriptionLoading) return;

    const fetchPermissions = async () => {
      try {
        // Determine the plan name from subscription or default to FREE
        let currentPlanName = "FREE";
        let isAnnual = false;

        if (subscription?.priceId) {
          // Fetch plan name from plan_permissions using priceId
          const { data: planData } = await supabase
            .from("plan_permissions")
            .select("plan_name, is_annual")
            .eq("stripe_price_id", subscription.priceId)
            .single();

          if (planData) {
            currentPlanName = planData.plan_name;
            isAnnual = planData.is_annual || false;
          }
        }

        setPlanName(currentPlanName);

        // Fetch permissions for the current plan
        const { data: permissionsData, error } = await supabase
          .from("plan_permissions")
          .select("permissions")
          .eq("plan_name", currentPlanName)
          .eq("is_annual", isAnnual)
          .single();

        if (error) {
          console.error("Error fetching permissions:", error);
          // Default to empty permissions on error
          setPermissions({});
        } else if (permissionsData?.permissions) {
          setPermissions(permissionsData.permissions as Permissions);
        }
      } catch (error) {
        console.error("Error in fetchPermissions:", error);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user, subscription, subscriptionLoading]);

  const hasPermission = (key: PermissionKey): boolean => {
    return permissions[key] === true;
  };

  return {
    permissions,
    loading: loading || subscriptionLoading,
    hasPermission,
    planName,
  };
}
