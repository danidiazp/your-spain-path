-- user_documents: per-user state + notes for route documents
CREATE TABLE public.user_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.route_documents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'no_iniciado' CHECK (status IN ('no_iniciado','en_progreso','conseguido','pendiente_revision')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, document_id)
);

CREATE INDEX idx_user_documents_profile ON public.user_documents(profile_id);
CREATE INDEX idx_user_documents_document ON public.user_documents(document_id);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own document states"
  ON public.user_documents FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users insert own document states"
  ON public.user_documents FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users update own document states"
  ON public.user_documents FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users delete own document states"
  ON public.user_documents FOR DELETE
  USING (auth.uid() = profile_id);

CREATE TRIGGER trg_user_documents_updated_at
  BEFORE UPDATE ON public.user_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();