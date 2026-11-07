import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent} from './core.mjs';
import {ratingCriteria,publishedRatingAverage,compareStoryRatings,ratingAverage} from './rating-data.mjs';
import {renderScoreBadge} from './ratings.mjs';
import {countryGroups,countryBrowse,buildCountryPages} from './countries.mjs';

const ratings=score=>({enabled:true,...Object.fromEntries(ratingCriteria.map(([key])=>[key,{score}]))});
const post=(slug,score,countries=['spain'],status='published',date='2026-11-01')=>({slug,status,date,countries,placeNames:['Village one','Village two'],ratings:score===null?{enabled:false}:ratings(score),en:{title:slug,excerpt:'Story',body:'Story'}});
const high=post('coastal-run',9,['spain','france']),low=post('city-run',7),unrated=post('unrated-run',null),draft=post('draft-run',1,['spain'],'draft');
const posts=[low,unrated,draft,high];
assert.equal(publishedRatingAverage(posts),8,'Each published rated story has equal weight; drafts and disabled scores do not lower the average.');
assert.equal(publishedRatingAverage([unrated,draft]),null,'No rating is different from a zero score.');
assert.deepEqual([low,unrated,high].sort(compareStoryRatings).map(p=>p.slug),['coastal-run','city-run','unrated-run']);
assert.deepEqual([post('old',8),post('new',8,['spain'],'published','2026-11-07')].sort(compareStoryRatings).map(p=>p.slug),['new','old'],'Equal scores use newest story first.');
const data={posts,places:[],countries:['belgium','spain','france','italy'].map(slug=>({slug,en:{name:slug,description:''},et:{name:slug,description:''}}))};
data.posts.push(post('italy-unrated',null,['italy']));
for(const lang of ['en','et']){
 const groups=countryGroups(data,lang);
 assert.deepEqual(groups.map(g=>g.slug),['france','spain','italy','belgium']);
 assert.equal(groups[0].score,9,'A multi-country story counts once in each relevant country.');
 assert.equal(groups[1].score,8,'Adding several place tags does not multiply a story’s weight.');
 assert.equal(groups[1].ratedStoryCount,2);
 const html=countryBrowse({data,lang,url:p=>'/test'+p,full:true});
 assert.equal((html.match(/data-runograph-score=/g)??[]).length,2);
 assert(html.includes('data-runograph-score="8"'));assert(html.includes('/test/'+lang+'/countries/spain/'));
 assert(!renderScoreBadge(null,lang));assert(renderScoreBadge(8.6,lang).includes(lang==='et'?'8,6':'8.6'));
 const shown=[];buildCountryPages({data,lang,url:p=>p,write(){},shell(){return '';},card:(p,_lang,options)=>{if(p.countries.includes('spain'))shown.push([p.slug,options.showScore]);return '';}});
 // The multi-country story is rendered in both countries; inspect Spain’s ordered run.
 assert(shown.some((_,i)=>shown.slice(i,i+3).map(x=>x[0]).join(',')==='coastal-run,city-run,unrated-run'));
 assert(shown.every(([,score])=>score));
}

const current=readContent();
for(const group of countryGroups(current,'en').filter(g=>g.hasContent)){
 const html=readFileSync(resolve(root,'dist/countries',group.slug,'index.html'),'utf8');
 const links=[...html.matchAll(/class="card-image"[^>]*href="[^"]*\/journal\/([^/]+)\//g)].map(m=>m[1]);
 assert.deepEqual(links,[...group.posts].sort(compareStoryRatings).map(p=>p.slug));
 assert.equal((html.match(/data-runograph-score=/g)??[]).length,group.posts.filter(p=>ratingAverage(p.ratings)!==null).length);
}
console.log('Passed destination scores: published-only country averages, equal story weights, multi-country stories, hidden ratings, descending story/country order and score cards.');
