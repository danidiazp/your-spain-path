// Wrapper de gating premium. Si el usuario no tiene acceso (ni trial ni suscripción)
// muestra una pantalla bloqueada explicativa con CTAs en lugar de redirigir,
// para que el usuario entienda dónde está y cómo desbloquear el dashboard.
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { Sparkles, Lock, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StartTrialButton } from "@/components/StartTrialButton";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export function RequireSubscription({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading, billing, refresh } = useSubscription();
  const location = useLocation();
  const [autoTrialChecked, setAutoTrialChecked] = useState(false);

  // Intento idempotente de activar trial sin tarjeta (1 vez) si el usuario nunca ha tenido uno.
  useEffect(() => {
    if (autoTrialChecked) return;
    if (authLoading || subLoading) return;
    if (!user) return;
    if (isActive) { setAutoTrialChecked(true); return; }
    if (billing?.trial_start) { setAutoTrialChecked(true); return; }

    (async () => {
      try {
        await supabase.rpc("start_trial_no_card" as never, { _user_id: user.id } as never);
        await refresh();
      } catch (e) {
        console.warn("[RequireSubscription] no se pudo activar trial automático", e);
      } finally {
        setAutoTrialChecked(true);
      }
    })();
  }, [authLoading, subLoading, user, isActive, billing, refresh, autoTrialChecked]);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (subLoading || !autoTrialChecked) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Sin acceso: mostrar pantalla bloqueada explicativa (no redirigir).
  if (!isActive) {
    const trialAlreadyUsed = !!billing?.trial_start;
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-14 lg:py-20 max-w-3xl">
          <div className="relative bg-card border border-border rounded-3xl p-8 lg:p-12 shadow-elegant overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-secondary border border-border grid place-items-center">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Acceso premium</p>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold">Tu dashboard te está esperando</h1>
                </div>
              </div>

              <p className="text-muted-foreground">
                {trialAlreadyUsed
                  ? "Tu prueba gratis ya finalizó. Suscríbete para mantener acceso a tu checklist documental, recordatorios y roadmap personalizado."
                  : "Activa tu prueba gratis de 7 días sin tarjeta o suscríbete para acceder a todo tu plan migratorio: checklist documental, roadmap, recordatorios y recursos oficiales."}
              </p>

              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {[
                  "Checklist documental personalizado",
                  "Roadmap por etapas con tiempos",
                  "Recordatorios con fecha límite",
                  "Recursos oficiales actualizados",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {!trialAlreadyUsed && (
                  <StartTrialButton fullWidth={false} size="lg" redirectTo={location.pathname} />
                )}
                <Button asChild variant={trialAlreadyUsed ? "hero" : "outline"} size="lg">
                  <Link to={`/precios?from=${encodeURIComponent(location.pathname)}`}>
                    {trialAlreadyUsed ? "Ver planes y suscribirme" : "Suscribirme con tarjeta"} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {trialAlreadyUsed && (
                <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  La prueba gratis sin tarjeta solo se concede una vez por usuario.
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Mientras tanto, puedes seguir explorando las{" "}
            <Link to="/rutas/estudios" className="underline">rutas migratorias</Link> y los{" "}
            <Link to="/recursos" className="underline">recursos oficiales</Link>.
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return <>{children}</>;
}
