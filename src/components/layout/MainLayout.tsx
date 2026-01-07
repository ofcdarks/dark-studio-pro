import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationsBell } from "./NotificationsBell";
import { StorageIndicator } from "./StorageIndicator";
import { CreditsDisplay } from "./CreditsDisplay";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAdminPushNotifications } from "@/hooks/useAdminPushNotifications";
import { RequireWhatsAppModal } from "@/components/auth/RequireWhatsAppModal";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerHovered, setHeaderHovered] = useState(false);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Enable push notifications for admins
  useAdminPushNotifications();

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;
      
      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // Hide header when scrolling down
        setHeaderVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  const showHeader = headerVisible || headerHovered;
  const showWhatsAppModal = user && !profileLoading && profile && !profile.whatsapp;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {user && (
          <>
            {/* Invisible hover zone at top */}
            <div 
              className="fixed top-0 right-0 h-4 w-96 z-40"
              onMouseEnter={() => setHeaderHovered(true)}
              onMouseLeave={() => setHeaderHovered(false)}
            />
            <div 
              className={cn(
                "fixed top-0 right-0 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-l from-background via-background/95 to-transparent transition-all duration-300",
                showHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
              )}
              onMouseEnter={() => setHeaderHovered(true)}
              onMouseLeave={() => setHeaderHovered(false)}
            >
              <CreditsDisplay collapsed={false} showRefresh={false} />
              <StorageIndicator />
              <ThemeToggle />
              <NotificationsBell />
            </div>
          </>
        )}
        {/* Spacer for fixed header */}
        {user && <div className="h-16 flex-shrink-0" />}
        <div ref={mainRef} className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* WhatsApp Required Modal */}
      {showWhatsAppModal && (
        <RequireWhatsAppModal
          open={true}
          userId={user.id}
          onComplete={refetch}
        />
      )}
    </div>
  );
}
