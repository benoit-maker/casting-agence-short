-- ============================================
-- BACKFILL: email des acteurs déjà créés, à partir de leur
-- candidature d'origine (applications), rapprochement par nom.
-- Aucune colonne de liaison fiable n'existe (pas d'application_id
-- sur actors) : le matching se fait donc sur actors.name vs
-- applications.first_name + last_name, normalisé (lower + trim +
-- espaces multiples réduits à un seul), et restreint aux
-- correspondances UNIQUES des deux côtés pour éviter tout faux
-- positif (homonymes). Périmètre : applications status = 'accepted'
-- uniquement.
-- Exécuter dans le SQL Editor de Supabase, étape par étape.
-- ============================================

-- ============================================
-- ÉTAPE 1 — Diagnostic (lecture seule, aucune écriture)
-- ============================================
with eligible_actors as (
  select
    id,
    lower(trim(regexp_replace(name, '\s+', ' ', 'g'))) as norm_name
  from actors
  where email is null and name is not null and trim(name) <> ''
),
eligible_apps as (
  select
    lower(trim(regexp_replace(trim(first_name) || ' ' || trim(last_name), '\s+', ' ', 'g'))) as norm_name,
    email
  from applications
  where status = 'accepted' and email is not null and trim(email) <> ''
),
actor_name_counts as (
  select norm_name, count(*) as n from eligible_actors group by norm_name
),
app_name_counts as (
  select norm_name, count(*) as n from eligible_apps group by norm_name
)
select
  (select count(*) from eligible_actors) as actors_sans_email,
  (select count(*) from actor_name_counts a join app_name_counts p using (norm_name) where a.n = 1 and p.n = 1) as matchs_uniques_surs,
  (select count(*) from actor_name_counts a join app_name_counts p using (norm_name) where a.n > 1 or p.n > 1) as noms_ambigus,
  (select count(*) from eligible_actors a left join app_name_counts p using (norm_name) where p.norm_name is null) as sans_correspondance;

-- ============================================
-- ÉTAPE 2 — Backfill (UPDATE), uniquement les correspondances 1:1
-- ============================================
with eligible_apps as (
  select
    lower(trim(regexp_replace(trim(first_name) || ' ' || trim(last_name), '\s+', ' ', 'g'))) as norm_name,
    email,
    count(*) over (
      partition by lower(trim(regexp_replace(trim(first_name) || ' ' || trim(last_name), '\s+', ' ', 'g')))
    ) as name_count
  from applications
  where status = 'accepted' and email is not null and trim(email) <> ''
),
unique_apps as (
  select norm_name, email from eligible_apps where name_count = 1
),
eligible_actors as (
  select
    id,
    lower(trim(regexp_replace(name, '\s+', ' ', 'g'))) as norm_name,
    count(*) over (
      partition by lower(trim(regexp_replace(name, '\s+', ' ', 'g')))
    ) as name_count
  from actors
  where email is null and name is not null and trim(name) <> ''
),
unique_actors as (
  select id, norm_name from eligible_actors where name_count = 1
)
update actors
set email = unique_apps.email
from unique_actors
join unique_apps on unique_apps.norm_name = unique_actors.norm_name
where actors.id = unique_actors.id;

-- ============================================
-- ÉTAPE 3 — Rapport des cas laissés de côté (ambigus ou sans
-- correspondance) : à traiter manuellement au cas par cas.
-- ============================================
select id, name, display_name
from actors
where email is null and name is not null and trim(name) <> ''
order by name;
