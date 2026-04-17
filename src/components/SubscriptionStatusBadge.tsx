// Píldora compacta que muestra el estado de la suscripción del usuario.
// Pensada para el header y otros lugares donde haga falta dar contexto rápido.
import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

function daysUntil(d: Date): number {
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000));
}

interface Props {
  /** Si true, envuelve el badge en un Link a /perfil */
  asLink?: boolean;
  /** Si true, oculta el badge cuando no hay user (en vez de mostrar "Sin plan") */
  hideWhenAnonymous?: boolean;
}

export function SubscriptionStatusBadge({ asLink = true, hideWhenAnonymous = true }: Props) {
  const { user } = useAuth();
  const { loading, accessSource, subscription, trialEnd } = useSubscription();

  if (loading) return null;
  if (!user && hideWhenAnonymous) return null;

  let content: { label: string; icon: JSX.Element; className: string } | null = null;

  if (!user) {
    content = {
      label: "Sin cuenta",
      icon: <AlertCircle className="h-3 w-3" />,
      className: "border-border bg-secondary text-muted-foreground",
    };
  } else if (accessSource === "paid" && subscription) {
    const willCancel = subscription.cancel_at_period_end;
    if (subscription.status === "past_due") {
      content = {
        label: "Pago pendiente",
        icon: <CreditCard className="h-3 w-3" />,
        className: "border-destructive/30 bg-destructive/10 text-destructive",
      };
    } else if (willCancel) {
      content = {
        label: "Cancela pronto",
        icon: <AlertCircle className="h-3 w-3" />,
        className: "border-warning/30 bg-warning/10 text-warning",
      };
    } else if (subscription.status === "trialing") {
      const days = subscription.current_period_end ? daysUntil(new Date(subscription.current_period_end)) : null;
      content = {
        label: days != null ? `Trial · ${days}d` : "En prueba",
        icon: <Sparkles className="h-3 w-3" />,
        className: "border-accent/30 bg-accent/10 text-accent-foreground",
      };
    } else {
      content = {
        label: "Plan activo",
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "border-success/30 bg-success/10 text-success",
      };
    }
  } else if (accessSource === "trial_no_card" && trialEnd) {
    const days = daysUntil(trialEnd);
    content = {
      label: `Prueba · ${days}d`,
      icon: <Sparkles className="h-3 w-3" />,
      className: "border-accent/30 bg-accent/10 text-accent-foreground",
    };
  } else {
    content = {
      label: "Sin plan",
      icon: <AlertCircle className="h-3 w-3" />,
      className: "border-border bg-secondary text-muted-foreground",
    };
  }

  const badge = (
    <Badge
      variant="outline"
      className={`gap-1 px-2.5 py-1 text-[11px] font-medium ${content.className}`}
    >
      {content.icon}
      {content.label}
    </Badge>
  );

  if (!asLink) return badge;
  return (
    <Link to="/perfil" aria-label="Ver detalles de tu plan">
      {badge}
    </Link>
  );
}
