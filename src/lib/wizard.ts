// Wizard preguntas y motor de recomendación.
// MVP enfocado en hispanohablantes: usa códigos ISO de país (no texto libre)
// y soporta doble nacionalidad. Ver src/lib/countries.ts.
import { isFastTrackNationality } from "./countries";

export type SpainStatus =
  | "tourist"
  | "student"
  | "valid_residence"
  | "renewing"
  | "irregular"
  | "other";

export type IntendedRoute =
  | "estudios"
  | "trabajo"
  | "reagrupacion-familiar"
  | "regularizacion"
  | "unknown";

export type WizardAnswers = {
  // Identidad y nacionalidad
  birth_country?: string;                // ISO-2
  primary_nationality?: string;          // ISO-2
  has_second_nationality?: boolean;
  second_nationality?: string;           // ISO-2 (opcional)
  active_process_nationality?: string;   // ISO-2: la que se usará para tramitar
  // Situación geográfica
  current_residence_country?: string;    // ISO-2
  currently_in_spain?: boolean;
  current_spain_status?: SpainStatus;
  // Intención
  intended_route?: IntendedRoute;
  // Soporte y plazo
  timeline_goal?: "1-3" | "3-6" | "6-12" | "12+" | "unknown";
  preferred_language?: "es" | "en" | "fr" | "other";
  // Legacy fields (coexistencia, no usados por el motor nuevo)
  nationality?: string;
  current_country?: string;
  eu_status?: "yes" | "no" | "unknown";
  main_goal?: "study" | "work" | "family" | "explore";
  work_offer?: "yes" | "no" | "unknown";
  study_admission?: "yes" | "no" | "unknown";
  family_in_spain?: "yes" | "no" | "unknown";
  budget_range?: "low" | "medium" | "high" | "unknown";
  urgency?: "exploring" | "planning" | "urgent";
  started_process?: "no" | "docs" | "applied" | "in_progress";
  support_need?: "info" | "tracking" | "full";
};

export type RouteSlug = "estudios" | "trabajo" | "reagrupacion-familiar" | "regularizacion";

export type Viability = "alta" | "media" | "baja";
export type Difficulty = "baja" | "media" | "alta";

export type RouteEvaluation = {
  slug: RouteSlug;
  score: number;
  viability: Viability;
  difficulty: Difficulty;
  estimatedTime: string;
  reason: string;
  missing: string[];
  blockers: string[];
  nextSteps: string[];
};

export type Recommendation = {
  primary: RouteSlug | null;
  alternatives: RouteSlug[];
  preparedness: "alto" | "medio" | "bajo";
  explanation: string;
  missing: string[];
  isEU: boolean;
  fastTrackNationality: boolean;     // Iberoamericano: 2 años para nacionalidad
  fastTrackMessage?: string;
  evaluations: Record<RouteSlug, RouteEvaluation>;
};

export const ROUTE_LABEL: Record<RouteSlug, string> = {
  estudios: "Estancia por estudios",
  trabajo: "Autorización de residencia y trabajo",
  "reagrupacion-familiar": "Reagrupación familiar",
  regularizacion: "Regularización / arraigo",
};

const ROUTE_DEFAULTS: Record<RouteSlug, { time: string; difficulty: Difficulty; baseSteps: string[] }> = {
  estudios: {
    time: "2 a 4 meses desde la admisión",
    difficulty: "media",
    baseSteps: [
      "Conseguir o confirmar la carta de admisión del centro educativo en España",
      "Reunir documentos personales (pasaporte, antecedentes penales apostillados, seguro médico)",
      "Solicitar cita en el consulado español de tu país de residencia",
    ],
  },
  trabajo: {
    time: "3 a 8 meses según comunidad autónoma",
    difficulty: "alta",
    baseSteps: [
      "Confirmar oferta firme y que el empleador inicie la solicitud de autorización",
      "Preparar documentación personal y antecedentes penales apostillados",
      "Tras la resolución favorable, pedir cita consular para el visado de trabajo",
    ],
  },
  "reagrupacion-familiar": {
    time: "4 a 9 meses desde la solicitud inicial",
    difficulty: "media",
    baseSteps: [
      "Tu familiar reagrupante debe acreditar residencia legal y medios económicos en España",
      "Solicitar el informe de habitabilidad de la vivienda en el ayuntamiento",
      "Presentar la solicitud de reagrupación en la Oficina de Extranjería",
    ],
  },
  regularizacion: {
    time: "Variable: arraigo social/laboral suele requerir 2-3 años en España",
    difficulty: "alta",
    baseSteps: [
      "Acreditar tiempo de permanencia continuada en España (empadronamiento, certificados)",
      "Reunir contrato de trabajo o informe de arraigo social del ayuntamiento",
      "Presentar la solicitud de autorización por arraigo en la Oficina de Extranjería",
    ],
  },
};

