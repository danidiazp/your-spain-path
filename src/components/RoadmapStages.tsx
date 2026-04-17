import { Check, Clock, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type RoadmapStep = {
  id: string;
  step_order: number;
  title: string;
  description: string | null;
  estimated_duration: string | null;
  stage_location: string | null;
  official_link: string | null;
};

type Props = {
  steps: RoadmapStep[];
  completedStepIds: Set<string>;
};

const STAGE_ORDER = ["origen", "consulado", "espana", "españa", "post"];

const stageLabel = (s: string | null) => {
  if (!s) return "Sin etapa";
  const k = s.toLowerCase();
  if (k.includes("origen")) return "1 · En tu país";
  if (k.includes("consul")) return "2 · Consulado";
  if (k.includes("españ") || k === "espana") return "3 · En España";
  if (k.includes("post")) return "4 · Trámites posteriores";
  return s;
};

export const RoadmapStages = ({ steps, completedStepIds }: Props) => {
  // group by stage_location
  const groups = new Map<string, RoadmapStep[]>();
  for (const s of steps) {
    const k = s.stage_location ?? "sin_etapa";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }
  const orderedKeys = Array.from(groups.keys()).sort((a, b) => {
    const ai = STAGE_ORDER.findIndex((p) => a.toLowerCase().includes(p));
    const bi = STAGE_ORDER.findIndex((p) => b.toLowerCase().includes(p));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // compute stage progress
  const stageProgress = (group: RoadmapStep[]) => {
    const done = group.filter((s) => completedStepIds.has(s.id)).length;
    return { done, total: group.length, pct: group.length ? Math.round((done / group.length) * 100) : 0 };
  };

  return (
    <div className="space-y-6">
      {orderedKeys.map((key) => {
        const group = groups.get(key)!.sort((a, b) => a.step_order - b.step_order);
        const { done, total, pct } = stageProgress(group);
        const allDone = done === total;
        return (
          <div key={key} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-2xl grid place-items-center shrink-0 ${
                allDone ? "bg-success/15 text-success" : pct > 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}>
                {allDone ? <Check className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{stageLabel(key)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden max-w-[140px]">
                    <div className={`h-full ${allDone ? "bg-success" : "bg-primary"} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{done}/{total}</span>
                </div>
              </div>
            </div>
            <ol className="relative border-l-2 border-border ml-4 space-y-4 pl-6">
              {group.map((s) => {
                const isDone = completedStepIds.has(s.id);
                return (
                  <li key={s.id} className="relative">
                    <span className={`absolute -left-[34px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${isDone ? "bg-success text-success-foreground" : "bg-card border-2 border-primary text-primary"}`}>
                      {isDone ? <Check className="h-3 w-3" /> : s.step_order}
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>{s.title}</p>
                        {s.estimated_duration && (
                          <Badge variant="outline" className="text-[10px] h-5 inline-flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {s.estimated_duration}
                          </Badge>
                        )}
                      </div>
                      {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                      {s.official_link && (
                        <a href={s.official_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                          Enlace oficial <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
};
