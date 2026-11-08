import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readContent,root,validatePracticalSummary} from './core.mjs';
import {renderPracticalSummary} from './story-summary.mjs';
import {renderStoryMap} from './story-maps.mjs';
import {commentsSection} from './comments.mjs';

const sample={en:{practicalSummary:{goodFor:'Easy runs',terrain:'Paved paths',keepInMind:'Busy later.'}},routeMap:{enabled:true}};
assert(renderPracticalSummary(sample).includes('href="#route-map"'));
assert(!renderPracticalSummary({...sample,routeMap:{enabled:false}}).includes('href="#route-map"'),'Do not link to a disabled map.');
assert.equal(renderPracticalSummary({en:{}}),'','An empty optional summary must not create a blank block.');
assert(renderPracticalSummary(sample,{practicalSummary:{}},'es').includes('Easy runs'),'Use the English summary when a translation has no summary.');
assert(renderPracticalSummary(sample,{practicalSummary:{goodFor:'Rodajes fáciles'}},'es').includes('lang="es"'));
const unsafe=renderPracticalSummary({en:{practicalSummary:{goodFor:'<script>alert(1)</script>',terrain:'" onclick="bad'}}});
assert(!unsafe.includes('<script>'));assert(unsafe.includes('&lt;script&gt;'));assert(unsafe.includes('&quot;'));
validatePracticalSummary(undefined);validatePracticalSummary({});
for(const invalid of [[],42,'text',{terrain:42},{goodFor:'x'.repeat(181)}])assert.throws(()=>validatePracticalSummary(invalid));

const data=readContent(),config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));
const fields=config.content.find(group=>group.name==='posts').fields;
for(const group of ['en','translations']){
 const form=fields.find(field=>field.name===group).fields,summary=form.find(field=>field.name==='practicalSummary');
 assert(summary&&!summary.required,'Summary fields must remain editable and optional.');
 assert(form.indexOf(summary)<form.findIndex(field=>field.name==='body'));
 for(const field of summary.fields)assert.equal(field.options.maxlength,180);
}
const launch=readFileSync(resolve(root,'dist/index.html'),'utf8').includes('data-publication="coming-soon"');
for(const post of data.posts){
 for(const lang of ['en',...(post.translations??[]).map(entry=>entry.language)]){
  const fields=lang==='en'?post.en:post.translations.find(entry=>entry.language===lang);
  validatePracticalSummary(fields?.practicalSummary);
 }
 if(post.routeMap?.enabled){
  assert.equal((renderStoryMap(post,p=>p).match(/id="route-map"/g)??[]).length,1,'The map jump needs one destination.');
  if(post.routeMap.mapId)assert(renderStoryMap({...post,routeMap:{...post.routeMap,googleMyMapsUrl:''}},p=>p).includes('id="route-map"'),'Both Google and prepared maps support the jump.');
 }
 if(launch||post.status!=='published')continue;
 const page=readFileSync(resolve(root,'dist/journal',post.slug,'index.html'),'utf8');
 const markup=renderPracticalSummary(post);
 if(markup){assert(page.includes(markup));assert(page.indexOf(markup)<page.indexOf('<figure class="article-image'),'Show practical information before the cover image.');}
 if(post.routeMap?.enabled)assert(page.includes('id="route-map"'));
 if(data.engagement.comments.enabled)assert(page.includes('Share your experience, ask a question or add a tip for the next runner.'));
}
assert.equal(commentsSection({data:{engagement:{comments:{enabled:false,appsScriptUrl:''}}},slug:'sample',url:p=>p}), '');
console.log('Passed practical summaries: editable optional fields, safe text, language fallback, early placement, working map anchors, disabled-map handling and comment invitations.');
