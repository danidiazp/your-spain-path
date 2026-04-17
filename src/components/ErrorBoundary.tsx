import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4 shadow-elegant">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 grid place-items-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="font-display text-xl font-semibold">Algo no se cargó bien</h1>
          <p className="text-sm text-muted-foreground">
            Hemos detectado un error inesperado. Puedes recargar la página o volver al inicio.
          </p>
          {this.state.error?.message && (
            <pre className="text-[11px] text-left bg-muted/50 rounded p-2 overflow-auto max-h-32 text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" size="sm" onClick={() => { this.reset(); window.location.reload(); }}>
              <RefreshCw className="h-4 w-4" /> Recargar
            </Button>
            <Button variant="hero" size="sm" onClick={() => { this.reset(); window.location.href = "/"; }}>
              <Home className="h-4 w-4" /> Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
