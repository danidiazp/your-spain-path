import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Trash2, Plus, Calendar as CalendarIcon, AlertTriangle, X } from "lucide-react";
import { format, isPast, isToday, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Task = {
  id: string;
  title: string;
  status: string;
  description: string | null;
  source_step_id: string | null;
  due_date?: string | null;
};

type Props = {
  profileId: string;
  routeId: string | null;
  tasks: Task[];
  onChange: (next: Task[]) => void;
  onSeed?: () => void;
  canSeed?: boolean;
};

const dueBadge = (due: string) => {
  const d = new Date(due);
  if (isPast(d) && !isToday(d)) return { label: "Vencida", style: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle };
  if (isToday(d)) return { label: "Hoy", style: "bg-warning/15 text-warning border-warning/30", icon: AlertTriangle };
  const diff = differenceInCalendarDays(d, new Date());
  if (diff <= 7) return { label: `En ${diff}d`, style: "bg-warning/10 text-warning border-warning/20", icon: CalendarIcon };
  return { label: format(d, "d MMM", { locale: es }), style: "bg-secondary text-muted-foreground border-border", icon: CalendarIcon };
};

export const TaskList = ({ profileId, routeId, tasks, onChange, onSeed, canSeed }: Props) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState<Date | undefined>();
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // pending first
      if (a.status === "done" && b.status !== "done") return 1;
      if (b.status === "done" && a.status !== "done") return -1;
      // by due date asc (no date last)
      if (a.due_date && !b.due_date) return -1;
      if (b.due_date && !a.due_date) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      return 0;
    });
  }, [tasks]);

  const toggle = async (t: Task) => {
    const status = t.status === "done" ? "pending" : "done";
    onChange(tasks.map((x) => (x.id === t.id ? { ...x, status } : x)));
    const { error } = await supabase.from("user_tasks").update({ status }).eq("id", t.id);
    if (error) toast.error("No se pudo actualizar");
  };

  const remove = async (t: Task) => {
    onChange(tasks.filter((x) => x.id !== t.id));
    const { error } = await supabase.from("user_tasks").delete().eq("id", t.id);
    if (error) toast.error("No se pudo eliminar");
  };

  const setDue = async (t: Task, date: Date | undefined) => {
    const due_date = date ? format(date, "yyyy-MM-dd") : null;
    onChange(tasks.map((x) => (x.id === t.id ? { ...x, due_date } : x)));
    setDatePickerFor(null);
    const { error } = await supabase.from("user_tasks").update({ due_date }).eq("id", t.id);
    if (error) toast.error("No se pudo guardar la fecha");
  };

  const add = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await supabase
      .from("user_tasks")
      .insert({
        profile_id: profileId,
        route_id: routeId,
        title: newTitle.trim(),
        status: "pending",
        due_date: newDue ? format(newDue, "yyyy-MM-dd") : null,
      })
      .select()
      .single();
    if (error) { toast.error("No se pudo crear la tarea"); return; }
    onChange([...tasks, data as Task]);
    setNewTitle("");
    setNewDue(undefined);
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Añadir tarea…"
          className="h-9 text-sm"
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("h-9 px-2.5", newDue && "text-primary border-primary/40")}>
              <CalendarIcon className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={newDue}
              onSelect={setNewDue}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              locale={es}
              className="p-3 pointer-events-auto"
            />
            {newDue && (
              <div className="border-t border-border p-2">
                <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={() => setNewDue(undefined)}>
                  <X className="h-3 w-3" /> Quitar fecha
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <Button size="sm" variant="soft" onClick={add} disabled={!newTitle.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {newDue && (
        <p className="text-[11px] text-muted-foreground mb-2">
          Con fecha: {format(newDue, "d 'de' MMMM", { locale: es })}
        </p>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-muted-foreground">Aún no tienes tareas</p>
          {canSeed && onSeed && (
            <Button variant="soft" size="sm" onClick={onSeed}>Generar desde mi ruta</Button>
          )}
        </div>
      ) : (
        <ul className="space-y-1">
          {sorted.map((t) => {
            const due = t.due_date ? dueBadge(t.due_date) : null;
            const DueIcon = due?.icon;
            return (
              <li key={t.id} className="group flex items-center gap-2 p-2 rounded-xl hover:bg-secondary/60">
                <button onClick={() => toggle(t)} className="shrink-0">
                  {t.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <span className={`flex-1 text-sm ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                  {t.title}
                </span>
                <Popover open={datePickerFor === t.id} onOpenChange={(o) => setDatePickerFor(o ? t.id : null)}>
                  <PopoverTrigger asChild>
                    {due ? (
                      <button>
                        <Badge variant="outline" className={`${due.style} text-[10px] h-5 cursor-pointer inline-flex items-center gap-1`}>
                          {DueIcon && <DueIcon className="h-2.5 w-2.5" />} {due.label}
                        </Badge>
                      </button>
                    ) : (
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                        <CalendarIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={t.due_date ? new Date(t.due_date) : undefined}
                      onSelect={(d) => setDue(t, d)}
                      initialFocus
                      locale={es}
                      className="p-3 pointer-events-auto"
                    />
                    {t.due_date && (
                      <div className="border-t border-border p-2">
                        <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={() => setDue(t, undefined)}>
                          <X className="h-3 w-3" /> Quitar fecha
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                <button onClick={() => remove(t)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};
