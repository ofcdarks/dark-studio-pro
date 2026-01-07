import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkUserStatus();
    }
  }, [user, loading, navigate]);

  // Re-check when pathname changes but only if user exists and we already checked once
  useEffect(() => {
    if (user && hasCheckedRef.current && userStatus === "pending" && location.pathname !== "/pending-approval") {
      navigate("/pending-approval", { replace: true });
    }
  }, [location.pathname, user, userStatus, navigate]);

  const checkUserStatus = async () => {
    if (!user?.id) {
      setCheckingStatus(false);
      return;
    }
    
    try {
      const provider = user.app_metadata?.provider;

      // Para cadastro/login via Google: garante que o profile/role exista antes de checar status
      if (provider === "google") {
        try {
          await supabase.functions.invoke("ensure-user-profile");
          // pequena folga para o backend persistir (evita corrida)
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (e) {
          console.error("Erro ao garantir profile do Google:", e);
        }
      }

      // Delay mais longo para usuários novos do Google OAuth (trigger pode demorar)
      const isOAuthUser = provider === "google";
      const initialDelay = isOAuthUser ? 1500 : 500;

      await new Promise((resolve) => setTimeout(resolve, initialDelay));

      let retries = 0;
      const maxRetries = 3;
      let data: { status: string | null } | null = null;
      let error: any = null;

      // Retry loop para garantir que o profile foi criado
      while (retries < maxRetries) {
        const result = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        data = result.data as { status: string | null } | null;
        error = result.error;

        if (data?.status) break;

        retries++;
        if (retries < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!error && data) {
        setUserStatus(data.status);

        // Se status é pending e não está na página de pending, redireciona
        if (data.status === "pending" && location.pathname !== "/pending-approval") {
          navigate("/pending-approval", { replace: true });
          return;
        }
      } else {
        console.error("Erro ao buscar status:", error);

        // Se for Google e ainda não há profile/status, trata como pending (primeiro acesso)
        if (provider === "google" && location.pathname !== "/pending-approval") {
          setUserStatus("pending");
          navigate("/pending-approval", { replace: true });
          return;
        }

        setUserStatus(null);
      }
    } catch (e) {
      console.error("Erro ao verificar status:", e);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Se usuário está pending e tentando acessar outra rota, não renderiza
  if (userStatus === "pending" && location.pathname !== "/pending-approval") {
    return null;
  }

  return <>{children}</>;
}
