import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Rocket } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      richColors={false}
      closeButton={false}
      icons={{
        success: <CheckCircle2 className="w-5 h-5 text-success" />,
        error: <AlertCircle className="w-5 h-5 text-destructive" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-primary" />,
        loading: <Rocket className="w-5 h-5 text-primary animate-pulse" />,
      }}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-primary/40 group-[.toaster]:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(245,158,11,0.15)] group-[.toaster]:rounded-xl group-[.toaster]:px-5 group-[.toaster]:py-4 group-[.toaster]:min-w-[320px] group-[.toaster]:max-w-[420px]",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold group-[.toast]:text-base",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80",
          success: "group-[.toaster]:border-success/50 group-[.toaster]:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(34,197,94,0.2)]",
          error: "group-[.toaster]:border-destructive/50 group-[.toaster]:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(239,68,68,0.2)]",
          warning: "group-[.toaster]:border-primary/50 group-[.toaster]:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(245,158,11,0.25)]",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.2)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
