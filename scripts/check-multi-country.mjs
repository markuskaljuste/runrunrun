import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {root,readContent,validateAll,validateRecord,postCountries} from './core.mjs';
import {countryGroups,countrySlugs,buildCountryPages} from './countries.mjs';

const data=readContent(),journey={slug:'multi-country-fixture',status:'published',date:'2026-11-01',countries:[],place:'',image:'/assets/forest.jpg',en:{title:'Fixture story',excerpt:'A story for checks.',body:'A story for checks.'},et:{title:'Kontroll-lugu',excerpt:'Kontrolli tekst.',body:'Kontrolli tekst.'}};
journey.countries=['france','monaco'];journey.place='monaco';
const fixture={...structuredClone(data),posts:[journey]};
validateAll(fixture);
assert.deepEqual(postCountries({country:'france'}),['france']);
assert.deepEqual(countrySlugs({countries:[],country:'france'}),['general']);
assert.deepEqual(countrySlugs({countries:null}),['general']);
for(const countries of ['france',['france','france'],['france',null],['general']]){
 const invalid={...structuredClone(journey),countries};
 assert.throws(()=>validateAll({...fixture,posts:[invalid]}));
}
const mismatch=structuredClone(journey);mismatch.countries=['france'];
assert.throws(()=>validateAll({...fixture,posts:[mismatch]}),'A linked place must belong to a selected country.');
validateRecord('posts',{...journey,countries:[],place:''});
for(const lang of ['en','et']){
 const groups=countryGroups(fixture,lang);
 for(const country of ['france','monaco'])assert.equal(groups.find(g=>g.slug===country).posts.length,1);
 assert(!groups.some(g=>g.slug==='general'));
 const pages=new Map();
 buildCountryPages({data:fixture,lang,url:path=>path,write:(path,html)=>pages.set(path,html),shell:(_lang,_path,_title,_description,html)=>html,card:p=>`<article data-story="${p.slug}"><a href="/${lang}/journal/${p.slug}/">${p[lang].title}</a></article>`});
 for(const country of ['france','monaco']){
  const html=pages.get(`/${lang}/countries/${country}/`);
  assert.equal(html.split(`data-story="${journey.slug}"`).length-1,1);
  assert(html.includes(`href="/${lang}/journal/${journey.slug}/"`));
 }
 assert(!pages.get(`/${lang}/countries/estonia/`).includes(`data-story="${journey.slug}"`));
 const hidden=structuredClone(fixture);hidden.posts[0].status='draft';hidden.places=[];
 assert(!countryGroups(hidden,lang).some(g=>g.slug==='france'||g.slug==='monaco'));
}

// Exercise the actual browser filter: the same card matches either country.
function element(extra={}){return {listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},classList:{toggle(){}},setAttribute(){},...extra};}
const input=element({value:''}),counter=element(),empty=element();
const cards=[element({dataset:{category:'france monaco',search:'Nitsast Monacosse Prantsusmaa France Monaco'}}),element({dataset:{category:'portugal',search:'Aveiro Portugal'}}),element({dataset:{category:'general',search:'Minu lugu'}})];
const buttons=['all','france','monaco','portugal'].map(country=>element({dataset:{filter:country}}));
const document={documentElement:{lang:'et'},addEventListener(){},querySelectorAll:s=>s==='[data-filter]'?buttons:s==='[data-list] .card'?cards:[],querySelector:s=>s==='.search input'?input:s==='.results-count'?counter:s==='.empty-state'?empty:s==='[data-list]'?{dataset:{countKind:'stories'}}:null};
runInNewContext(readFileSync(resolve(root,'public/assets/site.js'),'utf8'),{document,location:{pathname:'/et/journal/'}});
for(const country of ['france','monaco']){buttons.find(b=>b.dataset.filter===country).listeners.click();assert.equal(cards[0].hidden,false);assert.equal(cards[1].hidden,true);assert.equal(cards[2].hidden,true);assert.equal(counter.textContent,'1 lugu');}
buttons[0].listeners.click();assert.equal(counter.textContent,'3 lugu');
input.value='Monaco';input.listeners.input();assert.equal(counter.textContent,'1 lugu');assert.equal(cards[0].hidden,false);
input.value='Prantsusmaa';input.listeners.input();assert.equal(cards[0].hidden,false);
input.value='';buttons.find(b=>b.dataset.filter==='portugal').listeners.click();assert.equal(cards[0].hidden,true);assert.equal(cards[1].hidden,false);
console.log('Passed multi-country checks: one story in both archives, either-country filtering, no duplicate counts, legacy records, empty selection, invalid countries, place membership and draft isolation.');
