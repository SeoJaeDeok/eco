import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const names = ['0012-pre-apply', '0012-post-apply', '0013-pre-apply', '0013-post-apply'];

test('manual verification SQL is catalog-only and contains no executing writes or constant-success checks', () => {
  for (const name of names) {
    const sql = read(`docs/architecture/sql-checks/${name}.sql`);
    const statements = sql.replace(/--[^\n]*/g, '').replace(/'(?:''|[^'])*'/g, "''");
    assert.match(statements.trim(), /^(?:with|select)\b/i);
    assert.doesNotMatch(statements, /\b(?:insert|update|delete|alter|create|drop|grant|revoke|truncate|do|call|copy)\b/i);
    assert.doesNotMatch(statements, /\b(?:from|join)\s+(?:public\.|auth\.|storage\.)/i);
    assert.doesNotMatch(statements, /\btrue\s+as\b|count\([^)]*\)\s*>=\s*0/i);
    assert.equal((statements.match(/;/g) ?? []).length, 1);
  }
});

test('readiness checks compare policy expressions/roles and deny unexpected permissive paths', () => {
  const pre = read('docs/architecture/sql-checks/0012-pre-apply.sql');
  const post = read('docs/architecture/sql-checks/0012-post-apply.sql');
  assert.match(pre, /baseline_admin_delete_exact/);
  assert.match(pre, /source_rule = 'selectexistsselect1frompublic.profiles/);
  assert.match(post, /using_rule = 'status=''approved''andobserver_id=selectauth.uid'/);
  assert.match(post, /using_rule = 'status=''approved''andis_admin'/);
  assert.match(post, /count\(\*\) = 2 from policies where cmd in \('DELETE','ALL'\)/);
  assert.match(post, /owner_update_preserved/);
  const comments = read('docs/architecture/sql-checks/0013-post-apply.sql');
  for (const check of ['kind_check_exact', 'body_check_exact', 'observation_fk_cascade',
    'public_read_approved_parent_exact', 'self_insert_approved_parent_exact', 'self_or_admin_delete_exact',
    'insert_columns_exact_no_spoof', 'all_client_updates_denied', 'authenticated_direct_table_acl_exact']) {
    assert.ok(comments.includes(`as ${check}`));
  }
  assert.doesNotMatch(post + comments, /qual like|with_check like/);
});

test('manual trigger checksum follows the complete unchanged 0013 function body, not a function name', () => {
  const migration = read('supabase/migrations/0013_observation_comments.sql');
  const body = migration.split('as $$')[1].split('$$')[0];
  const fingerprint = createHash('md5').update(body).digest('hex');
  const post = read('docs/architecture/sql-checks/0013-post-apply.sql');
  assert.ok(post.includes(`= '${fingerprint}'`));
  assert.match(post, /p\.prosecdef/);
  assert.match(post, /t\.tgtype = 7/);
  assert.match(post, /trigger_not_directly_callable/);
});
