
create table public.nabd_hope_control (
 id integer primary key check(id=1), registration_open boolean not null default false, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);
insert into public.nabd_hope_control(id) values(1);
create table public.nabd_hope_applications (
 id uuid primary key default gen_random_uuid(), receipt_hash bytea not null unique,
 full_name text not null check(char_length(btrim(full_name)) between 3 and 150),
 email text not null check(char_length(email) between 5 and 254 and email=lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 phone text not null check(phone ~ '^\+?[0-9]{7,15}$'),
 governorate text not null check(governorate in ('north_gaza','gaza','middle','khan_younis','rafah')),
 institution text not null check(char_length(btrim(institution)) between 2 and 160),
 field_of_study text not null check(char_length(btrim(field_of_study)) between 2 and 120),
 study_stage text not null check(study_stage in ('prospective','year1','year2','year3','year4','year5plus','other')),
 support_types text[] not null check(cardinality(support_types) between 1 and 5 and support_types <@ array['tuition','transport','device','internet','supplies']::text[]),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 decision text not null default 'pending' check(decision in ('pending','review','shortlisted','accepted','waitlisted','rejected')),
 result_published boolean not null default false,
 reviewed_at timestamptz, reviewed_by uuid references auth.users(id),
 check(not result_published or decision<>'pending')
);
create unique index nabd_hope_unique_email on public.nabd_hope_applications(email);
create index nabd_hope_created_at on public.nabd_hope_applications(created_at desc,id);
alter table public.nabd_hope_control enable row level security;
alter table public.nabd_hope_applications enable row level security;
revoke all on public.nabd_hope_control,public.nabd_hope_applications from public,anon,authenticated;
grant select(id,registration_open,updated_at) on public.nabd_hope_control to anon,authenticated;
grant update(registration_open,updated_at,updated_by) on public.nabd_hope_control to authenticated;
grant select(id,full_name,email,phone,governorate,institution,field_of_study,study_stage,support_types,created_at,decision,result_published,reviewed_at) on public.nabd_hope_applications to authenticated;
grant update(decision,result_published,reviewed_at,reviewed_by) on public.nabd_hope_applications to authenticated;
grant all on public.nabd_hope_control,public.nabd_hope_applications to service_role;
create policy hope_public_control_read on public.nabd_hope_control for select to anon,authenticated using(id=1);
create policy hope_director_control_update on public.nabd_hope_control for update to authenticated using ((select public.is_admin()) and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid()))) with check(id=1 and updated_by=(select auth.uid()) and (select public.is_admin()) and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));
create policy hope_director_application_read on public.nabd_hope_applications for select to authenticated using ((select public.is_admin()) and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));
create policy hope_director_application_update on public.nabd_hope_applications for update to authenticated using ((select public.is_admin()) and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid()))) with check(reviewed_by=(select auth.uid()) and (select public.is_admin()) and exists(select 1 from public.nabd_exam_owner o where o.user_id=(select auth.uid())));
create function public.nabd_hope_submit_v1(p_code uuid,p_name text,p_email text,p_phone text,p_governorate text,p_institution text,p_field text,p_stage text,p_support text[],p_consent boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_open boolean; v_hash bytea; v_id uuid; v_mail text:=lower(btrim(p_email));
begin
 if p_code is null or p_consent is distinct from true or p_support is null or array_position(p_support,null) is not null or (select count(distinct a) from unnest(p_support) a)<>cardinality(p_support) then raise exception 'INVALID_INPUT';end if;
 v_hash:=extensions.digest(p_code::text,'sha256');
 select registration_open into v_open from public.nabd_hope_control where id=1 for update;
 select id into v_id from public.nabd_hope_applications where receipt_hash=v_hash and email=v_mail;
 if found then return jsonb_build_object('ok',true,'existing',true);end if;
 if v_open is distinct from true then return jsonb_build_object('ok',false,'error','CLOSED');end if;
 insert into public.nabd_hope_applications(receipt_hash,full_name,email,phone,governorate,institution,field_of_study,study_stage,support_types)
 values(v_hash,btrim(p_name),v_mail,p_phone,p_governorate,btrim(p_institution),btrim(p_field),p_stage,p_support) returning id into v_id;
 return jsonb_build_object('ok',true,'existing',false);
exception when unique_violation then return jsonb_build_object('ok',false,'error','DUPLICATE_OR_CONFLICT');
when check_violation or not_null_violation then return jsonb_build_object('ok',false,'error','INVALID_INPUT');
end;$$;
create function public.nabd_hope_lookup_v1(p_code uuid,p_email text) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((select jsonb_build_object('found',true,'status',case when result_published then decision else 'pending' end,'published',result_published) from public.nabd_hope_applications where receipt_hash=extensions.digest(p_code::text,'sha256') and email=lower(btrim(p_email))),jsonb_build_object('found',false));
$$;
create function public.nabd_hope_director_set_open(p_open boolean) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_open boolean;
begin
 if p_open is null or not (select public.is_admin()) or not exists(select 1 from public.nabd_exam_owner where user_id=auth.uid()) then raise exception 'DIRECTOR_ONLY';end if;
 update public.nabd_hope_control set registration_open=p_open,updated_at=now(),updated_by=auth.uid() where id=1 returning registration_open into v_open;
 if not found then raise exception 'UPDATE_FAILED';end if;
 return jsonb_build_object('open',v_open);
end;$$;
create function public.nabd_hope_director_decide(p_id uuid,p_decision text,p_publish boolean) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v_id uuid;
begin
 if not (select public.is_admin()) or not exists(select 1 from public.nabd_exam_owner where user_id=auth.uid()) then raise exception 'DIRECTOR_ONLY';end if;
 if p_id is null or p_decision is null or p_publish is null or p_decision not in ('pending','review','shortlisted','accepted','waitlisted','rejected') or (p_decision='pending' and p_publish) then raise exception 'INVALID_DECISION';end if;
 update public.nabd_hope_applications set decision=p_decision,result_published=p_publish,reviewed_at=now(),reviewed_by=auth.uid() where id=p_id returning id into v_id;
 if not found then raise exception 'NOT_FOUND';end if;
 return jsonb_build_object('ok',true,'id',v_id);
end;$$;
revoke all on function public.nabd_hope_submit_v1(uuid,text,text,text,text,text,text,text,text[],boolean),public.nabd_hope_lookup_v1(uuid,text) from public,anon,authenticated;
grant execute on function public.nabd_hope_submit_v1(uuid,text,text,text,text,text,text,text,text[],boolean),public.nabd_hope_lookup_v1(uuid,text) to service_role;
revoke all on function public.nabd_hope_director_set_open(boolean),public.nabd_hope_director_decide(uuid,text,boolean) from public,anon;
grant execute on function public.nabd_hope_director_set_open(boolean),public.nabd_hope_director_decide(uuid,text,boolean) to authenticated;

