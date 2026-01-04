import { Sidebar } from "./Sidebar";
import { NotificationsBell } from "./NotificationsBell";
import { StorageIndicator } from "./StorageIndicator";
import { CreditsDisplay } from "./CreditsDisplay";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {user && (
          <div className="fixed top-0 right-0 z-50 flex items-center gap-3 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
            <CreditsDisplay collapsed={false} showRefresh={false} />
            <StorageIndicator />
            <ThemeToggle />
            <NotificationsBell />
          </div>
        )}
        {/* Spacer for fixed header */}
        {user && <div className="h-16 flex-shrink-0" />}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
