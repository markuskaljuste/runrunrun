import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {esc} from './core.mjs';

export function buildSitemap({dist,origin}){
 const files=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(resolve(folder,entry.name)):[resolve(folder,entry.name)]);
 const urls=new Set();
 for(const file of files(dist).filter(path=>path.endsWith('.html'))){
  const html=readFileSync(file,'utf8');
  if(!/<meta name="robots" content="index,follow">/.test(html))continue;
  const canonical=html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if(!canonical||new URL(canonical).origin!==origin)throw Error('Indexable pages need a canonical URL on the website origin: '+file);
  urls.add(canonical);
 }
 writeFileSync(resolve(dist,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...urls].sort().map(url=>`<url><loc>${esc(url)}</loc></url>`).join('')+'</urlset>');
 return urls.size;
}
