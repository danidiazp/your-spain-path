import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { PasswordRequirements, isPasswordValid } from "@/components/PasswordRequirements";
import { toast } from "sonner";

const ResetPassword = () => {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase abre la sesión de recovery automáticamente al volver del email
    // (PASSWORD_RECOVERY event). Esperamos a que esté lista para mostrar el form.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Si ya hay sesión activa (volvió y recargó), permitir igualmente
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      toast.error("La contraseña no cumple los requisitos");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Contraseña actualizada", {
        description: "Inicia sesión con tu nueva contraseña.",
      });
      await supabase.auth.signOut();
      nav("/auth", { replace: true });
    } catch (err: any) {
      toast.error("No pudimos actualizar la contraseña", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <SiteHeader />
      <main className="flex-1 container max-w-md py-10 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-premium"
        >
          <div className="flex justify-center mb-5">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 grid place-items-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1.5 text-center">
            Crea una nueva contraseña
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-7">
            Elige una contraseña segura para proteger tu cuenta.
          </p>

          {!ready ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              Validando enlace de recuperación…
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordRequirements password={password} />
              </div>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading || !isPasswordValid(password)}
              >
                {loading ? "Actualizando…" : "Actualizar contraseña"}
              </Button>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;
