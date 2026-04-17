// Wizard preguntas y motor de recomendación
export type WizardAnswers = {
  nationality?: string;
  current_country?: string;
  eu_status?: "yes" | "no" | "unknown";
  main_goal?: "study" | "work" | "family" | "explore";
  work_offer?: "yes" | "no" | "unknown";
  study_admission?: "yes" | "no" | "unknown";
  family_in_spain?: "yes" | "no" | "unknown";
  timeline_goal?: "1-3" | "3-6" | "6-12" | "12+";
  budget_range?: "low" | "medium" | "high" | "unknown";
  urgency?: "exploring" | "planning" | "urgent";
  preferred_language?: "es" | "en" | "fr" | "other";
  started_process?: "no" | "docs" | "applied" | "in_progress";
  support_need?: "info" | "tracking" | "full";
};

export type RouteSlug = "estudios" | "trabajo" | "reagrupacion-familiar";

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
  evaluations: Record<RouteSlug, RouteEvaluation>;
};

export const ROUTE_LABEL: Record<RouteSlug, string> = {
  estudios: "Estancia por estudios",
  trabajo: "Autorización de residencia y trabajo",
  "reagrupacion-familiar": "Reagrupación familiar",
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
};

export function evaluate(a: WizardAnswers): Record<RouteSlug, RouteEvaluation> {
  const ev: Record<RouteSlug, RouteEvaluation> = {} as any;

  // ESTUDIOS
  {
    let score = 0;
    const missing: string[] = [];
    const reasons: string[] = [];
    if (a.study_admission === "yes") { score += 60; reasons.push("ya cuentas con admisión académica en España"); }
    else if (a.main_goal === "study") { score += 25; missing.push("Carta de admisión de un centro educativo español"); reasons.push("tu objetivo es estudiar pero falta confirmar la admisión"); }
    else if (a.main_goal === "explore") { score += 8; }
    if (a.budget_range === "low") missing.push("Acreditación de medios económicos suficientes (IPREM mensual)");
    if (a.timeline_goal === "1-3") score -= 5;
    if (!a.nationality) missing.push("Confirmar nacionalidad para validar requisitos consulares");
    ev.estudios = mkEval("estudios", score, missing, reasons.join(" y ") || "encaja parcialmente con tu perfil", a);
  }

  // TRABAJO
  {
    let score = 0;
    const missing: string[] = [];
    const reasons: string[] = [];
    if (a.work_offer === "yes") { score += 60; reasons.push("tienes una oferta firme que activa el procedimiento"); }
    else if (a.main_goal === "work") { score += 25; missing.push("Oferta de trabajo firme de un empleador en España"); reasons.push("tu objetivo es laboral pero aún sin oferta"); }
    else if (a.main_goal === "explore") { score += 8; }
    if (a.budget_range === "low") missing.push("Tasas y trámites pueden requerir presupuesto medio");
    if (a.timeline_goal === "1-3") score -= 10;
    ev.trabajo = mkEval("trabajo", score, missing, reasons.join(" y ") || "encaja parcialmente con tu perfil", a);
  }

  // REAGRUPACIÓN
  {
    let score = 0;
    const missing: string[] = [];
    const reasons: string[] = [];
    if (a.family_in_spain === "yes") { score += 55; reasons.push("tienes familiar directo residiendo legalmente en España"); }
    else if (a.main_goal === "family") { score += 20; missing.push("Familiar directo residiendo legalmente en España"); reasons.push("buscas reunirte con familia pero el familiar aún no reside legalmente"); }
    else if (a.main_goal === "explore") { score += 5; }
    if (a.timeline_goal === "1-3") score -= 15;
    ev["reagrupacion-familiar"] = mkEval("reagrupacion-familiar", score, missing, reasons.join(" y ") || "encaja parcialmente con tu perfil", a);
  }

  return ev;
}

function mkEval(slug: RouteSlug, score: number, missing: string[], reason: string, a: WizardAnswers): RouteEvaluation {
  const def = ROUTE_DEFAULTS[slug];
  let viability: Viability = "baja";
  if (score >= 55) viability = "alta";
  else if (score >= 25) viability = "media";

  // next steps: si faltan cosas, las primeras como acción; si no, baseSteps
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
    nextSteps,
  };
}

export function recommend(a: WizardAnswers): Recommendation {
  const isEU = a.eu_status === "yes";
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
    explanation =
      "Como ciudadano UE/EEE/Suiza no necesitas visado nacional. Tu trámite principal será el registro de ciudadano de la Unión y, si procede, el certificado de residencia. Las rutas de visado se muestran solo a título informativo.";
  } else if (primary === "estudios") {
    explanation = a.study_admission === "yes"
      ? "Cuentas con admisión académica en España, lo que te permite tramitar el visado de estancia por estudios como vía principal."
      : "Tu objetivo es estudiar en España. La ruta de estudios es la más adecuada cuando consigas la admisión en un centro español.";
  } else if (primary === "trabajo") {
    explanation = a.work_offer === "yes"
      ? "Tu oferta de trabajo activa el procedimiento de autorización de residencia y trabajo iniciado por el empleador en España."
      : "Tu objetivo laboral apunta a la autorización de residencia y trabajo. Esta ruta requiere una oferta firme antes de iniciar el trámite.";
  } else if (primary === "reagrupacion-familiar") {
    explanation = a.family_in_spain === "yes"
      ? "Tu familiar residente en España puede iniciar el procedimiento de reagrupación, siempre que cumpla los requisitos de tiempo de residencia y medios económicos."
      : "Para la reagrupación familiar es imprescindible que tengas un familiar directo residiendo legalmente en España con condiciones acreditables.";
  } else {
    explanation = "Con la información facilitada no podemos sugerir una ruta clara. Te recomendamos explorar las tres vías disponibles para entender cuál encaja mejor con tu situación.";
  }

  // Missing agregado: del primary
  const missing = primary ? evaluations[primary].missing : [];

  return { primary, alternatives, preparedness, explanation, missing, isEU, evaluations };
}

export const TIMELINE_LABEL: Record<string, string> = {
  "1-3": "1-3 meses",
  "3-6": "3-6 meses",
  "6-12": "6-12 meses",
  "12+": "Más de 12 meses",
};

export const BUDGET_LABEL: Record<string, string> = {
  low: "Bajo (<2.000 €)",
  medium: "Medio (2.000-6.000 €)",
  high: "Alto (>6.000 €)",
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
