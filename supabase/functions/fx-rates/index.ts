// FX rates via exchangerate.host (free, no key). Cached per-region by Supabase edge runtime.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { from, to } = await req.json();
    if (!/^[A-Z]{3}$/.test(from || "") || !/^[A-Z]{3}$/.test(to || "")) {
      return new Response(JSON.stringify({ error: "Invalid currency code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (from === to) {
      return new Response(JSON.stringify({ rate: 1 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // exchangerate.host free endpoint
    const r = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1`);
    const data = await r.json();
    const rate = data?.result ?? data?.info?.quote ?? null;

    if (!rate || typeof rate !== "number") {
      return new Response(JSON.stringify({ error: "fx unavailable" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ rate, from, to }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=21600",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
