import type { WizardAnswers, Recommendation } from "./wizard";
import { isFastTrackNationality } from "./countries";
import { supabase } from "@/integrations/supabase/client";

const KEY_ANSWERS = "rea_wizard_answers";
const KEY_RESULT = "rea_wizard_result";

export const localStore = {
  saveAnswers(a: WizardAnswers) { try { localStorage.setItem(KEY_ANSWERS, JSON.stringify(a)); } catch {} },
  getAnswers(): WizardAnswers | null {
    try { const raw = localStorage.getItem(KEY_ANSWERS); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  saveResult(r: unknown) { try { localStorage.setItem(KEY_RESULT, JSON.stringify(r)); } catch {} },
  getResult<T = unknown>(): T | null {
    try { const raw = localStorage.getItem(KEY_RESULT); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  clear() { try { localStorage.removeItem(KEY_ANSWERS); localStorage.removeItem(KEY_RESULT); } catch {} },
};

export async function persistAssessment(
  userId: string,
  answers: WizardAnswers,
  result: Recommendation,
) {
  // Resolver UUIDs de rutas por slug
  const slugs = [result.primary, ...result.alternatives].filter(Boolean) as string[];
  const { data: routes } = await supabase
    .from("migration_routes")
    .select("id, slug")
    .in("slug", slugs);
  const idBySlug = new Map(routes?.map((r) => [r.slug, r.id]) ?? []);
  const primaryId = result.primary ? idBySlug.get(result.primary) ?? null : null;
  const altIds = result.alternatives.map((s) => idBySlug.get(s)).filter(Boolean);

  const activeNat = answers.active_process_nationality || answers.primary_nationality;
  const fastTrack = isFastTrackNationality(activeNat);

  // Update profile (campos NUEVOS estructurados + algunos viejos por compatibilidad)
  await supabase.from("profiles").update({
    birth_country: answers.birth_country,
    primary_nationality: answers.primary_nationality,
    has_second_nationality: !!answers.has_second_nationality,
    second_nationality: answers.has_second_nationality ? (answers.second_nationality ?? null) : null,
    active_process_nationality: activeNat,
    eligible_fast_track_nationality: fastTrack,
    current_residence_country: answers.current_residence_country,
    currently_in_spain: !!answers.currently_in_spain,
    current_spain_status: answers.current_spain_status ?? null,
    intended_route: answers.intended_route,
    timeline_goal: answers.timeline_goal === "unknown" ? null : answers.timeline_goal,
    preferred_language: answers.preferred_language ?? "es",
    // Legacy mapping
    nationality: answers.primary_nationality ?? answers.nationality ?? null,
    current_country: answers.current_residence_country ?? answers.current_country ?? null,
  }).eq("id", userId);

  // Insert assessment
  const { data: inserted, error } = await supabase
    .from("assessment_results")
    .insert({
      profile_id: userId,
      primary_route_id: primaryId,
      alternative_route_ids_json: altIds,
      preparedness_level: result.preparedness,
      explanation: result.explanation,
      missing_requirements_json: result.missing,
    })
    .select()
    .single();

  if (error) throw error;
  return inserted;
}
