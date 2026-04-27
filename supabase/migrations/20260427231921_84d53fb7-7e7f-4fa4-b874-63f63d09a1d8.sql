REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.current_profile_name() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_audit_fields() FROM anon, authenticated;