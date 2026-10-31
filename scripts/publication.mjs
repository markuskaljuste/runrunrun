import {mkdirSync,rmSync,cpSync,writeFileSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {root,esc} from './core.mjs';
import {verificationTag} from './privacy.mjs';
export const isComingSoon=data=>process.env.PUBLIC_BUILD==='1'&&data.publication.mode==='coming-soon';
export function buildComingSoon({data,base,origin}){
 const dist=resolve(root,'dist'),assets=resolve(dist,'assets');rmSync(dist,{recursive:true,force:true});mkdirSync(assets,{recursive:true});
 for(const name of ['manrope-700.ttf','dm-sans-400.ttf','LICENSE-manrope.txt','LICENSE-dm-sans.txt','favicon.svg'])cpSync(resolve(root,'public/assets',name),resolve(assets,name));
 cpSync(resolve(root,'public/assets/launch.css'),resolve(assets,'launch.css'));
 const url=p=>base+p;
 function page(lang){
  const et=lang==='et',text=data.publication[lang];
  return `<!doctype html><html lang="${lang}" data-publication="coming-soon"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(text.title)} | ${esc(data.site.brand)}</title><meta name="description" content="${esc(text.description)}"><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#263b2e">${verificationTag(data)}${origin?`<link rel="canonical" href="${esc(origin+url('/'+lang+'/'))}"><link rel="alternate" hreflang="en" href="${esc(origin+url('/en/'))}"><link rel="alternate" hreflang="et" href="${esc(origin+url('/et/'))}">`:''}<link rel="icon" href="${url('/assets/favicon.svg')}"><link rel="stylesheet" href="${url('/assets/launch.css')}"></head><body><header><a class="launch-brand" href="${url('/'+lang+'/')}">${esc(data.site.brand)}<span aria-hidden="true">✳</span></a><nav aria-label="${et?'Keel':'Language'}"><a href="${url('/et/')}" lang="et" ${et?'aria-current="page"':''}>ET</a><span aria-hidden="true">/</span><a href="${url('/en/')}" lang="en" ${!et?'aria-current="page"':''}>EN</a></nav></header><main><section class="launch-copy"><p class="eyebrow">${et?'JOOKSMINE · REISIMINE':'RUNNING · TRAVEL'}</p><h1>${esc(text.title)}</h1><p class="description">${esc(text.description)}</p><div class="launch-status"><span aria-hidden="true"></span>${et?'Üks jooks korraga.':'One run at a time.'}</div></section><div class="launch-art" aria-hidden="true"><svg viewBox="0 0 460 460" fill="none"><circle cx="230" cy="230" r="200" stroke="currentColor" stroke-width="1" opacity=".24"/><circle cx="230" cy="230" r="170" stroke="currentColor" stroke-width="1" stroke-dasharray="2 10" opacity=".45"/><path d="M120 332C120 260 340 300 340 188C340 80 142 78 142 188C142 267 302 223 302 318" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="120" cy="332" r="9" fill="#263b2e"/><circle cx="302" cy="318" r="15" fill="#d6e58a" stroke="currentColor" stroke-width="2"/><path d="M223 218h14m-7-7v14" stroke="currentColor" stroke-width="2"/></svg><span>${et?'Uued paigad. Uued lood.':'New places. New stories.'}</span></div></main><footer><span>© ${new Date().getUTCFullYear()} ${esc(data.site.brand)}</span><span>${et?'Jooksu- ja reisipäevik':'A running travel journal'}</span></footer></body></html>`;
 }
 for(const lang of ['et','en']){mkdirSync(resolve(dist,lang),{recursive:true});writeFileSync(resolve(dist,lang,'index.html'),page(lang));}
 writeFileSync(resolve(dist,'index.html'),`<!doctype html><html lang="en" data-publication="coming-soon"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>${esc(data.site.brand)}</title>${verificationTag(data)}<meta http-equiv="refresh" content="0;url=${url('/en/')}"></head><body><a href="${url('/en/')}">English</a> · <a href="${url('/et/')}">Eesti</a></body></html>`);
 writeFileSync(resolve(dist,'404.html'),page('et'));
 writeFileSync(resolve(dist,'robots.txt'),`User-agent: *\nAllow: /\n`);writeFileSync(resolve(dist,'.nojekyll'),'');
 console.log('Built public coming-soon page only. The full journal remains in the private/local preview.');
}
export function checkComingSoon({data,base}){
 const dist=resolve(root,'dist'),allowed=new Set(['index.html','404.html','en/index.html','et/index.html','robots.txt','.nojekyll',...['launch.css','favicon.svg','manrope-700.ttf','dm-sans-400.ttf','LICENSE-manrope.txt','LICENSE-dm-sans.txt'].map(n=>'assets/'+n)]);
 const list=folder=>readdirSync(folder).flatMap(n=>{const p=resolve(folder,n);return statSync(p).isDirectory()?list(p):[p];});
 for(const file of list(dist)){const relative=file.slice(dist.length+1);assert(allowed.has(relative),`Full-site content leaked into the public coming-soon build: ${relative}`);if(file.endsWith('.html')){const html=readFileSync(file,'utf8');assert(html.includes('data-publication="coming-soon"'));assert(html.includes('content="noindex,follow"'));assert(!/<script\b/i.test(html),'Coming soon must not load Analytics or other scripts.');for(const link of html.matchAll(/(?:href|src)="([^"#]+)"/g)){if(/^https?:/.test(link[1]))continue;assert(link[1].startsWith(base+'/'));assert(statSync(resolve(dist,'.'+link[1].slice(base.length))));}}}
 for(const lang of ['et','en'])assert(readFileSync(resolve(dist,lang,'index.html'),'utf8').includes(esc(data.publication[lang].title)));
 assert.equal(list(dist).length,allowed.size);
 console.log('Passed public launch checks: only coming-soon pages/assets, both languages, correct paths, no blog content, scripts or Analytics.');
}
