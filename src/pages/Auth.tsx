import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const Auth = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const redirect = params.get("redirect") || "/dashboard";
  const saveFlag = params.get("save");

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada", { description: "Ya puedes acceder a tu dashboard." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sesión iniciada");
      }
      const target = saveFlag ? `${redirect}?save=1` : redirect;
      nav(target, { replace: true });
    } catch (err: any) {
      toast.error("No pudimos completar la acción", { description: err.message });
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
          <div className="flex justify-center mb-6 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1.5 text-center">
            {mode === "signup" ? "Crea tu cuenta" : "Bienvenido de vuelta"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-7">
            {mode === "signup" ? "Guarda tu progreso y accede a tu dashboard" : "Continúa con tu plan migratorio"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="María García" required className="h-11" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className="h-11 pl-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required minLength={8} className="h-11 pl-10" />
              </div>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Procesando…" : mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            {mode === "signup" ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary font-medium hover:underline">
              {mode === "signup" ? "Inicia sesión" : "Crea una cuenta"}
            </button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground text-center">
            Al continuar, aceptas que la información proporcionada es orientativa y no sustituye asesoramiento jurídico individual.
          </p>
        </motion.div>
        <p className="text-center mt-6 text-sm text-muted-foreground">
          ¿Aún no hiciste el diagnóstico? <Link to="/diagnostico" className="text-primary hover:underline">Empezar ahora</Link>
        </p>
      </main>
    </div>
  );
};

export default Auth;
