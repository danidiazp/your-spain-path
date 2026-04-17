// Banner global que avisa al usuario logueado de los días restantes de su prueba.
// Solo aparece si el usuario tiene trial sin tarjeta vigente o trial de pago activo.
// No se muestra en /precios (donde ya hay contexto de pricing) ni en /checkout/return.
import { Link, useLocation } from "react-router-dom";
import { Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

const HIDDEN_PATHS = ["/precios", "/checkout/return", "/auth", "/forgot-password", "/reset-password"];

function daysLeft(d: Date) {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

export function TrialBanner() {
  const { user } = useAuth();
  const { accessSource, subscription, trialEnd } = useSubscription();
  const { pathname } = useLocation();

  if (!user) return null;
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  // Pago fallido: avisar siempre con CTA para gestionar
  if (subscription?.status === "past_due") {
    return (
      <div className="w-full bg-destructive/10 border-b border-destructive/30 px-4 py-2.5 text-center text-xs sm:text-sm">
        <span className="inline-flex items-center gap-2 text-destructive font-medium">
          <AlertTriangle className="h-4 w-4" />
          Tu último cobro falló. Actualiza tu método de pago para no perder acceso.
        </span>{" "}
        <Link to="/perfil" className="underline font-semibold ml-1 inline-flex items-center gap-1">
          Gestionar pago <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // Trial sin tarjeta
  if (accessSource === "trial_no_card" && trialEnd) {
    const days = daysLeft(trialEnd);
    if (days > 5) return null; // solo avisar cerca del fin
    return (
      <div className="w-full bg-accent/10 border-b border-accent/30 px-4 py-2.5 text-center text-xs sm:text-sm">
        <span className="inline-flex items-center gap-2 text-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          {days === 0
            ? "Hoy termina tu prueba gratis."
            : days === 1
            ? "Mañana termina tu prueba gratis."
            : `Tu prueba gratis termina en ${days} días.`}
        </span>{" "}
        <Link to="/precios" className="underline font-semibold ml-1 inline-flex items-center gap-1">
          Suscribirme <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // Trial con tarjeta (Stripe)
  if (accessSource === "paid" && subscription?.status === "trialing" && subscription.current_period_end) {
    const days = daysLeft(new Date(subscription.current_period_end));
    if (days > 3) return null;
    return (
      <div className="w-full bg-accent/10 border-b border-accent/30 px-4 py-2.5 text-center text-xs sm:text-sm">
        <span className="inline-flex items-center gap-2 text-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          {days === 0
            ? "Hoy se realizará tu primer cobro."
            : `En ${days} ${days === 1 ? "día" : "días"} se cobrará tu primer mes.`}
        </span>{" "}
        <Link to="/perfil" className="underline font-semibold ml-1 inline-flex items-center gap-1">
          Gestionar plan <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return null;
}
