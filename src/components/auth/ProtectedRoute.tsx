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
      // Delay mais longo para usuários novos do Google OAuth (trigger pode demorar)
      const isOAuthUser = user.app_metadata?.provider === "google";
      const initialDelay = isOAuthUser ? 1500 : 500;
      
      await new Promise(resolve => setTimeout(resolve, initialDelay));
      
      let retries = 0;
      const maxRetries = 3;
      let data = null;
      let error = null;
      
      // Retry loop para garantir que o profile foi criado
      while (retries < maxRetries) {
        const result = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .single();
          
        data = result.data;
        error = result.error;
        
        if (data) break;
        
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!error && data) {
        setUserStatus(data.status);
        
        // Se status é pending e não está na página de pending, redireciona
        if (data.status === "pending" && location.pathname !== "/pending-approval") {
          // Para usuários Google OAuth novos, enviar emails de notificação
          if (user.app_metadata?.provider === "google") {
            try {
              // Enviar email de pendente para o usuário
              await supabase.functions.invoke("send-pending-email", {
                body: { 
                  email: user.email, 
                  fullName: user.user_metadata?.full_name || user.email?.split("@")[0] 
                },
              });
              
              // Notificar admins sobre novo cadastro
              await supabase.functions.invoke("send-admin-notification", {
                body: { 
                  userEmail: user.email, 
                  userName: user.user_metadata?.full_name || user.email?.split("@")[0],
                  userWhatsapp: null 
                },
              });
            } catch (e) {
              console.error("Erro ao enviar emails de notificação:", e);
            }
          }
          
          navigate("/pending-approval", { replace: true });
          return;
        }
      } else if (error) {
        console.error("Erro ao buscar status:", error);
        // Se não encontrou o perfil após retries, pode ser um problema - aguarda mais
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: retryData } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .single();
          
        if (retryData?.status === "pending" && location.pathname !== "/pending-approval") {
          navigate("/pending-approval", { replace: true });
          return;
        }
        setUserStatus(retryData?.status || null);
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
