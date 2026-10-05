import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { compileSource, componentHarness } from './helpers/component-contract.mjs';
import * as contract from '../src/repositories/commentRepository.ts';
import * as observer from '../src/utils/observerDisplay.ts';
import { createMockCommentRepository } from '../src/repositories/mockCommentRepository.ts';
import { communityObservation, createCommentFixture } from './fixtures/observation-comments.mjs';

const empty={user:null,profile:null,isAdmin:false};
const actor=(id='fixture-author',isAdmin=false)=>({user:{id},profile:{displayName:'안전한 별명'},isAdmin});
const createMock=(comments=createCommentFixture())=>{
  let session=empty, observation={...communityObservation};
  const mock=createMockCommentRepository({initialComments:comments,getObservation:async id=>observation?.id===id?observation:null,getSession:async()=>session});
  return {...mock,setActor(value){session=value;},setObservation(value){observation=value;}};
};

for(const count of [0,1,19,20,21,40,41])test(`mock comment pages and deterministic ties: ${count}`,async()=>{
  const {repository}=createMock(createCommentFixture(count));const ids=[];
  for(let page=1;page<=Math.max(1,Math.ceil(count/20));page++){
    const result=await repository.listObservationComments(communityObservation.id,page);
    assert.equal(result.totalCount,count);assert.equal(result.items.length,Math.min(20,count-(page-1)*20));ids.push(...result.items.map(row=>row.id));
  }
  assert.equal(new Set(ids).size,count);assert.deepEqual(ids,createCommentFixture(count).map(row=>row.id).reverse());
});
test('public mock comment reads hide pending/rejected/missing observations, including admin sessions',async()=>{
  const mock=createMock();mock.setActor(actor('admin',true));
  for(const status of ['pending','rejected',undefined]){mock.setObservation({...communityObservation,status});assert.equal((await mock.repository.listObservationComments(communityObservation.id,1)).totalCount,0);}
  mock.setObservation(null);assert.equal((await mock.repository.listObservationComments(communityObservation.id,1)).totalCount,0);
});
test('mock create derives author, validates kind/body, preserves taxonomy and rejects deleted parents',async()=>{
  const mock=createMock([]);const input={observationId:communityObservation.id,kind:'identification',body:'  참고 의견  ',authorId:'spoofed'};
  await assert.rejects(mock.repository.createObservationComment(input));mock.setActor(actor());
  const comment=await mock.repository.createObservationComment(input);assert.equal(comment.authorId,'fixture-author');assert.equal(comment.body,'참고 의견');assert.equal(comment.kind,'identification');
  for(const body of ['', ' \t\n ', '\u00a0', 'x'.repeat(1001)])await assert.rejects(mock.repository.createObservationComment({...input,body}));
  await assert.rejects(mock.repository.createObservationComment({...input,kind:'vote'}));
  await mock.repository.createObservationComment({...input,body:'🌱'.repeat(1000)});
  mock.setObservation({...communityObservation,status:'rejected'});await assert.rejects(mock.repository.createObservationComment(input));
  mock.setObservation(null);await assert.rejects(mock.repository.createObservationComment(input));
  assert.equal(communityObservation.scientificName,'Fixture species');assert.equal(communityObservation.taxonId,undefined);
});
test('mock own/admin deletes, no anonymous/non-owner delete; cascade removes comments in memory',async()=>{
  const mock=createMock();await assert.rejects(mock.repository.deleteObservationComment('comment-000'));
  mock.setActor(actor('outsider'));await assert.rejects(mock.repository.deleteObservationComment('comment-000'));
  mock.setActor(actor());await mock.repository.deleteObservationComment('comment-000');
  mock.setActor(actor('admin',true));await mock.repository.deleteObservationComment('comment-001');
  assert.equal((await mock.repository.listObservationComments(communityObservation.id,1)).totalCount,25);
  mock.cascadeObservation(communityObservation.id);assert.equal((await mock.repository.listObservationComments(communityObservation.id,1)).totalCount,0);
});
test('comment page bounds and runtime payload whitelist reject invalid inputs',()=>{
  for(const page of [0,-1,NaN,Infinity,1.5,100001])assert.throws(()=>contract.commentPageRange(page));
  assert.deepEqual(contract.commentPageRange(2),{from:20,to:39});
  assert.deepEqual(contract.normalizeCommentInput({observationId:'obs',kind:'comment',body:' note ',author_id:'spoof',created_at:'forged'}),{observationId:'obs',kind:'comment',body:'note'});
});

