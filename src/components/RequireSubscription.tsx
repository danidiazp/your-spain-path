// Wrapper de gating premium. Redirige al usuario a /precios cuando no tiene
// trial activo ni suscripción de pago. Antes de redirigir, intenta activar
// automáticamente el trial sin tarjeta (idempotente) por si el usuario se
// registró antes de que existiera esta lógica o el trial no se creó.
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

export function RequireSubscription({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading, billing, refresh } = useSubscription();
  const location = useLocation();
  const [autoTrialChecked, setAutoTrialChecked] = useState(false);

  // Si el usuario está logueado, ya cargó la subscripción y no tiene acceso
  // ni trial registrado, intenta activar el trial sin tarjeta una vez.
  useEffect(() => {
    if (autoTrialChecked) return;
    if (authLoading || subLoading) return;
    if (!user) return;
    if (isActive) { setAutoTrialChecked(true); return; }
    // Solo intentamos si nunca se le concedió un trial (trial_start vacío).
    if (billing?.trial_start) { setAutoTrialChecked(true); return; }

    (async () => {
      try {
        await supabase.rpc("start_trial_no_card" as never, { _user_id: user.id } as never);
        await refresh();
      } catch (e) {
        console.warn("[RequireSubscription] no se pudo activar trial automático", e);
      } finally {
        setAutoTrialChecked(true);
      }
    })();
  }, [authLoading, subLoading, user, isActive, billing, refresh, autoTrialChecked]);

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Mientras carga la subscripción o se intenta activar el trial automático,
  // mostramos un spinner ligero (no en blanco).
  if (subLoading || !autoTrialChecked) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isActive) {
    return <Navigate to={`/precios?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
