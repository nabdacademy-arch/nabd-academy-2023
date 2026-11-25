
create schema if not exists nabd_hope_private;
revoke all on schema nabd_hope_private from public,anon,authenticated;
grant usage on schema nabd_hope_private to service_role;
create table nabd_hope_private.identity_key(id boolean primary key default true check(id), secret bytea not null);
alter table nabd_hope_private.identity_key enable row level security;
revoke all on nabd_hope_private.identity_key from public,anon,authenticated;
grant select on nabd_hope_private.identity_key to service_role;
insert into nabd_hope_private.identity_key(id,secret) values(true,extensions.gen_random_bytes(32));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nabd-hope-enrollment-private','nabd-hope-enrollment-private',false,1048576,array['application/pdf','image/jpeg','image/png']);
create table public.nabd_hope_verifications(
 application_id uuid primary key references public.nabd_hope_applications(id) on delete cascade,
 identity_kind text not null check(identity_kind in ('national_id','passport')),
 identity_issuer text not null check(identity_issuer ~ '^[A-Z]{2}$'),
 identity_hash bytea not null unique,
 identity_last4 text not null check(identity_last4 ~ '^[A-Z0-9]{4}$'),
 document_path text not null unique,
 document_mime text not null check(document_mime in ('application/pdf','image/jpeg','image/png')),
 document_bytes integer not null check(document_bytes between 1 and 1048576),
 verification_state text not null default 'submitted' check(verification_state in ('submitted','verified','needs_correction')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz, reviewed_by uuid references auth.users(id)
);
alter table public.nabd_hope_verifications enable row level security;
revoke all on public.nabd_hope_verifications from public,anon,authenticated;
grant all on public.nabd_hope_verifications to service_role;
grant select(application_id,identity_kind,identity_issuer,identity_last4,document_path,document_mime,document_bytes,verification_state,submitted_at,reviewed_at) on public.nabd_hope_verifications to authenticated;
grant update(verification_state,reviewed_at,reviewed_by) on public.nabd_hope_verifications to authenticated;
create policy hope_verification_director_select on public.nabd_hope_verifications for select to authenticated using ((select public.is_admin()) and exists(select 1 from public.nabd_exam_owner where user_id=(select auth.uid())));
create policy hope_verification_director_update on public.nabd_hope_verifications for update to authenticated using ((select public.is_admin()) and exists(select 1 from public.nabd_exam_owner where user_id=(select auth.uid()))) with check (reviewed_by=(select auth.uid()) and (select public.is_admin()) and exists(select 1 from public.nabd_exam_owner where user_id=(select auth.uid())));
create policy hope_enrollment_director_read on storage.objects for select to authenticated using (bucket_id='nabd-hope-enrollment-private' and (select public.is_admin()) and exists(select 1 from public.nabd_exam_owner where user_id=(select auth.uid())) and exists(select 1 from public.nabd_hope_verifications v where v.document_path=objects.name));
create function public.nabd_hope_verification_prepare(p_code uuid,p_email text) returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((select jsonb_build_object('found',true,'application_id',a.id,'state',coalesce(v.verification_state,'missing'),'can_upload',v.application_id is null or (v.verification_state='needs_correction' and v.submitted_at<now()-interval '1 minute')) from public.nabd_hope_applications a left join public.nabd_hope_verifications v on v.application_id=a.id where a.receipt_hash=extensions.digest(p_code::text,'sha256') and a.email=lower(btrim(p_email))),jsonb_build_object('found',false));
$$;
create function public.nabd_hope_verification_save(p_code uuid,p_email text,p_kind text,p_issuer text,p_number text,p_path text,p_mime text,p_bytes integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare aid uuid; oldpath text; oldstate text; oldsubmitted timestamptz; h bytea; n text:=upper(btrim(p_number)); issuer text:=upper(btrim(p_issuer));
begin
 if p_kind not in ('national_id','passport') or issuer !~ '^[A-Z]{2}$' or n !~ '^[A-Z0-9]{5,20}$' or (p_kind='national_id' and issuer='PS' and n !~ '^[0-9]{9}$') or p_mime not in ('application/pdf','image/jpeg','image/png') or p_bytes not between 1 and 1048576 then return jsonb_build_object('ok',false,'error','INVALID_INPUT');end if;
 select id into aid from public.nabd_hope_applications where receipt_hash=extensions.digest(p_code::text,'sha256') and email=lower(btrim(p_email)) for update;
 if not found then return jsonb_build_object('ok',false,'error','NOT_FOUND');end if;
 if p_path is null or p_path !~ ('^'||aid::text||'/[0-9a-f-]{36}\.(pdf|jpg|png)$') then return jsonb_build_object('ok',false,'error','INVALID_INPUT');end if;
 select verification_state,document_path,submitted_at into oldstate,oldpath,oldsubmitted from public.nabd_hope_verifications where application_id=aid;
 if found and (oldstate<>'needs_correction' or oldsubmitted>=now()-interval '1 minute') then return jsonb_build_object('ok',false,'error','ALREADY_SUBMITTED');end if;
 select extensions.hmac(convert_to(p_kind||':'||issuer||':'||n,'UTF8'),secret,'sha256') into h from nabd_hope_private.identity_key where id;
 if h is null then raise exception 'KEY_UNAVAILABLE';end if;
 insert into public.nabd_hope_verifications(application_id,identity_kind,identity_issuer,identity_hash,identity_last4,document_path,document_mime,document_bytes)
 values(aid,p_kind,issuer,h,right(n,4),p_path,p_mime,p_bytes)
 on conflict(application_id) do update set identity_kind=excluded.identity_kind,identity_issuer=excluded.identity_issuer,identity_hash=excluded.identity_hash,identity_last4=excluded.identity_last4,document_path=excluded.document_path,document_mime=excluded.document_mime,document_bytes=excluded.document_bytes,verification_state='submitted',submitted_at=now(),reviewed_at=null,reviewed_by=null;
 return jsonb_build_object('ok',true,'old_path',oldpath);
exception when unique_violation then return jsonb_build_object('ok',false,'error','IDENTITY_CONFLICT');
end;$$;
create function public.nabd_hope_director_verify(p_id uuid,p_state text) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if not (select public.is_admin()) or not exists(select 1 from public.nabd_exam_owner where user_id=auth.uid()) then raise exception 'DIRECTOR_ONLY';end if;
 if p_state not in ('verified','needs_correction') then raise exception 'INVALID_STATE';end if;
 update public.nabd_hope_verifications set verification_state=p_state,reviewed_at=now(),reviewed_by=auth.uid() where application_id=p_id;
 if not found then raise exception 'MISSING_DOCUMENT';end if;
 return jsonb_build_object('ok',true);
end;$$;
create function public.nabd_hope_accept_verified_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.decision='accepted' and (old.decision is distinct from new.decision or (new.result_published and not old.result_published)) and not exists(select 1 from public.nabd_hope_verifications where application_id=new.id and verification_state='verified') then raise exception 'VERIFICATION_REQUIRED';end if;
 return new;
end;$$;
create trigger nabd_hope_accept_requires_verification before update of decision,result_published on public.nabd_hope_applications for each row execute function public.nabd_hope_accept_verified_guard();
revoke all on function public.nabd_hope_verification_prepare(uuid,text),public.nabd_hope_verification_save(uuid,text,text,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.nabd_hope_verification_prepare(uuid,text),public.nabd_hope_verification_save(uuid,text,text,text,text,text,text,integer) to service_role;
revoke all on function public.nabd_hope_director_verify(uuid,text) from public,anon;
grant execute on function public.nabd_hope_director_verify(uuid,text) to authenticated;

