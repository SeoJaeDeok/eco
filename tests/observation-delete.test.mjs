import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { compileSource, componentHarness } from './helpers/component-contract.mjs';
import * as pagination from '../src/utils/observationPagination.ts';
import * as stats from '../src/utils/observationStats.ts';

const empty = { user:null,profile:null,isAdmin:false };
const session = (id='owner',isAdmin=false)=>({...empty,user:{id},isAdmin});
const row={id:'record',image_path:'trusted-path',observer_id:'owner'};

const deletionRepository = (actor,{cleanup='removed',databaseError=false,status='approved'}={})=>{
  const calls=[];
  const client=createClient('https://fixture.invalid','fixture-public-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,init)=>{
    const params=new URL(input).searchParams;calls.push({method:init.method,params});
    assert.equal(init.method,'DELETE');assert.equal(params.get('id'),'eq.record');assert.equal(params.get('select'),'id,image_path,observer_id');
    assert.equal(params.get('status'),'eq.approved');
    const allowed=status==='approved'&&actor.user&&(actor.isAdmin||actor.user.id===row.observer_id);
    return new Response(JSON.stringify(databaseError?{code:'42501',message:'denied'}:allowed?[row]:[]),{status:databaseError?403:200,headers:{'content-type':'application/json'}});
  }}});
  client.auth.getUser=async()=>({data:{user:actor.user},error:null});
  const repository=compileSource('src/repositories/supabase/supabaseObservationRepository.ts',{
    './supabaseClient':{getSupabaseClient:()=>client}, './observationMappers':{}, './observationPageQuery':{},
    '../../utils/observerDisplay':{},'../../utils/observationStats':stats,'../../utils/observationPagination':pagination,
    './supabaseTaxonomyTreeRepository':{invalidateTaxonomyTreeCache(){calls.push('invalidate');}},
    './supabaseObservationImageStorage':{async cleanupDeletedObservationImage(path,owner){calls.push({cleanup:path,owner});return cleanup;}},
  }).supabaseObservationRepository;
  return {repository,calls};
};

