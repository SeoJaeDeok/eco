-- READ ONLY: narrow follow-up for the one unresolved RPC body comparison.
-- The reviewed body below is inert TEXT from migration 0011, not executable SQL.
-- This statement reads pg_proc only; it does not call the RPC or read user rows.
-- Output only check_name/matched. No source body, tokens, identifiers or ACL output.
-- diag.* compares reviewed vs remote metadata; info.* is explanatory, not a gate.
-- Masked string comparisons only locate differences; they cannot establish safety.
with
reviewed(source) as (values ($reviewed_0011$
declare
  v_user_id uuid := auth.uid();
  v_profile_display_name text;
  v_observer_display_name text;
  v_taxon public.taxa%rowtype;
  v_resolution public.taxonomy_name_resolutions%rowtype;
  v_normalized_input text;
  v_match_type text;
  v_confidence integer;
  v_project_taxon text;
  v_observation public.observations%rowtype;
begin
  if v_user_id is null then
    raise exception 'authenticated user is required for taxonomy-linked observation create';
  end if;

  if p_name is null or pg_catalog.char_length(pg_catalog.btrim(p_name)) = 0 then
    raise exception 'observation name is required';
  end if;

  if p_location is null or pg_catalog.char_length(pg_catalog.btrim(p_location)) = 0 then
    raise exception 'observation location is required';
  end if;

  if p_reported_scientific_name is null
    or pg_catalog.char_length(pg_catalog.btrim(p_reported_scientific_name)) = 0
    or pg_catalog.char_length(pg_catalog.btrim(p_reported_scientific_name)) > 200
    or p_reported_scientific_name ~ '[[:cntrl:]]'
  then
    raise exception 'a valid verified scientific name is required';
  end if;

  if p_latitude is null or p_latitude < -90 or p_latitude > 90 then
    raise exception 'latitude is out of range';
  end if;

  if p_longitude is null or p_longitude < -180 or p_longitude > 180 then
    raise exception 'longitude is out of range';
  end if;

  if (p_description is not null and pg_catalog.char_length(pg_catalog.btrim(p_description)) = 0) then
    raise exception 'description cannot be blank when present';
  end if;

  if (
    (p_image_path is null and (p_image_mime_type is not null or p_image_size_bytes is not null))
    or (p_image_path is not null and (p_image_mime_type is null or p_image_size_bytes is null))
  ) then
    raise exception 'image metadata must be complete when an image path is present';
  end if;

  if p_image_path is not null then
    if p_image_path !~* (
      '^observations/' || v_user_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
    ) then
      raise exception 'image path must belong to the authenticated observer';
    end if;

    if p_image_mime_type not in ('image/jpeg', 'image/png', 'image/webp') then
      raise exception 'image MIME type is not allowed';
    end if;

    if p_image_size_bytes is null or p_image_size_bytes < 0 or p_image_size_bytes > 20971520 then
      raise exception 'image size is out of range';
    end if;
  end if;

  select p.display_name
    into v_profile_display_name
  from public.profiles p
  where p.id = v_user_id;

  if not found then
    raise exception 'observer profile is required';
  end if;

  -- NULLIF is a SQL expression, not an ordinary pg_catalog function.
  v_observer_display_name := nullif(pg_catalog.btrim(v_profile_display_name), '');
  if v_observer_display_name is not null
    and v_observer_display_name ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  then
    v_observer_display_name := null;
  end if;

  select t.*
    into v_taxon
  from public.taxa t
  where t.id = p_taxon_id;

  if not found then
    raise exception 'accepted taxon was not found in the trusted cache';
  end if;

  v_normalized_input := public.normalize_taxonomy_input_key(p_reported_scientific_name);

  select r.*
    into v_resolution
  from public.taxonomy_name_resolutions r
  where r.source = v_taxon.source
    and r.source_checklist_key = v_taxon.source_checklist_key
    and r.normalized_input = v_normalized_input
    and r.taxon_id = v_taxon.id;

  if not found then
    raise exception 'verified taxonomy resolution is required before observation create';
  end if;

  v_match_type := v_resolution.match_type;
  v_confidence := v_resolution.confidence;

  -- COALESCE is a SQL expression, not an ordinary pg_catalog function.
  v_project_taxon := case
    when pg_catalog.lower(pg_catalog.btrim(coalesce(v_taxon.class_name, ''))) = 'insecta' then '곤충'
    when pg_catalog.lower(pg_catalog.btrim(coalesce(v_taxon.class_name, ''))) = 'aves' then '조류'
    when pg_catalog.lower(pg_catalog.btrim(coalesce(v_taxon.class_name, ''))) = 'mammalia' then '포유류'
    when pg_catalog.lower(pg_catalog.btrim(coalesce(v_taxon.class_name, ''))) in ('amphibia', 'reptilia') then '양서/파충류'
    when pg_catalog.lower(pg_catalog.btrim(coalesce(v_taxon.kingdom_name, ''))) = 'plantae' then '식물'
    when pg_catalog.lower(pg_catalog.btrim(coalesce(v_taxon.kingdom_name, ''))) = 'fungi' then '균류'
    else '기타'
  end;

  insert into public.observations (
    name,
    scientific_name,
    taxon,
    location,
    observed_date,
    description,
    latitude,
    longitude,
    image_path,
    image_mime_type,
    image_size_bytes,
    status,
    observer_id,
    observer_display_name,
    taxon_id,
    taxonomy_match_type,
    taxonomy_confidence,
    taxonomy_verified_at
  )
  values (
    pg_catalog.btrim(p_name),
    pg_catalog.btrim(p_reported_scientific_name),
    v_project_taxon,
    pg_catalog.btrim(p_location),
    p_observed_date,
    nullif(pg_catalog.btrim(p_description), ''),
    p_latitude,
    p_longitude,
    p_image_path,
    p_image_mime_type,
    p_image_size_bytes,
    'approved',
    v_user_id,
    v_observer_display_name,
    v_taxon.id,
    v_match_type,
    v_confidence,
    now()
  )
  returning * into v_observation;

  return v_observation;
end;
$reviewed_0011$::text)),
remote_function as (
  select p.oid, replace(p.prosrc,E'\r\n',E'\n') as source
  from pg_catalog.pg_proc p
  where p.oid=to_regprocedure(
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)')
),
sources(side,source) as (
  select 'reviewed',source from reviewed
  union all select 'remote',coalesce((select source from remote_function),'')
),
-- Both sources use the same PostgreSQL lexer. No Node-vs-PostgreSQL digest
-- assumption is required for the side-by-side comparisons.
raw_tokens as (
  select s.side,t.position,t.parts[1] as token
  from sources s cross join lateral regexp_matches(s.source,
    $token$('(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\r\n]*|[A-Za-z_][A-Za-z_0-9$]*|[0-9]+|::|:=|<>|<=|>=|!=|!~\*|!~|~\*|\|\||->>|->|#>>|#>|[^[:space:]])$token$,
    'g') with ordinality t(parts,position)
  where left(t.parts[1],2)<>'--'
),
neighbors as (
  select *,lead(token) over (partition by side order by position) as next_token
  from raw_tokens
),
token_lists as (
  select side,
    array_agg(case when left(token,1) in ('''','"') then token else lower(token) end
      order by position) as tokens,
    bool_and(not (token='$' or (token='/' and next_token='*') or (token='*' and next_token='/')
      or (lower(token) in ('e','u','b','x','n') and left(next_token,1)='''')
      or (lower(token)='u' and next_token='&'))) as supported
  from neighbors group by side
),
bodies as (
  select s.side,coalesce(t.tokens,array[]::text[]) as tokens,
    current_setting('standard_conforming_strings')='on'
      and coalesce(t.supported,false) and cardinality(t.tokens)>0 as supported
  from sources s left join token_lists t using(side)
),
whole_comparison as (
  select e.tokens as expected_tokens,a.tokens as actual_tokens,
    e.supported and a.supported
      and exists(select 1 from remote_function) as supported
  from bodies e cross join bodies a where e.side='reviewed' and a.side='remote'
),
anchors(section_order,section_name,anchor) as (values
  (1,'declarations_and_auth',array['declare']),
  (2,'input_validation',array['if','p_name','is','null']),
  (3,'image_validation',array['if','(','(','p_image_path','is','null']),
  (4,'profile_and_safe_name',array['select','p','.','display_name']),
  (5,'accepted_taxon',array['select','t','.','*']),
  (6,'resolution_and_confidence',array['v_normalized_input',':=','public','.','normalize_taxonomy_input_key']),
  (7,'category_mapping',array['v_project_taxon',':=','case']),
  (8,'observation_insert_return',array['insert','into','public','.','observations'])
),
anchor_locations as (
  select b.side,a.section_order,a.section_name,
    count(k.position) as occurrences,min(k.position) as start_position
  from bodies b cross join anchors a
  left join lateral (
    select position from generate_series(1,cardinality(b.tokens)-cardinality(a.anchor)+1) position
    where b.tokens[position:position+cardinality(a.anchor)-1]=a.anchor
  ) k on true
  group by b.side,a.section_order,a.section_name
),
boundaries as (
  select a.*,lead(start_position,1,cardinality(b.tokens)+1)
    over (partition by a.side order by section_order) as end_position
  from anchor_locations a join bodies b using(side)
),
anchor_safety as (
  select side,count(*)=8
    and bool_and(occurrences=1 and start_position<end_position
      and (section_order<>1 or start_position=1)) as matched
  from boundaries group by side
),
sections as (
  select a.side,a.section_order,a.section_name,
    b.supported and s.matched as supported,
    b.tokens[a.start_position:a.end_position-1] as tokens
  from boundaries a join bodies b using(side) join anchor_safety s using(side)
),
section_comparisons as (
  select e.section_name,e.supported and a.supported as supported,
    e.tokens as expected_tokens,a.tokens as actual_tokens
  from sections e join sections a using(section_order,section_name)
  where e.side='reviewed' and a.side='remote'
),
checks(check_name,matched) as (
  select 'diag.function_present',exists(select 1 from remote_function)
  union all select 'diag.lexer_supported.'||side,supported from bodies
  union all select 'diag.unique_ordered_section_anchors.'||side,matched from anchor_safety
  union all select 'diag.whole_body_tokens_match',
    supported and expected_tokens=actual_tokens from whole_comparison
  union all select 'diag.whole_body_string_literals_match',supported
    and array(select t from unnest(expected_tokens) with ordinality u(t,n) where left(t,1)='''' order by n)
      = array(select t from unnest(actual_tokens) with ordinality u(t,n) where left(t,1)='''' order by n)
    from whole_comparison
  union all select 'diag.whole_body_with_strings_masked_match',supported
    and array(select case when left(t,1)='''' then '<string-literal>' else t end
      from unnest(expected_tokens) with ordinality u(t,n) order by n)
      = array(select case when left(t,1)='''' then '<string-literal>' else t end
      from unnest(actual_tokens) with ordinality u(t,n) order by n)
    from whole_comparison
  union all select 'diag.section_tokens_match.'||section_name,
    supported and expected_tokens=actual_tokens from section_comparisons
  union all select 'diag.section_string_literals_match.'||section_name,supported
    and array(select t from unnest(expected_tokens) with ordinality u(t,n) where left(t,1)='''' order by n)
      = array(select t from unnest(actual_tokens) with ordinality u(t,n) where left(t,1)='''' order by n)
    from section_comparisons
  union all select 'diag.section_with_strings_masked_match.'||section_name,supported
    and array(select case when left(t,1)='''' then '<string-literal>' else t end
      from unnest(expected_tokens) with ordinality u(t,n) order by n)
      = array(select case when left(t,1)='''' then '<string-literal>' else t end
      from unnest(actual_tokens) with ordinality u(t,n) order by n)
    from section_comparisons
  union all select 'info.reviewed_literal_matches_local_0011_md5',
    md5(source)='73e299f542867b9ea5186a48f5be8d9c' from reviewed
  union all select 'info.reviewed_tokens_match_prior_local_fingerprint',
    cardinality(tokens)=773 and md5(array_to_string(tokens,E'\n'))='ccc18e974a5c662f38d4d05d60e982ce'
    from bodies where side='reviewed'
  union all select 'info.remote_token_count_matches_reviewed',
    cardinality(expected_tokens)=cardinality(actual_tokens) from whole_comparison
)
select check_name,coalesce(matched,false) as matched from checks order by check_name;
