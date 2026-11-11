import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord} from './core.mjs';
import {comparePostDates} from './post-order.mjs';
import {ratingAverage} from './rating-data.mjs';
import {countryGroups,countrySlugs} from './countries.mjs';

// A high score must not move an older story above a newer story in the journal.
const fixture=[
 {slug:'older-day',date:'2026-11-06',publishedAt:'2026-11-08T15:00:00+02:00'},
 {slug:'early',date:'2026-11-07',publishedAt:'2026-11-07T08:00:00+02:00',score:10},
 {slug:'late',date:'2026-11-07',publishedAt:'2026-11-07T14:00:00+02:00',score:6},
 {slug:'without-time',date:'2026-11-07'}
];
assert.deepEqual(fixture.sort(comparePostDates).map(p=>p.slug),['late','early','without-time','older-day']);
const data=readContent(),base=(process.env.BASE_PATH??'').replace(/\/$/,'');
const post=data.posts.find(p=>p.status==='published');
validateRecord('posts',{...post,publishedAt:'2026-11-07T14:00:00+02:00'});
validateRecord('posts',{...post,publishedAt:undefined});
validateRecord('posts',{...post,publishedAt:''});
const cms=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));
const timeField=cms.content.find(c=>c.name==='posts').fields.find(f=>f.name==='publishedAt');
assert.equal(timeField.type,'string','The optional timestamp must not enter the CMS date writer, which crashes on undefined.');
assert.equal(timeField.default,'');
assert.throws(()=>validateRecord('posts',{...post,publishedAt:'not-a-date'}));
const load=path=>readFileSync(resolve(root,'dist',path,'index.html'),'utf8');
const cards=html=>[...html.matchAll(/<article class="card"[\s\S]*?<\/article>/g)].map(m=>m[0]);
const home=load(''),journal=load('journal');
for(const html of [home,journal]){
 assert.match(html,/<h[12]>Latest<\/h[12]>/);
 assert(!html.includes('01 / Stories'));
 assert(!html.includes('A few chapters from the road'));
 const nav=html.split('<nav id="navigation"')[1].split('</nav>')[0];
 assert(nav.indexOf('>Destinations</a>')<nav.indexOf('>Journal</a>'));
 for(const card of cards(html)){
  const story=data.posts.find(p=>card.includes(`href="${base}/journal/${p.slug}/"`));assert(story);
  if(ratingAverage(story.ratings)!=null){
   const image=card.split('<a class="card-image"')[1].split('</a>')[0];
   assert(image.includes('data-runograph-score='));
  }
 }
}
const hero=home.split('<div class="hero-content">')[1].split('</section>')[0];
assert(hero.includes(`href="${base}/countries/"`));
assert(!hero.includes(`href="${base}/journal/"`));
assert(home.includes('<h2>Destination stories</h2>'));
const all=cards(journal).map(card=>data.posts.find(p=>card.includes(`href="${base}/journal/${p.slug}/"`)));
for(let i=1;i<all.length;i++)assert(comparePostDates(all[i-1],all[i])<=0);
const storySlugs=html=>cards(html).map(card=>all.find(p=>card.includes(`href="${base}/journal/${p.slug}/"`))?.slug);
assert.deepEqual(storySlugs(home),all.slice(0,6).map(p=>p.slug));
const destinations=countryGroups(data,'en').filter(group=>group.hasContent).map(group=>group.slug);
for(const story of all){
 const html=load('journal/'+story.slug);
 const section=html.match(/<section class="section related"[\s\S]*?<\/section>/)?.[0];
 const countries=countrySlugs(story);
 const current=destinations.findIndex(country=>countries.includes(country));
 const next=destinations.slice(current+1).concat(destinations.slice(0,current+1));
 const matching=country=>all.filter(post=>post.slug!==story.slug&&countrySlugs(post).includes(country));
 const local=all.filter(post=>post.slug!==story.slug&&countrySlugs(post).some(country=>countries.includes(country)));
 const expected=[...new Set([...local,...next.flatMap(matching)])].slice(0,3).map(post=>post.slug);
 assert.deepEqual(storySlugs(section??''),expected,`Related stories for ${story.slug}`);
}
assert(!load('journal/seville-marathon').replace(/(?:href|src|content)="[^"]*"/g,'').includes('Seville'));
console.log('Passed journal listing: latest-first including same-day times, image score badges, destination links and navigation order.');
