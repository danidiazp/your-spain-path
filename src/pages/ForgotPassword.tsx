import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      track("password_reset_requested");
      setSent(true);
    } catch (err: any) {
      toast.error("No pudimos enviar el email", { description: err.message });
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
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-success/10 grid place-items-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <h1 className="font-display text-2xl font-semibold">Revisa tu correo</h1>
              <p className="text-sm text-muted-foreground">
                Si existe una cuenta asociada a <span className="font-medium text-foreground">{email}</span>,
                recibirás un enlace para crear una nueva contraseña.
              </p>
              <p className="text-xs text-muted-foreground">
                ¿No lo ves? Revisa tu carpeta de spam o intenta de nuevo en unos minutos.
              </p>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link to="/auth">Volver al login</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1.5 text-center">
                Recuperar contraseña
              </h1>
              <p className="text-sm text-muted-foreground text-center mb-7">
                Te enviaremos un enlace seguro para crear una nueva.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email de tu cuenta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar enlace de recuperación"}
                </Button>
              </form>
              <Link
                to="/auth"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver al login
              </Link>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ForgotPassword;
