-- READ ONLY follow-up to the operator's first reconciliation result.
-- Do not execute migrations or change metadata to make these comparisons pass.
-- Original check file/results are preserved. Only failed comparisons are investigated.
-- diag.* should match; info.* records original/body-format alternatives, not all-true gates.
-- Return only check_name and matched. No original expressions, bodies, ACLs or row data.
with
expected_checks(table_name,name,compact_rule) as (values
  ('observations','observations_description_not_blank','descriptionisnullorchar_lengthbtrimdescription>0'),
  ('observations','observations_image_path_format_check',
    'image_pathisnullorchar_lengthbtrimimage_path>0andimage_path!~*''^https?:|blob:|data:''andimage_path~*''^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg|jpeg|png|webp$''orimage_path~*''^observations/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg|jpeg|png|webp$'''),
  ('observations','observations_location_not_empty','char_lengthbtrimlocation>0'),
  ('observations','observations_name_not_empty','char_lengthbtrimname>0'),
  ('observations','observations_observer_display_name_not_blank','observer_display_nameisnullorchar_lengthbtrimobserver_display_name>0'),
  ('observations','observations_scientific_name_not_blank','scientific_nameisnullorchar_lengthbtrimscientific_name>0'),
  ('observations','observations_taxonomy_match_type_not_blank','taxonomy_match_typeisnullorchar_lengthbtrimtaxonomy_match_type>0'),
  ('profiles','profiles_display_name_not_blank','display_nameisnullorchar_lengthbtrimdisplay_name>0'),
  ('taxa','taxa_optional_text_not_blank','canonical_nameisnullorchar_lengthbtrimcanonical_name>0andkingdom_keyisnullorchar_lengthbtrimkingdom_key>0andkingdom_nameisnullorchar_lengthbtrimkingdom_name>0andphylum_keyisnullorchar_lengthbtrimphylum_key>0andphylum_nameisnullorchar_lengthbtrimphylum_name>0andclass_keyisnullorchar_lengthbtrimclass_key>0andclass_nameisnullorchar_lengthbtrimclass_name>0andorder_keyisnullorchar_lengthbtrimorder_key>0andorder_nameisnullorchar_lengthbtrimorder_name>0andfamily_keyisnullorchar_lengthbtrimfamily_key>0andfamily_nameisnullorchar_lengthbtrimfamily_name>0andgenus_keyisnullorchar_lengthbtrimgenus_key>0andgenus_nameisnullorchar_lengthbtrimgenus_name>0andspecies_keyisnullorchar_lengthbtrimspecies_key>0andspecies_nameisnullorchar_lengthbtrimspecies_name>0'),
  ('taxa','taxa_required_text_not_blank','char_lengthbtrimsource>0andchar_lengthbtrimsource_checklist_key>0andchar_lengthbtrimsource_taxon_key>0andchar_lengthbtrimaccepted_scientific_name>0andchar_lengthbtrimterminal_rank>0andchar_lengthbtrimtaxonomic_status>0'),
  ('taxonomy_name_resolutions','taxonomy_name_resolutions_required_text_not_blank','char_lengthbtrimsource>0andchar_lengthbtrimsource_checklist_key>0andchar_lengthbtrimnormalized_input>0andchar_lengthbtrimreported_scientific_name>0andchar_lengthbtrimmatch_type>0'),
  ('taxonomy_name_resolutions','taxonomy_name_resolutions_success_match_type_check','upperbtrimmatch_type<>allarray[''none'',''no_match'',''higherrank'',''ambiguous'']')
),
constraint_expressions as (
  select e.*, c.oid, c.convalidated,
    pg_catalog.pg_get_expr(c.conbin,c.conrelid) as expression
  from expected_checks e left join pg_catalog.pg_constraint c
    on c.conrelid=to_regclass('public.'||e.table_name) and c.conname=e.name and c.contype='c'
),
constraint_rules as (
  select e.*, regexp_replace(lower(coalesce(expression,'')), '[[:space:]()]|::text','','g') as original_rule,
    -- Only recognize SQL-standard TRIM(BOTH FROM simple_identifier). Do not alter
    -- TRIM with an explicit character set, LEADING/TRAILING, predicates or limits.
    regexp_replace(lower(coalesce(expression,'')),
      'trim\(both[[:space:]]+from[[:space:]]+([a-z_][a-z_0-9]*)\)', 'btrim(\1)', 'g') as trim_rendering
  from constraint_expressions e
),
expected_indexes(table_name,name,key_rule,predicate_rule) as (values
  ('observations','observations_image_path_idx','image_path','image_pathisnotnull'),
  ('observations','observations_observer_id_idx','observer_id','observer_idisnotnull'),
  ('observations','observations_observer_status_idx','observer_id,status,observed_datedesc','observer_idisnotnull'),
  ('observations','observations_taxon_id_idx','taxon_id','taxon_idisnotnull'),
  ('taxa','taxa_canonical_name_lower_idx','lowercanonical_name','canonical_nameisnotnull'),
  ('taxa','taxa_class_key_idx','class_key','class_keyisnotnull'),
  ('taxa','taxa_family_key_idx','family_key','family_keyisnotnull'),
  ('taxa','taxa_genus_key_idx','genus_key','genus_keyisnotnull'),
  ('taxa','taxa_kingdom_key_idx','kingdom_key','kingdom_keyisnotnull'),
  ('taxa','taxa_order_key_idx','order_key','order_keyisnotnull'),
  ('taxa','taxa_phylum_key_idx','phylum_key','phylum_keyisnotnull'),
  ('taxa','taxa_species_key_idx','species_key','species_keyisnotnull')
),
indexes as (
  select e.*, i.indexrelid, i.indisvalid, i.indisready, i.indisunique,
    i.indnatts, i.indnkeyatts, i.indoption, am.amname,
    regexp_replace((select string_agg(pg_catalog.pg_get_indexdef(i.indexrelid,k,false)
      || case when (i.indoption[k-1]&1)=1 then ' desc' else '' end,',' order by k)
      from generate_series(1,i.indnkeyatts) k),'[[:space:]()]','','g') as actual_key,
    regexp_replace(coalesce(pg_catalog.pg_get_expr(i.indpred,i.indrelid),''),'[[:space:]()]','','g') as original_predicate
  from expected_indexes e left join pg_catalog.pg_class ic on ic.oid=to_regclass('public.'||e.name)
  left join pg_catalog.pg_index i on i.indexrelid=ic.oid and i.indrelid=to_regclass('public.'||e.table_name)
  left join pg_catalog.pg_am am on am.oid=ic.relam
),
expected_functions(name,signature,result_type,language_name,definer,volatility,strict,search_path,body_md5,trim_md5,token_md5,token_count) as (values
  ('guard_observation_edit_fields','public.guard_observation_edit_fields()','trigger','plpgsql',false,'v',false,'public',
    '92dfd7233c27a52a090694ad50ca811e','dbb7fe6ffcedcc840b81b5c296b99d3d','fbb34b07d75600b169b3b9a6dd85d163',346),
  ('provision_public_profile_for_new_auth_user','public.provision_public_profile_for_new_auth_user()','trigger','plpgsql',true,'v',false,'',
    '53501305447a2d3d7484cc22366ffbfa','5810fbdbbabd56e9fba6a3574e094429','2c5304b35f10861b3c5cfe363445f038',83),
  ('normalize_taxonomy_input_key','public.normalize_taxonomy_input_key(text)','text','sql',false,'i',true,'',
    'f15b554cfa917da12ce620cc848a05c1','18d6cd77847269957b5ea58c7fe792de','f4f21227a978974bec2ca73bc24d3634',24),
  ('create_observation_with_verified_taxonomy','public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)',
    'public.observations','plpgsql',true,'v',false,'',
    '73e299f542867b9ea5186a48f5be8d9c','6dc3ff0431e96728cb27ee3ffea708fe','ccc18e974a5c662f38d4d05d60e982ce',773)
),
functions as (
  select e.*, p.oid, p.prorettype, p.prokind, p.proretset, p.prosecdef, p.provolatile,
    p.proisstrict, p.proconfig, l.lanname, replace(p.prosrc,E'\r\n',E'\n') as source
  from expected_functions e left join pg_catalog.pg_proc p on p.oid=to_regprocedure(e.signature)
  left join pg_catalog.pg_language l on l.oid=p.prolang
),
-- Diagnostic lexer, not execution or an arbitrary SQL equivalence proof.
-- Preserve quoted strings/identifiers, punctuation and operator order; omit only
-- whitespace and line comments, lowercase only unquoted tokens. Reject unsupported
-- escape/dollar strings or block-comment forms rather than call them equivalent.
tokens as (
  select f.name, t.position, t.parts[1] as token
  from functions f cross join lateral regexp_matches(coalesce(f.source,''),
    $token$('(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\r\n]*|[A-Za-z_][A-Za-z_0-9$]*|[0-9]+|::|:=|<>|<=|>=|!=|!~\*|!~|~\*|\|\||->>|->|#>>|#>|[^[:space:]])$token$,
    'g') with ordinality t(parts,position)
  where left(t.parts[1],2)<>'--'
),
token_neighbors as (
  select *, lead(token) over (partition by name order by position) as next_token from tokens
),
token_summaries as (
  select name, count(*) as actual_count,
    md5(string_agg(case when left(token,1) in ('''','"') then token else lower(token) end,E'\n' order by position)) as actual_md5,
    bool_and(not (token='$' or (token='/' and next_token='*') or (token='*' and next_token='/')
      or (lower(token) in ('e','u','b','x','n') and left(next_token,1)='''')
      or (lower(token)='u' and next_token='&'))) as supported
  from token_neighbors group by name
),
checks(check_name,matched) as (
  select 'diag.constraint_present_validated.'||name, oid is not null and convalidated from constraint_rules
  union all select 'info.original_constraint_match.'||name, original_rule=compact_rule from constraint_rules
  union all select 'diag.constraint_trim_rendering_match.'||name,
    oid is not null and convalidated and regexp_replace(trim_rendering,'[[:space:]()]|::text','','g')=compact_rule
    from constraint_rules
  union all select 'diag.index_structure.'||name, indexrelid is not null and indisvalid and indisready
    and not indisunique and amname='btree' and indnatts=indnkeyatts and actual_key=key_rule
    and not exists (select 1 from generate_series(0,indnkeyatts-1) k where indoption[k] not in (0,3)) from indexes
  union all select 'diag.index_predicate_case_match.'||name, indexrelid is not null and lower(original_predicate)=predicate_rule from indexes
  union all select 'info.original_index_predicate_match.'||name, original_predicate=predicate_rule from indexes
  union all select 'diag.function_signature.'||name, oid is not null and prorettype=to_regtype(result_type)
    and prokind='f' and not proretset from functions
  union all select 'diag.function_language.'||name, oid is not null and lanname=language_name from functions
  union all select 'diag.function_security.'||name, oid is not null and prosecdef=definer from functions
  union all select 'diag.function_volatility_strict.'||name, oid is not null
    and provolatile::text=volatility and proisstrict=strict from functions
  union all select 'diag.function_search_path.'||name, oid is not null and case
    when search_path='' then proconfig in (array['search_path=""'],array['search_path='])
    else proconfig=array['search_path='||search_path] end from functions
  union all select 'info.function_exact_body.'||name, oid is not null and md5(source)=body_md5 from functions
  union all select 'info.function_outer_whitespace_body.'||name, oid is not null
    and md5(btrim(source,E' \t\n\r\f\013'))=trim_md5 from functions
  union all select 'diag.function_lexer_supported.'||f.name,
    f.oid is not null and current_setting('standard_conforming_strings')='on' and coalesce(s.supported,false)
    from functions f left join token_summaries s using(name)
  union all select 'diag.function_body_tokens.'||f.name,
    f.oid is not null and current_setting('standard_conforming_strings')='on' and coalesce(s.supported,false)
      and s.actual_count=f.token_count and s.actual_md5=f.token_md5
    from functions f left join token_summaries s using(name)
)
select check_name, coalesce(matched,false) as matched from checks order by check_name;
