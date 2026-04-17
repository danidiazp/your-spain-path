import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, AlertCircle, Sparkles, BookmarkPlus, Clock, Gauge, Target, ListChecks, ShieldAlert, Shield, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { localStore, persistAssessment } from "@/lib/storage";
import { ROUTE_LABEL, type Recommendation, type RouteSlug, type RouteEvaluation, VIABILITY_LABEL, DIFFICULTY_LABEL } from "@/lib/wizard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const VIABILITY_STYLES = {
  alta: "bg-success/15 text-success border-success/30",
  media: "bg-warning/15 text-warning border-warning/30",
  baja: "bg-muted text-muted-foreground border-border",
} as const;

const DIFFICULTY_STYLES = {
  baja: "bg-success/10 text-success border-success/20",
  media: "bg-warning/10 text-warning border-warning/20",
  alta: "bg-destructive/10 text-destructive border-destructive/20",
} as const;

const PREP_LABEL = {
  alto: "Preparación alta",
  medio: "Preparación media",
  bajo: "Preparación inicial",
} as const;

const RouteCard = ({ ev, isPrimary }: { ev: RouteEvaluation; isPrimary?: boolean }) => (
  <div className={`bg-card border rounded-3xl p-6 lg:p-7 transition-all hover:shadow-elegant ${isPrimary ? "border-primary/40 shadow-elegant" : "border-border"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        {isPrimary && <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium mb-1.5">Ruta principal</p>}
        {!isPrimary && <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Alternativa</p>}
        <h3 className="font-display text-xl lg:text-2xl font-semibold">{ROUTE_LABEL[ev.slug]}</h3>
      </div>
      <Badge variant="outline" className={`${VIABILITY_STYLES[ev.viability]} text-xs font-medium`}>
        {VIABILITY_LABEL[ev.viability]}
      </Badge>
    </div>

    <p className="text-sm text-muted-foreground leading-relaxed mb-5">Encaja porque {ev.reason}.</p>

    <div className="grid grid-cols-2 gap-3 mb-5">
      <div className="bg-secondary/60 rounded-xl p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <Clock className="h-3 w-3" /> Tiempo orientativo
        </div>
        <p className="text-sm font-medium leading-tight">{ev.estimatedTime}</p>
      </div>
      <div className="bg-secondary/60 rounded-xl p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <Gauge className="h-3 w-3" /> Dificultad
        </div>
        <Badge variant="outline" className={`${DIFFICULTY_STYLES[ev.difficulty]} text-xs`}>{DIFFICULTY_LABEL[ev.difficulty]}</Badge>
      </div>
    </div>

    {ev.missing.length > 0 && (
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3" /> Lo que aún te falta
        </p>
        <ul className="space-y-1.5">
          {ev.missing.map((m) => (
            <li key={m} className="text-sm text-foreground/80 flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span> {m}
            </li>
          ))}
        </ul>
      </div>
    )}

    {ev.blockers.length > 0 && (
      <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-xs uppercase tracking-wider text-destructive/90 mb-2 flex items-center gap-1.5 font-semibold">
          <ShieldAlert className="h-3.5 w-3.5" /> Bloqueos frecuentes a anticipar
        </p>
        <ul className="space-y-1.5">
          {ev.blockers.map((b) => (
            <li key={b} className="text-sm text-foreground/85 flex items-start gap-2">
              <span className="text-destructive mt-0.5">!</span> {b}
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="mb-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <Target className="h-3 w-3" /> Próximos 3 pasos
      </p>
      <ol className="space-y-2">
        {ev.nextSteps.map((s, i) => (
          <li key={i} className="text-sm flex items-start gap-2.5">
            <span className="shrink-0 h-5 w-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold grid place-items-center mt-0.5">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>

    <Button asChild variant={isPrimary ? "hero" : "outline"} size="sm" className="w-full sm:w-auto">
      <Link to={`/rutas/${ev.slug}`}>Ver ruta completa <ArrowRight className="h-3.5 w-3.5" /></Link>
    </Button>
  </div>
);

const Results = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState<Recommendation | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = localStore.getResult<Recommendation>();
    if (!r) nav("/diagnostico");
    else setResult(r);
  }, [nav]);

  const saveToAccount = async () => {
    if (!result) return;
    if (!user) {
      nav("/auth?redirect=/resultados&save=1");
      return;
    }
    setSaving(true);
    try {
      const answers = localStore.getAnswers();
      if (!answers) throw new Error("No hay respuestas guardadas");
      await persistAssessment(user.id, answers, result);
      toast.success("Diagnóstico guardado en tu dashboard");
      nav("/dashboard");
    } catch (e: any) {
      toast.error("No pudimos guardar el diagnóstico", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  // Auto-save si veníamos de auth con flag
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("save") === "1" && user && result) {
      saveToAccount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, result]);

  if (!result) return null;

  const primaryEval = result.primary ? result.evaluations?.[result.primary] : null;
  const altEvals = result.alternatives.map((s) => result.evaluations?.[s]).filter(Boolean) as RouteEvaluation[];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-hero border-b border-border/60">
          <div className="container py-12 lg:py-16 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-5 text-center"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Tu recomendación personalizada
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
                {result.isEU
                  ? "Tu situación tiene un trato especial"
                  : primaryEval
                    ? <>Tu mejor camino es <span className="text-primary">{ROUTE_LABEL[primaryEval.slug]}</span></>
                    : "Aún necesitamos más datos para sugerir una ruta clara"}
              </h1>
              <Badge variant="outline" className="text-sm font-medium">
                {PREP_LABEL[result.preparedness]}
              </Badge>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed pt-2">{result.explanation}</p>
            </motion.div>
          </div>
        </section>

        <div className="container py-10 lg:py-12 max-w-5xl space-y-8">
          {/* EU notice */}
          {result.isEU && (
            <div className="bg-accent-soft/50 border border-accent/30 rounded-3xl p-6">
              <p className="text-sm">
                Como ciudadano UE/EEE/Suiza tu trámite principal es el <strong>registro de ciudadano de la Unión</strong> en la Oficina de Extranjería o Comisaría de Policía correspondiente, sin necesidad de visado nacional.
              </p>
            </div>
          )}

          {/* Ruta principal */}
          {primaryEval && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <RouteCard ev={primaryEval} isPrimary />
            </motion.div>
          )}

          {/* Alternativas */}
          {altEvals.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h2 className="font-display text-xl font-semibold">Rutas alternativas a considerar</h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                {altEvals.map((ev) => (
                  <RouteCard key={ev.slug} ev={ev} />
                ))}
              </div>
            </div>
          )}

          {/* CTA guardar */}
          <div className="bg-gradient-primary rounded-3xl p-8 lg:p-10 text-primary-foreground relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-48 w-48 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative space-y-4 max-w-xl">
              <h2 className="font-display text-2xl lg:text-3xl font-semibold">Guarda tu diagnóstico y avanza paso a paso</h2>
              <p className="opacity-85">
                Crea una cuenta para acceder a tu dashboard con checklist documental, timeline, próximo paso y recursos oficiales personalizados.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button variant="accent" size="lg" onClick={saveToAccount} disabled={saving}>
                  <BookmarkPlus className="h-4 w-4" />
                  {saving ? "Guardando…" : user ? "Guardar en mi dashboard" : "Crear cuenta y guardar"}
                </Button>
                {primaryEval && (
                  <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    <Link to={`/rutas/${primaryEval.slug}`}>Ver detalle de la ruta <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <LegalDisclaimer />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Results;
