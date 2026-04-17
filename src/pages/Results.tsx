import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, AlertCircle, Sparkles, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { localStore } from "@/lib/storage";
import { ROUTE_LABEL, type Recommendation, type RouteSlug } from "@/lib/wizard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PREP_STYLES = {
  alto: { label: "Preparación alta", className: "bg-success/15 text-success border-success/30" },
  medio: { label: "Preparación media", className: "bg-warning/15 text-warning border-warning/30" },
  bajo: { label: "Preparación inicial", className: "bg-secondary text-secondary-foreground border-border" },
} as const;

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
      // Resolver UUIDs por slug
      const slugs = [result.primary, ...result.alternatives].filter(Boolean) as RouteSlug[];
      const { data: routes } = await supabase
        .from("migration_routes")
        .select("id, slug")
        .in("slug", slugs);
      const idBySlug = new Map(routes?.map((r) => [r.slug, r.id]) ?? []);
      const primaryId = result.primary ? idBySlug.get(result.primary) : null;
      const altIds = result.alternatives.map((s) => idBySlug.get(s)).filter(Boolean);

      const answers = localStore.getAnswers();
      if (answers) {
        await supabase.from("profiles").update({
          nationality: answers.nationality,
          current_country: answers.current_country,
          eu_status: answers.eu_status === "yes",
          main_goal: answers.main_goal,
          work_offer: answers.work_offer === "yes",
          study_admission: answers.study_admission === "yes",
          family_in_spain: answers.family_in_spain === "yes",
          timeline_goal: answers.timeline_goal,
          budget_range: answers.budget_range,
        }).eq("id", user.id);
      }

      await supabase.from("assessment_results").insert({
        profile_id: user.id,
        primary_route_id: primaryId,
        alternative_route_ids_json: altIds,
        preparedness_level: result.preparedness,
        explanation: result.explanation,
        missing_requirements_json: result.missing,
      });

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

  const prep = PREP_STYLES[result.preparedness];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-hero border-b border-border/60">
          <div className="container py-14 lg:py-20 max-w-4xl">
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
                  : result.primary
                    ? <>Tu mejor camino es <span className="text-primary">{ROUTE_LABEL[result.primary]}</span></>
                    : "Aún necesitamos más datos para sugerir una ruta clara"}
              </h1>
              <Badge variant="outline" className={`${prep.className} text-sm font-medium`}>{prep.label}</Badge>
            </motion.div>
          </div>
        </section>

        <div className="container py-12 max-w-4xl space-y-8">
          {/* Explicación */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card border border-border rounded-3xl p-7 lg:p-8 shadow-elegant"
          >
            <h2 className="font-display text-xl font-semibold mb-3">Por qué esta ruta encaja</h2>
            <p className="text-muted-foreground leading-relaxed">{result.explanation}</p>
          </motion.div>

          {/* Alternativas */}
          {result.alternatives.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Rutas alternativas</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.alternatives.map((slug) => (
                  <Link
                    key={slug}
                    to={`/rutas/${slug}`}
                    className="group bg-card border border-border rounded-2xl p-5 hover:shadow-elegant hover:border-primary/30 transition-all"
                  >
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Alternativa</p>
                    <p className="font-display text-lg font-semibold mb-3">{ROUTE_LABEL[slug]}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary group-hover:gap-2.5 transition-all">
                      Ver detalles <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          {result.missing.length > 0 && (
            <div className="bg-accent-soft/40 border border-accent/30 rounded-3xl p-7">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-9 w-9 rounded-full bg-accent/15 grid place-items-center shrink-0">
                  <AlertCircle className="h-4.5 w-4.5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Lo que aún te falta</h2>
                  <p className="text-sm text-muted-foreground">Reúne estos elementos para acercarte a tu ruta principal.</p>
                </div>
              </div>
              <ul className="space-y-2.5 ml-12">
                {result.missing.map((m) => (
                  <li key={m} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" /> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-primary rounded-3xl p-8 lg:p-10 text-primary-foreground relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-48 w-48 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative space-y-4 max-w-xl">
              <h2 className="font-display text-2xl lg:text-3xl font-semibold">Guarda tu diagnóstico y avanza paso a paso</h2>
              <p className="opacity-85">
                Crea una cuenta para acceder a tu dashboard con checklist documental, timeline y recursos oficiales personalizados.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button variant="accent" size="lg" onClick={saveToAccount} disabled={saving}>
                  <BookmarkPlus className="h-4 w-4" />
                  {saving ? "Guardando…" : user ? "Guardar en mi dashboard" : "Crear cuenta y guardar"}
                </Button>
                {result.primary && (
                  <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                    <Link to={`/rutas/${result.primary}`}>Ver detalle de la ruta <ArrowRight className="h-4 w-4" /></Link>
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
