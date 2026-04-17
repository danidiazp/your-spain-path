import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { localStore, persistAssessment } from "@/lib/storage";
import { recommend, WizardAnswers, type SpainStatus, type IntendedRoute } from "@/lib/wizard";
import { COUNTRIES } from "@/lib/countries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Choice = { value: string; label: string; desc?: string };

type Step = {
  id: string;
  question: string;
  helper?: string;
  why?: string;
  type: "country" | "choice";
  field: keyof WizardAnswers;
  options?: Choice[];
  show?: (a: WizardAnswers) => boolean;
};

const YES_NO: Choice[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
];

const SPAIN_STATUS: Choice[] = [
  { value: "tourist", label: "Turista" },
  { value: "student", label: "Estudiante" },
  { value: "valid_residence", label: "Residencia válida" },
  { value: "renewing", label: "En proceso de renovación" },
  { value: "irregular", label: "Situación irregular" },
  { value: "other", label: "Otra" },
];

const ROUTE_OPTIONS: Choice[] = [
  { value: "estudios", label: "Estudios", desc: "Universidad, FP, máster, idiomas" },
  { value: "trabajo", label: "Trabajo", desc: "Cuenta ajena con empleador en España" },
  { value: "reagrupacion-familiar", label: "Reagrupación familiar", desc: "Familiar directo ya residente" },
  { value: "regularizacion", label: "Regularización / arraigo", desc: "Estás en España y buscas regularizar" },
  { value: "unknown", label: "Todavía no lo sé", desc: "Quiero ver mis opciones" },
];

const STEPS: Step[] = [
  {
    id: "birth_country", field: "birth_country", type: "country",
    question: "¿En qué país naciste?",
    why: "El país de nacimiento puede afectar a algunos trámites consulares y de antecedentes penales.",
  },
  {
    id: "primary_nationality", field: "primary_nationality", type: "country",
    question: "¿Cuál es tu nacionalidad principal?",
    helper: "El país del pasaporte que usarías por defecto.",
    why: "La nacionalidad determina el régimen de visado y plazos para nacionalidad española por residencia.",
  },
  {
    id: "has_second_nationality", field: "has_second_nationality", type: "choice", options: YES_NO,
    question: "¿Tienes una segunda nacionalidad o pasaporte?",
    why: "Si tienes doble nacionalidad podrás elegir el pasaporte más favorable para tu proceso.",
  },
  {
    id: "second_nationality", field: "second_nationality", type: "country",
    question: "¿Cuál es tu segunda nacionalidad?",
    show: (a) => a.has_second_nationality === true,
  },
  {
    id: "active_process_nationality", field: "active_process_nationality", type: "country",
    question: "¿Qué nacionalidad usarás para tu proceso?",
    helper: "Puedes cambiarla más adelante. Esta nacionalidad determina tu ruta y tu pricing.",
    why: "Algunos países (iberoamericanos) acceden a la nacionalidad española por residencia en 2 años en lugar de 10.",
    show: (a) => a.has_second_nationality === true,
  },
  {
    id: "current_residence_country", field: "current_residence_country", type: "country",
    question: "¿En qué país resides actualmente?",
    why: "Tu país de residencia define el consulado competente y los tiempos de cita.",
  },
  {
    id: "currently_in_spain", field: "currently_in_spain", type: "choice", options: YES_NO,
    question: "¿Te encuentras actualmente en España?",
    why: "Si ya estás en España se abren vías como regularización, arraigo o cambio de situación.",
  },
  {
    id: "current_spain_status", field: "current_spain_status", type: "choice", options: SPAIN_STATUS,
    question: "¿Cuál es tu situación actual en España?",
    show: (a) => a.currently_in_spain === true,
  },
  {
    id: "intended_route", field: "intended_route", type: "choice", options: ROUTE_OPTIONS,
    question: "¿Qué ruta te interesa?",
    helper: "Si todavía no lo tienes claro, podemos sugerírtela según tu perfil.",
  },
];

