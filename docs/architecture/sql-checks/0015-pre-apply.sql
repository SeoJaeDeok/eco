-- READ ONLY / OPERATOR SQL: all passed values must be true before manual 0015.
-- Do not run the migration on false/null/error. No function invocation or row read.
-- Wrong remote spelling is deliberately not printed. Token 604 is fixed by the
-- full 773-token reviewed 0011 fingerprint, not by a substring/name heuristic.
-- BEGIN SHARED CATALOG GUARDS (also used inside migration 0015).
with
target as (
  select p.*, l.lanname
  from pg_catalog.pg_proc p
  join pg_catalog.pg_language l on l.oid = p.prolang
  where p.oid = to_regprocedure(
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)')
),
raw_tokens as (
  select t.position, t.parts[1] as token
  from target f cross join lateral regexp_matches(f.prosrc,
    $token$('(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\r\n]*|[A-Za-z_][A-Za-z_0-9$]*|[0-9]+|::|:=|<>|<=|>=|!=|!~\*|!~|~\*|\|\||->>|->|#>>|#>|[[:space:]]+|[^[:space:]])$token$,
    'g') with ordinality t(parts,position)
),
offsets as (
  select *, 1 + coalesce(sum(char_length(token)) over (
    order by position rows between unbounded preceding and 1 preceding),0)::integer as source_start
  from raw_tokens
),
code_tokens as (
  select *, row_number() over(order by position) as ordinal,
    lead(token) over(order by position) as next_token
  from offsets where left(token,2) <> '--' and token !~ '^[[:space:]]+$'
),
body as (
  select count(*) as token_count,
    array_agg(case when left(token,1) in ('''','"') then token else lower(token) end
      order by ordinal) as tokens,
    md5(string_agg(case when ordinal = 604 then '<target-literal>'
      when left(token,1) in ('''','"') then token else lower(token) end,
      E'\n' order by ordinal)) as masked_hash,
    md5(string_agg(case when left(token,1) in ('''','"') then token else lower(token) end,
      E'\n' order by ordinal)) as full_hash,
    coalesce(bool_and(not (
      token = '$' or (token = '/' and next_token = '*') or (token = '*' and next_token = '/')
      or (lower(token) in ('e','u','b','x','n') and left(next_token,1) = '''')
      or (lower(token) = 'u' and next_token = '&'))),false) as lexer_supported
  from code_tokens
),
correction as (
  select U&'\c591\c11c/\d30c\cda9\b958' as label,
    chr(39) || U&'\c591\c11c/\d30c\cda9\b958' || chr(39) as literal,
    array[U&'\c2dd\bb3c',U&'\d3ec\c720\b958',U&'\c870\b958',
      U&'\ace4\cda9',U&'\c591\c11c/\d30c\cda9\b958',U&'\ade0\b958',U&'\ae30\d0c0'] as allowed_labels
),
checks(check_name,passed) as (
  select 'function_exact_signature_present', exists(select 1 from target)
  union all select 'no_overload', (select count(*) = 1
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'create_observation_with_verified_taxonomy')
  union all select 'reviewed_function_attributes', exists(select 1 from target
    where lanname = 'plpgsql' and prokind = 'f' and not proretset
      and prorettype = to_regtype('public.observations')
      and prosecdef and provolatile = 'v' and not proisstrict and not proleakproof
      and proparallel = 'u'
      and proconfig in (array['search_path=""'],array['search_path=']))
  union all select 'named_arguments_and_defaults', exists(select 1 from target
    where pronargs = 11 and pronargdefaults = 4 and provariadic = 0
      and proallargtypes is null and proargmodes is null
      and pg_catalog.pg_get_expr(proargdefaults,0) = 'NULL::text, NULL::text, NULL::text, NULL::integer'
      and proargnames = array['p_name','p_reported_scientific_name','p_taxon_id','p_location',
        'p_observed_date','p_latitude','p_longitude','p_description','p_image_path',
        'p_image_mime_type','p_image_size_bytes'])
  union all select 'owner_exists_not_browser_role', exists(select 1 from target f
    join pg_catalog.pg_roles r on r.oid = f.proowner
    where r.rolname not in ('anon','authenticated'))
  union all select 'operator_can_replace_existing_function', exists(select 1 from target f
    where pg_catalog.pg_has_role(current_user,f.proowner,'USAGE'))
  union all select 'public_execute_absent', exists(select 1 from target f where not exists(
    select 1 from pg_catalog.aclexplode(coalesce(f.proacl,pg_catalog.acldefault('f',f.proowner))) a
    where a.grantee = 0 and a.privilege_type = 'EXECUTE'))
  union all select 'anon_direct_and_effective_execute_absent', exists(select 1 from target f
    join pg_catalog.pg_roles r on r.rolname = 'anon'
    where not pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE') and not exists(
      select 1 from pg_catalog.aclexplode(coalesce(f.proacl,pg_catalog.acldefault('f',f.proowner))) a
      where a.grantee = r.oid and a.privilege_type = 'EXECUTE'))
  union all select 'authenticated_execute_present', exists(select 1 from target f
    join pg_catalog.pg_roles r on r.rolname = 'authenticated'
    where pg_catalog.has_function_privilege(r.oid,f.oid,'EXECUTE'))
  union all select 'browser_roles_do_not_bypass_rls', (
    select count(*) = 2 and bool_and(not rolsuper and not rolbypassrls)
    from pg_catalog.pg_roles where rolname in ('anon','authenticated'))
  union all select 'reviewed_taxon_check_validated', exists(
    select 1 from pg_catalog.pg_constraint
    where conrelid = to_regclass('public.observations')
      and conname = 'observations_taxon_check' and contype = 'c' and convalidated
      and regexp_replace(replace(lower(pg_catalog.pg_get_expr(conbin,conrelid)),
        '::text',''),'[[:space:]()]','','g') =
        U&'taxon=anyarray[''\c2dd\bb3c'',''\d3ec\c720\b958'',''\c870\b958'',''\ace4\cda9'',''\c591\c11c/\d30c\cda9\b958'',''\ade0\b958'',''\ae30\d0c0'']')
  union all select 'source_lexer_supported', current_setting('standard_conforming_strings') = 'on'
    and current_setting('server_encoding') = 'UTF8' and lexer_supported from body
  union all select 'entire_body_matches_except_target_literal', token_count = 773
    and masked_hash = 'fe460a6b7ba7ab9b9e44d756ea43440a' from body
  union all select 'target_is_one_ordinary_string_literal', exists(select 1 from code_tokens
    where ordinal = 604 and token ~ $literal$^'(?:[^']|'')*'$$literal$)
)
-- END SHARED CATALOG GUARDS
select check_name,coalesce(passed,false) as passed from checks
union all
select 'target_is_still_invalid_not_already_corrected', coalesce(
  token_count = 773 and masked_hash = 'fe460a6b7ba7ab9b9e44d756ea43440a'
  and tokens[604] collate "C" <> c.literal collate "C"
  and not (replace(substr(tokens[604],2,char_length(tokens[604])-2),
    chr(39)||chr(39),chr(39)) collate "C" = any(c.allowed_labels)),false)
from body cross join correction c
order by check_name;
