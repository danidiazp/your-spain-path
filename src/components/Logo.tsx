import { forwardRef } from "react";
import { Link } from "react-router-dom";

export const Logo = forwardRef<HTMLAnchorElement, { className?: string }>(
  ({ className = "" }, ref) => (
    <Link ref={ref} to="/" className={`inline-flex items-center gap-2.5 group ${className}`}>
      <div className="relative h-9 w-9 rounded-xl bg-gradient-primary shadow-elegant grid place-items-center overflow-hidden">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          <circle cx="16.5" cy="9" r="1.6" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">Ruta a España</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">Orientación migratoria</span>
      </div>
    </Link>
  )
);
Logo.displayName = "Logo";
