/**
 * Analytics tracker — capa interna sin proveedor.
 * Punto único para enchufar PostHog / Plausible / GA en el futuro.
 *
 * Eventos del funnel:
 *  - landing_viewed
 *  - cta_start_diagnostic_clicked
 *  - onboarding_started
 *  - onboarding_step_completed (step)
 *  - onboarding_completed
 *  - results_viewed (primary_route)
 *  - signup_started
 *  - signup_completed
 *  - email_verification_sent
 *  - email_verified
 *  - dashboard_viewed
 *  - task_completed
 */

export type AnalyticsEvent =
  | "landing_viewed"
  | "cta_start_diagnostic_clicked"
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "results_viewed"
  | "signup_started"
  | "signup_completed"
  | "signin_completed"
  | "password_reset_requested"
  | "email_verification_sent"
  | "email_verified"
  | "dashboard_viewed"
  | "task_completed"
  | "task_created"
  | "route_detail_viewed";

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

const isDev = import.meta.env.DEV;

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  // Stub — log estructurado en consola, listo para enchufar proveedor real.
  if (isDev) {
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${event}`, props ?? {});
  }
  // TODO: provider integration
  // window.posthog?.capture(event, props)
  // window.plausible?.(event, { props })
}

export function identify(userId: string, traits?: AnalyticsProps) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.info(`[analytics] identify`, userId, traits ?? {});
  }
  // window.posthog?.identify(userId, traits)
}
