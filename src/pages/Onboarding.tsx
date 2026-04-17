import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { localStore, persistAssessment } from "@/lib/storage";
import { recommend, WizardAnswers } from "@/lib/wizard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Step = {
  id: keyof WizardAnswers;
  question: string;
  helper?: string;
  type: "text" | "choice";
  options?: { value: string; label: string; desc?: string }[];
  show?: (a: WizardAnswers) => boolean;
};

const STEPS: Step[] = [
  { id: "nationality", question: "¿Cuál es tu nacionalidad?", type: "text", helper: "País del pasaporte con el que viajarías." },
  { id: "current_country", question: "¿En qué país resides actualmente?", type: "text" },
  {
    id: "eu_status", question: "¿Tienes ciudadanía de la UE/EEE/Suiza?", type: "choice",
    options: [{ value: "yes", label: "Sí" }, { value: "no", label: "No" }],
  },
  {
    id: "main_goal", question: "¿Cuál es tu objetivo principal para venir a España?", type: "choice",
    options: [
      { value: "study", label: "Estudiar", desc: "Universidad, FP, idiomas, máster…" },
      { value: "work", label: "Trabajar", desc: "Cuenta ajena con empleador en España" },
      { value: "family", label: "Reunirme con mi familia", desc: "Familiar directo ya residente" },
      { value: "explore", label: "Aún explorando", desc: "Quiero ver mis opciones" },
    ],
  },
  {
    id: "study_admission", question: "¿Has sido admitido en un centro de estudios en España?", type: "choice",
    options: [{ value: "yes", label: "Sí, tengo carta de admisión" }, { value: "no", label: "Todavía no" }],
    show: (a) => a.main_goal === "study" || a.main_goal === "explore",
  },
  {
    id: "work_offer", question: "¿Tienes una oferta de trabajo en España?", type: "choice",
    options: [{ value: "yes", label: "Sí, oferta firme" }, { value: "no", label: "No, todavía no" }],
    show: (a) => a.main_goal === "work" || a.main_goal === "explore",
  },
  {
    id: "family_in_spain", question: "¿Tienes familiares directos residiendo legalmente en España?", type: "choice",
    options: [{ value: "yes", label: "Sí" }, { value: "no", label: "No" }],
    show: (a) => a.main_goal === "family" || a.main_goal === "explore",
  },
  {
    id: "timeline_goal", question: "¿Cuál es tu plazo ideal para mudarte?", type: "choice",
    options: [
      { value: "1-3", label: "1-3 meses" },
      { value: "3-6", label: "3-6 meses" },
      { value: "6-12", label: "6-12 meses" },
      { value: "12+", label: "Más de 12 meses" },
    ],
  },
  {
    id: "budget_range", question: "¿Cuál es tu presupuesto aproximado para iniciar el proceso?", type: "choice",
    helper: "Incluye tasas, traducciones, apostillas, viaje y primeros gastos.",
    options: [
      { value: "low", label: "Menos de 2.000 €" },
      { value: "medium", label: "2.000 € – 6.000 €" },
      { value: "high", label: "Más de 6.000 €" },
    ],
  },
];

const Onboarding = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<WizardAnswers>(() => localStore.getAnswers() ?? {});
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const visibleSteps = STEPS.filter((s) => !s.show || s.show(answers));
  const step = visibleSteps[idx];
  const total = visibleSteps.length;
  const progress = ((idx + 1) / total) * 100;
  const value = step ? (answers as any)[step.id] ?? "" : "";
  const canNext = step?.type === "text" ? String(value).trim().length > 0 : !!value;

  const handleNext = async () => {
    localStore.saveAnswers(answers);
    if (idx < total - 1) {
      setIdx(idx + 1);
      return;
    }
    const result = recommend(answers);
    localStore.saveResult(result);
    if (user) {
      setSubmitting(true);
      try {
        await persistAssessment(user.id, answers, result);
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

  const setValue = (v: string) => setAnswers({ ...answers, [step.id]: v as any });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <SiteHeader />
      <main className="flex-1 container py-10 lg:py-16 max-w-3xl">
        {/* Progreso */}
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
            key={step.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance">
                {step.question}
              </h1>
              {step.helper && <p className="text-muted-foreground">{step.helper}</p>}
            </div>

            {step.type === "text" ? (
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && canNext) handleNext(); }}
                placeholder="Escribe tu respuesta…"
                className="h-14 text-lg rounded-2xl border-2 px-5 focus-visible:ring-primary/30"
              />
            ) : (
              <div className="grid gap-3">
                {step.options!.map((o) => {
                  const selected = value === o.value;
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

        <p className="text-xs text-muted-foreground text-center mt-8">
          Información orientativa basada en fuentes oficiales. No sustituye asesoramiento jurídico individual.
        </p>
      </main>
    </div>
  );
};

export default Onboarding;
