import { useQuery } from "@tanstack/react-query";
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
  | "pastas"
  | "usar_api_propria"
  | "baixar_xml"
  | "imagefx_cookies";

interface Permissions {
  [key: string]: boolean;
}

interface PermissionsData {
  permissions: Permissions;
  planName: string | null;
}

// Cache: 10 minutos (permissões mudam com plano)
const PERMISSIONS_STALE_TIME = 10 * 60 * 1000;
const PERMISSIONS_GC_TIME = 30 * 60 * 1000;

const ALL_PERMISSIONS: Permissions = {
  analisador_videos: true,
  gerador_cenas: true,
  agentes_virais: true,
  gerador_voz: true,
  prompts_imagens: true,
  biblioteca_viral: true,
  explorar_nicho: true,
  canais_monitorados: true,
  analytics_youtube: true,
  buscar_canais: true,
  analisador_canal: true,
  conversor_srt: true,
  analytics: true,
  pastas: true,
  usar_api_propria: true,
  baixar_xml: true,
  imagefx_cookies: true,
};

export function usePermissions() {
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const { data, isLoading } = useQuery({
    queryKey: ['permissions', user?.id, subscription?.priceId, subscription?.plan],
    queryFn: async (): Promise<PermissionsData> => {
      if (!user) return { permissions: {}, planName: null };

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleData?.role === "admin") {
        return { permissions: ALL_PERMISSIONS, planName: "ADMIN" };
      }

      // Determine the plan name from subscription or default to FREE
      let currentPlanName = "FREE";
      let isAnnual = false;

      // First try to get plan from Stripe price ID
      if (subscription?.priceId) {
        const { data: planData } = await supabase
          .from("plan_permissions")
          .select("plan_name, is_annual")
          .eq("stripe_price_id", subscription.priceId)
          .maybeSingle();

        if (planData) {
          currentPlanName = planData.plan_name;
          isAnnual = planData.is_annual || false;
        }
      }
      
      // If still FREE but subscription says otherwise, use the plan name from subscription
      if (currentPlanName === "FREE" && subscription?.plan && subscription.plan !== "FREE") {
        currentPlanName = subscription.plan;
        // Try to detect annual based on plan name or default to false
        isAnnual = false;
      }
      
      // If user has 'pro' role, give them full PRO permissions regardless of detected plan
      // This handles cases where Stripe subscription is not properly linked
      if (roleData?.role === "pro") {
        return {
          permissions: ALL_PERMISSIONS,
          planName: "PRO",
        };
      }

      // Fetch permissions for the current plan
      const { data: permissionsData } = await supabase
        .from("plan_permissions")
        .select("permissions")
        .eq("plan_name", currentPlanName)
        .eq("is_annual", isAnnual)
        .maybeSingle();

      // If no permissions found for exact match, try without annual filter
      if (!permissionsData) {
        const { data: fallbackData } = await supabase
          .from("plan_permissions")
          .select("permissions")
          .eq("plan_name", currentPlanName)
          .limit(1)
          .maybeSingle();
        
        return {
          permissions: (fallbackData?.permissions as Permissions) || {},
          planName: currentPlanName,
        };
      }

      return {
        permissions: (permissionsData?.permissions as Permissions) || {},
        planName: currentPlanName,
      };
    },
    enabled: !!user && !subscriptionLoading,
    staleTime: PERMISSIONS_STALE_TIME,
    gcTime: PERMISSIONS_GC_TIME,
  });

  const hasPermission = (key: PermissionKey): boolean => {
    return data?.permissions?.[key] === true;
  };

  return {
    permissions: data?.permissions || {},
    loading: isLoading || subscriptionLoading,
    hasPermission,
    planName: data?.planName || null,
  };
}
