CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid;
  role_names text[];
BEGIN
  -- Extract user_id; if missing, log a warning and return event unchanged
  IF NOT (event ? 'user_id') THEN
    RAISE WARNING 'custom_access_token_hook: No user_id found in event';
    RETURN event;
  END IF;

  -- Convert user_id to uuid (adjust if your user_id is text)
  uid := (event ->> 'user_id')::uuid;

  -- Select roles into an array
  SELECT array_agg(r.name) INTO role_names
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = uid;

  IF role_names IS NULL THEN
    role_names := ARRAY[]::text[];
  END IF;

  -- Ensure claims exists and inject roles as JSON array
  IF NOT (event ? 'claims') THEN
    event := jsonb_set(event, '{claims}', '{}'::jsonb);
  END IF;

  event := jsonb_set(event, '{claims,user_roles}', to_jsonb(role_names), true);

  RETURN event;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'custom_access_token_hook error: %', SQLERRM;
END;
$$;