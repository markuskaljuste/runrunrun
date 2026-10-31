import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { root,readContent,validateAll,validateRecord,markdown } from './core.mjs';
import {isComingSoon,checkComingSoon} from './publication.mjs';
import {renderMetadata} from './metadata.mjs';
import {countryGroups,countrySlug} from './countries.mjs';
const data=readContent();validateAll(data);
const dist=resolve(root,'dist'),base=(process.env.BASE_PATH??'').replace(/\/$/,'');
if(isComingSoon(data)){checkComingSoon({data,base});process.exit(0);}
assert(existsSync(resolve(dist,'en/index.html')),'Build the site before running checks.');
function files(folder){return readdirSync(folder).flatMap(n=>{const path=resolve(folder,n);return statSync(path).isDirectory()?files(path):[path];});}
let pages=0,links=0;
for(const path of files(dist).filter(p=>p.endsWith('.html'))){
 const html=readFileSync(path,'utf8');pages++;
 assert(html.includes('name="viewport"'),`Missing viewport: ${path}`);
 for(const match of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)){
  const href=match[1].replaceAll('&amp;','&');if(/^(https?:|mailto:|data:)/.test(href))continue;
  let target;
  if(href.startsWith('/')){
   assert(!base||href===base||href.startsWith(base+'/'),`Missing base path: ${href} in ${path}`);
   target=resolve(dist,'.'+(base?href.slice(base.length):href));
  }else target=resolve(path,'..',href);
  assert(target.startsWith(dist),`Path escapes output: ${href}`);
  assert(existsSync(target),`Broken local link ${href} in ${path}`);links++;
 }
}
for(const lang of ['en','et'])for(const type of ['posts'])for(const record of data[type]){
 const path=resolve(dist,lang,type==='posts'?'journal':'routes',record.slug,'index.html');
 assert.equal(existsSync(path),record.status==='published',`Draft isolation failed: ${record.slug}`);
 if(record.status==='published'){
  const html=readFileSync(path,'utf8'),other=lang==='en'?'et':'en';
  assert(html.includes(`/${other}/${type==='posts'?'journal':'routes'}/${record.slug}/`),'Missing corresponding translation.');
 }
}
assert(markdown('<script>alert(1)</script>').includes('&lt;script&gt;'),'HTML must be escaped.');
assert(!markdown('[unsafe](javascript:alert(1))').includes('href="javascript:'),'Unsafe URL.');
const draft=structuredClone(data.posts[0]);draft.status='draft';draft.en.body='';validateRecord('posts',draft);draft.status='published';assert.throws(()=>validateRecord('posts',draft),'Incomplete translations must block publishing.');
const route=structuredClone(data.routes[0]);route.sourceUrl='';assert.throws(()=>validateRecord('routes',route),'Route publication must require a source.');
const config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));assert.equal(config.content.length,10);assert.equal(config.media.output,'/assets/uploads');for(const type of ['branding','images','seo','integrations','publication','engagement'])assert(config.content.some(c=>c.name===type&&c.path===`content/${type}.json`));
const branding=structuredClone(data.branding);branding.sponsors=[{name:'Test sponsor',logo:'/assets/favicon.svg',url:'javascript:alert(1)',enabled:true}];assert.throws(()=>validateRecord('branding',branding),'Sponsor links must use HTTPS.');branding.sponsors[0].url='https://example.com';validateRecord('branding',branding);branding.logoWidth=999;assert.throws(()=>validateRecord('branding',branding),'Logo sizing must stay within the header layout.');
const testData=structuredClone(data);testData.seo.pages.home.et={title:'Uus SEO pealkiri',description:'Kirjeldus & tekst',socialImage:'/assets/ocean.jpg'};testData.seo.indexing=false;
let head=renderMetadata({lang:'et',path:'',title:'Fallback',description:'Fallback description',data:testData,base:'/journal-site',origin:'https://example.com'});
assert(head.includes('<title>Uus SEO pealkiri</title>'));assert(head.includes('content="Kirjeldus &amp; tekst"'));assert(head.includes('content="noindex,follow"'));assert(head.includes('https://example.com/journal-site/assets/ocean.jpg'));assert(head.includes('hreflang="en"'));assert(head.includes('rel="canonical" href="https://example.com/journal-site/et/"'));
head=renderMetadata({lang:'en',path:'journal/a-story/',title:'Fallback',description:'Fallback',ogImage:'/assets/forest.jpg',seo:{seoTitle:'Story SEO',seoDescription:'Story description',socialImage:'https://example.com/story.jpg'},data:testData,origin:'https://example.com'});
assert(head.includes('<title>Story SEO</title>'));assert(head.includes('content="Story description"'));assert(head.includes('content="https://example.com/story.jpg"'));assert(head.includes('content="article"'));
const images=structuredClone(data.images);images.homeHero.src='javascript:alert(1)';assert.throws(()=>validateRecord('images',images));
assert(config.content.some(c=>c.name==='countries'&&c.type==='collection'));
assert(config.content.find(c=>c.name==='posts').fields.some(f=>f.name==='country'&&f.type==='reference'&&f.options.collection==='countries'));
const countryData=structuredClone(data);countryData.posts[0].country='nonexistent';assert.throws(()=>validateAll(countryData),'Unknown countries must be rejected.');
const reserved={slug:'general',en:{name:'General'},et:{name:'Üldine'}};assert.throws(()=>validateRecord('countries',reserved),'General is a reserved category.');
for(const lang of ['en','et']){
 const index=readFileSync(resolve(dist,lang,'countries/index.html'),'utf8');assert(index.includes(`/${lang}/countries/`));
 const groups=countryGroups(data,lang);
 for(const group of groups){const page=readFileSync(resolve(dist,lang,'countries',group.slug,'index.html'),'utf8');for(const post of data.posts.filter(p=>p.status==='published'))assert.equal(page.includes(`/${lang}/journal/${post.slug}/`),countrySlug(post)===group.slug,`Country page mixed stories: ${group.slug}`);const other=lang==='en'?'et':'en';assert(page.includes(`/${other}/countries/${group.slug}/`));}
 for(const country of data.countries)assert.equal(existsSync(resolve(dist,lang,'countries',country.slug,'index.html')),groups.some(g=>g.slug===country.slug),'Empty country categories should stay hidden.');
}
const draftOnly=structuredClone(data);draftOnly.posts[0].country='indonesia';draftOnly.posts[0].status='draft';draftOnly.places=[];assert(!countryGroups(draftOnly,'et').some(g=>g.slug==='indonesia'),'Draft stories must not expose a country category.');
console.log(`Passed: ${pages} HTML pages, ${links} internal links/assets, EN/ET counterpart links, source requirements, safe text rendering, draft visibility and CMS file structure.`);
const integrations=structuredClone(data.integrations);integrations.analyticsEnabled=true;integrations.gaMeasurementId='';assert.throws(()=>validateRecord('integrations',integrations),'Enabling Analytics requires the real ID and privacy contact.');Object.assign(integrations,{gaMeasurementId:'G-TEST123456',privacyControllerName:'Test operator',privacyContactEmail:'test@example.com'});validateRecord('integrations',integrations);integrations.searchConsoleVerification='<script>';assert.throws(()=>validateRecord('integrations',integrations));
const verificationData=structuredClone(data);verificationData.integrations.searchConsoleVerification='test-verification-token';assert(renderMetadata({lang:'et',path:'',title:'Test',description:'Test',data:verificationData}).includes('<meta name="google-site-verification" content="test-verification-token">'));
for(const lang of ['et','en']){const privacy=readFileSync(resolve(dist,lang,'privacy/index.html'),'utf8');assert(privacy.includes('runograph-consent'));assert(privacy.includes('data-cookie-settings'));const home=readFileSync(resolve(dist,lang,'index.html'),'utf8');assert(home.includes('id="runograph-integrations"'));assert(home.includes(`href="${base}/${lang}/privacy/"`));assert(home.includes('<title>')&&home.includes(data.site.brand));assert.equal((home.match(/name="google-site-verification"/g)||[]).length,data.integrations.searchConsoleVerification?1:0);assert(!home.includes('src="https://www.googletagmanager.com/'),'Google script must be loaded only after consent.');}
await import('./check-consent.mjs');

