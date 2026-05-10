ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
ALTER FUNCTION public.current_profile_name() SECURITY INVOKER;
ALTER FUNCTION public.set_audit_fields() SECURITY INVOKER;
