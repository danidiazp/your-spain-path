// Wrapper de gating premium. Redirige al usuario a /precios cuando no tiene
// trial activo ni suscripción de pago. Muestra un spinner mientras carga.
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";

export function RequireSubscription({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const location = useLocation();

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!isActive) {
    return <Navigate to={`/precios?from=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
