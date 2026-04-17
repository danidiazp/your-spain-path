// Hook unificado de acceso premium: combina suscripción de Stripe + trial sin tarjeta (billing_profiles).
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";

export type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  price_id: string;
  stripe_customer_id?: string | null;
};

export type BillingProfileRow = {
  trial_start: string | null;
  trial_end: string | null;
  subscription_status: string | null;
  selected_pricing_country: string | null;
  monthly_amount: number | null;
  selected_currency: string | null;
};

export function useSubscription() {
  const { user } = useAuth();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [billing, setBilling] = useState<BillingProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setSub(null); setBilling(null); setLoading(false); return; }
    const env = getStripeEnvironment();
    const [{ data: subData }, { data: billData }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("status, current_period_end, cancel_at_period_end, price_id, stripe_customer_id")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("billing_profiles")
        .select("trial_start, trial_end, subscription_status, selected_pricing_country, monthly_amount, selected_currency")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setSub((subData as SubscriptionRow) ?? null);
    setBilling((billData as BillingProfileRow) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refresh().then(() => { if (cancelled) return; });

    if (!user) return;
    const channel = supabase
      .channel(`access-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "billing_profiles", filter: `user_id=eq.${user.id}` }, () => refresh())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user, refresh]);

  // Acceso por suscripción de pago
  const hasPaidAccess = !!sub && (
    (["active", "trialing"].includes(sub.status) && (!sub.current_period_end || new Date(sub.current_period_end) > new Date()))
    || (sub.status === "canceled" && sub.current_period_end && new Date(sub.current_period_end) > new Date())
  );

  // Acceso por trial sin tarjeta vigente
  const trialEnd = billing?.trial_end ? new Date(billing.trial_end) : null;
  const hasNoCardTrial =
    billing?.subscription_status === "trialing_no_card" &&
    trialEnd !== null &&
    trialEnd > new Date();

  const isActive = hasPaidAccess || hasNoCardTrial;
  const isTrialing = sub?.status === "trialing" || hasNoCardTrial;
  const accessSource: "paid" | "trial_no_card" | "none" =
    hasPaidAccess ? "paid" : hasNoCardTrial ? "trial_no_card" : "none";

  return {
    subscription: sub,
    billing,
    loading,
    isActive,
    isTrialing,
    hasNoCardTrial,
    accessSource,
    trialEnd,
    refresh,
  };
}
