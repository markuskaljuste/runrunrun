import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {root,markdown,readContent,esc} from './core.mjs';
import {countryGroups} from './countries.mjs';
import {storyPlaceEntries,storyPlaceKey} from './story-places.mjs';

const credited=markdown('![Coast](/assets/coast.jpg "The coast.")\n\nPhoto: [Author](https://example.com/photo), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).\n\nMy story continues.');
assert(credited.includes('<figcaption>The coast. · Photo: <a'));
assert(!credited.includes('<p>Photo:'));
assert.equal(credited.split('>Author</a>').length-1,1);
assert(credited.includes('<p>My story continues.</p>'));
assert(markdown('Photo: My own photograph.').includes('<p>Photo:'));
const unsafe=markdown('![Coast](/assets/coast.jpg)\n\nPhoto: [unsafe](javascript:alert(1)).');assert(!unsafe.includes('href="javascript:'));assert(!unsafe.includes('<p>Photo:'));

function element(extra={}){return {listeners:{},addEventListener(name,fn){this.listeners[name]=fn;},classList:{toggle(){}},setAttribute(){},...extra};}
const input=element({value:''}),select=element({value:'all'}),counter=element(),empty=element();
const cards=[element({dataset:{category:'france monaco',search:'Nice Monaco Cap Roux',places:JSON.stringify(['place:nice','place:monaco','name:cap roux'])}}),element({dataset:{category:'czechia',search:'Prague',places:JSON.stringify(['place:prague'])}})];
const buttons=['all','france','monaco','czechia'].map(country=>element({dataset:{filter:country}}));
const document={documentElement:{lang:'en'},addEventListener(){},querySelectorAll:s=>s==='[data-filter]'?buttons:s==='[data-list] .card'?cards:[],querySelector:s=>s==='.search input'?input:s==='[data-place-filter]'?select:s==='.results-count'?counter:s==='.empty-state'?empty:s==='[data-list]'?{dataset:{countKind:'stories'}}:null};
runInNewContext(readFileSync(resolve(root,'public/assets/site.js'),'utf8'),{document,location:{pathname:'/en/journal/'}});
for(const city of ['place:nice','place:monaco','name:cap roux']){select.listeners.change({target:{value:city}});assert(!cards[0].hidden);assert(cards[1].hidden);assert.equal(counter.textContent,'1 story');}
buttons.find(b=>b.dataset.filter==='czechia').listeners.click();assert(cards.every(c=>c.hidden));assert.equal(empty.hidden,false);
buttons[0].listeners.click();select.listeners.change({target:{value:'all'}});input.value='Prague';input.listeners.input();assert(cards[0].hidden);assert(!cards[1].hidden);
const data=readContent();
for(const lang of ['en']){
 for(const group of countryGroups(data,lang)){const page=readFileSync(resolve(root,'dist',lang==='en'?'':lang,'countries',group.slug,'index.html'),'utf8');assert(!page.includes('place-card'));}
 const journal=readFileSync(resolve(root,'dist',lang==='en'?'':lang,'journal/index.html'),'utf8');assert(journal.includes('data-place-filter'));
 for(const post of data.posts.filter(p=>p.status==='published'))for(const entry of storyPlaceEntries(post,data,lang))assert(journal.includes(`value="${esc(storyPlaceKey(entry))}"`));
}
console.log('Passed country story view checks: no duplicate place tiles, combined country/city/text filters, multi-place matches and safe photo credits shown once as small captions.');

input.value='';select.options=['all','place:nice','place:monaco','name:cap roux'].map(value=>({value}));
runInNewContext(readFileSync(resolve(root,'public/assets/site.js'),'utf8'),{document,location:{pathname:'/journal/',search:'?place=name%3Acap%20roux'},URLSearchParams});
assert.equal(select.value,'name:cap roux');assert(!cards[0].hidden);assert(cards[1].hidden);assert.equal(counter.textContent,'1 story');
