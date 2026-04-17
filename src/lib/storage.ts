import type { WizardAnswers } from "./wizard";

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
