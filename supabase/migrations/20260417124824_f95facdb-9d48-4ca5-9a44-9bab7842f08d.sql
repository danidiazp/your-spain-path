
-- 1) Extend profiles with new structured fields (coexist with old ones)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_country text,
  ADD COLUMN IF NOT EXISTS primary_nationality text,
  ADD COLUMN IF NOT EXISTS has_second_nationality boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS second_nationality text,
  ADD COLUMN IF NOT EXISTS current_residence_country text,
  ADD COLUMN IF NOT EXISTS currently_in_spain boolean,
  ADD COLUMN IF NOT EXISTS current_spain_status text,
  ADD COLUMN IF NOT EXISTS intended_route text,
  ADD COLUMN IF NOT EXISTS active_process_nationality text,
  ADD COLUMN IF NOT EXISTS eligible_fast_track_nationality boolean DEFAULT false;

-- 2) Country pricing tiers
CREATE TABLE IF NOT EXISTS public.country_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  country_name text NOT NULL,
  pricing_tier text NOT NULL CHECK (pricing_tier IN ('A','B','C')),
  reference_eur_amount numeric(10,2) NOT NULL,
  local_currency text,
  local_amount numeric(12,2),
  active boolean NOT NULL DEFAULT true,
  requires_manual_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.country_pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pricing tiers are public"
ON public.country_pricing_tiers
FOR SELECT
USING (active = true);

CREATE TRIGGER update_country_pricing_tiers_updated_at
BEFORE UPDATE ON public.country_pricing_tiers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Billing profiles
CREATE TABLE IF NOT EXISTS public.billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'none',
  selected_pricing_country text,
  selected_currency text,
  monthly_amount numeric(12,2),
  ip_country text,
  pricing_review boolean NOT NULL DEFAULT false,
  risk_flag text DEFAULT 'low' CHECK (risk_flag IN ('low','medium','high')),
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own billing profile"
ON public.billing_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own billing profile"
ON public.billing_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own billing profile"
ON public.billing_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_billing_profiles_updated_at
BEFORE UPDATE ON public.billing_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Seed pricing tiers for the 19 Spanish-speaking countries
INSERT INTO public.country_pricing_tiers (country_code, country_name, pricing_tier, reference_eur_amount, local_currency)
VALUES
  -- Tier A (8 EUR)
  ('ES','España','A',8.00,'EUR'),
  ('CL','Chile','A',8.00,'CLP'),
  ('UY','Uruguay','A',8.00,'UYU'),
  ('PA','Panamá','A',8.00,'PAB'),
  -- Tier B (5 EUR)
  ('MX','México','B',5.00,'MXN'),
  ('CR','Costa Rica','B',5.00,'CRC'),
  ('DO','República Dominicana','B',5.00,'DOP'),
  ('CO','Colombia','B',5.00,'COP'),
  ('PE','Perú','B',5.00,'PEN'),
  ('EC','Ecuador','B',5.00,'USD'),
  -- Tier C (2 EUR)
  ('AR','Argentina','C',2.00,'ARS'),
  ('PY','Paraguay','C',2.00,'PYG'),
  ('BO','Bolivia','C',2.00,'BOB'),
  ('SV','El Salvador','C',2.00,'USD'),
  ('GT','Guatemala','C',2.00,'GTQ'),
  ('HN','Honduras','C',2.00,'HNL'),
  ('NI','Nicaragua','C',2.00,'NIO'),
  ('CU','Cuba','C',2.00,'CUP'),
  ('VE','Venezuela','C',2.00,'VES')
ON CONFLICT (country_code) DO NOTHING;
