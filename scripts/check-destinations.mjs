import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readContent,root,validateRecord,validateAll} from './core.mjs';
import {countryGroups,countryBrowse,placeCard,buildCountryPages,buildPlacePages} from './countries.mjs';
import {postPlaceSlugs,storyPlaceEntries,storiesForPlace,placeHasContent,comparePlaces,publishedStoryPlaces} from './story-places.mjs';

const data=readContent(),record={slug:'destination-check',status:'published',date:'2026-11-02',countries:['france','monaco'],places:['nice','monaco'],placeNames:['Nitsa','Quiet coastal village'],en:{title:'A coastal run',excerpt:'My introduction.',body:'My written story.'},et:{title:'Rannikujooks',excerpt:'Sissejuhatus.',body:'Kirjutatud lugu.'}};
const fixture=structuredClone(data);fixture.posts=[record];fixture.places=fixture.places.filter(p=>['nice','monaco','tallinn','genk'].includes(p.slug));
const tallinn=fixture.places.find(p=>p.slug==='tallinn');tallinn.comingSoon=false;tallinn.en.body='A finished place description.';tallinn.et.body='Valmis kohakirjeldus.';
validateAll(fixture);
assert.deepEqual(postPlaceSlugs({place:'nice'}),['nice']);
assert.deepEqual(postPlaceSlugs({places:[],place:'nice'}),[]);
assert.deepEqual(storyPlaceEntries(record,fixture,'en').map(e=>e.name),['Nice','Monaco','Quiet coastal village']);
for(const slug of ['nice','monaco'])assert.equal(storiesForPlace(fixture,fixture.places.find(p=>p.slug===slug)).length,1);
const named={...record,places:[],placeNames:['Nitsa','MONACO']};
for(const slug of ['nice','monaco'])assert.equal(storiesForPlace({...fixture,posts:[named]},fixture.places.find(p=>p.slug===slug)).length,1);
for(const changes of [{places:'nice'},{places:['nice','nice']},{placeNames:'Village'},{placeNames:['']},{placeNames:['Village','village']},{placeNames:['x'.repeat(121)]}])assert.throws(()=>validateRecord('posts',{...record,...changes}));
assert.throws(()=>validateAll({...fixture,posts:[{...record,places:['nice','genk']}]}),'Every linked place must belong to a selected country.');
const noStories={...fixture,posts:[{...record,status:'draft'}]};
const hiddenCountry=structuredClone(fixture);hiddenCountry.countries.find(c=>c.slug==='monaco').listed=false;
const hiddenCountryCards=countryBrowse({data:hiddenCountry,lang:'en',url:p=>p,full:true});
assert(!hiddenCountryCards.includes('data-category="monaco"'));assert(hiddenCountryCards.includes('data-category="france"'));
assert(!placeHasContent(fixture.places.find(p=>p.slug==='nice'),noStories));
assert(placeHasContent(tallinn,noStories));

for(const lang of ['en','et']){
 const groups=countryGroups(fixture,lang);let sawPending=false;
 for(const group of groups){if(!group.hasContent)sawPending=true;else assert(!sawPending,'Written destinations must appear before all placeholders.');}
 assert.deepEqual(countryGroups(noStories,lang).filter(g=>g.hasContent).map(g=>g.slug),[]);
 const ordered=[...fixture.places].sort(comparePlaces(fixture,lang));assert.equal(ordered.at(-1).slug,'genk');
 const pending=placeCard(fixture.places.find(p=>p.slug==='genk'),{data:fixture,lang,url:p=>p});assert(pending.includes('destination-pending'));assert(pending.includes('destination-state'));
 const ready=placeCard(fixture.places.find(p=>p.slug==='nice'),{data:fixture,lang,url:p=>p});assert(!ready.includes('destination-pending'));assert(!ready.includes('destination-state'));
 const browse=countryBrowse({data:fixture,lang,url:p=>p,full:true});assert(browse.indexOf(`/${lang}/countries/france/`)<browse.indexOf(`/${lang}/countries/belgium/`));
 const pages=new Map(),options={data:fixture,lang,url:p=>p,write:(path,html)=>pages.set(path,html),shell:(_lang,_path,_title,_description,html)=>html,card:p=>`<article data-story="${p.slug}"><a href="/${lang}/journal/${p.slug}/">${p[lang].title}</a></article>`,base:''};
 buildCountryPages(options);
 const france=pages.get(`/${lang}/countries/france/`);assert(france.includes('country-content-grid'));assert(!france.includes('country-hero'));assert(!france.includes('My running places'));assert(!france.includes('Minu jooksukohad'));assert(france.includes(`data-story="${record.slug}"`));assert(!france.includes(`/${lang}/places/nice/`));assert(!france.includes('place-card'));
 buildPlacePages(options);const nice=pages.get(`/${lang}/places/nice/`);assert(nice.includes(`data-story="${record.slug}"`));assert(!nice.includes('class="place-image"'));assert(!nice.includes('Info coming soon.'));assert(!nice.includes('Info varsti.'));
}
const config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8')),fields=config.content.find(c=>c.name==='posts').fields;
assert(!fields.some(f=>f.name==='places'));assert(fields.some(f=>f.name==='placeNames'&&f.type==='string'&&f.list));
console.log('Passed destination checks: written content first, blurred placeholder labels, compact country grids, story-first place pages, multiple places, manual name matching, legacy records and draft isolation.');

const tagged={...record,places:[],placeNames:['New riverside village']};
const taggedData={...fixture,posts:[tagged]},onlyPlaces=publishedStoryPlaces(taggedData,'en');
assert.equal(onlyPlaces.length,1);assert.equal(onlyPlaces[0].name,'New riverside village');
const listing=new Map();buildPlacePages({data:taggedData,lang:'en',url:p=>p,write:(path,html)=>listing.set(path,html),shell:(_lang,_path,_title,_description,html)=>html,card:()=>'',base:''});
assert(listing.get('/en/places/').includes('New riverside village'));assert(listing.get('/en/places/').includes('?place=name%3Anew%20riverside%20village'));assert(!listing.get('/en/places/').includes('Genk'));
const hiddenBrowse=countryBrowse({data:noStories,lang:'en',url:p=>p,full:true});assert(hiddenBrowse.includes('Belgium'));assert(hiddenBrowse.includes('Coming soon'));assert(!hiddenBrowse.includes('Genk'));assert(!hiddenBrowse.includes('Tallinn'));assert(!hiddenBrowse.includes('destination-count'));
const franceGroup=countryGroups(fixture,'en').find(g=>g.slug==='france');assert(franceGroup.storyPlaces.some(e=>e.name==='Nice'));assert(!franceGroup.storyPlaces.some(e=>e.name==='Monaco'));
assert.equal(publishedStoryPlaces({...taggedData,posts:[{...tagged,status:'draft'}]},'en').length,0);
console.log('Passed story-tag checks: one free-form field, automatic new place cards, published-only labels/counts, country placeholders without city names, correct country matching and draft exclusion.');
