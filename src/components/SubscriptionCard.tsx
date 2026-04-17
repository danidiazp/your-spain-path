// Tarjeta de "Tu suscripción" para /perfil. Muestra estado, fecha de renovación/fin
// y botones para gestionar (portal Stripe) o iniciar trial sin tarjeta.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, CreditCard, Sparkles, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "Prueba gratis",
  trialing_no_card: "Prueba gratis (sin tarjeta)",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  unpaid: "Impago",
  incomplete: "Pago incompleto",
};

function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export function SubscriptionCard() {
  const { subscription, billing, accessSource, isActive, hasNoCardTrial, trialEnd, loading } = useSubscription();
  const [opening, setOpening] = useState(false);

  const openPortal = async () => {
    setOpening(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/perfil` },
      });
      if (error || !data?.url) throw new Error(error?.message || "No se pudo abrir el portal");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error("No pudimos abrir el portal", { description: e.message });
    } finally {
      setOpening(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando tu suscripción…
      </div>
    );
  }

  // Caso 1: suscripción de pago real
  if (accessSource === "paid" && subscription) {
    const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const willCancel = subscription.cancel_at_period_end;
    return (
      <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-elegant space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Tu suscripción</p>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" /> Plan Ruta a España
            </h2>
          </div>
          <Badge variant="outline" className={willCancel ? "border-warning/30 bg-warning/10 text-warning" : "border-success/30 bg-success/10 text-success"}>
            {willCancel ? "Cancela al final del periodo" : STATUS_LABEL[subscription.status] ?? subscription.status}
          </Badge>
        </div>

        {periodEnd && (
          <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
            {willCancel ? (
              <p>Tienes acceso completo hasta el <strong>{formatDate(periodEnd)}</strong>. Después no se renovará y perderás acceso a tu dashboard.</p>
            ) : subscription.status === "trialing" ? (
              <p>Tu prueba gratis termina el <strong>{formatDate(periodEnd)}</strong>. Después se cobrará automáticamente tu plan mensual.</p>
            ) : (
              <p>Próxima renovación: <strong>{formatDate(periodEnd)}</strong>.</p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={openPortal} disabled={opening} variant="hero" size="sm">
            {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Gestionar suscripción <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <p className="text-xs text-muted-foreground self-center">
            Cancela, cambia de plan o actualiza tu tarjeta desde el portal seguro de Stripe.
          </p>
        </div>
      </div>
    );
  }

  // Caso 2: trial sin tarjeta activo
  if (hasNoCardTrial && trialEnd) {
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000));
    return (
      <div className="bg-gradient-hero border border-primary/20 rounded-3xl p-6 lg:p-8 shadow-elegant space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Tu suscripción</p>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" /> Prueba gratis activa
            </h2>
          </div>
          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent-foreground">
            {daysLeft} {daysLeft === 1 ? "día restante" : "días restantes"}
          </Badge>
        </div>
        <div className="rounded-2xl bg-card/60 backdrop-blur p-4 text-sm">
          Tu prueba sin tarjeta termina el <strong>{formatDate(trialEnd)}</strong>. Para mantener el acceso, suscríbete antes de esa fecha.
        </div>
        <Button asChild variant="hero" size="sm">
          <Link to="/precios">Ver planes y suscribirme</Link>
        </Button>
      </div>
    );
  }

  // Caso 3: sin acceso (ni trial ni suscripción)
  return (
    <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">Tu suscripción</p>
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-muted-foreground" /> Sin plan activo
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Activa 7 días gratis sin tarjeta o suscríbete para acceder a tu dashboard, checklist documental y recordatorios.
      </p>
      <Button asChild variant="hero" size="sm">
        <Link to="/precios">Ver planes</Link>
      </Button>
    </div>
  );
}
