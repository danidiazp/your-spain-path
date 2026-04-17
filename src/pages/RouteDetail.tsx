import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, FileText, AlertTriangle, MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { supabase } from "@/integrations/supabase/client";

const RouteDetail = () => {
  const { slug } = useParams();
  const [route, setRoute] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: r } = await supabase.from("migration_routes").select("*").eq("slug", slug!).maybeSingle();
        if (cancelled) return;
        if (r) {
          const [{ data: s }, { data: d }] = await Promise.all([
            supabase.from("route_steps").select("*").eq("route_id", r.id).order("step_order"),
            supabase.from("route_documents").select("*").eq("route_id", r.id),
          ]);
          if (cancelled) return;
          setSteps(s ?? []);
          setDocs(d ?? []);
        }
        setRoute(r);
      } catch (e) {
        console.error("route detail load error", e);
        if (!cancelled) setRoute(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
  }
  if (!route) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="container py-20 text-center">
          <h1 className="font-display text-3xl font-semibold mb-3">Ruta no encontrada</h1>
          <Button asChild variant="hero"><Link to="/">Volver al inicio</Link></Button>
        </main>
      </div>
    );
  }

  const sources = (route.official_sources_json as { label: string; url: string }[]) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="bg-gradient-hero border-b border-border/60">
          <div className="container py-12 lg:py-16 max-w-5xl">
            <Button asChild variant="ghost" size="sm" className="mb-4">
              <Link to="/"><ArrowLeft className="h-4 w-4" /> Volver</Link>
            </Button>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4 max-w-3xl">
              <p className="text-sm font-medium text-primary uppercase tracking-[0.18em]">Ruta migratoria</p>
              <h1 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight text-balance">{route.name}</h1>
              <p className="text-lg text-muted-foreground text-pretty">{route.summary}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                {route.estimated_timeline && (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-card border border-border rounded-full px-3.5 py-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> {route.estimated_timeline}
                  </span>
                )}
                {route.target_user && (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-card border border-border rounded-full px-3.5 py-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" /> {route.target_user}
                  </span>
                )}
              </div>
              <div className="pt-4">
                <Button asChild variant="hero" size="lg">
                  <Link to="/diagnostico">Hacer mi diagnóstico</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container py-12 max-w-5xl space-y-10">
          {/* Documentos */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Documentos requeridos</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {docs.map((d) => (
                <div key={d.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-elegant transition-shadow">
                  <p className="font-medium">{d.name}</p>
                  {d.description && <p className="text-sm text-muted-foreground mt-1.5">{d.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {d.translation_needed && <Badge variant="outline" className="text-[10px]">Traducción jurada</Badge>}
                    {d.apostille_needed && <Badge variant="outline" className="text-[10px]">Apostilla</Badge>}
                    {d.validity_window && <Badge variant="outline" className="text-[10px]">Validez: {d.validity_window}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pasos */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-semibold">Pasos del proceso</h2>
            </div>
            <ol className="relative border-l-2 border-border ml-4 space-y-6">
              {steps.map((s) => (
                <li key={s.id} className="ml-6">
                  <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold shadow-elegant">
                    {s.step_order}
                  </span>
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-medium text-base">{s.title}</h3>
                      {s.estimated_duration && <Badge variant="outline" className="text-[10px]">{s.estimated_duration}</Badge>}
                      {s.stage_location && <Badge variant="outline" className="text-[10px]">{s.stage_location}</Badge>}
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                    {s.official_link && (
                      <a href={s.official_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3">
                        Enlace oficial <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Riesgos */}
          {route.risk_notes && (
            <section className="bg-warning/10 border border-warning/30 rounded-3xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">Riesgos y bloqueos frecuentes</h3>
                  <p className="text-sm text-muted-foreground">{route.risk_notes}</p>
                </div>
              </div>
            </section>
          )}

          {/* Fuentes */}
          {sources.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-display text-2xl font-semibold">Fuentes oficiales</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {sources.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4 hover:shadow-elegant hover:border-primary/30 transition-all">
                    <span className="text-sm font-medium">{s.label}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <LegalDisclaimer />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default RouteDetail;
