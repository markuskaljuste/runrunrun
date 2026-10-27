import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { root,readContent,validateAll,validateRecord,markdown } from './core.mjs';
import {renderMetadata} from './metadata.mjs';
const data=readContent();validateAll(data);
const dist=resolve(root,'dist'),base=(process.env.BASE_PATH??'').replace(/\/$/,'');
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
for(const lang of ['en','et'])for(const type of ['posts','routes'])for(const record of data[type]){
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
const config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));assert.equal(config.content.length,6);assert.equal(config.media.output,'/assets/uploads');for(const type of ['branding','images','seo'])assert(config.content.some(c=>c.name===type&&c.path===`content/${type}.json`));
const branding=structuredClone(data.branding);branding.sponsors=[{name:'Test sponsor',logo:'/assets/favicon.svg',url:'javascript:alert(1)',enabled:true}];assert.throws(()=>validateRecord('branding',branding),'Sponsor links must use HTTPS.');branding.sponsors[0].url='https://example.com';validateRecord('branding',branding);branding.logoWidth=999;assert.throws(()=>validateRecord('branding',branding),'Logo sizing must stay within the header layout.');
const testData=structuredClone(data);testData.seo.pages.home.et={title:'Uus SEO pealkiri',description:'Kirjeldus & tekst',socialImage:'/assets/ocean.jpg'};testData.seo.indexing=false;
let head=renderMetadata({lang:'et',path:'',title:'Fallback',description:'Fallback description',data:testData,base:'/journal-site',origin:'https://example.com'});
assert(head.includes('<title>Uus SEO pealkiri</title>'));assert(head.includes('content="Kirjeldus &amp; tekst"'));assert(head.includes('content="noindex,follow"'));assert(head.includes('https://example.com/journal-site/assets/ocean.jpg'));assert(head.includes('hreflang="en"'));assert(head.includes('rel="canonical" href="https://example.com/journal-site/et/"'));
head=renderMetadata({lang:'en',path:'journal/a-story/',title:'Fallback',description:'Fallback',ogImage:'/assets/forest.jpg',seo:{seoTitle:'Story SEO',seoDescription:'Story description',socialImage:'https://example.com/story.jpg'},data:testData,origin:'https://example.com'});
assert(head.includes('<title>Story SEO</title>'));assert(head.includes('content="Story description"'));assert(head.includes('content="https://example.com/story.jpg"'));assert(head.includes('content="article"'));
const images=structuredClone(data.images);images.homeHero.src='javascript:alert(1)';assert.throws(()=>validateRecord('images',images));
console.log(`Passed: ${pages} HTML pages, ${links} internal links/assets, EN/ET counterpart links, source requirements, safe text rendering, draft visibility and CMS file structure.`);
