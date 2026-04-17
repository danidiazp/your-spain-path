import { Info } from "lucide-react";

export const LegalDisclaimer = ({ variant = "default" }: { variant?: "default" | "compact" }) => {
  if (variant === "compact") {
    return (
      <p className="text-xs text-muted-foreground flex items-start gap-2">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>La información es orientativa. Contrasta siempre con fuentes oficiales antes de iniciar trámites.</span>
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-5 flex gap-4">
      <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center shrink-0">
        <Info className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="font-medium text-sm">Información orientativa</p>
        <p className="text-sm text-muted-foreground">
          Los contenidos mostrados son una guía y deben contrastarse con las fuentes oficiales. Los tiempos pueden variar según el expediente y la administración competente. Esta plataforma no sustituye asesoramiento jurídico individual.
        </p>
      </div>
    </div>
  );
};
