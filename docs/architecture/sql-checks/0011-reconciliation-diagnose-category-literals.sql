-- READ ONLY: only the already-isolated category string difference is examined.
-- Expected strings are taken from unchanged migration 0011. Unicode escapes make
-- the inspection file ASCII-only; no clipboard Korean encoding assumption.
-- Read pg_proc, never invoke the create RPC or read application/user rows.
-- Output only check_name/matched. No remote string, token, body or ACL is returned.
-- Exact comparisons remain authoritative. NFC/case/allowlist checks are diagnostic
-- alternatives, not permission to normalize stored values or mark the RPC safe.
with
expected(literal_order,branch_name,kind,expected_value) as (values
  (1,'insecta','condition',''),
  (2,'insecta','condition','insecta'),
  (3,'insecta','return_value',U&'\ace4\cda9'),
  (4,'aves','condition',''),
  (5,'aves','condition','aves'),
  (6,'aves','return_value',U&'\c870\b958'),
  (7,'mammalia','condition',''),
  (8,'mammalia','condition','mammalia'),
  (9,'mammalia','return_value',U&'\d3ec\c720\b958'),
  (10,'amphibia_reptilia','condition',''),
  (11,'amphibia_reptilia','condition','amphibia'),
  (12,'amphibia_reptilia','condition','reptilia'),
  (13,'amphibia_reptilia','return_value',U&'\c591\c11c/\d30c\cda9\b958'),
  (14,'plantae','condition',''),
  (15,'plantae','condition','plantae'),
  (16,'plantae','return_value',U&'\c2dd\bb3c'),
  (17,'fungi','condition',''),
  (18,'fungi','condition','fungi'),
  (19,'fungi','return_value',U&'\ade0\b958'),
  (20,'fallback','return_value',U&'\ae30\d0c0')
),
expected_masked(source) as (values ($masked$v_project_taxon := case when pg_catalog . lower ( pg_catalog . btrim ( coalesce ( v_taxon . class_name , <string-literal> ) ) ) = <string-literal> then <string-literal> when pg_catalog . lower ( pg_catalog . btrim ( coalesce ( v_taxon . class_name , <string-literal> ) ) ) = <string-literal> then <string-literal> when pg_catalog . lower ( pg_catalog . btrim ( coalesce ( v_taxon . class_name , <string-literal> ) ) ) = <string-literal> then <string-literal> when pg_catalog . lower ( pg_catalog . btrim ( coalesce ( v_taxon . class_name , <string-literal> ) ) ) in ( <string-literal> , <string-literal> ) then <string-literal> when pg_catalog . lower ( pg_catalog . btrim ( coalesce ( v_taxon . kingdom_name , <string-literal> ) ) ) = <string-literal> then <string-literal> when pg_catalog . lower ( pg_catalog . btrim ( coalesce ( v_taxon . kingdom_name , <string-literal> ) ) ) = <string-literal> then <string-literal> else <string-literal> end ;$masked$::text)),
remote_function as (
  select p.oid,replace(p.prosrc,E'\r\n',E'\n') as source
  from pg_catalog.pg_proc p
  where p.oid=to_regprocedure(
    'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)')
),
raw_tokens as (
  select t.position,t.parts[1] as token
  from remote_function f cross join lateral regexp_matches(f.source,
    $token$('(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\r\n]*|[A-Za-z_][A-Za-z_0-9$]*|[0-9]+|::|:=|<>|<=|>=|!=|!~\*|!~|~\*|\|\||->>|->|#>>|#>|[^[:space:]])$token$,
    'g') with ordinality t(parts,position)
  where left(t.parts[1],2)<>'--'
),
neighbors as (
  select *,lead(token) over(order by position) as next_token from raw_tokens
),
body as (
  select array_agg(case when left(token,1) in ('''','"') then token else lower(token) end
      order by position) as tokens,
    count(*)>0 and coalesce(bool_and(not (
      token='$' or (token='/' and next_token='*') or (token='*' and next_token='/')
      or (lower(token) in ('e','u','b','x','n') and left(next_token,1)='''')
      or (lower(token)='u' and next_token='&'))),false) as supported
  from neighbors
),
anchors as (
  select b.*,
    array(select k from generate_series(1,cardinality(tokens)) k
      where tokens[k:k+2]=array['v_project_taxon',':=','case']) as starts,
    array(select k from generate_series(1,cardinality(tokens)) k
      where tokens[k:k+4]=array['insert','into','public','.','observations']) as ends
  from body b
),
section as (
  select supported and cardinality(starts)=1 and cardinality(ends)=1
      and starts[1]<ends[1] as supported,
    tokens[starts[1]:ends[1]-1] as tokens from anchors
),
string_tokens as (
  select row_number() over(order by position) as literal_order,
    replace(substr(token,2,length(token)-2),chr(39)||chr(39),chr(39)) as actual_value
  from section s cross join lateral unnest(s.tokens) with ordinality t(token,position)
  where left(token,1)=''''
),
guard as (
  select exists(select 1 from remote_function)
    and current_setting('standard_conforming_strings')='on'
    and current_setting('server_encoding')='UTF8'
    and coalesce(s.supported,false)
    and array_to_string(array(select case when left(token,1)=''''
      then '<string-literal>' else token end
      from unnest(s.tokens) with ordinality t(token,position) order by position),' ')
        = (select source from expected_masked)
    and (select count(*) from string_tokens)=20 as matched
  from section s
),
comparisons as (
  select e.*,s.actual_value,
    s.actual_value collate "C" = e.expected_value collate "C" as exact_match
  from expected e left join string_tokens s using(literal_order)
),
checks(check_name,matched) as (
  select 'diag.function_present',exists(select 1 from remote_function)
  union all select 'diag.category_structure_and_literal_count',matched from guard
  union all select 'diag.exact.condition.'||branch_name,
    (select matched from guard) and bool_and(coalesce(exact_match,false))
    from comparisons where kind='condition' group by branch_name
  union all select 'diag.exact.return_value.'||branch_name,
    (select matched from guard) and exact_match from comparisons where kind='return_value'
  union all select 'info.case_folded_condition_match.'||branch_name,
    (select matched from guard)
      and bool_and(coalesce(lower(actual_value collate "C")=expected_value collate "C",false))
    from comparisons where kind='condition' group by branch_name
  union all select 'info.nfc_return_value_match.'||branch_name,
    case when current_setting('server_encoding')='UTF8' then
      (select matched from guard) and normalize(actual_value,NFC) collate "C"=expected_value collate "C"
    else false end from comparisons where kind='return_value'
  union all select 'info.all_returns_in_reviewed_taxon_set',
    (select matched from guard) and bool_and(coalesce(actual_value collate "C" in (
      select expected_value collate "C" from expected where kind='return_value'),false))
    from comparisons where kind='return_value'
)
select check_name,coalesce(matched,false) as matched from checks order by check_name;
