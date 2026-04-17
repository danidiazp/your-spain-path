// Página de retorno tras Stripe Checkout. Refresca la suscripción del usuario
// (los webhooks pueden tardar 1–5 segundos) y muestra el estado real:
// trial activo / acceso completo / aún propagándose.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSubscription } from "@/hooks/useSubscription";

const MAX_POLLS = 6; // ~12s
const POLL_INTERVAL_MS = 2000;

function formatDate(d: Date) {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

const CheckoutReturn = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { subscription, accessSource, isActive, refresh, loading } = useSubscription();
  const [polls, setPolls] = useState(0);
  const [waiting, setWaiting] = useState(true);

  // Polling para esperar a que el webhook procese la suscripción
  useEffect(() => {
    if (isActive && accessSource === "paid") {
      setWaiting(false);
      return;
    }
    if (polls >= MAX_POLLS) {
      setWaiting(false);
      return;
    }
    const t = setTimeout(async () => {
      await refresh();
      setPolls((p) => p + 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [polls, isActive, accessSource, refresh]);

  const isStripeTrial = subscription?.status === "trialing";
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const ready = isActive && accessSource === "paid";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container py-20 max-w-xl text-center space-y-6">
        {(loading || waiting) && !ready ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-secondary grid place-items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Confirmando tu pago…</h1>
            <p className="text-muted-foreground">
              Estamos activando tu acceso. Esto suele tardar solo unos segundos.
            </p>
          </>
        ) : ready ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-success/15 grid place-items-center">
              {isStripeTrial ? <Sparkles className="h-8 w-8 text-accent" /> : <CheckCircle2 className="h-8 w-8 text-success" />}
            </div>
            <h1 className="font-display text-3xl font-semibold">
              {isStripeTrial ? "¡Tu prueba de 7 días está activa!" : "¡Suscripción activada!"}
            </h1>
            <p className="text-muted-foreground">
              Hemos activado tu acceso completo a tu dashboard, checklist y recordatorios.
            </p>
            {periodEnd && (
              <div className="rounded-2xl bg-secondary/60 border border-border p-4 text-sm text-left max-w-sm mx-auto">
                {isStripeTrial ? (
                  <p>
                    <span className="text-muted-foreground">Primer cobro: </span>
                    <strong>{formatDate(periodEnd)}</strong>. Cancela cuando quieras antes de esa fecha.
                  </p>
                ) : (
                  <p>
                    <span className="text-muted-foreground">Próxima renovación: </span>
                    <strong>{formatDate(periodEnd)}</strong>.
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="hero" size="lg">
                <Link to="/dashboard">Ir a mi dashboard <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/perfil">Ver mi suscripción</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-warning/15 grid place-items-center">
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Tu pago se está procesando</h1>
            <p className="text-muted-foreground">
              Stripe ya tiene tu confirmación, pero la activación puede tardar un par de minutos. Puedes ir a tu dashboard
              o revisar tu perfil más tarde.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="hero" size="lg">
                <Link to="/dashboard">Ir a mi dashboard <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button onClick={() => { setPolls(0); setWaiting(true); }} variant="outline" size="lg">
                Comprobar de nuevo
              </Button>
            </div>
          </>
        )}
        {sessionId && (
          <p className="text-[11px] text-muted-foreground font-mono opacity-70">Ref: {sessionId.slice(0, 18)}…</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default CheckoutReturn;
