-- NABD ONE / CONNECT. Already applied to Supabase on 2026-11-08.
-- Reproducible idempotent RLS for new environments.
create table if not exists public.nabd_support_tickets (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references auth.users(id) on delete cascade,
 category text not null default 'general' check(category in ('general','registration','technical','academic','certificate')),
 subject text not null check(char_length(btrim(subject)) between 6 and 160),
 status text not null default 'open' check(status in ('open','waiting','resolved')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.nabd_support_messages (
 id uuid primary key default gen_random_uuid(),
 ticket_id uuid not null references public.nabd_support_tickets(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now()
);
create index if not exists idx_nabd_tickets_student_date on public.nabd_support_tickets(student_id,created_at desc);
create index if not exists idx_nabd_tickets_status_date on public.nabd_support_tickets(status,updated_at desc);
create index if not exists idx_nabd_ticket_messages on public.nabd_support_messages(ticket_id,created_at asc);
alter table public.nabd_support_tickets enable row level security;
alter table public.nabd_support_messages enable row level security;
revoke all on public.nabd_support_tickets from public,anon,authenticated;
revoke all on public.nabd_support_messages from public,anon,authenticated;
grant select,insert on public.nabd_support_tickets to authenticated;
grant update(status,updated_at) on public.nabd_support_tickets to authenticated;
grant select,insert on public.nabd_support_messages to authenticated;
do $policies$
begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='nabd_support_tickets' and policyname='nabd_ticket_read_own_or_admin') then
  create policy nabd_ticket_read_own_or_admin on public.nabd_support_tickets for select to authenticated
    using(student_id=(select auth.uid()) or (select public.is_admin()));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='nabd_support_tickets' and policyname='nabd_ticket_create_self') then
  create policy nabd_ticket_create_self on public.nabd_support_tickets for insert to authenticated
    with check(student_id=(select auth.uid()) and status='open');
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='nabd_support_tickets' and policyname='nabd_ticket_admin_change_status') then
  create policy nabd_ticket_admin_change_status on public.nabd_support_tickets for update to authenticated
    using((select public.is_admin())) with check((select public.is_admin()));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='nabd_support_messages' and policyname='nabd_ticket_messages_read_members') then
  create policy nabd_ticket_messages_read_members on public.nabd_support_messages for select to authenticated
    using(exists(select 1 from public.nabd_support_tickets t where t.id=ticket_id
      and(t.student_id=(select auth.uid()) or (select public.is_admin()))));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='nabd_support_messages' and policyname='nabd_ticket_messages_send_members') then
  create policy nabd_ticket_messages_send_members on public.nabd_support_messages for insert to authenticated
    with check(sender_id=(select auth.uid()) and exists(select 1 from public.nabd_support_tickets t
      where t.id=ticket_id and ((t.student_id=(select auth.uid()) and t.status<>'resolved') or (select public.is_admin()))));
 end if;
end
$policies$;