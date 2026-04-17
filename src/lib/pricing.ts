// Pricing por tier de país. Fuente: tabla country_pricing_tiers en Supabase.
import { supabase } from "@/integrations/supabase/client";
import type { CountryCode } from "./countries";

export type PricingTier = "A" | "B" | "C";

export type CountryPricing = {
  country_code: string;
  country_name: string;
  pricing_tier: PricingTier;
  reference_eur_amount: number;
  local_currency: string | null;
  local_amount: number | null;
};

// Mapeo manual tier -> price_id en el sistema de pagos.
export const TIER_PRICE_ID: Record<PricingTier, string> = {
  A: "ruta_tier_a_monthly",
  B: "ruta_tier_b_monthly",
  C: "ruta_tier_c_monthly",
};

export async function getPricingForCountry(code: CountryCode | string): Promise<CountryPricing | null> {
  const { data, error } = await supabase
    .from("country_pricing_tiers")
    .select("country_code, country_name, pricing_tier, reference_eur_amount, local_currency, local_amount")
    .eq("country_code", code)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as CountryPricing;
}

export async function getAllPricing(): Promise<CountryPricing[]> {
  const { data } = await supabase
    .from("country_pricing_tiers")
    .select("country_code, country_name, pricing_tier, reference_eur_amount, local_currency, local_amount")
    .eq("active", true)
    .order("pricing_tier");
  return (data ?? []) as CountryPricing[];
}

// Convierte EUR a moneda local llamando a la edge function fx-rates.
// Cachea en memoria por sesión para no spamear la API.
const fxCache = new Map<string, { value: number; ts: number }>();
const FX_TTL_MS = 1000 * 60 * 60 * 6; // 6h

export async function convertEurTo(currency: string, eurAmount: number): Promise<number | null> {
  if (currency === "EUR") return eurAmount;
  const cacheKey = currency;
  const cached = fxCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < FX_TTL_MS) {
    return Math.round(eurAmount * cached.value * 100) / 100;
  }
  try {
    const { data, error } = await supabase.functions.invoke("fx-rates", {
      body: { from: "EUR", to: currency },
    });
    if (error || !data?.rate) return null;
    fxCache.set(cacheKey, { value: data.rate, ts: Date.now() });
    return Math.round(eurAmount * data.rate * 100) / 100;
  } catch {
    return null;
  }
}

export function formatLocal(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
