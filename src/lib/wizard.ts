// Wizard preguntas y motor de recomendación
export type WizardAnswers = {
  nationality?: string;
  current_country?: string;
  eu_status?: "yes" | "no";
  main_goal?: "study" | "work" | "family" | "explore";
  work_offer?: "yes" | "no";
  study_admission?: "yes" | "no";
  family_in_spain?: "yes" | "no";
  timeline_goal?: "1-3" | "3-6" | "6-12" | "12+";
  budget_range?: "low" | "medium" | "high";
};

export type RouteSlug = "estudios" | "trabajo" | "reagrupacion-familiar";

export type Recommendation = {
  primary: RouteSlug | null;
  alternatives: RouteSlug[];
  preparedness: "alto" | "medio" | "bajo";
  explanation: string;
  missing: string[];
  isEU: boolean;
};

export const ROUTE_LABEL: Record<RouteSlug, string> = {
  "estudios": "Estancia por estudios",
  "trabajo": "Autorización de residencia y trabajo",
  "reagrupacion-familiar": "Reagrupación familiar",
};

export function recommend(a: WizardAnswers): Recommendation {
  const isEU = a.eu_status === "yes";
  const scores: Record<RouteSlug, number> = {
    "estudios": 0,
    "trabajo": 0,
    "reagrupacion-familiar": 0,
  };
  const missing: string[] = [];

  if (a.study_admission === "yes") scores["estudios"] += 60;
  else if (a.main_goal === "study") {
    scores["estudios"] += 25;
    missing.push("Carta de admisión de un centro educativo español");
  }

  if (a.work_offer === "yes") scores["trabajo"] += 60;
  else if (a.main_goal === "work") {
    scores["trabajo"] += 25;
    missing.push("Oferta de trabajo firme de un empleador en España");
  }

  if (a.family_in_spain === "yes") scores["reagrupacion-familiar"] += 55;
  else if (a.main_goal === "family") {
    scores["reagrupacion-familiar"] += 20;
    missing.push("Familiar directo residiendo legalmente en España");
  }

  // Plazo y presupuesto modulan
  if (a.timeline_goal === "1-3") {
    scores["estudios"] -= 5;
    scores["trabajo"] -= 10;
    scores["reagrupacion-familiar"] -= 15;
  }
  if (a.budget_range === "low") missing.push("Acreditación de medios económicos suficientes");

  const ranked = (Object.entries(scores) as [RouteSlug, number][])
    .sort((x, y) => y[1] - x[1])
    .filter(([, v]) => v > 0);

  const primary = ranked[0]?.[0] ?? null;
  const alternatives = ranked.slice(1, 3).map(([k]) => k);

  let preparedness: Recommendation["preparedness"] = "bajo";
  const top = ranked[0]?.[1] ?? 0;
  if (top >= 60) preparedness = "alto";
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

  return { primary, alternatives, preparedness, explanation, missing, isEU };
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
