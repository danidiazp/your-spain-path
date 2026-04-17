import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Detecta país aproximado por IP usando ipapi.co (sin clave). Si falla, devuelve null.
async function detectCountryByIp(ip: string | null): Promise<string | null> {
  if (!ip || ip === "unknown") return null;
  try {
    const r = await fetch(`https://ipapi.co/${ip}/country/`);
    if (!r.ok) return null;
    const txt = (await r.text()).trim().toUpperCase();
    return /^[A-Z]{2}$/.test(txt) ? txt : null;
  } catch {
    return null;
  }
}

// Antifraude ligero: la IP es señal SECUNDARIA. No bloquea.
function computeRisk(opts: {
  selectedCountry: string;
  residenceCountry: string | null;
  ipCountry: string | null;
}): { risk: "low" | "medium" | "high"; review: boolean } {
  const { selectedCountry, residenceCountry, ipCountry } = opts;
  // Si residencia y selección coinciden, todo ok aunque IP varíe.
  if (residenceCountry && residenceCountry === selectedCountry) return { risk: "low", review: false };
  // Sin IP: no podemos juzgar -> bajo.
  if (!ipCountry) return { risk: "low", review: false };
  // IP coincide con alguno (residencia o nacionalidad seleccionada)
  if (ipCountry === selectedCountry || ipCountry === residenceCountry) return { risk: "low", review: false };
  // Inconsistencia parcial: precio del país elegido pero revisión interna.
  return { risk: "medium", review: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader ?? "");
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { priceId, selectedPricingCountry, environment, returnUrl } = await req.json();
    if (!priceId || typeof priceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    // Resolve internal Stripe price
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripePrice = prices.data[0];

    // Antifraude: detectar IP -> país, comparar con residencia/nacionalidad
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ipCountry = await detectCountryByIp(ip);

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_residence_country, active_process_nationality")
      .eq("id", user.id)
      .maybeSingle();

    const risk = computeRisk({
      selectedCountry: selectedPricingCountry,
      residenceCountry: profile?.current_residence_country ?? null,
      ipCountry,
    });

    // Persistir billing_profile (señales antifraude)
    await supabase.from("billing_profiles").upsert({
      user_id: user.id,
      selected_pricing_country: selectedPricingCountry,
      selected_currency: stripePrice.currency.toUpperCase(),
      monthly_amount: (stripePrice.unit_amount ?? 0) / 100,
      ip_country: ipCountry,
      pricing_review: risk.review,
      risk_flag: risk.risk,
      subscription_status: "checkout_started",
    }, { onConflict: "user_id" });

    // Crear checkout session con 7 días de prueba gratis
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "subscription",
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: user.email!,
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: user.id, selectedPricingCountry, riskFlag: risk.risk },
      },
      metadata: { userId: user.id, selectedPricingCountry, riskFlag: risk.risk },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret, riskFlag: risk.risk }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-checkout error", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
