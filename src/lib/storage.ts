import type { WizardAnswers, Recommendation } from "./wizard";
import { supabase } from "@/integrations/supabase/client";

const KEY_ANSWERS = "rea_wizard_answers";
const KEY_RESULT = "rea_wizard_result";

export const localStore = {
  saveAnswers(a: WizardAnswers) {
    try { localStorage.setItem(KEY_ANSWERS, JSON.stringify(a)); } catch {}
  },
  getAnswers(): WizardAnswers | null {
    try { const raw = localStorage.getItem(KEY_ANSWERS); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  saveResult(r: unknown) {
    try { localStorage.setItem(KEY_RESULT, JSON.stringify(r)); } catch {}
  },
  getResult<T = unknown>(): T | null {
    try { const raw = localStorage.getItem(KEY_RESULT); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  clear() {
    try { localStorage.removeItem(KEY_ANSWERS); localStorage.removeItem(KEY_RESULT); } catch {}
  },
};

/** Persist answers + recommendation into Supabase for an authenticated user. */
export async function persistAssessment(
  userId: string,
  answers: WizardAnswers,
  result: Recommendation
) {
  // Resolver UUIDs por slug
  const slugs = [result.primary, ...result.alternatives].filter(Boolean) as string[];
  const { data: routes } = await supabase
    .from("migration_routes")
    .select("id, slug")
    .in("slug", slugs);
  const idBySlug = new Map(routes?.map((r) => [r.slug, r.id]) ?? []);
  const primaryId = result.primary ? idBySlug.get(result.primary) ?? null : null;
  const altIds = result.alternatives.map((s) => idBySlug.get(s)).filter(Boolean);

  // Update profile
  await supabase.from("profiles").update({
    nationality: answers.nationality,
    current_country: answers.current_country,
    eu_status: answers.eu_status === "yes" ? true : answers.eu_status === "no" ? false : null,
    main_goal: answers.main_goal,
    work_offer: answers.work_offer === "yes" ? true : answers.work_offer === "no" ? false : null,
    study_admission: answers.study_admission === "yes" ? true : answers.study_admission === "no" ? false : null,
    family_in_spain: answers.family_in_spain === "yes" ? true : answers.family_in_spain === "no" ? false : null,
    timeline_goal: answers.timeline_goal,
    budget_range: answers.budget_range === "unknown" ? null : answers.budget_range,
    preferred_language: answers.preferred_language ?? "es",
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
