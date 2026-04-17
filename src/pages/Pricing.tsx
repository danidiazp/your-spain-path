// Página de selección de plan + checkout embebido.
// El precio se determina por la nacionalidad activa del usuario (active_process_nationality).
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Globe, Sparkles, ArrowRight, Loader2 } from "lucide-react";
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
import { toast } from "sonner";

const PLAN_FEATURES = [
  "Diagnóstico personalizado y rutas alternativas",
  "Roadmap por etapas con tiempos orientativos",
  "Checklist documental con apostilla y traducción",
  "Recordatorios de tareas con fecha límite",
  "Acceso a fuentes oficiales y actualizaciones",
];

const Pricing = () => {
  const { user } = useAuth();
  const nav = useNavigate();
  const [country, setCountry] = useState<string>("");
  const [pricing, setPricing] = useState<CountryPricing | null>(null);
  const [localApprox, setLocalApprox] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Cargar país por defecto desde profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("active_process_nationality, primary_nationality")
        .eq("id", user.id)
        .maybeSingle();
      const def = data?.active_process_nationality ?? data?.primary_nationality ?? "";
      if (def) setCountry(def);
    })();
  }, [user]);

  // Cuando cambia país, cargar pricing + conversión
  useEffect(() => {
    if (!country) { setPricing(null); setLocalApprox(null); return; }
    (async () => {
      setLoadingPrice(true);
      const p = await getPricingForCountry(country);
      setPricing(p);
      if (p && p.local_currency && p.local_currency !== "EUR") {
        const local = await convertEurTo(p.local_currency, p.reference_eur_amount);
        setLocalApprox(local != null ? formatLocal(local, p.local_currency) : null);
      } else {
        setLocalApprox(null);
      }
      setLoadingPrice(false);
    })();
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
          selectedPricingCountry: country,
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
                  <p className="text-xs text-muted-foreground mt-3">
                    Comienza con 7 días de prueba gratis. Después del trial, se cobra automáticamente. Cancela en cualquier momento.
                  </p>
                </>
              ) : country ? (
                <p className="text-sm text-muted-foreground">No hay pricing configurado para este país todavía.</p>
              ) : (
                <p className="text-sm text-muted-foreground">Selecciona un país para ver tu precio.</p>
              )}
            </div>

            <Button variant="hero" size="lg" className="w-full" onClick={startCheckout} disabled={!pricing || checkoutOpen}>
              {checkoutOpen ? "Cargando…" : "Empezar 7 días gratis"} <ArrowRight className="h-4 w-4" />
            </Button>
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
