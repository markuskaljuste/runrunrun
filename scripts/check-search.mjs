import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {root,readContent} from './core.mjs';

const data=readContent(),dist=resolve(root,process.env.BUILD_DIRECTORY||'dist');
const all=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?all(resolve(folder,entry.name)):[resolve(folder,entry.name)]);
const pages=all(dist).filter(path=>path.endsWith('.html'));
const forbidden=/https?:\/\/(?:[a-z0-9.-]+\.chatgpt\.site|localhost(?::\d+)?|127\.0\.0\.1(?::\d+)?)/i;
const records=pages.map(file=>({file,html:readFileSync(file,'utf8')}));
for(const {file,html} of records){
 assert(!forbidden.test(html),'Preview/local URL in rendered page: '+file);
 const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];
 if(canonical)assert.equal(new URL(canonical).origin,'https://runograph.com','Canonical must use runograph.com: '+file);
 if(!html.includes('<meta name="robots" content="index,follow">'))continue;
 assert(html.includes('<title>')&&html.includes('<h1'),'Indexable page needs a title and heading: '+file);
 assert(/<meta name="description" content="[^"]+">/.test(html),'Indexable page needs a description: '+file);
 assert(canonical,'Indexable page needs a canonical URL: '+file);
 assert(/property="og:image" content="https:\/\//.test(html),'Indexable page needs an absolute sharing image: '+file);
}
const home=readFileSync(resolve(dist,'index.html'),'utf8'),comingSoon=home.includes('data-publication="coming-soon"');
if(comingSoon){
 assert(home.includes('content="noindex,follow"'));
 assert(!existsSync(resolve(dist,'sitemap.xml')),'Do not advertise pre-launch pages in a sitemap.');
}else{
 const xml=readFileSync(resolve(dist,'sitemap.xml'),'utf8');
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
 assert.equal(urls.length,new Set(urls).size,'Sitemap URLs must be unique.');
 for(const value of urls){
  const url=new URL(value);assert.equal(url.origin,'https://runograph.com');
  const base=(process.env.BASE_PATH??'').replace(/\/$/,'');
  const file=resolve(dist,'.'+url.pathname.slice(base.length),'index.html');
  assert(existsSync(file),'Sitemap URL must resolve to a page: '+value);
  assert(readFileSync(file,'utf8').includes('content="index,follow"'),'No drafts, redirects or Coming soon countries in sitemap: '+value);
 }
 if(data.seo.indexing){
  for(const slug of ['', 'about/', 'journal/', 'countries/'])assert(urls.some(url=>new URL(url).pathname.endsWith('/'+slug)),'Missing principal page in sitemap: '+slug);
  for(const post of data.posts.filter(post=>post.status==='published'))assert(urls.some(url=>url.endsWith('/journal/'+post.slug+'/')),'Published story missing from sitemap: '+post.slug);
 }
 for(const {file,html} of records.filter(record=>record.html.includes('content="index,follow"'))){
  const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];assert(urls.includes(canonical),'Indexable page missing from sitemap: '+relative(dist,file));
 }
 assert(readFileSync(resolve(dist,'robots.txt'),'utf8').includes('Sitemap: https://runograph.com'),'robots.txt must advertise the owned sitemap.');
}
console.log('Passed search launch checks: owned canonical and sharing URLs, no preview/local leaks, complete indexable sitemap and no pre-launch indexing.');
