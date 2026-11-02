import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord,markdown} from './core.mjs';
import {emptyRatings,ratingCriteria,ratingAverage} from './rating-data.mjs';
import {renderRating} from './ratings.mjs';
import {storyLanguages,storyHasTranslation,storyLanguage,storyPath,publishedStoryLanguages,translationFields} from './story-languages.mjs';

const post={slug:'language-and-score-check',status:'published',date:'2026-11-02',countries:['france','monaco'],place:'nice',en:{title:'A coastal run',excerpt:'The owner’s introduction.',body:'The owner’s **latest story**.'}};
validateRecord('posts',post);
assert.equal(storyLanguage(post,'et'),'en');
assert.equal(storyPath(post,'et'),'/en/journal/language-and-score-check/');
assert(!storyHasTranslation(post,'et'));
const estonian={...post,en:undefined,et:{title:'Rannikujooks',excerpt:'Autori sissejuhatus.',body:'Autori tekst.'}};
assert.throws(()=>validateRecord('posts',estonian),'The original must be written in English.');
const translated={...post,translations:[{language:'et',status:'published',...estonian.et}]};validateRecord('posts',translated);assert.equal(storyLanguage(translated,'et'),'et');assert.equal(storyPath(translated,'et'),'/et/journal/language-and-score-check/');
validateRecord('posts',{...post,et:{title:'Pooleli tõlge'}});
assert.throws(()=>validateRecord('posts',{...post,en:{title:'Only a title'}}));
assert.throws(()=>validateRecord('posts',{...post,en:{...post.en,body:42}}));

const ratings=emptyRatings();ratings.enabled=true;
for(const [index,[key]] of ratingCriteria.entries())ratings[key]={score:[8,9,7,8,10][index]};
validateRecord('posts',{...post,ratings});
assert.equal(ratingAverage(ratings),8.4);
assert(renderRating({ratings},'en').includes('8.4'));
assert(renderRating({ratings},'et').includes('8,4'));
for(const score of [0,11,8.5])assert.throws(()=>validateRecord('posts',{...post,ratings:{...ratings,safety:{score}}}));
assert.throws(()=>validateRecord('posts',{...post,ratings:{...ratings,safety:{score:8,en:'x'.repeat(241)}}}));
assert.throws(()=>validateRecord('posts',{...post,ratings:{...ratings,safety:{score:null}}}));
assert.equal(renderRating(post,'en'),'','An unrated story must not inherit place ratings.');

const schema=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));
const fields=schema.content.find(c=>c.name==='posts').fields;
const ratingFields=fields.find(f=>f.name==='ratings').fields;
for(const [key] of ratingCriteria){const score=ratingFields.find(f=>f.name===key).fields.find(f=>f.name==='score');assert.deepEqual(score.options,{min:1,max:10});}
for(const lang of storyLanguages){const group=fields.find(f=>f.name===lang);assert(!group.required);for(const key of ['title','excerpt','body'])assert(!group.fields.find(f=>f.name===key).required);}

const data=readContent(),base=(process.env.BASE_PATH??'').replace(/\/$/,'');
for(const record of data.posts.filter(p=>p.status==='published'))for(const lang of publishedStoryLanguages(record)){
 const page=readFileSync(resolve(root,'dist',lang,'journal',record.slug,'index.html'),'utf8');
 if(storyHasTranslation(record,lang))assert(page.includes(markdown(translationFields(record,lang).body,base)),'A story must render its own saved body.');
 else{assert(page.includes('translation-notice'));assert(page.includes('content="noindex,follow"'));assert(page.includes(`href="${base+storyPath(record,lang)}"`));assert(!page.includes('<div class="article-layout section">'));}
 for(const country of record.countries){const listing=readFileSync(resolve(root,'dist','en','countries',country,'index.html'),'utf8');assert(listing.includes(`href="${base+storyPath(record,lang)}"`));}
 const sitemap=resolve(root,'dist/sitemap.xml');if(existsSync(sitemap))assert.equal(readFileSync(sitemap,'utf8').includes(`/${lang}/journal/${record.slug}/`),storyHasTranslation(record,lang));
}
console.log('Passed story publishing checks: independent post scores, optional notes, 1 to 10 limits, automatic averages, single-language publishing, correct destination links and saved story bodies.');
