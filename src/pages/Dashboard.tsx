import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Calendar, MapPin, BookOpen, Sparkles, AlertCircle, ListChecks, ExternalLink, Target, Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { DocumentChecklist, type RouteDoc, type UserDocState } from "@/components/DocumentChecklist";
import { RoadmapStages, type RoadmapStep } from "@/components/RoadmapStages";
import { TaskList, type Task } from "@/components/TaskList";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { track } from "@/lib/analytics";

type Assessment = {
  id: string;
  preparedness_level: string | null;
  explanation: string | null;
  missing_requirements_json: any;
  primary_route_id: string | null;
  created_at: string;
};

type Route = {
  id: string; slug: string; name: string;
  short_description: string | null;
  estimated_timeline: string | null;
  risk_notes: string | null;
};
type Resource = { id: string; title: string; url: string; institution: string | null; category: string };

const PREP_LABEL: Record<string, string> = {
  alto: "Preparación alta",
  medio: "Preparación media",
  bajo: "Preparación inicial",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [steps, setSteps] = useState<RoadmapStep[]>([]);
  const [docs, setDocs] = useState<RouteDoc[]>([]);
  const [docStates, setDocStates] = useState<Record<string, UserDocState>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    track("dashboard_viewed");
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [profRes, assessRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("assessment_results").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (cancelled) return;
        const prof = profRes.data;
        const assess = assessRes.data as Assessment | null;
        setProfile(prof);
        setAssessment(assess);

        if (assess?.primary_route_id) {
          const [rRes, sRes, dRes, resRes, dsRes] = await Promise.all([
            supabase.from("migration_routes").select("id, slug, name, short_description, estimated_timeline, risk_notes").eq("id", assess.primary_route_id).maybeSingle(),
            supabase.from("route_steps").select("id, step_order, title, description, estimated_duration, stage_location, official_link").eq("route_id", assess.primary_route_id).order("step_order"),
            supabase.from("route_documents").select("id, name, description, required, translation_needed, apostille_needed, official_link, validity_window, issued_by").eq("route_id", assess.primary_route_id),
            supabase.from("resources").select("id, title, url, institution, category").eq("route_id", assess.primary_route_id).limit(8),
            supabase.from("user_documents").select("id, document_id, status, notes").eq("profile_id", user.id),
          ]);
          if (cancelled) return;
          setRoute(rRes.data as Route | null);
          setSteps((sRes.data ?? []) as RoadmapStep[]);
          setDocs((dRes.data ?? []) as RouteDoc[]);
          setResources((resRes.data ?? []) as Resource[]);
          const map: Record<string, UserDocState> = {};
          (dsRes.data ?? []).forEach((row: any) => { map[row.document_id] = { id: row.id, document_id: row.document_id, status: row.status, notes: row.notes }; });
          setDocStates(map);
        }

        const tRes = await supabase
          .from("user_tasks")
          .select("id, title, status, description, source_step_id, due_date")
          .eq("profile_id", user.id)
          .order("created_at");
        if (cancelled) return;
        setTasks(((tRes.data ?? []) as Task[]));
      } catch (e: any) {
        console.error("dashboard load error", e);
        if (!cancelled) setLoadError(e?.message ?? "Error cargando tu dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const seedTasksFromRoute = async () => {
    if (!user || !route || steps.length === 0) return;
    const items = steps.slice(0, 5).map((s) => ({
      profile_id: user.id,
      route_id: route.id,
      title: s.title,
      description: s.description,
      source_step_id: s.id,
      status: "pending",
    }));
    const { data, error } = await supabase.from("user_tasks").insert(items).select();
    if (error) toast.error("No se pudieron crear las tareas");
    else { setTasks((prev) => [...prev, ...((data as Task[]) ?? [])]); toast.success("Tareas creadas a partir de tu ruta"); }
  };

  // Progress: docs (50%) + tasks (50%) blended
  const docProgress = useMemo(() => {
    if (docs.length === 0) return 100;
    const done = docs.filter((d) => docStates[d.id]?.status === "conseguido").length;
    return Math.round((done / docs.length) * 100);
  }, [docs, docStates]);

  const taskProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter((t) => t.status === "done").length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  const overallProgress = Math.round((docProgress + taskProgress) / 2);

  const completedStepIds = useMemo(
    () => new Set(tasks.filter((t) => t.status === "done" && t.source_step_id).map((t) => t.source_step_id!)),
    [tasks]
  );

  // Próximo mejor paso: primer step de la ruta no completado
  const nextRouteStep = useMemo(
    () => steps.find((s) => !completedStepIds.has(s.id)) ?? null,
    [steps, completedStepIds]
  );

  // Recordatorios: tareas con due_date próxima o vencida no completadas
  const reminders = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return tasks
      .filter((t) => t.status !== "done" && t.due_date)
      .map((t) => ({ task: t, date: new Date(t.due_date!) }))
      .filter(({ date }) => (date.getTime() - today.getTime()) / 86400000 <= 14)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex-1 grid place-items-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl py-20 text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 grid place-items-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="font-display text-2xl font-semibold">No pudimos cargar tu dashboard</h1>
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Button onClick={() => window.location.reload()} variant="hero">Reintentar</Button>
        </main>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container max-w-2xl py-20 text-center space-y-6">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-secondary grid place-items-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-semibold">Empieza por tu diagnóstico</h1>
          <p className="text-muted-foreground">
            Aún no has completado el diagnóstico. En 2 minutos sabremos qué ruta migratoria encaja mejor contigo.
          </p>
          <Button asChild variant="hero" size="lg">
            <Link to="/diagnostico">Empezar diagnóstico <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container py-10 lg:py-14 max-w-6xl space-y-7">
        <EmailVerificationBanner />
        <SubscriptionCard compact />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Hola{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋</p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mt-1">Tu camino a España</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Diagnóstico realizado el {new Date(assessment.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/diagnostico">Rehacer diagnóstico</Link>
            </Button>
            <Button asChild variant="soft" size="sm">
              <Link to="/perfil">Editar perfil</Link>
            </Button>
          </div>
        </motion.div>

        {/* PRÓXIMO MEJOR PASO — destacado arriba */}
        {nextRouteStep && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="relative overflow-hidden bg-gradient-primary rounded-3xl p-7 lg:p-9 text-primary-foreground shadow-deep"
          >
            <div className="absolute -top-16 -right-16 h-64 w-64 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative grid lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/15 text-xs font-medium backdrop-blur">
                  <Target className="h-3 w-3" /> Tu próximo mejor paso
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-semibold leading-tight">{nextRouteStep.title}</h2>
                {nextRouteStep.description && (
                  <p className="opacity-90 text-sm lg:text-base leading-relaxed">{nextRouteStep.description}</p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {nextRouteStep.estimated_duration && (
                    <span className="inline-flex items-center gap-1.5 text-xs bg-primary-foreground/15 backdrop-blur rounded-full px-3 py-1">
                      <Calendar className="h-3 w-3" /> {nextRouteStep.estimated_duration}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs bg-primary-foreground/15 backdrop-blur rounded-full px-3 py-1">
                    Paso {nextRouteStep.step_order} de {steps.length}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  {nextRouteStep.official_link && (
                    <Button asChild variant="accent" size="sm">
                      <a href={nextRouteStep.official_link} target="_blank" rel="noreferrer">
                        Ir al trámite oficial <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  {route && (
                    <Button asChild variant="outline" size="sm" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                      <Link to={`/rutas/${route.slug}`}>Ver ruta completa <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </Button>
                  )}
                </div>
              </div>
              <div className="bg-primary-foreground/10 rounded-2xl p-5 backdrop-blur-sm border border-primary-foreground/15">
                <p className="text-xs uppercase tracking-[0.18em] opacity-75 mb-2">Ruta principal</p>
                <p className="font-display text-lg font-semibold leading-tight">{route?.name ?? "Sin ruta asignada"}</p>
                <Badge variant="outline" className="mt-3 bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground text-[10px]">
                  {PREP_LABEL[assessment.preparedness_level ?? "bajo"]}
                </Badge>
                <div className="mt-4 pt-4 border-t border-primary-foreground/15">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs opacity-80">Progreso global</span>
                    <span className="font-display text-lg font-semibold">{overallProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-primary-foreground/15 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary-foreground" initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.6 }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 text-[11px] opacity-85">
                    <div><span className="opacity-70">Documentos</span><p className="font-medium">{docProgress}%</p></div>
                    <div><span className="opacity-70">Tareas</span><p className="font-medium">{taskProgress}%</p></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recordatorios */}
        {reminders.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-accent" />
              <h3 className="font-display text-base font-semibold">Próximos recordatorios</h3>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {reminders.map(({ task, date }) => {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const isOverdue = date < today;
                const isTodayDue = date.getTime() === today.getTime();
                return (
                  <li key={task.id} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    isOverdue ? "border-destructive/30 bg-destructive/5" :
                    isTodayDue ? "border-warning/30 bg-warning/5" :
                    "border-border bg-secondary/40"
                  }`}>
                    <div className={`shrink-0 h-9 w-9 rounded-xl grid place-items-center ${
                      isOverdue ? "bg-destructive/15 text-destructive" :
                      isTodayDue ? "bg-warning/15 text-warning" :
                      "bg-card text-muted-foreground"
                    }`}>
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className={`text-xs ${isOverdue ? "text-destructive" : isTodayDue ? "text-warning" : "text-muted-foreground"}`}>
                        {isOverdue ? "Vencida · " : isTodayDue ? "Hoy · " : ""}
                        {format(date, "d 'de' MMMM", { locale: es })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Alertas missing del diagnóstico */}
        {assessment.missing_requirements_json && Array.isArray(assessment.missing_requirements_json) && assessment.missing_requirements_json.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-warning" />
              <h3 className="font-display text-base font-semibold">Lo que aún te falta para avanzar</h3>
            </div>
            <ul className="space-y-1.5 ml-6 list-disc text-sm text-foreground/80">
              {(assessment.missing_requirements_json as string[]).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        {/* Checklist documental enriquecido + Tareas */}
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 lg:p-7 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold">Checklist documental</h3>
              </div>
              <Badge variant="outline" className="text-xs">{docs.length} documentos</Badge>
            </div>
            {user && (
              <DocumentChecklist
                profileId={user.id}
                docs={docs}
                states={docStates}
                onChange={setDocStates}
              />
            )}
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 lg:p-7 shadow-elegant">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4 text-primary" />
              <h3 className="font-display text-lg font-semibold">Mis tareas</h3>
            </div>
            {user && (
              <TaskList
                profileId={user.id}
                routeId={route?.id ?? null}
                tasks={tasks}
                onChange={setTasks}
                onSeed={seedTasksFromRoute}
                canSeed={!!route && steps.length > 0}
              />
            )}
          </div>
        </div>

        {/* Roadmap por etapas */}
        {steps.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-elegant">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold">Roadmap por etapas</h3>
              </div>
              <Badge variant="outline" className="text-xs">{completedStepIds.size} / {steps.length} pasos</Badge>
            </div>
            <RoadmapStages steps={steps} completedStepIds={completedStepIds} />
          </div>
        )}

        {/* Recursos contextuales */}
        {resources.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-7 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold">Recursos oficiales para tu ruta</h3>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/recursos">Ver biblioteca <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {resources.map((r) => (
                <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-border hover:border-primary/30 hover:bg-secondary/40 transition-all">
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{r.title}</p>
                    {r.institution && <p className="text-xs text-muted-foreground mt-1">{r.institution}</p>}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Riesgos */}
        {route?.risk_notes && (
          <div className="bg-warning/5 border border-warning/20 rounded-3xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-base font-semibold mb-1">Riesgos y bloqueos frecuentes</h3>
                <p className="text-sm text-muted-foreground">{route.risk_notes}</p>
              </div>
            </div>
          </div>
        )}

        <LegalDisclaimer />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Dashboard;
