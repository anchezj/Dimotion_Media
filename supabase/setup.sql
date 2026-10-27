do $$
begin
  create type public.app_role as enum ('cliente', 'admin');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre_cliente text not null check (length(btrim(nombre_cliente)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clientes
  add column if not exists correo_contacto text,
  add column if not exists telefono_contacto text,
  add column if not exists is_active boolean not null default true,
  add column if not exists deleted_at timestamptz,
  add column if not exists campanas_cerradas integer not null default 0;

create unique index if not exists clientes_nombre_cliente_unique
  on public.clientes (lower(btrim(nombre_cliente)));

create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  nombre_usuario text not null check (length(btrim(nombre_usuario)) > 0),
  correo_electronico text not null unique,
  rol public.app_role not null default 'cliente',
  is_active boolean not null default false,
  debe_cambiar_contrasena boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios
  add column if not exists debe_cambiar_contrasena boolean not null default false,
  add column if not exists deleted_at timestamptz;

create unique index if not exists usuarios_nombre_cliente_unique
  on public.usuarios (cliente_id, lower(btrim(nombre_usuario)))
  where rol = 'cliente' and cliente_id is not null;

create unique index if not exists usuarios_nombre_admin_unique
  on public.usuarios (lower(btrim(nombre_usuario)))
  where rol = 'admin';

alter table public.clientes enable row level security;
alter table public.usuarios enable row level security;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios as usuario
    where usuario.id = (select auth.uid())
      and usuario.rol = 'admin'
      and usuario.is_active
      and not usuario.debe_cambiar_contrasena
  );
$$;

create or replace function public.current_active_cliente_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select usuario.cliente_id
  from public.usuarios as usuario
  join public.clientes as cliente on cliente.id = usuario.cliente_id
  where usuario.id = (select auth.uid())
    and usuario.rol = 'cliente'
    and usuario.is_active
    and not usuario.debe_cambiar_contrasena
    and cliente.is_active
  limit 1;
$$;

revoke all on function public.is_active_admin() from public, anon;
grant execute on function public.is_active_admin() to authenticated;
revoke all on function public.current_active_cliente_id() from public, anon;
grant execute on function public.current_active_cliente_id() to authenticated;

drop policy if exists "Users can read their own user record" on public.usuarios;
create policy "Users can read their own user record"
on public.usuarios for select to authenticated
using (id = (select auth.uid()) or (select public.is_active_admin()));

drop policy if exists "Admins can update user records" on public.usuarios;
create policy "Admins can update user records"
on public.usuarios for update to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

drop policy if exists "Users can read their own client or admins can read all clients" on public.clientes;
create policy "Users can read their own client or admins can read all clients"
on public.clientes for select to authenticated
using (
  id = (select public.current_active_cliente_id())
  or (select public.is_active_admin())
);

drop policy if exists "Admins can update clients" on public.clientes;
create policy "Admins can update clients"
on public.clientes for update to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

drop policy if exists "Admins can create clients" on public.clientes;
create policy "Admins can create clients"
on public.clientes for insert to authenticated
with check ((select public.is_active_admin()));

drop policy if exists "Admins can delete clients without campaign history" on public.clientes;
create policy "Admins can delete clients without campaign history"
on public.clientes for delete to authenticated
using ((select public.is_active_admin()));

revoke all on public.usuarios, public.clientes from anon, authenticated;
grant select on public.usuarios, public.clientes to authenticated;
grant update (cliente_id, nombre_usuario, rol, is_active) on public.usuarios to authenticated;
grant insert, delete on public.clientes to authenticated;
grant update (nombre_cliente, correo_contacto, telefono_contacto, is_active, campanas_cerradas)
  on public.clientes to authenticated;
grant usage on type public.app_role to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_cliente_id uuid;
  new_client_name text := nullif(btrim(new.raw_user_meta_data ->> 'client_name'), '');
begin
  if new_client_name is not null then
    insert into public.clientes (nombre_cliente, correo_contacto, is_active)
    values (new_client_name, new.email, false)
    on conflict do nothing;

    select id into new_cliente_id
    from public.clientes
    where lower(btrim(nombre_cliente)) = lower(new_client_name)
    limit 1;
  end if;

  insert into public.usuarios (
    id,
    cliente_id,
    nombre_usuario,
    correo_electronico
  )
  values (
    new.id,
    new_cliente_id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'username'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'requester_name'), ''),
      nullif(split_part(new.email, '@', 1), ''),
      'Usuario'
    ),
    new.email
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

drop trigger if exists set_clientes_updated_at on public.clientes;
create trigger set_clientes_updated_at
  before update on public.clientes
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_usuarios_updated_at on public.usuarios;
create trigger set_usuarios_updated_at
  before update on public.usuarios
  for each row execute procedure public.set_updated_at();

insert into public.clientes (nombre_cliente, correo_contacto, is_active)
select distinct
  btrim(raw_user_meta_data ->> 'client_name'),
  email,
  false