for(const [label,actor,allowed] of [['owner',session(),true],['admin',session('admin',true),true],['non-owner',session('other'),false],['anon',empty,false]]) {
  test(`actual Supabase DELETE transport under simulated ${label} policy response`,async()=>{
    const {repository,calls}=deletionRepository(actor);
    if(allowed){const result=await repository.deleteObservation('record');assert.equal(result.imageCleanup,'removed');assert.equal(calls[0].method,'DELETE');assert.deepEqual(calls[2],{cleanup:'trusted-path',owner:'owner'});}
    else {await assert.rejects(repository.deleteObservation('record'));assert.ok(!calls.some(call=>call.cleanup));if(!actor.user)assert.equal(calls.length,0);}
  });
}
test('denied/missing deletion never cleans storage; unconfirmed cleanup preserves successful deletion',async()=>{
  const denied=deletionRepository(session(),{databaseError:true});await assert.rejects(denied.repository.deleteObservation('record'));assert.equal(denied.calls.length,1);
  const ok=deletionRepository(session(),{cleanup:'unconfirmed'});assert.equal((await ok.repository.deleteObservation('record')).imageCleanup,'unconfirmed');
});
test('real cleanup helper only removes trusted generated owner/legacy paths and checks actual removal',async()=>{
  const calls=[];let outcome={data:[{}],error:null};
  const helper=compileSource('src/repositories/supabase/supabaseObservationImageStorage.ts',{
    '../../constants/upload':{},'./supabaseClient':{getSupabaseClient:()=>({storage:{from:()=>({async remove(paths){calls.push(paths);if(outcome instanceof Error)throw outcome;return outcome;}})}})},
  }).cleanupDeletedObservationImage;
  const owner='00000000-0000-4000-8000-000000000001',file='00000000-0000-4000-8000-000000000002';
  for(const path of ['https://fixture.invalid/file','../private','observations/other/file.png',`observations/${owner}/../${file}.png`])assert.equal(await helper(path,owner),'unconfirmed');
  assert.equal(await helper(`observations/${owner}/${file}.png`,'another-owner'),'unconfirmed');assert.equal(calls.length,0);
  assert.equal(await helper(null,owner),'not-needed');
  assert.equal(await helper(`observations/${owner}/${file}.png`,owner),'removed');
  assert.equal(await helper(`pending/${owner}/${file}.jpg`,null),'removed');
  outcome={data:[],error:null};assert.equal(await helper(`observations/${owner}/${file}.png`,owner),'unconfirmed');
  outcome=new Error('storage unavailable');assert.equal(await helper(`observations/${owner}/${file}.png`,owner),'unconfirmed');
});
test('actual mock deletion checks actor, removes only chosen sample and dispatches cascade without mutating seed',async()=>{
  let actor=empty;const deleted=new Set(),cascaded=[];
  const samples=Object.freeze([{id:'record',name:'sample',status:'approved',observerId:'owner'}].map(Object.freeze));
  const repository=compileSource('src/repositories/mockObservationRepository.ts',{
    '../data/sampleObservations':{sampleObservations:samples},'../utils/observationStats':stats,'../utils/observationPagination':pagination,
    './authRepositoryProvider':{activeAuthRepository:{getSessionState:async()=>actor}},
    './mockObservationDeletion':{deletedMockObservationIds:deleted,markMockObservationDeleted(id){deleted.add(id);cascaded.push(id);}},
  }).mockObservationRepository;
  await assert.rejects(repository.deleteObservation('record'));actor=session('other');await assert.rejects(repository.deleteObservation('record'));
  actor=session();await repository.deleteObservation('record');assert.equal((await repository.listObservations()).length,0);assert.deepEqual(cascaded,['record']);
  assert.equal(samples.length,1);assert.equal((await repository.getPublicObservationSummary()).observationCount,0);
  await assert.rejects(repository.deleteObservation('record'));
});
test('actual confirmation requires consent, prevents double click and shows safe retry after failure',async()=>{
  const view=componentHarness();let finish,calls=0;
  const Component=compileSource('src/components/ui/DeleteConfirmation.tsx',view.modules).DeleteConfirmation;
  await view.mount(Component,{label:'remove',message:'irreversible',onDelete:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
  await view.click('remove');assert.equal(calls,0);
  const confirm=view.button('삭제 확인');confirm.props.onClick();confirm.props.onClick();await view.settle();assert.equal(calls,1);assert.ok(view.button('삭제 중').props.disabled);
  finish();await view.settle();assert.ok(view.button('remove'));
  await view.update({onDelete:async()=>{throw new Error('private backend error');}});await view.click('remove');await view.click('삭제 확인');
  assert.ok(view.nodes(n=>n.props.role==='alert').some(n=>view.text(n).includes('삭제하지 못했습니다')));
  assert.ok(!view.nodes(n=>view.text(n).includes('private backend error')).length);
});
test('0012 is a new grant/owner policy candidate and preserves existing SELECT/UPDATE/Storage',()=>{
  const sql=readFileSync(new URL('../supabase/migrations/0012_observation_owner_delete.sql',import.meta.url),'utf8');
  assert.match(sql,/grant delete on public\.observations to authenticated/i);
  assert.match(sql,/for delete to authenticated[\s\S]*observer_id = \(select auth.uid\(\)\)/i);
  assert.match(sql,/using \(status = 'approved' and observer_id = \(select auth.uid\(\)\)\)/);
  assert.match(sql,/alter policy "Admins can delete observations" on public.observations\s+using \(status = 'approved' and public.is_admin\(\)\)/);
  assert.doesNotMatch(sql,/create policy[\s\S]*for (?:select|update)|alter table storage|drop policy/i);
});

test('actual admin route switches to all states and delegates deletion through the admin repository',async()=>{
  const view=componentHarness();let allReads=0,pendingReads=0,deleted=null,notified=null;
  const observation={id:'admin-row',status:'approved'};
  const repository={
    async listPendingObservations(){pendingReads++;return [];},
    async listAllObservations(){allReads++;return deleted?[]:[observation];},
    async deleteObservationAsAdmin(id){deleted=id;return {imageCleanup:'unconfirmed'};},
  };
  const component=compileSource('src/components/admin/AdminPage.tsx',{
    ...view.modules,
    './AdminLoginForm':{AdminLoginForm:'admin-login'}, './AdminObservationReviewPanel':{AdminObservationReviewPanel:'admin-review'},
    './AdminPendingList':{AdminPendingList:'admin-list'}, './AdminSessionPanel':{AdminSessionPanel:'admin-session'},
    '../../repositories/adminObservationRepositoryProvider':{activeAdminObservationRepository:repository},
    '../../repositories/supabase/supabaseAuthRepository':{supabaseAuthRepository:{getSessionState:async()=>session('admin',true)}},
  }).AdminPage;
  await view.mount(component,{onObservationDeleted:id=>{notified=id;}});assert.equal(pendingReads,1);
  view.nodes(n=>n.type==='input'&&n.props.type==='checkbox')[0].props.onChange({target:{checked:true}});await view.settle();
  assert.equal(allReads,1);assert.equal(view.nodes(n=>n.type==='admin-list')[0].props.showAll,true);
  await view.nodes(n=>n.type==='admin-review')[0].props.onDelete(observation);await view.settle();
  assert.equal(deleted,observation.id);assert.equal(notified,observation.id);assert.equal(allReads,2);
  assert.equal(view.nodes(n=>n.type==='admin-list')[0].props.observations.length,0);
  assert.ok(view.nodes(n=>n.props.role==='status').some(n=>view.text(n).includes('이미지 파일 정리')));
});

test('approved-only deletion rejects pending/rejected in SDK and actual mock paths for owner and admin',async()=>{
  for(const status of ['pending','rejected'])for(const actor of [session(),session('admin',true)]){
    const live=deletionRepository(actor,{status});await assert.rejects(live.repository.deleteObservation('record'));
    assert.equal(live.calls.length,1);
    let deleted=false;
    const repository=compileSource('src/repositories/mockObservationRepository.ts',{
      '../data/sampleObservations':{sampleObservations:[{id:'record',status,observerId:'owner'}]},
      '../utils/observationStats':stats,'../utils/observationPagination':pagination,
      './authRepositoryProvider':{activeAuthRepository:{getSessionState:async()=>actor}},
      './mockObservationDeletion':{deletedMockObservationIds:new Set(),markMockObservationDeleted(){deleted=true;}},
    }).mockObservationRepository;
    await assert.rejects(repository.deleteObservation('record'));assert.equal(deleted,false);
  }
});

test('actual admin detail only renders deletion for approved observations',async()=>{
  const view=componentHarness();
  const Component=compileSource('src/components/admin/AdminObservationReviewPanel.tsx',{
    ...view.modules,'../TaxonBadge':{TaxonBadge:'taxon-badge'},'../ui/ImageFrame':{ImageFrame:'image-frame'},
    '../ui/DeleteConfirmation':{DeleteConfirmation:'delete-confirmation'},
  }).AdminObservationReviewPanel;
  const observation={id:'record',name:'fixture',coords:{lat:0,lng:0},status:'pending'};
  await view.mount(Component,{observation,actionInProgressId:null,actionError:null,onApprove(){},onReject(){},async onDelete(){}});
  for(const status of ['pending','rejected',undefined,'approved']){
    await view.update({observation:{...observation,status}});
    assert.equal(view.nodes(n=>n.type==='delete-confirmation').length,status==='approved'?1:0);
  }
});
