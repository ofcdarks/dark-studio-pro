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
    queryKey: ['permissions', user?.id, subscription?.priceId],
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

      // Fetch permissions for the current plan
      const { data: permissionsData } = await supabase
        .from("plan_permissions")
        .select("permissions")
        .eq("plan_name", currentPlanName)
        .eq("is_annual", isAnnual)
        .maybeSingle();

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
