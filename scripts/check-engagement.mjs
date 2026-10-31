import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {readContent,validateRecord,root} from './core.mjs';
import {emptyRatings,ratingAverage,validateRatings,ratingCriteria} from './rating-data.mjs';
import {renderRating} from './ratings.mjs';
import {shareBar,commentsSection} from './engagement.mjs';
const data=readContent(),ratings=emptyRatings();assert.equal(ratingAverage(ratings),null);assert.equal(renderRating({ratings},'et'),'');
ratings.enabled=true;assert.throws(()=>validateRatings(ratings));for(const [i,[key]] of ratingCriteria.entries())ratings[key]={score:[8,9,7,8,10][i],en:'A note',et:'Märkus'};assert.equal(ratingAverage(ratings),8.4);assert(renderRating({ratings},'et').includes('8,4'));assert(renderRating({ratings},'en').includes('8.4'));
ratings.safety.score=11;assert.throws(()=>validateRatings(ratings));ratings.safety.score=8.5;assert.throws(()=>validateRatings(ratings));ratings.safety.score=8;ratings.safety.et='<script>bad</script>';assert(renderRating({ratings},'et').includes('&lt;script&gt;'));
const e=structuredClone(data.engagement);e.contact.enabled=true;assert.throws(()=>validateRecord('engagement',e));e.contact.formspreeId='abcdefgh';validateRecord('engagement',e);e.comments.enabled=true;assert.throws(()=>validateRecord('engagement',e));e.comments.remarkboxKey='00000000-0000-4000-8000-000000000001';assert.throws(()=>validateRecord('engagement',e));e.comments.moderationConfirmed=true;validateRecord('engagement',e);e.socials[0].url='javascript:alert(1)';assert.throws(()=>validateRecord('engagement',e));
const fixture=structuredClone(data);fixture.engagement.comments={enabled:true,remarkboxKey:'00000000-0000-4000-8000-000000000001',moderationConfirmed:true};const comments=commentsSection({data:fixture,lang:'et',path:'/et/places/tallinn/',title:'Tallinn'});assert(comments.includes('data-load-comments'));assert(!comments.includes('<iframe'));assert(!comments.includes('<script'));assert(comments.includes('https://runograph.com/et/places/tallinn/'));
fixture.engagement.comments.moderationConfirmed=false;assert(!commentsSection({data:fixture,lang:'et',path:'/et/places/tallinn/',title:'Tallinn'}).includes('data-load-comments'));
const share=shareBar({data,lang:'et',path:'/et/places/tallinn/',title:'A & B'});assert(share.includes(encodeURIComponent('https://runograph.com/et/places/tallinn/')));assert(!share.includes('chatgpt.site'));assert(!share.includes('<script'));
const files=folder=>readdirSync(folder).flatMap(n=>{const p=resolve(folder,n);return statSync(p).isDirectory()?files(p):[p];});
for(const file of files(resolve(root,'dist')).filter(p=>p.endsWith('.html'))){const html=readFileSync(file,'utf8');assert(!/[A-Z0-9._%+-]+@gmail\.com/i.test(html),'Do not publish personal Gmail addresses.');}
console.log('Passed reader-feature checks: rating averages/ranges, escaped notes, inactive defaults, sharing URLs, moderation prerequisites and recipient privacy.');
await import('./check-reader-ui.mjs');
