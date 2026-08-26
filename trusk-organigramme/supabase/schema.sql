-- ============================================================
--  Organigramme TRUSK — schéma Supabase
--  À coller dans : console Supabase > SQL Editor > New query > Run
-- ============================================================

create table if not exists public.org_state (
  id          integer primary key,
  data        jsonb   not null,
  updated_at  timestamptz not null default now()
);

alter table public.org_state enable row level security;

-- ------------------------------------------------------------
--  LECTURE
-- ------------------------------------------------------------
-- Par défaut : toute personne disposant du lien peut consulter
-- l'organigramme, emails internes compris.
--
-- Pour restreindre la consultation aux personnes connectées,
-- commentez la policy ci-dessous et décommentez la suivante.
-- Il faudra alors créer un compte pour chaque lecteur.

create policy "lecture publique"
  on public.org_state for select
  to anon, authenticated
  using (true);

-- create policy "lecture réservée aux comptes"
--   on public.org_state for select
--   to authenticated
--   using (true);

-- ------------------------------------------------------------
--  ÉCRITURE — réservée aux comptes créés dans Supabase
-- ------------------------------------------------------------

create policy "écriture authentifiée"
  on public.org_state for insert
  to authenticated
  with check (true);

create policy "mise à jour authentifiée"
  on public.org_state for update
  to authenticated
  using (true)
  with check (true);

-- Aucune policy de suppression : la ligne ne doit jamais disparaître.
-- Une correction se fait par mise à jour, jamais par suppression.

-- ------------------------------------------------------------
--  Historique des versions (optionnel mais recommandé)
--  Conserve chaque état précédent : permet de revenir en arrière
--  si quelqu'un supprime une branche par erreur.
-- ------------------------------------------------------------

create table if not exists public.org_history (
  id          bigserial primary key,
  data        jsonb not null,
  saved_at    timestamptz not null default now(),
  saved_by    uuid references auth.users(id)
);

alter table public.org_history enable row level security;

create policy "historique lisible par les comptes"
  on public.org_history for select
  to authenticated
  using (true);

create or replace function public.archive_org_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.org_history (data, saved_by)
  values (old.data, auth.uid());
  -- on ne garde que les 50 dernières versions
  delete from public.org_history
  where id in (
    select id from public.org_history
    order by saved_at desc
    offset 50
  );
  return new;
end;
$$;

drop trigger if exists org_state_archive on public.org_state;
create trigger org_state_archive
  before update on public.org_state
  for each row execute function public.archive_org_state();