from auth.users
where nullif(btrim(raw_user_meta_data ->> 'client_name'), '') is not null
on conflict do nothing;

insert into public.usuarios (
  id,
  cliente_id,
  nombre_usuario,
  correo_electronico
)
select
  auth_user.id,
  (
    select cliente.id
    from public.clientes as cliente
    where lower(btrim(cliente.nombre_cliente)) =
      lower(btrim(auth_user.raw_user_meta_data ->> 'client_name'))
    limit 1
  ),
  coalesce(
    nullif(btrim(auth_user.raw_user_meta_data ->> 'username'), ''),
    nullif(btrim(auth_user.raw_user_meta_data ->> 'requester_name'), ''),
    nullif(split_part(auth_user.email, '@', 1), ''),
    'Usuario'
  ),
  auth_user.email
from auth.users as auth_user
where auth_user.email is not null
on conflict (id) do nothing;

do $$
begin
  create type public.campaign_stage as enum (
    'pago',
    'guion',
    'grabacion',
    'cambios',
    'entrega'
  );
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.campaign_status as enum ('active', 'paused', 'closed');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.campanas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  titulo text not null check (length(btrim(titulo)) > 0),
  fecha date not null,
  hora time not null,
  etapa public.campaign_stage not null default 'pago',
  estado public.campaign_status not null default 'active',
  observaciones text not null default '',
  solicitada_por uuid not null default auth.uid()
    references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campanas
  add column if not exists closed_at timestamptz;

update public.campanas
set closed_at = updated_at
where estado = 'closed'
  and closed_at is null;

create index if not exists campanas_cliente_fecha_idx
  on public.campanas (cliente_id, fecha, hora);

create table if not exists public.campana_etapas_historial (
  id bigint generated always as identity primary key,
  campana_id uuid not null references public.campanas (id) on delete cascade,
  etapa public.campaign_stage not null,
  cambiado_por uuid references auth.users (id) on delete set null,
  cambiado_en timestamptz not null default now()
);

create index if not exists campana_etapas_historial_campana_fecha_idx
  on public.campana_etapas_historial (campana_id, cambiado_en);

alter table public.campanas enable row level security;
alter table public.campana_etapas_historial enable row level security;

drop policy if exists "Clients can read their campaigns and admins can read all" on public.campanas;
create policy "Clients can read their campaigns and admins can read all"
on public.campanas for select to authenticated
using (
  cliente_id = (select public.current_active_cliente_id())
  or (select public.is_active_admin())
);

drop policy if exists "Active clients can request campaigns and admins can create" on public.campanas;
create policy "Active clients can request campaigns and admins can create"
on public.campanas for insert to authenticated
with check (
  solicitada_por = (select auth.uid())
  and (
    cliente_id = (select public.current_active_cliente_id())
    or (select public.is_active_admin())
  )
);

drop policy if exists "Admins can update campaigns" on public.campanas;
create policy "Admins can update campaigns"
on public.campanas for update to authenticated
using ((select public.is_active_admin()))
with check ((select public.is_active_admin()));

drop policy if exists "Admins can delete campaigns" on public.campanas;
create policy "Admins can delete campaigns"
on public.campanas for delete to authenticated
using ((select public.is_active_admin()));

drop policy if exists "Users can read history for visible campaigns" on public.campana_etapas_historial;
create policy "Users can read history for visible campaigns"
on public.campana_etapas_historial for select to authenticated
using (
  exists (
    select 1
    from public.campanas as campana
    where campana.id = campana_etapas_historial.campana_id
      and (
        campana.cliente_id = (select public.current_active_cliente_id())
        or (select public.is_active_admin())
      )
  )
);

revoke all on public.campanas, public.campana_etapas_historial
  from anon, authenticated;
grant select on public.campanas, public.campana_etapas_historial to authenticated;
grant insert (cliente_id, titulo, fecha, hora, solicitada_por)
  on public.campanas to authenticated;
grant update (cliente_id, titulo, fecha, hora, etapa, estado, observaciones)
  on public.campanas to authenticated;
grant delete on public.campanas to authenticated;

create or replace function public.record_campaign_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.campana_etapas_historial (campana_id, etapa, cambiado_por)
    values (new.id, new.etapa, new.solicitada_por);
  elsif new.etapa is distinct from old.etapa then
    insert into public.campana_etapas_historial (campana_id, etapa, cambiado_por)
    values (new.id, new.etapa, (select auth.uid()));
  end if;
  return new;
end;
$$;

revoke all on function public.record_campaign_stage() from public, anon, authenticated;

drop trigger if exists record_campaign_stage on public.campanas;
create trigger record_campaign_stage
  after insert or update of etapa on public.campanas
  for each row execute procedure public.record_campaign_stage();

drop trigger if exists set_campanas_updated_at on public.campanas;
create trigger set_campanas_updated_at
  before update on public.campanas
  for each row execute procedure public.set_updated_at();
