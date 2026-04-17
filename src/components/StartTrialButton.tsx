// Botón que activa 7 días gratis sin tarjeta llamando a la función RPC start_trial_no_card.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  redirectTo?: string;
  variant?: "hero" | "outline" | "soft" | "accent";
  fullWidth?: boolean;
  size?: "sm" | "lg" | "default";
  label?: string;
}

export function StartTrialButton({
  redirectTo = "/dashboard",
  variant = "hero",
  fullWidth = false,
  size = "lg",
  label = "Empezar 7 días gratis sin tarjeta",
}: Props) {
  const { user } = useAuth();
  const { refresh } = useSubscription();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (!user) {
      nav(`/auth?redirect=${encodeURIComponent("/precios")}&trial=1`);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("start_trial_no_card" as never, { _user_id: user.id } as never);
      if (error) throw error;
      const result = data as { ok: boolean; error?: string; trial_end?: string; already_active?: boolean };
      if (!result.ok) {
        if (result.error === "trial_already_used") {
          toast.error("Ya usaste tu prueba gratis", { description: "Suscríbete para seguir teniendo acceso." });
        } else if (result.error === "has_paid_subscription") {
          toast.info("Ya tienes una suscripción activa");
          nav(redirectTo);
        } else {
          toast.error("No pudimos activar tu prueba", { description: result.error });
        }
        return;
      }
      await refresh();
      toast.success(result.already_active ? "Tu prueba sigue activa" : "¡7 días de acceso completo activados!");
      nav(redirectTo);
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={start}
      disabled={loading}
      variant={variant}
      size={size}
      className={fullWidth ? "w-full" : undefined}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </Button>
  );
}
