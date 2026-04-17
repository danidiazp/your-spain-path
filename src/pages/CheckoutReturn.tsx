import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const CheckoutReturn = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container py-20 max-w-xl text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/15 grid place-items-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-display text-3xl font-semibold">¡Tu prueba de 7 días ha comenzado!</h1>
        <p className="text-muted-foreground">
          Hemos activado tu acceso completo. No se realizará ningún cobro durante los próximos 7 días, y puedes cancelar en cualquier momento.
        </p>
        {sessionId && (
          <p className="text-xs text-muted-foreground font-mono">Ref: {sessionId.slice(0, 18)}…</p>
        )}
        <Button asChild variant="hero" size="lg">
          <Link to="/dashboard">Ir a mi dashboard <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
};

export default CheckoutReturn;
