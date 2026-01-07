import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import logo from "@/assets/logo.gif";

export function InstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show prompt after a short delay if installable
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't show if installed, dismissed, or not installable
  if (isInstalled || dismissed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-6 md:max-w-sm">
      <div
        className="relative rounded-2xl p-5 backdrop-blur-xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(34, 197, 94, 0.2)",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <img src={logo} alt="La Casa Dark" className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Instalar App
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              La Casa Dark CORE
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Instale para acesso rápido e experiência completa offline
            </p>

            {/* Install button */}
            <Button
              onClick={handleInstall}
              className="w-full h-10 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
