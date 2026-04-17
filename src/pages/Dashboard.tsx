import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Check, ArrowRight, FileText, Calendar, MapPin, BookOpen, Sparkles, AlertCircle, ListChecks, Plus, ExternalLink, Target, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
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

type Route = { id: string; slug: string; name: string; short_description: string | null; estimated_timeline: string | null; risk_notes: string | null };
type Step = { id: string; step_order: number; title: string; description: string | null; estimated_duration: string | null; stage_location: string | null; official_link: string | null };
type Doc = { id: string; name: string; description: string | null; required: boolean | null; translation_needed: boolean | null; apostille_needed: boolean | null; official_link: string | null };
type Task = { id: string; title: string; status: string; description: string | null; source_step_id: string | null };
type Resource = { id: string; title: string; url: string; institution: string | null; category: string };

const PREP_LABEL: Record<string, string> = { alto: "Preparación alta", medio: "Preparación media", bajo: "Preparación inicial" };

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (!user) return;
    track("dashboard_viewed");
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: assess }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("assessment_results").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setProfile(prof);
      setAssessment(assess);

      if (assess?.primary_route_id) {
        const [{ data: r }, { data: s }, { data: d }, { data: res }] = await Promise.all([
          supabase.from("migration_routes").select("id, slug, name, short_description, estimated_timeline, risk_notes").eq("id", assess.primary_route_id).maybeSingle(),
          supabase.from("route_steps").select("id, step_order, title, description, estimated_duration, stage_location, official_link").eq("route_id", assess.primary_route_id).order("step_order"),
          supabase.from("route_documents").select("id, name, description, required, translation_needed, apostille_needed, official_link").eq("route_id", assess.primary_route_id),
          supabase.from("resources").select("id, title, url, institution, category").eq("route_id", assess.primary_route_id).limit(6),
        ]);
        setRoute(r);
        setSteps(s ?? []);
        setDocs(d ?? []);
        setResources(res ?? []);
      }

      const { data: t } = await supabase.from("user_tasks").select("id, title, status, description, source_step_id").eq("profile_id", user.id).order("created_at");
      setTasks(t ?? []);
      setLoading(false);
    })();
  }, [user]);

  const toggleTask = async (id: string, status: string) => {
    const newStatus = status === "done" ? "pending" : "done";
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    const { error } = await supabase.from("user_tasks").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("No se pudo actualizar la tarea");
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("user_tasks").delete().eq("id", id);
    if (error) toast.error("No se pudo eliminar");
  };

  const addCustomTask = async () => {
    if (!user || !newTask.trim()) return;
    const { data, error } = await supabase.from("user_tasks").insert({
      profile_id: user.id,
      route_id: route?.id ?? null,
      title: newTask.trim(),
      status: "pending",
    }).select().single();
    if (error) { toast.error("No se pudo crear"); return; }
    setTasks((prev) => [...prev, data]);
    setNewTask("");
  };

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
    else { setTasks((prev) => [...prev, ...(data ?? [])]); toast.success("Tareas creadas a partir de tu ruta"); }
  };

  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const nextTask = tasks.find((t) => t.status !== "done") ?? null;

  // Próximo paso de la ruta: el primero cuyo step no tenga tarea completada
  const completedStepIds = new Set(tasks.filter((t) => t.status === "done" && t.source_step_id).map((t) => t.source_step_id!));
  const nextRouteStep = steps.find((s) => !completedStepIds.has(s.id)) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
      <main className="flex-1 container py-10 lg:py-14 max-w-6xl space-y-8">
        <EmailVerificationBanner />
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

        {/* Estado general + ruta + progreso */}
        <div className="grid lg:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2 bg-gradient-primary rounded-3xl p-7 lg:p-8 text-primary-foreground relative overflow-hidden shadow-deep">
            <div className="absolute -top-10 -right-10 h-48 w-48 bg-accent/30 rounded-full blur-3xl" />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground text-xs">
                  {PREP_LABEL[assessment.preparedness_level ?? "bajo"]}
                </Badge>
                <span className="text-xs uppercase tracking-[0.18em] opacity-75">Ruta principal</span>
              </div>
              <h2 className="font-display text-3xl lg:text-4xl font-semibold">{route?.name ?? "Sin ruta asignada"}</h2>
              <p className="opacity-85 max-w-xl text-sm">{route?.short_description}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                {route?.estimated_timeline && (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-primary-foreground/10 backdrop-blur-sm rounded-full px-3.5 py-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {route.estimated_timeline}
                  </span>
                )}
                {route && (
                  <Button asChild size="sm" variant="accent">
                    <Link to={`/rutas/${route.slug}`}>Ver ruta completa <ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-3xl p-7 shadow-elegant flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Progreso</p>
              <p className="font-display text-4xl font-semibold mb-1">{progress}%</p>
              <p className="text-sm text-muted-foreground">{completedTasks} de {tasks.length || 0} tareas completadas</p>
            </div>
            <div className="mt-5 h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-primary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
            </div>
          </motion.div>
        </div>

        {/* Próximo paso recomendado */}
        {nextRouteStep && (
          <div className="bg-accent-soft/50 border border-accent/30 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/15 grid place-items-center shrink-0">
                <Target className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                  Próximo paso recomendado · {nextRouteStep.estimated_duration ?? "duración variable"}
                </p>
                <p className="font-medium">{nextRouteStep.title}</p>
                {nextRouteStep.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{nextRouteStep.description}</p>}
              </div>
            </div>
            {nextRouteStep.official_link && (
              <Button asChild variant="accent" size="sm">
                <a href={nextRouteStep.official_link} target="_blank" rel="noreferrer">
                  Ir al trámite oficial <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Alertas missing */}
        {assessment.missing_requirements_json && Array.isArray(assessment.missing_requirements_json) && assessment.missing_requirements_json.length > 0 && (
          <div className="bg-warning/10 border border-warning/30 rounded-3xl p-6 lg:p-7">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4.5 w-4.5 text-warning" />
              <h3 className="font-display text-lg font-semibold">Lo que aún te falta para avanzar</h3>
            </div>
            <ul className="space-y-2 ml-7 list-disc text-sm text-foreground/80">
              {(assessment.missing_requirements_json as string[]).map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        )}

        {/* Checklist + Tareas */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Checklist documental */}
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 lg:p-7 shadow-elegant">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-display text-lg font-semibold">Checklist documental</h3>
              </div>
              <Badge variant="outline" className="text-xs">{docs.length} documentos</Badge>
            </div>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay documentos asociados a esta ruta.</p>
            ) : (
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <Circle className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{d.name}</p>
                        {d.official_link && (
                          <a href={d.official_link} target="_blank" rel="noreferrer" className="text-primary shrink-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      {d.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{d.description}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {d.required && <Badge variant="outline" className="text-[10px] h-5 bg-primary/5">Obligatorio</Badge>}
                        {d.translation_needed && <Badge variant="outline" className="text-[10px] h-5">Traducción</Badge>}
                        {d.apostille_needed && <Badge variant="outline" className="text-[10px] h-5">Apostilla</Badge>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tareas personales */}
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-7 shadow-elegant">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4.5 w-4.5 text-primary" />
                <h3 className="font-display text-lg font-semibold">Mis tareas</h3>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addCustomTask(); }}
                placeholder="Añadir tarea…"
                className="h-9 text-sm"
              />
              <Button size="sm" variant="soft" onClick={addCustomTask} disabled={!newTask.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">Aún no tienes tareas</p>
                <Button variant="soft" size="sm" onClick={seedTasksFromRoute}>Generar desde mi ruta</Button>
              </div>
            ) : (
              <ul className="space-y-1">
                {tasks.map((t) => (
                  <li key={t.id} className="group flex items-center gap-2 p-2 rounded-xl hover:bg-secondary/60">
                    <button onClick={() => toggleTask(t.id, t.status)} className="shrink-0">
                      {t.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                    <button onClick={() => deleteTask(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Timeline del proceso */}
        {steps.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-elegant">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="h-4.5 w-4.5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Timeline del proceso</h3>
            </div>
            <ol className="relative border-l-2 border-border ml-4 space-y-6">
              {steps.map((s) => {
                const isDone = completedStepIds.has(s.id);
                return (
                  <li key={s.id} className="ml-6">
                    <span className={`absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${isDone ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}`}>
                      {isDone ? <Check className="h-3 w-3" /> : s.step_order}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>{s.title}</p>
                        {s.estimated_duration && <Badge variant="outline" className="text-[10px] h-5">{s.estimated_duration}</Badge>}
                        {s.stage_location && <Badge variant="outline" className="text-[10px] h-5">{s.stage_location}</Badge>}
                      </div>
                      {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                      {s.official_link && (
                        <a href={s.official_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                          Enlace oficial <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* Recursos relacionados */}
        {resources.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-6 lg:p-7 shadow-elegant">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-primary" />
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