test('actual SDK comment queries enforce approved join/count/range/order and insert column whitelist',async()=>{
  const requests=[];let signedIn=true;
  const rows=createCommentFixture(27).map(row=>({id:row.id,observation_id:row.observationId,author_id:row.authorId,author_display_name:'hidden@example.invalid',kind:row.kind,body:row.body,created_at:row.createdAt})).reverse();
  const client=createClient('https://fixture.invalid','fixture-public-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,init)=>{
    const params=new URL(input).searchParams;const body=init.body?JSON.parse(init.body):null;requests.push({params,method:init.method,body});
    if(init.method==='POST')return new Response(JSON.stringify({...rows[0],...body,author_id:'server-author'}),{headers:{'content-type':'application/json'}});
    if(init.method==='DELETE')return new Response(JSON.stringify([{id:'comment-026'}]),{headers:{'content-type':'application/json'}});
    const offset=Number(params.get('offset'));return new Response(JSON.stringify(rows.slice(offset,offset+20)),{headers:{'content-type':'application/json','content-range':`${offset}-${Math.min(26,offset+19)}/27`}});
  }}});
  client.auth.getUser=async()=>({data:{user:signedIn?{id:'server-author'}:null},error:null});
  const repository=compileSource('src/repositories/supabase/supabaseCommentRepository.ts',{'./supabaseClient':{getSupabaseClient:()=>client},'../../utils/observerDisplay':observer,'../commentRepository':contract}).supabaseCommentRepository;
  const page=await repository.listObservationComments(communityObservation.id,2);
  assert.equal(page.items.length,7);assert.equal(page.totalCount,27);assert.equal(page.items[0].authorDisplayName,undefined);
  const request=requests[0];assert.equal(request.params.get('offset'),'20');assert.equal(request.params.get('limit'),'20');assert.equal(request.params.get('observations.status'),'eq.approved');assert.equal(request.params.get('order'),'created_at.desc,id.desc');
  await repository.createObservationComment({observationId:communityObservation.id,kind:'comment',body:' text ',author_id:'forged'});
  assert.deepEqual(requests[1].body,{observation_id:communityObservation.id,kind:'comment',body:'text'});
  await repository.deleteObservationComment('comment-026');assert.equal(requests[2].params.get('id'),'eq.comment-026');
  signedIn=false;await assert.rejects(repository.createObservationComment({observationId:communityObservation.id,kind:'comment',body:'text'}));assert.equal(requests.length,3);
});

const mountComments=async({repository,authState=empty}={})=>{
  const view=componentHarness();const mock=createMock();mock.setActor(authState);repository??=mock.repository;
  const DeleteConfirmation=compileSource('src/components/ui/DeleteConfirmation.tsx',view.modules).DeleteConfirmation;
  const Component=compileSource('src/components/observations/detail/ObservationComments.tsx',{
    ...view.modules,'../../../repositories/commentRepositoryProvider':{activeCommentRepository:repository},'../../../repositories/commentRepository':contract,
    '../../../utils/observerDisplay':observer,'../../ui/DeleteConfirmation':{DeleteConfirmation},
  }).ObservationComments;
  await view.mount(Component,{observationId:communityObservation.id,authState,repository});return view;
};
test('actual comment UI allows anonymous read, 20+7 more, plain text, safe nickname and no write controls',async()=>{
  const mock=createMock(createCommentFixture().map(row=>({...row,authorDisplayName:'private@example.invalid',body:'<script>unsafe</script>'})));
  const view=await mountComments({repository:mock.repository});assert.equal(view.nodes(n=>n.type==='li').length,20);assert.equal(view.nodes(n=>n.type==='textarea').length,0);
  assert.ok(view.nodes(n=>view.text(n)==='등록 관찰자').length>0);assert.equal(view.nodes(n=>n.props.dangerouslySetInnerHTML).length,0);
  assert.ok(view.nodes(n=>n.type==='p'&&view.text(n)==='<script>unsafe</script>').length>0);
  await view.click('댓글 더 보기');assert.equal(view.nodes(n=>n.type==='li').length,27);
});
test('actual comment UI single submit, failed write retains draft, successful write refreshes only comments',async()=>{
  let writes=0,reads=0,fail=true;
  const repository={async listObservationComments(){reads++;return {items:[],page:1,totalCount:0};},async createObservationComment(){writes++;if(fail)throw new Error('private');},async deleteObservationComment(){}};
  const view=await mountComments({repository,authState:actor()});
  view.nodes(n=>n.type==='textarea')[0].props.onChange({target:{value:'keep this draft'}});await view.settle();
  const form=view.nodes(n=>n.type==='form')[0];form.props.onSubmit({preventDefault(){}});form.props.onSubmit({preventDefault(){}});await view.settle();
  assert.equal(writes,1);assert.equal(view.nodes(n=>n.type==='textarea')[0].props.value,'keep this draft');assert.equal(reads,1);
  fail=false;view.nodes(n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});await view.settle();
  assert.equal(writes,2);assert.equal(reads,2);assert.equal(view.nodes(n=>n.type==='textarea')[0].props.value,'');
});
test('late comment response after observation switch or detail unmount is ignored',async()=>{
  let resolveOld;const calls=[];
  const repository={listObservationComments(id,page,signal){calls.push(signal);return calls.length===1?new Promise(resolve=>{resolveOld=resolve;}):Promise.resolve({items:[],page:1,totalCount:0});}};
  const view=await mountComments({repository});await view.update({observationId:'another-record'});
  assert.ok(calls[0].aborted);resolveOld({items:createCommentFixture(1),page:1,totalCount:1});await view.settle();assert.equal(view.nodes(n=>n.type==='li').length,0);
  view.unmount();assert.ok(calls.at(-1).aborted);
});
test('comment read failure is independent and retry restores known count, not fake zero',async()=>{
  let attempt=0;const repository={async listObservationComments(){if(++attempt===1)throw new Error('private');return {items:[],page:1,totalCount:0};}};
  const view=await mountComments({repository});assert.ok(view.nodes(n=>n.props.role==='alert').length);assert.equal(view.nodes(n=>n.type==='h2').map(view.text)[0],'댓글 ');
  await view.click('다시 불러오기');assert.equal(view.nodes(n=>n.type==='h2').map(view.text)[0],'댓글 0');
});

