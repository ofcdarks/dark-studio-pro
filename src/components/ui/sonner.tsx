import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-primary/50 group-[.toaster]:shadow-[0_0_30px_rgba(245,158,11,0.15)] group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-success/50 group-[.toaster]:shadow-[0_0_30px_rgba(34,197,94,0.2)]",
          error: "group-[.toaster]:border-destructive/50 group-[.toaster]:shadow-[0_0_30px_rgba(239,68,68,0.2)]",
          warning: "group-[.toaster]:border-amber-500/50 group-[.toaster]:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:shadow-[0_0_30px_rgba(59,130,246,0.2)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
