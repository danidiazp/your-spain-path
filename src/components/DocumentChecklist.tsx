import { useState } from "react";
import { Circle, CircleDot, CheckCircle2, AlertCircle, ExternalLink, FileText, Pencil, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DocStatus = "no_iniciado" | "en_progreso" | "conseguido" | "pendiente_revision";

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  no_iniciado: "No iniciado",
  en_progreso: "En progreso",
  conseguido: "Conseguido",
  pendiente_revision: "Pendiente de revisar",
};

const STATUS_STYLES: Record<DocStatus, string> = {
  no_iniciado: "bg-muted text-muted-foreground border-border",
  en_progreso: "bg-warning/15 text-warning border-warning/30",
  conseguido: "bg-success/15 text-success border-success/30",
  pendiente_revision: "bg-accent/15 text-accent border-accent/30",
};

const STATUS_ICON: Record<DocStatus, React.ComponentType<{ className?: string }>> = {
  no_iniciado: Circle,
  en_progreso: CircleDot,
  conseguido: CheckCircle2,
  pendiente_revision: AlertCircle,
};

export type RouteDoc = {
  id: string;
  name: string;
  description: string | null;
  required: boolean | null;
  translation_needed: boolean | null;
  apostille_needed: boolean | null;
  official_link: string | null;
  validity_window?: string | null;
  issued_by?: string | null;
};

export type UserDocState = {
  id?: string;
  document_id: string;
  status: DocStatus;
  notes: string | null;
};

type Props = {
  profileId: string;
  docs: RouteDoc[];
  states: Record<string, UserDocState>;
  onChange: (next: Record<string, UserDocState>) => void;
};

const STATUS_CYCLE: DocStatus[] = ["no_iniciado", "en_progreso", "conseguido", "pendiente_revision"];

export const DocumentChecklist = ({ profileId, docs, states, onChange }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  const persist = async (documentId: string, status: DocStatus, notes: string | null) => {
    const existing = states[documentId];
    const payload = { profile_id: profileId, document_id: documentId, status, notes };
    const { data, error } = await supabase
      .from("user_documents")
      .upsert(payload, { onConflict: "profile_id,document_id" })
      .select()
      .single();
    if (error) {
      toast.error("No se pudo guardar el documento");
      return;
    }
    onChange({ ...states, [documentId]: { id: data.id, document_id: documentId, status, notes } });
    if (existing?.status !== status) toast.success(`Estado: ${DOC_STATUS_LABEL[status]}`);
  };

  const cycleStatus = (doc: RouteDoc) => {
    const current = states[doc.id]?.status ?? "no_iniciado";
    const idx = STATUS_CYCLE.indexOf(current);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    void persist(doc.id, next, states[doc.id]?.notes ?? null);
  };

  const setStatus = (doc: RouteDoc, status: DocStatus) => {
    void persist(doc.id, status, states[doc.id]?.notes ?? null);
  };

  const saveNote = async (docId: string) => {
    const current = states[docId];
    await persist(docId, current?.status ?? "no_iniciado", draftNote.trim() || null);
    setEditingId(null);
  };

  const completed = docs.filter((d) => states[d.id]?.status === "conseguido").length;

  if (docs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No hay documentos asociados a esta ruta.</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{completed}</span> de {docs.length} conseguidos
        </p>
        <div className="h-1.5 w-32 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-success transition-all" style={{ width: `${(completed / docs.length) * 100}%` }} />
        </div>
      </div>
      <ul className="space-y-2">
        {docs.map((d) => {
          const state = states[d.id];
          const status: DocStatus = state?.status ?? "no_iniciado";
          const Icon = STATUS_ICON[status];
          const editing = editingId === d.id;
          return (
            <li key={d.id} className="rounded-xl border border-border/60 hover:border-border bg-card transition-colors">
              <div className="flex items-start gap-3 p-3">
                <button
                  onClick={() => cycleStatus(d)}
                  title="Cambiar estado"
                  className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
                >
                  <Icon className={`h-5 w-5 ${
                    status === "conseguido" ? "text-success" :
                    status === "en_progreso" ? "text-warning" :
                    status === "pendiente_revision" ? "text-accent" : "text-muted-foreground"
                  }`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium text-sm ${status === "conseguido" ? "text-muted-foreground" : ""}`}>{d.name}</p>
                    <Badge variant="outline" className={`${STATUS_STYLES[status]} text-[10px] h-5 shrink-0`}>
                      {DOC_STATUS_LABEL[status]}
                    </Badge>
                  </div>
                  {d.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{d.description}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                    {d.required && <Badge variant="outline" className="text-[10px] h-5 bg-primary/5">Obligatorio</Badge>}
                    {d.translation_needed && <Badge variant="outline" className="text-[10px] h-5">Traducción jurada</Badge>}
                    {d.apostille_needed && <Badge variant="outline" className="text-[10px] h-5">Apostilla</Badge>}
                    {d.validity_window && <Badge variant="outline" className="text-[10px] h-5">Vigencia: {d.validity_window}</Badge>}
                    {d.official_link && (
                      <a href={d.official_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline ml-auto">
                        Enlace oficial <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  {state?.notes && !editing && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-foreground/70 bg-secondary/50 rounded-lg px-2.5 py-1.5">
                      <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="flex-1 whitespace-pre-wrap">{state.notes}</span>
                    </div>
                  )}
                  {editing ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        placeholder="Notas personales sobre este documento…"
                        className="text-xs min-h-[60px]"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="soft" className="h-7 text-xs" onClick={() => saveNote(d.id)}>
                          <Save className="h-3 w-3" /> Guardar
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {STATUS_CYCLE.filter((s) => s !== status).slice(0, 2).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(d, s)}
                          className="text-[10px] px-2 py-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          → {DOC_STATUS_LABEL[s]}
                        </button>
                      ))}
                      <button
                        onClick={() => { setEditingId(d.id); setDraftNote(state?.notes ?? ""); }}
                        className="text-[10px] px-2 py-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors inline-flex items-center gap-1 ml-auto"
                      >
                        <Pencil className="h-2.5 w-2.5" /> {state?.notes ? "Editar nota" : "Añadir nota"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};
