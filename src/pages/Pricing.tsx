// Página de selección de plan + checkout embebido.
// Diseñada para NUNCA quedarse en blanco: cada bloque tiene fallback de error.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Globe, Sparkles, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getCountryFlag, getCountryName } from "@/lib/countries";
import { TIER_PRICE_ID, getPricingForCountry, convertEurTo, formatLocal, type CountryPricing } from "@/lib/pricing";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { StartTrialButton } from "@/components/StartTrialButton";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const PLAN_FEATURES = [
  "Diagnóstico personalizado y rutas alternativas",
  "Roadmap por etapas con tiempos orientativos",
  "Checklist documental con apostilla y traducción",
  "Recordatorios de tareas con fecha límite",
  "Acceso a fuentes oficiales y actualizaciones",
];

// Precio por defecto (fallback estándar) si el país no tiene configuración.
const FALLBACK_PRICING: CountryPricing = {
  country_code: "XX",
  country_name: "Internacional",
  pricing_tier: "B",
  reference_eur_amount: 5,
  local_currency: "EUR",
  local_amount: null,
};

const Pricing = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasNoCardTrial, isActive, accessSource } = useSubscription();
  const nav = useNavigate();
  const [country, setCountry] = useState<string>("");
  const [pricing, setPricing] = useState<CountryPricing | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [localApprox, setLocalApprox] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Cargar país por defecto desde profile (si hay user)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("active_process_nationality, primary_nationality")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        const def = data?.active_process_nationality ?? data?.primary_nationality ?? "";
        if (def) setCountry(def);
      } catch (e) {
        console.error("profile fetch failed", e);
        // No bloquea: el usuario puede seleccionar país manualmente
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Cuando cambia país, cargar pricing + conversión (con fallback)
  useEffect(() => {
    if (!country) { setPricing(null); setLocalApprox(null); setUsedFallback(false); return; }
    let cancelled = false;
    (async () => {
      setLoadingPrice(true);
      try {
        const p = await getPricingForCountry(country);
        if (cancelled) return;
        if (p) {
          setPricing(p);
          setUsedFallback(false);
          if (p.local_currency && p.local_currency !== "EUR") {
            try {
              const local = await convertEurTo(p.local_currency, p.reference_eur_amount);
              if (!cancelled) setLocalApprox(local != null ? formatLocal(local, p.local_currency) : null);
            } catch {
              if (!cancelled) setLocalApprox(null);
            }
          } else {
            setLocalApprox(null);
          }
        } else {
          // Fallback estándar — nunca dejamos al usuario sin precio
          setPricing(FALLBACK_PRICING);
          setUsedFallback(true);
          setLocalApprox(null);
        }
      } catch (e) {
        console.error("pricing load failed", e);
        if (!cancelled) {
          setPricing(FALLBACK_PRICING);
          setUsedFallback(true);
          setLocalApprox(null);
        }
      } finally {
        if (!cancelled) setLoadingPrice(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country]);

  const startCheckout = () => {
    if (!user) { nav("/auth?redirect=/precios"); return; }
    if (!pricing) return;
    setCheckoutOpen(true);
  };

  const fetchClientSecret = async (): Promise<string> => {
    setCreating(true);
    try {
      const priceId = TIER_PRICE_ID[pricing!.pricing_tier];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId,
          selectedPricingCountry: country || pricing!.country_code,
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        },
      });
      if (error || !data?.clientSecret) {
        throw new Error(error?.message || "No se pudo iniciar el pago");
      }
      return data.clientSecret;
    } catch (e: any) {
      toast.error("Error iniciando el pago", { description: e.message });
      setCheckoutOpen(false);
      throw e;
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="flex-1 container py-12 lg:py-16 max-w-5xl">
        {/* Banner de estado del usuario */}
        {user && accessSource === "paid" && isActive && (
          <div className="mb-8 rounded-2xl bg-success/10 border border-success/30 p-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm">
              <strong>Ya tienes una suscripción activa.</strong> Gestiónala desde tu perfil.
            </p>
            <Button asChild variant="hero" size="sm">
              <a href="/perfil">Ir a mi suscripción <ArrowRight className="h-3.5 w-3.5" /></a>
            </Button>
          </div>
        )}
        {user && accessSource === "trial_no_card" && (
          <div className="mb-8 rounded-2xl bg-accent/10 border border-accent/30 p-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm">
              <Sparkles className="h-4 w-4 text-accent inline-block mr-1" />
              Ya tienes tu prueba gratis activa. Suscríbete para no perder acceso cuando termine.
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Plan único, precio adaptado a tu país
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
            Tu plan completo, con <span className="text-primary">7 días gratis</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tu precio puede variar según tu país de origen o documentación seleccionada. Sin compromiso: cancelas cuando quieras durante la prueba.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          {/* Plan card */}
          <div className="bg-card border border-border rounded-3xl p-7 lg:p-9 space-y-6 shadow-elegant">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium mb-1">Plan mensual</p>
                <h2 className="font-display text-2xl font-semibold">Ruta a España</h2>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">7 días gratis</Badge>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Tu país de pricing</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Selecciona un país…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-2">{c.flag}</span> {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Globe className="h-3 w-3" /> Si tienes doble nacionalidad, podrás elegir cuál usar para tu proceso.
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-hero border border-border p-5">
              {loadingPrice ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calculando precio…</div>
              ) : pricing ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-semibold">{pricing.reference_eur_amount} €</span>
                    <span className="text-muted-foreground text-sm">/ mes</span>
                    <Badge variant="outline" className="ml-2 text-[10px]">Tier {pricing.pricing_tier}</Badge>
                  </div>
                  {localApprox && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Aprox. <span className="font-medium text-foreground">{localApprox}</span> en tu moneda local · referencia.
                    </p>
                  )}
                  {usedFallback && (
                    <p className="text-xs text-warning mt-2 inline-flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" /> Aplicando precio estándar internacional.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Comienza con 7 días de prueba gratis. Después del trial, se cobra automáticamente. Cancela en cualquier momento.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Selecciona un país para ver tu precio.</p>
              )}
            </div>

            <div className="space-y-2">
              <StartTrialButton fullWidth size="lg" label="Empezar 7 días gratis sin tarjeta" />
              <Button variant="outline" size="lg" className="w-full" onClick={startCheckout} disabled={!pricing || checkoutOpen || authLoading}>
                {checkoutOpen ? "Cargando…" : "Suscribirme ahora con tarjeta"} <ArrowRight className="h-4 w-4" />
              </Button>
              {accessSource === "trial_no_card" && (
                <p className="text-xs text-success text-center">Ya tienes tu prueba activa. Puedes suscribirte cuando quieras para no perder acceso.</p>
              )}
              {isActive && accessSource === "paid" && (
                <p className="text-xs text-muted-foreground text-center">Ya tienes una suscripción activa. Gestiónala desde tu perfil.</p>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="bg-card border border-border rounded-3xl p-7 lg:p-9">
            <h3 className="font-display text-lg font-semibold mb-4">Todo incluido</h3>
            <ul className="space-y-3">
              {PLAN_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <div className="shrink-0 h-6 w-6 rounded-full bg-primary/10 grid place-items-center mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Tu precio se adapta a tu país de origen o nacionalidad seleccionada. Detectamos señales para evitar fraude, pero nunca bloqueamos por una sola IP.
              </p>
            </div>
          </div>
        </div>

        {/* Embedded checkout */}
        {checkoutOpen && pricing && (
          <div className="mt-10 bg-card border border-border rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">
                Finaliza tu suscripción {pricing && (
                  <span className="text-muted-foreground text-sm ml-2">{getCountryFlag(country)} {getCountryName(country)} · {pricing.reference_eur_amount} €/mes</span>
                )}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
            </div>
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
            {creating && <p className="text-xs text-muted-foreground mt-2">Creando sesión segura…</p>}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Pricing;
