# SMTP Notification Foundation

Date: 2026-04-13

## Summary

This change introduces the first implementation slice for outbound e-mail notifications:

- new database migrations for form ownership, per-form notification settings, mail delivery jobs, and delivery event logs
- typed mail configuration endpoints under `/api/config/mail`
- a new top-level `functions` workdir containing the Supabase Edge Function `send_email`
- setup wizard changes to apply the new migrations, sync function secrets, and deploy the edge function

## Files Added

- `migrations/forms_notifications.sql`
- `migrations/mail_delivery.sql`
- `functions/config.toml`
- `functions/send_email/index.ts`
- `functions/send_email/deno.json`

## Files Changed

- `api/lib/systemConfig.ts`
- `api/lib/managedSecrets.ts`
- `api/routes/config.ts`
- `scripts/setup.mjs`

## New Database Objects

### Form notifications

- `forms.owner_user_id`
- `form_notification_settings`
- `form_notification_recipients`

### Mail delivery

- `mail_delivery_jobs`
- `mail_delivery_events`

## New Managed Secret Names

These secrets are stored through the existing encrypted `managed_secrets` flow:

- `MAIL_SMTP_PASSWORD`
- `MAIL_RESEND_API_KEY`

Namespace:

- `mail`

## New System Config Namespace

Namespace:

- `mail`

Keys:

- `provider`
- `from_name`
- `from_email`
- `reply_to_email`
- `smtp_host`
- `smtp_port`
- `smtp_secure`
- `smtp_username`

## Setup Changes

The setup wizard now needs to do three additional things:

1. Apply `forms_notifications.sql` after `forms_answers.sql`.
2. Apply `mail_delivery.sql` after `forms_notifications.sql`.
3. Sync Supabase Edge Function secrets and deploy `send_email` by staging the top-level `functions` workdir into a temporary Supabase CLI-compatible layout.

## Supabase Edge Function Secrets

The setup wizard now syncs these secrets into Supabase before deploying the function:

- `APP_SUPABASE_SECRET_KEY`
- `SECRETS_ENCRYPTION_KEY`

The function relies on Supabase's built-in `SUPABASE_URL` runtime variable and a custom non-reserved key name for the privileged credential. Hosted Edge Functions reject user-defined `SUPABASE_*` secret names, so `SUPABASE_SECRET_KEY` is intentionally not used here.

The `send_email` function is configured with `verify_jwt = false`. It is invoked server-to-server from privileged backend routes using a Supabase secret key, not an end-user JWT. Access control is therefore enforced by the Worker routes that call it rather than by Supabase Edge JWT validation.

## Operator Notes

- The same `SECRETS_ENCRYPTION_KEY` used by the Cloudflare Worker must also be present in Supabase Edge Functions, otherwise provider credentials in `managed_secrets` cannot be decrypted.
- The current implementation now includes the admin mail configuration UI, form-level notification controls, and submission-time enqueueing into `mail_delivery_jobs` with immediate `send_email` invocation per queued job.
- SMTP transport is implemented inside the edge function workdir. If the target Supabase edge runtime restricts outbound socket behavior in your project tier or region, SMTP verification/sending may need a provider-specific fallback or a dedicated server runtime.
- The edge function now uses a function-local `deno.json` so Supabase resolves npm dependencies from a stable, explicit config during deploy.

## Recommended Update Procedure

1. Pull the updated code.
2. Re-run `npm run setup`.
3. Confirm the new migrations were applied.
4. Confirm the setup log shows Supabase function secrets synced and `send_email` deployed.
5. Open the admin configuration API or upcoming UI and configure either SMTP or Resend.
6. Run a mail connection test before enabling queue processing in production.
