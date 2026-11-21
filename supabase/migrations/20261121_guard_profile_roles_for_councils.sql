-- Secure the trust root for administrators: users must not promote themselves via profiles.update.
-- New council member provisioning runs only in an authenticated server-side Edge Function.
begin;
create or replace function public.nabd_guard_profile_role_changes()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $fn$
begin
  if new.role is distinct from old.role
    and current_user not in ('postgres', 'service_role', 'supabase_admin')
    and not coalesce(public.is_admin(),false)
  then
    raise exception 'Profile role changes require an existing administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$fn$;
drop trigger if exists nabd_guard_profile_role_update on public.profiles;
create trigger nabd_guard_profile_role_update
  before update of role on public.profiles
  for each row execute function public.nabd_guard_profile_role_changes();
revoke all on function public.nabd_guard_profile_role_changes() from public, anon, authenticated;
comment on function public.nabd_guard_profile_role_changes() is
  'Prevents authenticated non-admin users from escalating their profile role through profiles UPDATE.';
commit;