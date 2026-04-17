import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordChecks = {
  length: boolean;
  letter: boolean;
  number: boolean;
};

export function checkPassword(pwd: string): PasswordChecks {
  return {
    length: pwd.length >= 8,
    letter: /[a-zA-Z]/.test(pwd),
    number: /\d/.test(pwd),
  };
}

export function isPasswordValid(pwd: string) {
  const c = checkPassword(pwd);
  return c.length && c.letter && c.number;
}

const RULES: { key: keyof PasswordChecks; label: string }[] = [
  { key: "length", label: "Al menos 8 caracteres" },
  { key: "letter", label: "Una letra" },
  { key: "number", label: "Un número" },
];

export function PasswordRequirements({ password }: { password: string }) {
  const checks = checkPassword(password);
  return (
    <ul className="space-y-1 mt-2" aria-live="polite">
      {RULES.map((r) => {
        const ok = checks[r.key];
        return (
          <li
            key={r.key}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              ok ? "text-success" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-4 w-4 rounded-full grid place-items-center border",
                ok ? "bg-success/15 border-success/30" : "border-border bg-muted"
              )}
            >
              {ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5 opacity-40" />}
            </span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
