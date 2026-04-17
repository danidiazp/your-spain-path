import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = new URL(req.url);
  const env = (url.searchParams.get("env") || "sandbox") as StripeEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("event", event.type, "env", env);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await markCanceled(event.data.object, env);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object, env);
        break;
      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object, env);
        break;
      default:
        console.log("Unhandled", event.type);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("webhook error", e);
    return new Response("Webhook error", { status: 400 });
  }
});

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  if (!userId) return;
  // Vincular customer al usuario antes de que llegue subscription.created
  await supabase.from("billing_profiles").upsert({
    user_id: userId,
    stripe_customer_id: session.customer,
    selected_pricing_country: session.metadata?.selectedPricingCountry ?? null,
    subscription_status: "checkout_completed",
  }, { onConflict: "user_id" });
}

async function upsertSubscription(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) { console.error("no userId"); return; }

  const item = sub.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;

  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer,
    product_id: productId,
    price_id: priceId,
    status: sub.status,
    current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });

  await supabase.from("billing_profiles").upsert({
    user_id: userId,
    stripe_customer_id: sub.customer,
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
  }, { onConflict: "user_id" });
}

async function markCanceled(sub: any, env: StripeEnv) {
  await supabase.from("subscriptions").update({
    status: "canceled",
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", sub.id).eq("environment", env);

  // Reflejar en billing_profile
  if (sub.metadata?.userId) {
    await supabase.from("billing_profiles").update({
      subscription_status: "canceled",
    }).eq("user_id", sub.metadata.userId);
  }
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  await supabase.from("subscriptions").update({
    status: "active",
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subId).eq("environment", env);
}

async function handleInvoiceFailed(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  await supabase.from("subscriptions").update({
    status: "past_due",
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", subId).eq("environment", env);
}
