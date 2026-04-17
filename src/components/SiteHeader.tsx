import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, User } from "lucide-react";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  const nav = [
    { to: "/rutas/estudios", label: "Estudios" },
    { to: "/rutas/trabajo", label: "Trabajo" },
    { to: "/rutas/reagrupacion-familiar", label: "Familia" },
    { to: "/recursos", label: "Recursos" },
    { to: "/precios", label: "Precios" },
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                pathname === n.to
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:inline-flex">
                <SubscriptionStatusBadge />
              </div>
              <Button asChild variant="soft" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Mi perfil" className="hidden sm:inline-flex">
                <Link to="/perfil"><User className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Acceder</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/diagnostico">Empezar diagnóstico</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
