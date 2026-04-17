import { useState } from "react";
import { Mail, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Banner suave que se muestra dentro del dashboard cuando el email
 * no está verificado. No bloquea la experiencia, solo informa y
 * permite reenviar el email de verificación.
 */
export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || dismissed) return null;
  // En Supabase, email_confirmed_at se rellena al verificar.
  if (user.email_confirmed_at) return null;

  const resend = async () => {
    if (!user.email) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Email reenviado", {
        description: "Revisa tu bandeja de entrada y la carpeta de spam.",
      });
    } catch (err: any) {
      toast.error("No pudimos reenviar el email", { description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1">
        <div className="h-9 w-9 rounded-xl bg-warning/15 grid place-items-center shrink-0">
          <Mail className="h-4 w-4 text-warning" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Verifica tu email para proteger tu cuenta
          </p>
          <p className="text-xs text-muted-foreground">
            Te enviamos un enlace a <span className="font-medium">{user.email}</span>. La verificación
            protege tu acceso y la recuperación de contraseña.
          </p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button size="sm" variant="outline" onClick={resend} disabled={sending}>
          {sending ? "Enviando…" : "Reenviar email"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)} aria-label="Cerrar">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