assert(config.content.some(c=>c.name==='places'&&c.type==='collection'&&c.path==='content/places'));
assert(config.content.find(c=>c.name==='posts').fields.some(f=>f.name==='place'&&f.type==='reference'&&f.options.collection==='places'));
const invalidPlace=structuredClone(data.places[0]);invalidPlace.country='';assert.throws(()=>validateRecord('places',invalidPlace));
const mismatched=structuredClone(data);mismatched.posts[0].place=data.places.find(p=>p.country!==mismatched.posts[0].country).slug;assert.throws(()=>validateAll(mismatched),'Story and place must share their country.');
const hiddenPlaces=structuredClone(data);hiddenPlaces.countries.push({slug:'draft-place-only',en:{name:'Draft'},et:{name:'Mustand'}});hiddenPlaces.places.push({...structuredClone(data.places[0]),slug:'draft-place-only',country:'draft-place-only',status:'draft'});assert(!countryGroups(hiddenPlaces,'et').some(c=>c.slug==='draft-place-only'));
for(const lang of ['en','et']){
 for(const place of data.places){
  const file=resolve(dist,lang,'places',place.slug,'index.html');assert.equal(existsSync(file),place.status==='published');if(place.status!=='published')continue;
  const html=readFileSync(file,'utf8'),other=lang==='et'?'en':'et';assert(html.includes(`/${other}/places/${place.slug}/`));assert(html.includes(`/${lang}/countries/${place.country}/`));assert(html.includes(`content="${place.comingSoon||!data.seo.indexing?'noindex,follow':'index,follow'}"`));
  const credit=data.photoCredits.find(c=>c.path===place.image);assert(credit,'Location photos need attribution');assert(html.includes(credit.sourceUrl.replaceAll('&','&amp;')));assert(html.includes(credit.licenseUrl));
 }
 for(const group of countryGroups(data,lang)){const page=readFileSync(resolve(dist,lang,'countries',group.slug,'index.html'),'utf8');for(const place of data.places)assert.equal(page.includes(`/${lang}/places/${place.slug}/`),place.status==='published'&&place.country===group.slug,'Country mixed its places.');}
}
for(const credit of data.photoCredits){assert(credit.author&&credit.license&&/^https:\/\//.test(credit.sourceUrl)&&/^https:\/\//.test(credit.licenseUrl));assert(existsSync(resolve(dist,'.'+credit.path)));}
if(existsSync(resolve(dist,'sitemap.xml'))){const sitemap=readFileSync(resolve(dist,'sitemap.xml'),'utf8');for(const p of data.places)for(const lang of ['en','et'])assert.equal(sitemap.includes(`/${lang}/places/${p.slug}/`),p.status==='published'&&!p.comingSoon);}
console.log('Passed place checks: country/place relationships, draft isolation, bilingual pages, placeholder indexing, image credits and CMS references.');

const invalidPublication=structuredClone(data.publication);invalidPublication.mode='unknown';assert.throws(()=>validateRecord('publication',invalidPublication));

assert(!config.content.some(c=>c.name==='routes'),'Route guides must be removed from the CMS.');
for(const lang of ['et','en']){const home=readFileSync(resolve(dist,lang,'index.html'),'utf8');assert(!home.includes('class="section routes-home"'));assert(!home.includes(`href="${base}/${lang}/routes/"`));assert(home.includes('class="brand-run"'));assert(home.includes('class="brand-ograph"'));assert(home.includes('https://www.instagram.com/markuskaljuste/'));assert(home.includes('https://strava.app.link/W1a7SCITG7b'));const contact=readFileSync(resolve(dist,lang,'contact/index.html'),'utf8');assert(contact.includes('contact-form'));if(!data.engagement.contact.enabled)assert(!contact.includes('data-contact-form'));for(const post of data.posts.filter(p=>p.status==='published'))assert(readFileSync(resolve(dist,lang,'journal',post.slug,'index.html'),'utf8').includes('data-copy-link'));}
await import('./check-engagement.mjs');