test('late create from a previous detail does not clear or reload the new detail',async()=>{
  let resolveWrite; const reads=[];
  const repository={
    async listObservationComments(id){reads.push(id);return {items:[],page:1,totalCount:0};},
    createObservationComment(){return new Promise(resolve=>{resolveWrite=resolve;});},
  };
  const view=await mountComments({repository,authState:actor()});
  view.nodes(n=>n.type==='textarea')[0].props.onChange({target:{value:'first draft'}});await view.settle();
  view.nodes(n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});await view.settle();
  await view.update({observationId:'another-record'});
  resolveWrite();await view.settle();
  assert.deepEqual(reads,[communityObservation.id,'another-record']);
  assert.equal(view.nodes(n=>n.props.role==='status'&&view.text(n)==='댓글이 등록되었습니다.').length,0);
});

test('comment delete UI confirms own/admin permission, updates count and preserves failed drafts',async()=>{
  const mock=createMock(createCommentFixture(2));mock.setActor(actor());
  const view=await mountComments({repository:mock.repository,authState:actor()});
  assert.equal(view.nodes(n=>n.type==='button'&&view.text(n)==='댓글 삭제').length,1);
  await view.click('댓글 삭제');assert.equal((await mock.repository.listObservationComments(communityObservation.id,1)).totalCount,2);
  await view.click('삭제 확인');assert.equal(view.nodes(n=>n.type==='li').length,1);
  assert.equal(view.nodes(n=>n.type==='h2').map(view.text)[0],'댓글 1');
  await view.update({authState:actor('outsider')});
  assert.equal(view.nodes(n=>n.type==='button'&&view.text(n)==='댓글 삭제').length,0);
  mock.setActor(actor('admin',true));await view.update({authState:actor('admin',true)});
  assert.equal(view.nodes(n=>n.type==='button'&&view.text(n)==='댓글 삭제').length,1);
});
test('0013 candidate has cascade, constrained text, explicit grants, trusted author and approved public RLS',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/0013_observation_comments.sql',import.meta.url),'utf8');
  assert.match(sql,/references public.observations\(id\) on delete cascade/);
  assert.match(sql,/references public.profiles\(id\) on delete set null/);
  assert.match(sql,/kind in \('comment', 'identification'\)/);assert.match(sql,/char_length\(body\) between 1 and 1000/);
  assert.match(sql,/grant insert \(observation_id, kind, body\)/);assert.doesNotMatch(sql,/grant update|for update/i);
  assert.match(sql,/author_id is distinct from auth.uid\(\)/);assert.match(sql,/o.status = 'approved'/);
  assert.match(sql,/author_id = \(select auth.uid\(\)\) or public.is_admin\(\)/);
  assert.doesNotMatch(sql,/update public.observations|taxonomy_name_resolutions|resolve-taxonomy/);
});
