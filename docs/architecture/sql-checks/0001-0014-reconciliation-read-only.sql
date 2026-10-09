-- READ ONLY evidence bundle, not a migration or a repair script.
-- One SELECT statement; no application rows, identities, ACLs or function bodies returned.
-- Run manually in the SAME project's SQL Editor. Codex must not execute it remotely.
-- Historical 0012/0013/0014 post-check PASS is reused, not represented as rerun here.
-- gate.* should be true. info.* are observations, NOT all-true requirements.
-- In particular, the 0002 bucket limit and the later manual 22C limit differ.
-- A false definition comparison needs review, never migration replay/automatic repair.
with
relations as (
  select c.*, n.nspname from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
),
column_groups(table_name, type_name, required, names) as (values
  ('profiles','uuid',true,array['id']),
  ('profiles','text',true,array['role']),
  ('profiles','text',false,array['display_name']),
  ('profiles','timestamp with time zone',true,array['created_at','updated_at']),
  ('observations','uuid',true,array['id']),
  ('observations','uuid',false,array['observer_id','taxon_id']),
  ('observations','text',true,array['name','taxon','location','status']),
  ('observations','text',false,array['scientific_name','description','image_url','image_path',
    'image_mime_type','observer_display_name','taxonomy_match_type']),
  ('observations','date',true,array['observed_date']),
  ('observations','double precision',true,array['latitude','longitude']),
  ('observations','integer',false,array['image_size_bytes','taxonomy_confidence']),
  ('observations','timestamp with time zone',true,array['created_at','updated_at']),
  ('observations','timestamp with time zone',false,array['taxonomy_verified_at']),
  ('taxa','uuid',true,array['id']),
  ('taxa','text',true,array['source','source_checklist_key','source_taxon_key',
    'accepted_scientific_name','terminal_rank','taxonomic_status']),
  ('taxa','text',false,array['canonical_name','kingdom_key','kingdom_name','phylum_key',
    'phylum_name','class_key','class_name','order_key','order_name','family_key',
    'family_name','genus_key','genus_name','species_key','species_name']),
  ('taxa','jsonb',true,array['classification_json']),
  ('taxa','timestamp with time zone',true,array['resolved_at','updated_at']),
  ('taxonomy_name_resolutions','uuid',true,array['id','taxon_id']),
  ('taxonomy_name_resolutions','text',true,array['source','source_checklist_key',
    'normalized_input','reported_scientific_name','match_type']),
  ('taxonomy_name_resolutions','integer',false,array['confidence']),
  ('taxonomy_name_resolutions','boolean',true,array['synonym','requires_confirmation']),
  ('taxonomy_name_resolutions','jsonb',true,array['issues_json']),
  ('taxonomy_name_resolutions','timestamp with time zone',true,array['resolved_at','updated_at'])
),
expected_columns as (
  select g.table_name, g.type_name, g.required, unnest(g.names) as column_name from column_groups g
),
attributes as (
  select r.relname::text as table_name, a.*,
    replace(coalesce(pg_catalog.pg_get_expr(d.adbin,d.adrelid),''),'public.','') as default_rule
  from relations r join pg_catalog.pg_attribute a on a.attrelid = r.oid
  left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where r.nspname = 'public' and r.relname in
    ('profiles','observations','taxa','taxonomy_name_resolutions')
    and a.attnum > 0 and not a.attisdropped
),
expected_defaults(table_name,column_name,rule) as (values
  ('profiles','role','''user''::text'), ('profiles','created_at','now()'),
  ('profiles','updated_at','now()'), ('observations','id','gen_random_uuid()'),
  ('observations','status','''pending''::text'), ('observations','created_at','now()'),
  ('observations','updated_at','now()'), ('taxa','id','gen_random_uuid()'),
  ('taxa','classification_json','''{}''::jsonb'), ('taxa','resolved_at','now()'),
  ('taxa','updated_at','now()'), ('taxonomy_name_resolutions','id','gen_random_uuid()'),
  ('taxonomy_name_resolutions','synonym','false'),
  ('taxonomy_name_resolutions','requires_confirmation','false'),
  ('taxonomy_name_resolutions','issues_json','''[]''::jsonb'),
  ('taxonomy_name_resolutions','resolved_at','now()'),
  ('taxonomy_name_resolutions','updated_at','now()')
),
keys as (
  select c.*, r.relname::text as table_name,
    array(select a.attname::text from unnest(c.conkey) with ordinality k(num,pos)
      join pg_catalog.pg_attribute a on a.attrelid=c.conrelid and a.attnum=k.num order by k.pos) as cols,
    array(select a.attname::text from unnest(c.confkey) with ordinality k(num,pos)
      join pg_catalog.pg_attribute a on a.attrelid=c.confrelid and a.attnum=k.num order by k.pos) as ref_cols
  from pg_catalog.pg_constraint c join relations r on r.oid=c.conrelid
  where r.nspname='public'
),
expected_fks(table_name,cols,target,delete_rule) as (values
  ('profiles',array['id'],'auth.users','c'),
  ('observations',array['observer_id'],'public.profiles','n'),
  ('observations',array['taxon_id'],'public.taxa','r'),
  ('taxonomy_name_resolutions',array['taxon_id'],'public.taxa','r')
),
expected_unique(table_name,cols) as (values
  ('taxa',array['source','source_checklist_key','source_taxon_key']),
  ('taxonomy_name_resolutions',array['source','source_checklist_key','normalized_input'])
),
-- CHECK expression comparisons below use the same compact deparser convention as
-- existing post-checks. They are drift screens, not a proof of arbitrary SQL equivalence.
-- Review false results (including formatting/cast differences) without weakening checks.
check_rules as (
  select k.*, regexp_replace(regexp_replace(replace(lower(coalesce(pg_catalog.pg_get_expr(k.conbin,k.conrelid),'')),
    '::double precision',''), '''(-?[0-9]+)''', '\1', 'g'),
    '[[:space:]()]|::text|::integer','', 'g') as rule
  from keys k where k.contype='c'
),
expected_checks(table_name,name,rule) as (values
  ('profiles','profiles_role_check','role=anyarray[''user'',''admin'']'),
  ('profiles','profiles_display_name_not_blank','display_nameisnullorchar_lengthbtrimdisplay_name>0'),
  ('observations','observations_name_not_empty','char_lengthbtrimname>0'),
  ('observations','observations_scientific_name_not_blank','scientific_nameisnullorchar_lengthbtrimscientific_name>0'),
  ('observations','observations_taxon_check','taxon=anyarray[''식물'',''포유류'',''조류'',''곤충'',''양서/파충류'',''균류'',''기타'']'),
  ('observations','observations_location_not_empty','char_lengthbtrimlocation>0'),
  ('observations','observations_description_not_blank','descriptionisnullorchar_lengthbtrimdescription>0'),
  ('observations','observations_status_check','status=anyarray[''pending'',''approved'',''rejected'']'),
  ('observations','observations_latitude_check','latitude>=-90andlatitude<=90'),
  ('observations','observations_longitude_check','longitude>=-180andlongitude<=180'),
  ('observations','observations_image_path_format_check',
    'image_pathisnullorchar_lengthbtrimimage_path>0andimage_path!~*''^https?:|blob:|data:''andimage_path~*''^pending/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg|jpeg|png|webp$''orimage_path~*''^observations/[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg|jpeg|png|webp$'''),
  ('observations','observations_image_mime_type_check','image_mime_typeisnullorimage_mime_type=anyarray[''image/jpeg'',''image/png'',''image/webp'']'),
  ('observations','observations_image_size_bytes_check','image_size_bytesisnullorimage_size_bytes>=0andimage_size_bytes<=20971520'),
  ('observations','observations_image_metadata_complete_check','image_pathisnullorimage_mime_typeisnotnullandimage_size_bytesisnotnull'),
  ('observations','observations_observer_display_name_not_blank','observer_display_nameisnullorchar_lengthbtrimobserver_display_name>0'),
  ('observations','observations_taxonomy_confidence_check','taxonomy_confidenceisnullortaxonomy_confidence>=0andtaxonomy_confidence<=100'),
  ('observations','observations_taxonomy_match_type_not_blank','taxonomy_match_typeisnullorchar_lengthbtrimtaxonomy_match_type>0'),
  ('observations','observations_taxonomy_linkage_complete_check','taxon_idisnullandtaxonomy_match_typeisnullandtaxonomy_confidenceisnullandtaxonomy_verified_atisnullortaxon_idisnotnullandtaxonomy_match_typeisnotnullandtaxonomy_verified_atisnotnull'),
  ('taxa','taxa_required_text_not_blank','char_lengthbtrimsource>0andchar_lengthbtrimsource_checklist_key>0andchar_lengthbtrimsource_taxon_key>0andchar_lengthbtrimaccepted_scientific_name>0andchar_lengthbtrimterminal_rank>0andchar_lengthbtrimtaxonomic_status>0'),
  ('taxa','taxa_optional_text_not_blank','canonical_nameisnullorchar_lengthbtrimcanonical_name>0andkingdom_keyisnullorchar_lengthbtrimkingdom_key>0andkingdom_nameisnullorchar_lengthbtrimkingdom_name>0andphylum_keyisnullorchar_lengthbtrimphylum_key>0andphylum_nameisnullorchar_lengthbtrimphylum_name>0andclass_keyisnullorchar_lengthbtrimclass_key>0andclass_nameisnullorchar_lengthbtrimclass_name>0andorder_keyisnullorchar_lengthbtrimorder_key>0andorder_nameisnullorchar_lengthbtrimorder_name>0andfamily_keyisnullorchar_lengthbtrimfamily_key>0andfamily_nameisnullorchar_lengthbtrimfamily_name>0andgenus_keyisnullorchar_lengthbtrimgenus_key>0andgenus_nameisnullorchar_lengthbtrimgenus_name>0andspecies_keyisnullorchar_lengthbtrimspecies_key>0andspecies_nameisnullorchar_lengthbtrimspecies_name>0'),
  ('taxa','taxa_classification_json_object','jsonb_typeofclassification_json=''object'''),
  ('taxonomy_name_resolutions','taxonomy_name_resolutions_required_text_not_blank','char_lengthbtrimsource>0andchar_lengthbtrimsource_checklist_key>0andchar_lengthbtrimnormalized_input>0andchar_lengthbtrimreported_scientific_name>0andchar_lengthbtrimmatch_type>0'),
  ('taxonomy_name_resolutions','taxonomy_name_resolutions_confidence_check','confidenceisnullorconfidence>=0andconfidence<=100'),
  ('taxonomy_name_resolutions','taxonomy_name_resolutions_issues_json_array','jsonb_typeofissues_json=''array'''),
  ('taxonomy_name_resolutions','taxonomy_name_resolutions_success_match_type_check','upperbtrimmatch_type<>allarray[''none'',''no_match'',''higherrank'',''ambiguous'']')
),
expected_indexes(table_name,name,key_rule,predicate_rule) as (values
  ('observations','observations_status_observed_date_idx','status,observed_datedesc',''),
  ('observations','observations_taxon_status_idx','taxon,status',''),
  ('observations','observations_created_at_idx','created_atdesc',''),
  ('observations','observations_image_path_idx','image_path','image_pathisnotnull'),
  ('observations','observations_observer_id_idx','observer_id','observer_idisnotnull'),
  ('observations','observations_observer_status_idx','observer_id,status,observed_datedesc','observer_idisnotnull'),
  ('observations','observations_taxon_id_idx','taxon_id','taxon_idisnotnull'),
  ('taxa','taxa_accepted_scientific_name_lower_idx','loweraccepted_scientific_name',''),
  ('taxa','taxa_canonical_name_lower_idx','lowercanonical_name','canonical_nameisnotnull'),
  ('taxa','taxa_kingdom_key_idx','kingdom_key','kingdom_keyisnotnull'),
  ('taxa','taxa_phylum_key_idx','phylum_key','phylum_keyisnotnull'),
  ('taxa','taxa_class_key_idx','class_key','class_keyisnotnull'),
  ('taxa','taxa_order_key_idx','order_key','order_keyisnotnull'),
  ('taxa','taxa_family_key_idx','family_key','family_keyisnotnull'),
  ('taxa','taxa_genus_key_idx','genus_key','genus_keyisnotnull'),
  ('taxa','taxa_species_key_idx','species_key','species_keyisnotnull'),
  ('taxonomy_name_resolutions','taxonomy_name_resolutions_taxon_id_idx','taxon_id','')
),
indexes as (
  select i.*, ic.relname::text as name, r.relname::text as table_name, am.amname,
    regexp_replace((select string_agg(pg_catalog.pg_get_indexdef(i.indexrelid,k,false)
      || case when (i.indoption[k-1] & 1)=1 then ' desc' else '' end,',' order by k)
      from generate_series(1,i.indnkeyatts) k),'[[:space:]()]','','g') as key_rule,
    regexp_replace(coalesce(pg_catalog.pg_get_expr(i.indpred,i.indrelid),''),'[[:space:]()]','','g') as predicate_rule
  from pg_catalog.pg_index i join relations ic on ic.oid=i.indexrelid
  join relations r on r.oid=i.indrelid join pg_catalog.pg_am am on am.oid=ic.relam
  where r.nspname='public'
),
expected_functions(name,signature,result_type,language_name,definer,volatility,strict,search_path,body_md5) as (values
  ('set_updated_at','public.set_updated_at()','trigger','plpgsql',false,'v',false,null,'9b1889f56258bf9d6554213c05019c76'),
  ('is_admin','public.is_admin()','boolean','sql',true,'s',false,'public','a48a3b72d94a37a286c216626640ca56'),
  ('guard_observation_edit_fields','public.guard_observation_edit_fields()','trigger','plpgsql',false,'v',false,'public','92dfd7233c27a52a090694ad50ca811e'),
  ('provision_public_profile_for_new_auth_user','public.provision_public_profile_for_new_auth_user()','trigger','plpgsql',true,'v',false,'','53501305447a2d3d7484cc22366ffbfa'),
  ('normalize_taxonomy_input_key','public.normalize_taxonomy_input_key(text)','text','sql',false,'i',true,'','f15b554cfa917da12ce620cc848a05c1'),
  ('create_observation_with_verified_taxonomy','public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)',
    'public.observations','plpgsql',true,'v',false,'','73e299f542867b9ea5186a48f5be8d9c')
),
functions as (
  select e.*, p.oid, p.proowner, p.proacl, p.prosrc, p.pronargdefaults, p.proargnames, p.proargdefaults,
    p.prorettype, p.proretset, p.prokind, p.prosecdef, p.provolatile, p.proisstrict, p.proconfig,
    l.lanname
  from expected_functions e left join pg_catalog.pg_proc p on p.oid=to_regprocedure(e.signature)
  left join pg_catalog.pg_language l on l.oid=p.prolang
),
expected_triggers(table_name,name,function_name,type_number) as (values
  ('public.profiles','profiles_set_updated_at','public.set_updated_at()',19),
  ('public.observations','observations_set_updated_at','public.set_updated_at()',19),
  ('public.observations','observations_guard_edit_fields','public.guard_observation_edit_fields()',19),
  ('auth.users','auth_users_provision_public_profile','public.provision_public_profile_for_new_auth_user()',5),
  ('public.taxa','taxa_set_updated_at','public.set_updated_at()',19),
  ('public.taxonomy_name_resolutions','taxonomy_name_resolutions_set_updated_at','public.set_updated_at()',19)
),
expected_policies(schema_name,table_name,name,cmd,roles,using_rule,check_rule) as (values
  ('public','profiles','Users can read own profile','SELECT',array['authenticated'],'id=auth.uid',''),
  ('public','profiles','Admins can read all profiles','SELECT',array['authenticated'],'is_admin',''),
  ('public','profiles','Users can update own display name','UPDATE',array['authenticated'],'id=auth.uid','id=auth.uid'),
  ('public','observations','Authenticated users can create own approved observations','INSERT',array['authenticated'],'',
    'observer_id=auth.uidandstatus=''approved''andimage_urlisnullandobserver_display_nameisnullorobserver_display_name=selectprofiles.display_namefromprofileswhereprofiles.id=auth.uidandtaxon_idisnullandtaxonomy_match_typeisnullandtaxonomy_confidenceisnullandtaxonomy_verified_atisnull'),
  ('public','taxa','Public can read accepted taxa','SELECT',array['anon','authenticated'],'true',''),
  ('storage','objects','Authenticated users can upload own observation images','INSERT',array['authenticated'],'',
    'bucket_id=''observation-images''andname~*''^observations/''||auth.uid||''/[0-9a-f-]{36}\.jpg|jpeg|png|webp$''')
),
policies as (
  select p.*, regexp_replace(replace(replace(lower(coalesce(qual,'')),'public.',''),'storage.',''),
    '[[:space:]()]|::text','','g') as using_rule,
    regexp_replace(replace(replace(lower(coalesce(with_check,'')),'public.',''),'storage.',''),
    '[[:space:]()]|::text','','g') as check_rule
  from pg_catalog.pg_policies p
),
-- A fixed SELECT on bucket CONFIGURATION only. CASE guards missing table/columns.
-- query_to_xml never receives operator input, application identifiers or write SQL.
bucket_metadata as (
  select case when exists (select 1 from relations where nspname='storage' and relname='buckets' and relkind='r')
    and (select count(*)=5 from pg_catalog.pg_attribute where attrelid=to_regclass('storage.buckets')
      and attname in ('id','name','public','file_size_limit','allowed_mime_types') and attnum>0 and not attisdropped)
    then pg_catalog.query_to_xml($bucket_query$
      select count(*)=1 and bool_and(name='observation-images' and not public
        and allowed_mime_types @> array['image/jpeg','image/png','image/webp']::text[]
        and cardinality(allowed_mime_types)=3) as private_mime_ok,
        count(*)=1 and bool_and(file_size_limit=5242880) as five_mib,
        count(*)=1 and bool_and(file_size_limit=20971520) as twenty_mib,
        count(*)=1 and bool_and(file_size_limit=20000000) as twenty_decimal_mb
      from storage.buckets where id='observation-images'
    $bucket_query$, false, false, '') else null end as value
),
checks(check_name,passed) as (
  select 'info.history_schema_still_absent', not exists (
    select 1 from pg_catalog.pg_namespace where nspname='supabase_migrations')
  union all select 'gate.pgcrypto_present', exists (select 1 from pg_catalog.pg_extension where extname='pgcrypto')
  union all select 'gate.table_rls.'||t.table_name, exists (
    select 1 from relations where nspname='public' and relname=t.table_name and relkind='r' and relrowsecurity)
    from (select distinct table_name from expected_columns) t
  union all select 'gate.columns.'||t.table_name,
    not exists (select 1 from expected_columns e where e.table_name=t.table_name and not exists (
      select 1 from attributes a where a.table_name=e.table_name and a.attname=e.column_name
        and pg_catalog.format_type(a.atttypid,a.atttypmod)=e.type_name and a.attnotnull=e.required
        and a.attidentity='' and a.attgenerated=''))
    and (select count(*) from attributes where table_name=t.table_name) =
        (select count(*) from expected_columns where table_name=t.table_name)
    from (select distinct table_name from expected_columns) t
  union all select 'gate.defaults.'||t.table_name, not exists (
    select 1 from expected_columns e left join expected_defaults d using(table_name,column_name)
    where e.table_name=t.table_name and not exists (select 1 from attributes a
      where a.table_name=e.table_name and a.attname=e.column_name and a.default_rule=coalesce(d.rule,'')))
    from (select distinct table_name from expected_columns) t
  union all select 'gate.primary_key.'||t.table_name, exists (select 1 from keys k
    where k.table_name=t.table_name and k.contype='p' and k.convalidated and not k.condeferrable and k.cols=array['id'])
    from (select distinct table_name from expected_columns) t
  union all select 'gate.foreign_key.'||e.table_name||'.'||e.cols[1], exists (
    select 1 from keys k where k.table_name=e.table_name and k.contype='f' and k.convalidated
      and not k.condeferrable and k.cols=e.cols and k.ref_cols=array['id']
      and k.confrelid=to_regclass(e.target) and k.confdeltype::text=e.delete_rule
      and k.confupdtype='a' and k.confmatchtype='s') from expected_fks e
  union all select 'gate.unique_key.'||e.table_name, exists (select 1 from keys k
    where k.table_name=e.table_name and k.contype='u' and k.convalidated and not k.condeferrable and k.cols=e.cols)
    from expected_unique e
  union all select 'gate.constraint.'||e.name, exists (select 1 from check_rules c
    where c.table_name=e.table_name and c.conname=e.name and c.convalidated and c.rule=e.rule) from expected_checks e
  union all select 'gate.constraint_inventory.'||t.table_name,
    (select count(*) from keys k where k.table_name=t.table_name and k.contype in ('p','f','u','c','x')) =
      1 + (select count(*) from expected_fks where table_name=t.table_name)
        + (select count(*) from expected_unique where table_name=t.table_name)
        + (select count(*) from expected_checks where table_name=t.table_name)
    from (select distinct table_name from expected_columns) t
  union all select 'gate.index.'||e.name, exists (select 1 from indexes i where i.table_name=e.table_name
    and i.name=e.name and i.amname='btree' and i.indisvalid and i.indisready and not i.indisunique
    and i.indnatts=i.indnkeyatts and i.key_rule=e.key_rule and i.predicate_rule=e.predicate_rule
    and not exists (select 1 from generate_series(0,i.indnkeyatts-1) k
      where i.indoption[k] not in (0,3))) from expected_indexes e
  union all select 'gate.function_definition.'||f.name, coalesce(f.oid is not null
    and f.prorettype=to_regtype(f.result_type) and f.prokind='f' and not f.proretset
    and f.lanname=f.language_name and f.prosecdef=f.definer and f.provolatile::text=f.volatility
    and f.proisstrict=f.strict and case when f.search_path is null then f.proconfig is null
      when f.search_path='' then f.proconfig in (array['search_path=""'],array['search_path='])
      else f.proconfig=array['search_path='||f.search_path] end
    and md5(replace(f.prosrc,E'\r\n',E'\n'))=f.body_md5,false) from functions f
  union all select 'gate.rpc_parameter_contract', exists (select 1 from functions
    where name='create_observation_with_verified_taxonomy' and pronargdefaults=4
      and pg_catalog.pg_get_expr(proargdefaults,0)='NULL::text, NULL::text, NULL::text, NULL::integer'
      and proargnames=array['p_name','p_reported_scientific_name','p_taxon_id','p_location',
        'p_observed_date','p_latitude','p_longitude','p_description','p_image_path','p_image_mime_type','p_image_size_bytes'])
  union all select 'gate.no_function_overload.'||e.name, (select count(*)=1 from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=e.name)
    from expected_functions e
  union all select 'gate.function_public_execute_absent.'||f.name, f.oid is not null and not exists (
    select 1 from pg_catalog.aclexplode(coalesce(f.proacl,pg_catalog.acldefault('f',f.proowner))) a
    where a.grantee=0 and a.privilege_type='EXECUTE') from functions f where f.name<>'set_updated_at'
  union all select 'gate.rpc_authenticated_only', exists (select 1 from functions f
    join pg_catalog.pg_roles a on a.rolname='anon' join pg_catalog.pg_roles u on u.rolname='authenticated'
    where f.name='create_observation_with_verified_taxonomy' and f.oid is not null
      and not pg_catalog.has_function_privilege(a.oid,f.oid,'EXECUTE')
      and pg_catalog.has_function_privilege(u.oid,f.oid,'EXECUTE'))
  union all select 'gate.normalizer_not_client_callable', exists (select 1 from functions f
    join pg_catalog.pg_roles a on a.rolname='anon' join pg_catalog.pg_roles u on u.rolname='authenticated'
    where f.name='normalize_taxonomy_input_key' and f.oid is not null
      and not pg_catalog.has_function_privilege(a.oid,f.oid,'EXECUTE')
      and not pg_catalog.has_function_privilege(u.oid,f.oid,'EXECUTE'))
  union all select 'gate.trigger.'||e.name, exists (select 1 from pg_catalog.pg_trigger t
    where t.tgrelid=to_regclass(e.table_name) and t.tgname=e.name and not t.tgisinternal
      and t.tgenabled='O' and t.tgtype=e.type_number and t.tgfoid=to_regprocedure(e.function_name)
      and t.tgqual is null and t.tgnargs=0) from expected_triggers e
  union all select 'gate.no_other_profile_provisioning_trigger', not exists (
    select 1 from pg_catalog.pg_trigger t join pg_catalog.pg_proc p on p.oid=t.tgfoid
    where t.tgrelid=to_regclass('auth.users') and not t.tgisinternal
      and t.tgname<>'auth_users_provision_public_profile'
      and (t.tgname ilike '%profile%' or p.proname ilike '%profile%'))
  union all select 'gate.trigger_inventory.'||e.table_name,
    (select count(*) from pg_catalog.pg_trigger t where t.tgrelid=to_regclass(e.table_name) and not t.tgisinternal)
      = (select count(*) from expected_triggers x where x.table_name=e.table_name)
    from (select distinct table_name from expected_triggers where table_name<>'auth.users') e
  union all select 'gate.policy.'||e.name, exists (select 1 from policies p
    where p.schemaname=e.schema_name and p.tablename=e.table_name and p.policyname=e.name
      and p.cmd=e.cmd and p.permissive='PERMISSIVE' and p.roles::text[] @> e.roles
      and cardinality(p.roles)=cardinality(e.roles) and p.using_rule=e.using_rule and p.check_rule=e.check_rule)
    from expected_policies e
  union all select 'gate.policy_inventory.'||e.table_name,
    (select count(*) from policies p where p.schemaname='public' and p.tablename=e.table_name)=e.expected_count
    from (values ('profiles',3),('observations',7),('taxa',1),('taxonomy_name_resolutions',0)) e(table_name,expected_count)
  union all select 'gate.no_storage_mutation_expansion', not exists (select 1 from policies
    where schemaname='storage' and tablename='objects' and cmd in ('ALL','UPDATE','DELETE'))
    and (select count(*) from policies where schemaname='storage' and tablename='objects' and cmd='INSERT')=1
  union all select 'gate.roles_do_not_bypass_rls', (select count(*)=2 from pg_catalog.pg_roles
    where rolname in ('anon','authenticated') and not rolsuper and not rolbypassrls)
  union all select 'gate.schema_usage.'||r.rolname, pg_catalog.has_schema_privilege(r.oid,n.oid,'USAGE')
    from pg_catalog.pg_roles r cross join pg_catalog.pg_namespace n
    where r.rolname in ('anon','authenticated','service_role') and n.nspname='public'
  union all select 'gate.client_column_privileges.'||r.rolname||'.'||t.table_name,
    exists (select 1 from attributes a where a.table_name=t.table_name) and not exists (
      select 1 from attributes a cross join (values ('SELECT'),('INSERT'),('UPDATE')) op(privilege)
      where a.table_name=t.table_name and pg_catalog.has_column_privilege(r.oid,a.attrelid,a.attnum,op.privilege)
      is distinct from case
        when op.privilege='SELECT' then a.table_name in ('observations','taxa')
          or (a.table_name='profiles' and r.rolname='authenticated')
        when op.privilege='INSERT' then r.rolname='authenticated' and a.table_name='observations'
          and a.attname in ('name','scientific_name','taxon','location','observed_date','description',
            'latitude','longitude','image_path','image_mime_type','image_size_bytes','status','observer_id','observer_display_name')
        when op.privilege='UPDATE' then r.rolname='authenticated' and (
          (a.table_name='profiles' and a.attname='display_name') or (a.table_name='observations' and a.attname in
            ('name','scientific_name','taxon','location','observed_date','description','latitude','longitude','status')))
        else false end)
    from pg_catalog.pg_roles r cross join (select distinct table_name from expected_columns) t
    where r.rolname in ('anon','authenticated')
  union all select 'gate.client_table_mutations.'||r.rolname||'.'||t.table_name,
    exists (select 1 from relations c where c.oid=to_regclass('public.'||t.table_name)
      and pg_catalog.has_table_privilege(r.oid,c.oid,'DELETE') =
        (r.rolname='authenticated' and t.table_name='observations')
      and not pg_catalog.has_table_privilege(r.oid,c.oid,'TRUNCATE')
      and not pg_catalog.has_table_privilege(r.oid,c.oid,'TRIGGER')
      and not pg_catalog.has_any_column_privilege(r.oid,c.oid,'REFERENCES'))
    from pg_catalog.pg_roles r cross join (select distinct table_name from expected_columns) t
    where r.rolname in ('anon','authenticated')
  union all select 'gate.server_taxonomy_grants.'||e.table_name, exists (
    select 1 from relations c join pg_catalog.pg_roles r on r.rolname='service_role'
    where c.oid=to_regclass('public.'||e.table_name)
      and pg_catalog.has_table_privilege(r.oid,c.oid,'SELECT')
      and pg_catalog.has_table_privilege(r.oid,c.oid,'INSERT')
      and pg_catalog.has_table_privilege(r.oid,c.oid,'UPDATE')
      and not pg_catalog.has_table_privilege(r.oid,c.oid,'DELETE'))
    from (values ('taxa'),('taxonomy_name_resolutions')) e(table_name)
  union all select 'gate.bucket_private_name_mime',
    coalesce((xpath('/table/row/private_mime_ok/text()',value))[1]::text='true',false) from bucket_metadata
  union all select 'info.bucket_limit_matches_0002_five_mib',
    coalesce((xpath('/table/row/five_mib/text()',value))[1]::text='true',false) from bucket_metadata
  union all select 'info.bucket_limit_matches_manual_22c_twenty_mib',
    coalesce((xpath('/table/row/twenty_mib/text()',value))[1]::text='true',false) from bucket_metadata
  union all select 'info.bucket_limit_is_twenty_decimal_mb',
    coalesce((xpath('/table/row/twenty_decimal_mb/text()',value))[1]::text='true',false) from bucket_metadata
)
select check_name, coalesce(passed,false) as passed from checks order by check_name;
