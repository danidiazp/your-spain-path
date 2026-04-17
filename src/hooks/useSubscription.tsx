import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";

export type SubscriptionRow = {
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  price_id: string;
};

export function useSubscription() {
  const { user } = useAuth();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSub(null); setLoading(false); return; }
    let cancelled = false;
    const env = getStripeEnvironment();
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end, cancel_at_period_end, price_id")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setSub((data as SubscriptionRow) ?? null);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`sub-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` }, (payload) => {
        const row = payload.new as SubscriptionRow;
        if (row) setSub(row);
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  const isActive = !!sub && (
    (["active", "trialing"].includes(sub.status) && (!sub.current_period_end || new Date(sub.current_period_end) > new Date()))
    || (sub.status === "canceled" && sub.current_period_end && new Date(sub.current_period_end) > new Date())
  );
  const isTrialing = sub?.status === "trialing";

  return { subscription: sub, loading, isActive, isTrialing };
}
