import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, User, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { Logo } from "@/components/Logo";
import { PasswordRequirements, isPasswordValid } from "@/components/PasswordRequirements";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Guardamos tu progreso de forma segura" },
  { icon: Sparkles, text: "Retoma tu plan cuando quieras" },
  { icon: Mail, text: "La verificación protege tu acceso y recuperación" },
];

const Auth = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const redirect = params.get("redirect") || "/dashboard";
  const saveFlag = params.get("save");
  const initialMode = params.get("mode") === "signin" ? "signin" : "signup";

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !isPasswordValid(password)) {
      toast.error("La contraseña no cumple los requisitos mínimos");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        track("signup_started");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;

        // Si Supabase requiere verificación, no hay sesión inmediata.
        // Mostramos el estado "revisa tu correo".
        if (!data.session) {
          track("email_verification_sent");
          setSignupSent(true);
          return;
        }
        track("signup_completed");
        toast.success("Cuenta creada");
        const target = saveFlag ? `${redirect}?save=1` : redirect;
        nav(target, { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        track("signin_completed");
        toast.success("Sesión iniciada");
        const target = saveFlag ? `${redirect}?save=1` : redirect;
        nav(target, { replace: true });
      }
    } catch (err: any) {
      const msg =
        err.message?.includes("Invalid login")
          ? "Email o contraseña incorrectos"
          : err.message?.includes("already registered")
          ? "Este email ya tiene cuenta. Inicia sesión."
          : err.message;
      toast.error("No pudimos completar la acción", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Email reenviado");
    } catch (err: any) {
      toast.error("No pudimos reenviar el email", { description: err.message });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <SiteHeader />
      <main className="flex-1 container max-w-5xl py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Columna izquierda: confianza */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block space-y-6"
          >
            <Logo />
            <h2 className="font-display text-3xl xl:text-4xl font-semibold leading-tight tracking-tight text-balance">
              Tu plan migratorio,{" "}
              <span className="text-primary">guardado y siempre disponible</span>
            </h2>
            <p className="text-muted-foreground text-pretty">
              Crea una cuenta gratuita para guardar tu diagnóstico, seguir tu progreso documental y
              acceder a tu dashboard desde cualquier dispositivo.
            </p>
            <ul className="space-y-3 pt-2">
              {TRUST_POINTS.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 shrink-0 rounded-xl bg-secondary border border-border grid place-items-center">
                    <p.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground pt-1.5">{p.text}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              Información orientativa. No sustituye asesoramiento jurídico individual.
            </p>
          </motion.div>

          {/* Columna derecha: formulario */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-border rounded-3xl p-8 shadow-premium"
          >
            <div className="flex justify-center mb-6 lg:hidden">
              <Logo />
            </div>

            {signupSent ? (
              <div className="text-center space-y-4 py-2">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-success/10 grid place-items-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <h1 className="font-display text-2xl font-semibold">Revisa tu correo</h1>
                <p className="text-sm text-muted-foreground">
                  Te enviamos un enlace de verificación a{" "}
                  <span className="font-medium text-foreground">{email}</span>. Confirma tu cuenta para
                  acceder a tu dashboard.
                </p>
                <p className="text-xs text-muted-foreground">
                  ¿No lo ves? Revisa tu carpeta de spam.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button onClick={resend} variant="outline" disabled={resending}>
                    {resending ? "Reenviando…" : "Reenviar email de verificación"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSignupSent(false);
                      setMode("signin");
                    }}
                  >
                    Ya verifiqué — iniciar sesión
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-1.5 text-center">
                  {mode === "signup" ? "Crea tu cuenta" : "Bienvenido de vuelta"}
                </h1>
                <p className="text-sm text-muted-foreground text-center mb-7">
                  {mode === "signup"
                    ? "Guarda tu progreso y accede a tu dashboard"
                    : "Continúa con tu plan migratorio"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {mode === "signup" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="María García"
                          required
                          className="h-11 pl-10"
                          autoComplete="name"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
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
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Contraseña</Label>
                      {mode === "signin" && (
                        <Link
                          to="/forgot-password"
                          className="text-xs text-primary hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPwd ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === "signup" ? "Crea una contraseña segura" : "Tu contraseña"}
                        required
                        minLength={mode === "signup" ? 8 : undefined}
                        className="h-11 pl-10 pr-10"
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === "signup" && password.length > 0 && (
                      <PasswordRequirements password={password} />
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={loading || (mode === "signup" && !isPasswordValid(password))}
                  >
                    {loading ? "Procesando…" : mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
                  {mode === "signup" ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                    className="text-primary font-medium hover:underline"
                  >
                    {mode === "signup" ? "Inicia sesión" : "Crea una cuenta"}
                  </button>
                </div>
                <p className="mt-5 text-xs text-muted-foreground text-center">
                  Al continuar, aceptas que la información proporcionada es orientativa y no sustituye
                  asesoramiento jurídico individual.
                </p>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Auth;
