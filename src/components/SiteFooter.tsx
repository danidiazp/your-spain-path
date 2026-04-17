import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export const SiteFooter = forwardRef<HTMLElement>((_, ref) => (
  <footer ref={ref} className="border-t border-border/60 mt-24 bg-card/50">
    <div className="container py-12 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2 space-y-4">
        <Logo />
        <p className="text-sm text-muted-foreground max-w-sm">
          Plataforma digital de orientación para personas que quieren mudarse a España. Información clara, accionable y basada en fuentes oficiales.
        </p>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold mb-3">Rutas</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/rutas/estudios" className="hover:text-foreground">Estudios</Link></li>
          <li><Link to="/rutas/trabajo" className="hover:text-foreground">Trabajo</Link></li>
          <li><Link to="/rutas/reagrupacion-familiar" className="hover:text-foreground">Reagrupación familiar</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold mb-3">Plataforma</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/diagnostico" className="hover:text-foreground">Diagnóstico</Link></li>
          <li><Link to="/precios" className="hover:text-foreground">Precios</Link></li>
          <li><Link to="/recursos" className="hover:text-foreground">Recursos oficiales</Link></li>
          <li><Link to="/auth" className="hover:text-foreground">Crear cuenta</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-5 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Ruta a España. Información orientativa, no sustituye asesoramiento jurídico.</p>
        <p>Datos basados en fuentes oficiales del Gobierno de España.</p>
      </div>
    </div>
  </footer>
));
SiteFooter.displayName = "SiteFooter";
