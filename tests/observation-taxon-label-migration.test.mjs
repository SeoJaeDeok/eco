import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { deriveBroadTaxonFromLineage } from '../src/features/taxonomy/taxonomyCore.ts';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const migration = read('supabase/migrations/0015_fix_observation_taxon_group_label.sql');
const pre = read('docs/architecture/sql-checks/0015-pre-apply.sql');
const post = read('docs/architecture/sql-checks/0015-post-apply.sql');
const old = read('supabase/migrations/0011_repair_taxonomy_observation_rpc_runtime_expressions.sql');
const reviewed = old.match(/create or replace function public\.create_observation_with_verified_taxonomy\([\s\S]*?\nas \$\$([\s\S]*?)\$\$;/i)[1];
const correctLabel = '\uc591\uc11c/\ud30c\ucda9\ub958';
const correctLiteral = "'" + correctLabel + "'";
const signature = 'public.create_observation_with_verified_taxonomy(text,text,uuid,text,date,double precision,double precision,text,text,text,integer)';
const shared = (source) => source.split('-- BEGIN SHARED CATALOG GUARDS')[1].split('-- END SHARED CATALOG GUARDS')[0];
const pattern = migration.match(/\$token\$([\s\S]*?)\$token\$/)[1].replaceAll('[[:space:]]', '\\s').replaceAll('[^[:space:]]', '\\S');
const hash = (tokens) => createHash('md5').update(tokens.join('\n')).digest('hex');
const targetIndex = Number(migration.match(/ordinal = (\d+) then '<target-literal>'/)[1]) - 1;
const expectedHash = migration.match(/masked_hash = '([a-f0-9]+)'/)[1];
const maskSql = (source) => source.replace(/--[^\r\n]*|\$([A-Za-z_][A-Za-z_0-9]*)\$[\s\S]*?\$\1\$|'(?:''|[^'])*'|"(?:""|[^"])*"/g, "''");

