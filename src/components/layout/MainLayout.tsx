import { Sidebar } from "./Sidebar";
import { NotificationsBell } from "./NotificationsBell";
import { StorageIndicator } from "./StorageIndicator";
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
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <StorageIndicator />
            <ThemeToggle />
            <NotificationsBell />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
