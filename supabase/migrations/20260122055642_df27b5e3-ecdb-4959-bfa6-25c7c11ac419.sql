-- 1) Ensure auto-assign trigger fires on both INSERT and email UPDATE
-- Recreate trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign role only when the email matches (case-insensitive)
  IF NEW.email IS NOT NULL AND lower(NEW.email) = 'evamarketingsolutions@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assign_super_admin_trigger ON public.profiles;
CREATE TRIGGER assign_super_admin_trigger
AFTER INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_super_admin();


-- 2) Provide a safe way for an authenticated user to sync their profile email
-- (email is sourced from the signed JWT, not user input)
CREATE OR REPLACE FUNCTION public.sync_profile_email_from_jwt()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := auth.jwt() ->> 'email';

  IF auth.uid() IS NULL OR v_email IS NULL OR v_email = '' THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET email = v_email,
      updated_at = now()
  WHERE id = auth.uid()
    AND (email IS DISTINCT FROM v_email);
END;
$$;