const Onboarding = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<WizardAnswers>(() => localStore.getAnswers() ?? {});
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const visibleSteps = useMemo(() => STEPS.filter((s) => !s.show || s.show(answers)), [answers]);
  const step = visibleSteps[idx];
  const total = visibleSteps.length;
  const progress = ((idx + 1) / total) * 100;

  const rawValue: any = step ? (answers as any)[step.field] : undefined;
  let displayValue: string = "";
  if (rawValue === true) displayValue = "yes";
  else if (rawValue === false) displayValue = "no";
  else if (rawValue != null) displayValue = String(rawValue);

  const canNext = step?.type === "country" ? !!displayValue : !!displayValue;

  const setValue = (v: string) => {
    let parsed: any = v;
    if (step.type === "choice" && step.options === YES_NO) {
      parsed = v === "yes";
    }
    const next: WizardAnswers = { ...answers, [step.field]: parsed };

    // Si activa el toggle has_second_nationality y la respuesta es no, limpiar campos siguientes
    if (step.field === "has_second_nationality" && parsed === false) {
      next.second_nationality = undefined;
      next.active_process_nationality = answers.primary_nationality;
    }
    // Si no está en España, limpiar status
    if (step.field === "currently_in_spain" && parsed === false) {
      next.current_spain_status = undefined;
    }
    setAnswers(next);
  };

  const handleNext = async () => {
    localStore.saveAnswers(answers);
    if (idx < total - 1) { setIdx(idx + 1); return; }
    // Último: si no se eligió active_process_nationality, usar primary
    const finalAnswers: WizardAnswers = {
      ...answers,
      active_process_nationality: answers.active_process_nationality ?? answers.primary_nationality,
    };
    localStore.saveAnswers(finalAnswers);
    const result = recommend(finalAnswers);
    localStore.saveResult(result);
    if (user) {
      setSubmitting(true);
      try {
        await persistAssessment(user.id, finalAnswers, result);
      } catch (e: any) {
        toast.error("No pudimos guardar tu diagnóstico", { description: e.message });
      } finally {
        setSubmitting(false);
      }
    }
    nav("/resultados");
  };

  const handleBack = () => {
    if (idx > 0) setIdx(idx - 1);
    else nav("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <SiteHeader />
      <main className="flex-1 container py-10 lg:py-16 max-w-2xl">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Pregunta {idx + 1} de {total}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step?.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
                {step?.question}
              </h1>
              {step?.helper && <p className="text-muted-foreground">{step.helper}</p>}
              {step?.why && (
                <div className="inline-flex items-start gap-2 px-3 py-2 rounded-xl bg-secondary/60 border border-border/60 text-xs text-muted-foreground max-w-prose">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                  <span><span className="font-medium text-foreground/80">Por qué te lo preguntamos: </span>{step.why}</span>
                </div>
              )}
            </div>

            {step?.type === "country" ? (
              <Select value={displayValue} onValueChange={setValue}>
                <SelectTrigger className="h-14 text-base rounded-2xl border-2 px-5">
                  <SelectValue placeholder="Selecciona un país…" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="mr-2">{c.flag}</span> {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="grid gap-3">
                {step?.options!.map((o) => {
                  const selected = displayValue === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setValue(o.value)}
                      className={`group text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                        selected
                          ? "border-primary bg-primary/5 shadow-elegant"
                          : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="font-medium text-base">{o.label}</p>
                          {o.desc && <p className="text-sm text-muted-foreground">{o.desc}</p>}
                        </div>
                        <div className={`shrink-0 h-6 w-6 rounded-full border-2 grid place-items-center transition-all ${
                          selected ? "bg-primary border-primary" : "border-border"
                        }`}>
                          {selected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-10">
          <Button variant="ghost" onClick={handleBack} disabled={submitting}>
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>
          <Button variant="hero" size="lg" onClick={handleNext} disabled={!canNext || submitting}>
            {submitting ? "Guardando…" : idx === total - 1 ? "Ver mi recomendación" : "Continuar"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8 max-w-prose mx-auto">
          Usaremos tu nacionalidad y situación actual para recomendarte la ruta más adecuada hacia España. Información orientativa basada en fuentes oficiales — no sustituye asesoramiento jurídico individual.
        </p>
      </main>
    </div>
  );
};

export default Onboarding;
