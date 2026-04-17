import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Listener primero — captura signIn, signOut, tokenRefresh, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // Si el refresh token es inválido o expira, limpiamos sin romper la app
      if (event === "TOKEN_REFRESHED" && !s) {
        setSession(null);
      } else {
        setSession(s);
      }
      setLoading(false);
    });
    // 2) Sesión actual — atrapamos errores de refresh token corrupto
    supabase.auth.getSession()
      .then(({ data: { session: s }, error }) => {
        if (error) {
          console.warn("[useAuth] getSession error, clearing local session:", error.message);
          // Forzar limpieza de tokens corruptos
          supabase.auth.signOut().catch(() => {});
          setSession(null);
        } else {
          setSession(s);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.warn("[useAuth] getSession threw, clearing local session:", e?.message);
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setLoading(false);
      });

    // Captura global de errores de refresh token no manejados que llegan a window
    const onUnhandled = (ev: PromiseRejectionEvent) => {
      const reason: any = ev.reason;
      const code = reason?.code || reason?.value?.code;
      const msg = reason?.message || reason?.value?.message || "";
      if (code === "refresh_token_not_found" || /Refresh Token/i.test(msg)) {
        console.warn("[useAuth] swallowed refresh-token error:", msg);
        ev.preventDefault();
        supabase.auth.signOut().catch(() => {});
        setSession(null);
      }
    };
    window.addEventListener("unhandledrejection", onUnhandled);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
