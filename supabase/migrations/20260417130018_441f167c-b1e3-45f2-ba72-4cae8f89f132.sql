-- Función para iniciar el trial sin tarjeta (7 días). Idempotente: si ya tiene trial o suscripción, no hace nada.
CREATE OR REPLACE FUNCTION public.start_trial_no_card(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_billing public.billing_profiles%ROWTYPE;
  trial_start_ts timestamptz := now();
  trial_end_ts timestamptz := now() + interval '7 days';
BEGIN
  -- Solo el usuario autenticado puede activar su propio trial
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  SELECT * INTO existing_billing FROM public.billing_profiles WHERE user_id = _user_id;

  -- Si ya tuvo un trial sin tarjeta antes, no se vuelve a conceder
  IF existing_billing.trial_start IS NOT NULL AND existing_billing.subscription_status = 'trialing_no_card' THEN
    RETURN jsonb_build_object(
      'ok', true,
      'already_active', true,
      'trial_end', existing_billing.trial_end
    );
  END IF;

  -- Si ya hay una suscripción de pago, no necesita trial
  IF existing_billing.stripe_subscription_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'has_paid_subscription');
  END IF;

  -- Si ya consumió un trial previo (aunque ya expirado), bloquear
  IF existing_billing.trial_end IS NOT NULL AND existing_billing.trial_end < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'trial_already_used');
  END IF;

  INSERT INTO public.billing_profiles (user_id, trial_start, trial_end, subscription_status)
  VALUES (_user_id, trial_start_ts, trial_end_ts, 'trialing_no_card')
  ON CONFLICT (user_id) DO UPDATE
    SET trial_start = EXCLUDED.trial_start,
        trial_end = EXCLUDED.trial_end,
        subscription_status = 'trialing_no_card',
        updated_at = now();

  RETURN jsonb_build_object(
    'ok', true,
    'already_active', false,
    'trial_end', trial_end_ts
  );
END;
$$;

-- Asegurar que billing_profiles.user_id es único (necesario para ON CONFLICT y para 1 trial por usuario)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'billing_profiles_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.billing_profiles ADD CONSTRAINT billing_profiles_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Función unificada: tiene acceso premium si está en trial sin tarjeta vigente O tiene suscripción activa de pago
CREATE OR REPLACE FUNCTION public.has_premium_access(_user_id uuid, _env text DEFAULT 'sandbox')
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Trial sin tarjeta vigente
    EXISTS (
      SELECT 1 FROM public.billing_profiles
      WHERE user_id = _user_id
        AND subscription_status = 'trialing_no_card'
        AND trial_end IS NOT NULL
        AND trial_end > now()
    )
    OR
    -- Suscripción de pago activa (incluye periodo de gracia tras cancelar)
    public.has_active_subscription(_user_id, _env);
$$;