export function evaluate(a: WizardAnswers): Record<RouteSlug, RouteEvaluation> {
  const ev: Record<RouteSlug, RouteEvaluation> = {} as any;
  const inSpain = a.currently_in_spain === true;
  const route = a.intended_route;

  // ESTUDIOS
  {
    let score = 0;
    const missing: string[] = [];
    const blockers: string[] = [];
    const reasons: string[] = [];
    if (route === "estudios") { score += 55; reasons.push("indicaste estudios como tu vía de interés"); }
    else if (route === "unknown") { score += 15; }
    if (a.study_admission === "yes") { score += 15; reasons.push("ya cuentas con admisión académica"); }
    else { missing.push("Carta de admisión de un centro educativo español"); }
    if (inSpain && a.current_spain_status === "student") {
      score += 10;
      reasons.push("ya estás en España como estudiante, lo que facilita renovación o cambio");
    }
    blockers.push("Necesitas acreditar medios económicos suficientes (~600 €/mes IPREM)");
    ev.estudios = mkEval("estudios", score, missing, blockers, reasons.join(" y ") || "encaja parcialmente con tu perfil");
  }

  // TRABAJO
  {
    let score = 0;
    const missing: string[] = [];
    const blockers: string[] = [];
    const reasons: string[] = [];
    if (route === "trabajo") { score += 55; reasons.push("buscas residir y trabajar en España"); }
    else if (route === "unknown") { score += 15; }
    if (a.work_offer === "yes") { score += 15; reasons.push("tienes una oferta firme"); }
    else { missing.push("Oferta de trabajo firme de un empleador en España"); blockers.push("Sin oferta firme no puede iniciarse la autorización (la inicia el empleador)"); }
    if (inSpain && a.current_spain_status === "student") {
      score += 5;
      reasons.push("estando como estudiante puedes compatibilizar trabajo en supuestos limitados o transitar a residencia y trabajo");
    }
    ev.trabajo = mkEval("trabajo", score, missing, blockers, reasons.join(" y ") || "encaja parcialmente con tu perfil");
  }

  // REAGRUPACIÓN
  {
    let score = 0;
    const missing: string[] = [];
    const blockers: string[] = [];
    const reasons: string[] = [];
    if (route === "reagrupacion-familiar") { score += 55; reasons.push("tu vía de interés es reunirte con familia"); }
    else if (route === "unknown") { score += 10; }
    if (a.family_in_spain === "yes") { score += 15; reasons.push("tienes familiar directo residiendo legalmente en España"); }
    else { missing.push("Familiar reagrupante con residencia legal en España"); }
    blockers.push("El familiar reagrupante debe acreditar al menos 1 año de residencia legal renovada por otro año");
    blockers.push("Se exige vivienda adecuada (informe de habitabilidad) y medios económicos suficientes");
    ev["reagrupacion-familiar"] = mkEval("reagrupacion-familiar", score, missing, blockers, reasons.join(" y ") || "encaja parcialmente con tu perfil");
  }

  // REGULARIZACIÓN / ARRAIGO (solo aplica si está en España)
  {
    let score = 0;
    const missing: string[] = [];
    const blockers: string[] = [];
    const reasons: string[] = [];
    if (inSpain) {
      score += 30;
      reasons.push("ya te encuentras en España");
      if (route === "regularizacion") score += 30;
      if (a.current_spain_status === "irregular") {
        score += 15;
        reasons.push("tu situación irregular hace de la regularización por arraigo una vía probable");
      }
      if (a.current_spain_status === "tourist") {
        blockers.push("La estancia turística no computa como residencia legal: necesitarás acreditar permanencia efectiva por otros medios");
      }
      missing.push("Acreditar tiempo de permanencia continuada (empadronamiento, certificados, facturas)");
      blockers.push("El arraigo social suele requerir 3 años; el laboral 2 años con relación laboral acreditada");
    } else {
      // Desde fuera de España, no tiene sentido como vía principal.
      score = 0;
      blockers.push("Esta vía solo aplica a personas que ya residen en España");
    }
    ev.regularizacion = mkEval("regularizacion", score, missing, blockers, reasons.join(" y ") || "no aplica desde fuera de España");
  }

  return ev;
}

