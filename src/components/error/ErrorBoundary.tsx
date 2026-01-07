import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {this.props.fallbackTitle || "Algo deu errado"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {this.props.fallbackMessage || 
                  "Ocorreu um erro inesperado ao carregar esta página. Por favor, tente novamente."}
              </p>
            </div>

            {this.state.error && (
              <div className="bg-muted/50 rounded-lg p-3 text-left">
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} variant="default" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/dashboard">
                  <Home className="w-4 h-4" />
                  Ir para Dashboard
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
