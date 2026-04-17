-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  nationality TEXT,
  current_country TEXT,
  eu_status BOOLEAN,
  main_goal TEXT,
  work_offer BOOLEAN,
  study_admission BOOLEAN,
  family_in_spain BOOLEAN,
  timeline_goal TEXT,
  budget_range TEXT,
  preferred_language TEXT DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============ MIGRATION ROUTES ============
CREATE TABLE public.migration_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  target_user TEXT,
  summary TEXT,
  eligibility_rules_json JSONB DEFAULT '{}'::jsonb,
  estimated_timeline TEXT,
  risk_notes TEXT,
  official_sources_json JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.migration_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Routes are public" ON public.migration_routes
  FOR SELECT USING (is_active = true);

-- ============ ROUTE STEPS ============
CREATE TABLE public.route_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.migration_routes(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  stage_location TEXT,
  estimated_duration TEXT,
  official_link TEXT,
  required_before_step INT
);

ALTER TABLE public.route_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Steps are public" ON public.route_steps
  FOR SELECT USING (true);
CREATE INDEX idx_route_steps_route ON public.route_steps(route_id, step_order);

-- ============ ROUTE DOCUMENTS ============
CREATE TABLE public.route_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.migration_routes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  issued_by TEXT,
  translation_needed BOOLEAN DEFAULT false,
  apostille_needed BOOLEAN DEFAULT false,
  validity_window TEXT,
  official_link TEXT
);

ALTER TABLE public.route_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Documents are public" ON public.route_documents
  FOR SELECT USING (true);
CREATE INDEX idx_route_documents_route ON public.route_documents(route_id);

-- ============ ASSESSMENT RESULTS ============
CREATE TABLE public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_route_id UUID REFERENCES public.migration_routes(id),
  alternative_route_ids_json JSONB DEFAULT '[]'::jsonb,
  preparedness_level TEXT,
  explanation TEXT,
  missing_requirements_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own assessments" ON public.assessment_results
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users insert own assessments" ON public.assessment_results
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users update own assessments" ON public.assessment_results
  FOR UPDATE USING (auth.uid() = profile_id);

-- ============ USER TASKS ============
CREATE TABLE public.user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.migration_routes(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  source_step_id UUID REFERENCES public.route_steps(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tasks" ON public.user_tasks
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users insert own tasks" ON public.user_tasks
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users update own tasks" ON public.user_tasks
  FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users delete own tasks" ON public.user_tasks
  FOR DELETE USING (auth.uid() = profile_id);

-- ============ RESOURCES ============
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  institution TEXT,
  url TEXT NOT NULL,
  language TEXT DEFAULT 'es',
  route_id UUID REFERENCES public.migration_routes(id),
  country_scope TEXT
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Resources are public" ON public.resources
  FOR SELECT USING (true);

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at
  BEFORE UPDATE ON public.user_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();