function mkEval(slug: RouteSlug, score: number, missing: string[], blockers: string[], reason: string): RouteEvaluation {
  const def = ROUTE_DEFAULTS[slug];
  let viability: Viability = "baja";
  if (score >= 55) viability = "alta";
  else if (score >= 25) viability = "media";

  const nextSteps = missing.length > 0
    ? [...missing.slice(0, 2), def.baseSteps[0]].slice(0, 3)
    : def.baseSteps.slice(0, 3);

  return {
    slug,
    score: Math.max(0, score),
    viability,
    difficulty: def.difficulty,
    estimatedTime: def.time,
    reason,
    missing,
    blockers,
    nextSteps,
  };
}

export function recommend(a: WizardAnswers): Recommendation {
  // EU status: Spain es UE, pero el usuario que use pasaporte ES es ciudadano UE.
  const isEU = a.active_process_nationality === "ES" || a.primary_nationality === "ES";
  // Iberoamericano (fast-track 2 años para nacionalidad española por residencia)
  const activeNat = a.active_process_nationality || a.primary_nationality;
  const fastTrack = !isEU && isFastTrackNationality(activeNat);

  const evaluations = evaluate(a);

  const ranked = (Object.values(evaluations) as RouteEvaluation[])
    .sort((x, y) => y.score - x.score)
    .filter((e) => e.score > 0);

  const primary = ranked[0]?.slug ?? null;
  const alternatives = ranked.slice(1, 3).map((e) => e.slug);

  let preparedness: Recommendation["preparedness"] = "bajo";
  const top = ranked[0]?.score ?? 0;
  if (top >= 55) preparedness = "alto";
  else if (top >= 25) preparedness = "medio";

  let explanation = "";
  if (isEU) {
    explanation = "Como ciudadano español/UE no necesitas visado nacional. Tu trámite principal será el registro de ciudadano de la Unión y, si procede, el certificado de residencia.";
  } else if (a.currently_in_spain) {
    explanation = "Ya te encuentras en España, por lo que evaluamos tanto vías de regularización (arraigo) como rutas de cambio o renovación según tu situación actual.";
  } else if (primary === "estudios") {
    explanation = "La ruta de estudios es la más adecuada cuando tu objetivo es formarte en España y consigues admisión en un centro reconocido.";
  } else if (primary === "trabajo") {
    explanation = "Tu objetivo laboral apunta a la autorización de residencia y trabajo. Esta ruta requiere una oferta firme antes de iniciar el trámite.";
  } else if (primary === "reagrupacion-familiar") {
    explanation = "Para la reagrupación familiar es imprescindible que tengas un familiar directo residiendo legalmente en España con condiciones acreditables.";
  } else {
    explanation = "Con la información facilitada podemos sugerirte rutas orientativas; te recomendamos completar tu perfil para afinar la recomendación.";
  }

  const fastTrackMessage = fastTrack
    ? "Como nacional de origen de un país iberoamericano, podrás solicitar la nacionalidad española por residencia tras 2 años de residencia legal y continuada (en lugar de los 10 años del régimen general). Fuente: art. 22 Código Civil."
    : undefined;

  const missing = primary ? evaluations[primary].missing : [];

  return { primary, alternatives, preparedness, explanation, missing, isEU, fastTrackNationality: fastTrack, fastTrackMessage, evaluations };
}

export const TIMELINE_LABEL: Record<string, string> = {
  "1-3": "1-3 meses",
  "3-6": "3-6 meses",
  "6-12": "6-12 meses",
  "12+": "Más de 12 meses",
};

export const VIABILITY_LABEL: Record<Viability, string> = {
  alta: "Viabilidad alta",
  media: "Viabilidad media",
  baja: "Viabilidad baja",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  baja: "Dificultad baja",
  media: "Dificultad media",
  alta: "Dificultad alta",
};

export const SPAIN_STATUS_LABEL: Record<SpainStatus, string> = {
  tourist: "Turista",
  student: "Estudiante",
  valid_residence: "Residencia válida",
  renewing: "En proceso de renovación",
  irregular: "Situación irregular",
  other: "Otra",
};

export const INTENDED_ROUTE_LABEL: Record<IntendedRoute, string> = {
  estudios: "Estudios",
  trabajo: "Trabajo",
  "reagrupacion-familiar": "Reagrupación familiar",
  regularizacion: "Regularización / arraigo",
  unknown: "Todavía no lo sé",
};

// Compat con código viejo:
export const BUDGET_LABEL: Record<string, string> = {
  low: "Bajo (<2.000 €)",
  medium: "Medio (2.000-6.000 €)",
  high: "Alto (>6.000 €)",
};
