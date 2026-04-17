// Lista cerrada de países hispanohablantes del mercado inicial.
// Este archivo es la fuente única de verdad para los dropdowns de país.

export type CountryCode =
  | "AR" | "BO" | "CL" | "CO" | "CR" | "CU" | "DO" | "EC" | "SV" | "ES"
  | "GT" | "HN" | "MX" | "NI" | "PA" | "PY" | "PE" | "UY" | "VE";

export type Country = {
  code: CountryCode;
  name: string;
  flag: string;
};

export const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "PA", name: "Panamá", flag: "🇵🇦" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
];

// Países que dan derecho a nacionalidad española por residencia tras 2 años
// (en lugar del plazo general de 10 años). Fuente: art. 22 Código Civil español.
export const IBEROAMERICAN_FAST_TRACK: CountryCode[] = [
  "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "SV",
  "GT", "HN", "MX", "NI", "PA", "PY", "PE", "UY", "VE",
];

export function isFastTrackNationality(code?: string | null): boolean {
  if (!code) return false;
  return IBEROAMERICAN_FAST_TRACK.includes(code as CountryCode);
}

export function getCountryName(code?: string | null): string {
  if (!code) return "—";
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export function getCountryFlag(code?: string | null): string {
  if (!code) return "";
  return COUNTRIES.find((c) => c.code === code)?.flag ?? "";
}