// A local model of the reviewed restricted SQL lexer/one-token splice, not a DB execution.
function lex(source) {
  return [...source.matchAll(new RegExp(pattern, 'g'))]
    .filter((m) => !m[0].startsWith('--') && !/^\s+$/.test(m[0]))
    .map((m) => ({ text: m[0], start: m.index }));
}
const normalize = (tokens) => tokens.map(({ text }) => /^['"]/.test(text) ? text : text.toLowerCase());
function supported(tokens) {
  return tokens.every(({ text: t }, i) => {
    const next = tokens[i + 1]?.text ?? '';
    return !(t === '$' || (t === '/' && next === '*') || (t === '*' && next === '/') ||
      (['e', 'u', 'b', 'x', 'n'].includes(t.toLowerCase()) && next.startsWith("'")) ||
      (t.toLowerCase() === 'u' && next === '&'));
  });
}
function guardedSplice(source) {
  const tokens = lex(source);
  const normalized = normalize(tokens);
  const target = tokens[targetIndex];
  if (!supported(tokens) || tokens.length !== 773 ||
      hash(normalized.map((t, i) => i === targetIndex ? '<target-literal>' : t)) !== expectedHash ||
      !/^'(?:[^']|'')*'$/.test(target?.text ?? '')) throw new Error('precondition');
  const allowed = ["'\uc2dd\ubb3c'", "'\ud3ec\uc720\ub958'", "'\uc870\ub958'", "'\uace4\ucda9'",
    correctLiteral, "'\uade0\ub958'", "'\uae30\ud0c0'"];
  if (target.text !== correctLiteral && allowed.includes(target.text)) throw new Error('unexpected allowed label');
  return source.slice(0, target.start) + correctLiteral + source.slice(target.start + target.text.length);
}
const substituteTarget = (source, literal) => {
  const { start, text } = lex(source)[targetIndex];
  return source.slice(0, start) + literal + source.slice(start + text.length);
};

test('0015 shared guards fingerprint the entire immutable 0011 body with exactly one literal excluded', () => {
  assert.equal(shared(migration), shared(pre));
  assert.equal(shared(pre), shared(post));
  const tokens = normalize(lex(reviewed));
  assert.equal(tokens.length, 773);
  assert.equal(targetIndex, 603);
  assert.equal(tokens[targetIndex], correctLiteral);
  assert.equal(hash(tokens), 'ccc18e974a5c662f38d4d05d60e982ce');
  assert.ok(post.includes(hash(tokens)));
  assert.equal(hash(tokens.map((t, i) => i === targetIndex ? '<target-literal>' : t)), expectedHash);
});

test('0015 corrects only the invalid target and canonical replay is a no-op', () => {
  assert.equal(guardedSplice(reviewed), reviewed);
  for (const invalid of ["'invalid group'", "'synthetic '' quoted label'", "'\uc784\uc2dc'"]) {
    assert.equal(guardedSplice(substituteTarget(reviewed, invalid)), reviewed);
  }
  assert.throws(() => guardedSplice(substituteTarget(reviewed, "'\uc870\ub958'")));
  assert.throws(() => guardedSplice(substituteTarget(reviewed, 'null')));
  assert.throws(() => guardedSplice(substituteTarget(reviewed, "E'invalid'")));
  assert.throws(() => guardedSplice(substituteTarget(reviewed, "'bad' || 'injected'")));
});

test('0015 rejects drift at every other token, including input/taxonomy/author/status contracts', () => {
  const tokens = lex(reviewed);
  for (let i = 0; i < tokens.length; i++) {
    if (i === targetIndex) continue;
    const { start, text } = tokens[i];
    const changed = reviewed.slice(0, start) + 'unexpected_token' + reviewed.slice(start + text.length);
    assert.throws(() => guardedSplice(changed), 'must reject token ' + (i + 1));
  }
});

test('0015 preserves comments, line endings and every character outside the target string', () => {
  const decorated = '-- local fixture comment \uc810\uac80\r\n' + reviewed.replaceAll('\n', '\r\n');
  assert.equal(guardedSplice(substituteTarget(decorated, "'fixture mismatch'")), decorated);
  assert.throws(() => guardedSplice('/* unsupported */' + reviewed));
  assert.throws(() => guardedSplice(reviewed.replace("'insecta'", "U&'insecta'")));
});

test('0015 corrected SQL CASE covers both classes and preserves other ranks and unknown fallback', () => {
  const corrected = guardedSplice(substituteTarget(reviewed, "'fixture mismatch'"));
  const section = corrected.match(/v_project_taxon := case([\s\S]*?)\n  end;/)[1];
  const branches = [...section.matchAll(/when pg_catalog\.lower\(pg_catalog\.btrim\(coalesce\(v_taxon\.(class_name|kingdom_name), ''\)\)\) (= '[^']+'|in \('[^']+', '[^']+'\)) then '([^']+)'/g)];
  assert.equal(branches.length, 6);
  const fallback = section.match(/else '([^']+)'/)[1];
  const evaluateRestrictedCase = (className, kingdomName) => {
    for (const [, field, condition, label] of branches) {
      const value = (field === 'class_name' ? className : kingdomName)?.trim().toLowerCase() ?? '';
      if ([...condition.matchAll(/'([^']+)'/g)].some((m) => m[1] === value)) return label;
    }
    return fallback;
  };
  const cases = [
    ['Amphibia', 'Animalia', correctLabel], ['Reptilia', 'Animalia', correctLabel],
    ['  REPTILIA  ', 'Animalia', correctLabel], ['Insecta', 'Animalia', '\uace4\ucda9'],
    ['Aves', 'Animalia', '\uc870\ub958'], ['Mammalia', 'Animalia', '\ud3ec\uc720\ub958'],
    [null, 'Plantae', '\uc2dd\ubb3c'], [null, 'Fungi', '\uade0\ub958'],
    ['unknown', 'unknown', '\uae30\ud0c0'], [null, null, '\uae30\ud0c0'],
    ['Amphibia', 'Plantae', correctLabel],
  ];
  for (const [className, kingdomName, expected] of cases) {
    assert.equal(evaluateRestrictedCase(className, kingdomName), expected);
    assert.equal(deriveBroadTaxonFromLineage({
      ...(className ? { class: { key: 'class', name: className } } : {}),
      ...(kingdomName ? { kingdom: { key: 'kingdom', name: kingdomName } } : {}),
    }), expected);
  }
  const initial = read('supabase/migrations/0001_create_observation_schema.sql');
  const allowed = initial.match(/constraint observations_taxon_check[\s\S]*?check \(taxon in \(([^)]+)\)\)/i)[1];
  for (const [, , , label] of branches) assert.ok(allowed.includes("'" + label + "'"));
  assert.ok(allowed.includes("'" + fallback + "'"));
});

test('0015 changes only existing function source and guards owner, ACL, identity and all other attributes', () => {
  assert.ok(migration.includes(signature));
  assert.match(migration, /v_definition := pg_catalog\.pg_get_functiondef\(v_before\.oid\)/);
  assert.match(migration, /execute v_definition;/);
  assert.equal((migration.match(/\bexecute v_definition;/g) ?? []).length, 1);
  assert.match(migration, /overlay\(v_before\.prosrc placing v_correct_literal/);
  assert.match(migration, /replace\(v_definition,v_before\.prosrc,v_new_source\)/);
  assert.match(migration, /v_after\.prosrc is distinct from v_new_source/);
  assert.match(migration, /\(to_jsonb\(v_after\) - array\['prosrc','proargdefaults'\]\)\s+is distinct from \(to_jsonb\(v_before\) - array\['prosrc','proargdefaults'\]\)/);
  assert.match(migration, /pg_catalog\.pg_get_expr\(v_after\.proargdefaults,0\)\s+is distinct from pg_catalog\.pg_get_expr\(v_before\.proargdefaults,0\)/);
  assert.match(migration, /to_jsonb\(v_after\) is distinct from to_jsonb\(v_before\)/);
  assert.match(migration, /exception when others then[\s\S]*raise exception using errcode = sqlstate/);
  const prefix = migration.match(/left\(v_definition,(\d+)\) <> '([^']+)'/);
  assert.equal(Number(prefix[1]), prefix[2].length);
  const executable = maskSql(migration.replace(/^do \$migration\$/m, 'do').replace(/^\$migration\$;$/m, ';'));
  assert.doesNotMatch(executable, /\b(?:drop|grant|revoke|alter|insert|update|delete|truncate|create)\b/i);
  assert.doesNotMatch(migration, /supabase_migrations|observation_comments|is_admin\(|storage\.objects/);
});

test('0015 pre/post remain catalog-only and distinguish still-wrong from fully corrected body', () => {
  for (const sql of [pre, post]) {
    const executable = maskSql(sql).replace(/''/g, '');
    assert.match(executable.trim(), /^with\b/i);
    assert.doesNotMatch(executable, /\b(?:do|call|execute|insert|update|delete|create|drop|alter|grant|revoke|copy|truncate)\b/i);
    assert.doesNotMatch(executable, /\b(?:from|join)\s+(?:public|auth|storage)\./i);
    assert.equal((executable.match(/;/g) ?? []).length, 1);
    assert.doesNotMatch(executable, /\btrue\s+as\b|count\([^)]*\)\s*>=\s*0/i);
    for (const check of ['reviewed_taxon_check_validated', 'public_execute_absent',
      'anon_direct_and_effective_execute_absent', 'authenticated_execute_present',
      'reviewed_function_attributes', 'named_arguments_and_defaults', 'no_overload']) {
      assert.ok(sql.includes("'" + check + "'"));
    }
  }
  assert.match(pre, /target_is_still_invalid_not_already_corrected/);
  assert.match(pre, /not \([\s\S]*= any\(c\.allowed_labels\)/);
  assert.match(post, /complete_corrected_body_and_branch_match/);
  assert.match(post, /full_hash = 'ccc18e974a5c662f38d4d05d60e982ce'/);
  assert.match(post, /tokens\[604\] collate "C" = c\.literal/);
});

test('0015 character offsets and decompiled-wrapper replacement do not touch other occurrences', () => {
  const wrong = substituteTarget(reviewed, "'wrong branch'");
  const tokens = lex(wrong);
  let consumed = 0;
  let targetStart;
  let codeOrdinal = 0;
  for (const m of wrong.matchAll(new RegExp(pattern, 'g'))) {
    assert.equal(m.index, consumed);
    const isCode = !m[0].startsWith('--') && !/^\s+$/.test(m[0]);
    if (isCode && ++codeOrdinal === targetIndex + 1) targetStart = consumed;
    consumed += m[0].length;
  }
  assert.equal(consumed, wrong.length);
  assert.equal(targetStart, tokens[targetIndex].start);
  const wrapper = 'CREATE OR REPLACE FUNCTION public.fixture() RETURNS void AS $function$' + wrong + '$function$ LANGUAGE plpgsql';
  assert.equal(wrapper.split(wrong).length, 2);
  assert.equal(wrapper.replace(wrong, () => guardedSplice(wrong)),
    'CREATE OR REPLACE FUNCTION public.fixture() RETURNS void AS $function$' + reviewed + '$function$ LANGUAGE plpgsql');
});
