import { useState, useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationsBell } from "./NotificationsBell";
import { StorageIndicator } from "./StorageIndicator";
import { CreditsDisplay } from "./CreditsDisplay";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {user && (
          <div 
            className={cn(
              "fixed top-0 right-0 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-l from-background via-background/95 to-transparent transition-all duration-300",
              headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
            )}
          >
            <CreditsDisplay collapsed={false} showRefresh={false} />
            <StorageIndicator />
            <ThemeToggle />
            <NotificationsBell />
          </div>
        )}
        {/* Spacer for fixed header */}
        {user && <div className="h-16 flex-shrink-0" />}
        <div ref={mainRef} className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
