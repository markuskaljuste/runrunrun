import {wordmarkText,socialLinks} from './engagement.mjs';
import {mkdirSync,rmSync,cpSync,writeFileSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {root,esc,safeUrl} from './core.mjs';
import {redirectPage} from './redirects.mjs';
import {verificationTag} from './privacy.mjs';
export const isComingSoon=data=>process.env.PUBLIC_BUILD==='1'&&data.publication.mode==='coming-soon';
function launchPhoto(data){
 const src=safeUrl(data.images.homeHero.src);assert.notEqual(src,'#','Choose a valid homepage photograph.');
 if(/^https?:\/\//i.test(src))return {src};
 const asset=src.split(/[?#]/)[0].slice(1),file=resolve(root,'public',asset);
 assert(file.startsWith(resolve(root,'public/assets')+'/')&&/\.(?:jpe?g|png|webp|avif|svg)$/i.test(asset),'The Coming soon background must be an image inside public/assets.');
 return {src,asset,file};
}
export function buildComingSoon({data,base,origin}){
 const dist=resolve(root,'dist'),assets=resolve(dist,'assets');rmSync(dist,{recursive:true,force:true});mkdirSync(assets,{recursive:true});
 for(const name of ['manrope-700.ttf','dm-sans-400.ttf','LICENSE-manrope.txt','LICENSE-dm-sans.txt','favicon.svg','favicon-run.svg'])cpSync(resolve(root,'public/assets',name),resolve(assets,name));
 cpSync(resolve(root,'public/assets/launch.css'),resolve(assets,'launch.css'));
 const photo=launchPhoto(data);if(photo.asset){const target=resolve(dist,photo.asset);mkdirSync(resolve(target,'..'),{recursive:true});cpSync(photo.file,target);}
 const url=p=>base+p;
 const photoUrl=photo.src.startsWith('/')?url(photo.src):photo.src;
 function page(lang){
  const et=lang==='et',text=data.publication[lang];
  return `<!doctype html><html lang="${lang}" data-publication="coming-soon"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(text.title)} | ${esc(data.site.brand)}</title><meta name="description" content="${esc(text.description)}"><meta name="robots" content="noindex,follow"><meta name="theme-color" content="#263b2e">${verificationTag(data)}${origin?`<link rel="canonical" href="${esc(origin+url('/'+lang+'/'))}"><link rel="alternate" hreflang="en" href="${esc(origin+url('/en/'))}">`:''}<link rel="icon" type="image/svg+xml" href="${url('/assets/favicon-run.svg')}"><link rel="stylesheet" href="${url('/assets/launch.css')}">${origin?`<meta property="og:image" content="${esc(photoUrl.startsWith('/')?origin+photoUrl:photoUrl)}">`: ''}</head><body><header><a class="launch-brand" href="${url('/'+lang+'/')}">${wordmarkText(data.site.brand)}</a></header><main><img class="launch-background" src="${esc(photoUrl)}" alt="" width="4966" height="2333" fetchpriority="high"><div class="launch-shade" aria-hidden="true"></div><section class="launch-copy"><h1>${esc(text.title)}</h1><p class="description">${esc(text.description)}</p></section></main><footer>${socialLinks(data,lang)}<span>© ${new Date().getUTCFullYear()} ${esc(data.site.brand)}</span></footer></body></html>`;
 }
 for(const lang of ['en']){mkdirSync(resolve(dist,lang),{recursive:true});writeFileSync(resolve(dist,lang,'index.html'),page(lang));}
 mkdirSync(resolve(dist,'et'),{recursive:true});writeFileSync(resolve(dist,'et/index.html'),redirectPage(url('/en/'),{origin,publication:true}));
 writeFileSync(resolve(dist,'index.html'),redirectPage(url('/en/'),{origin,publication:true}));
 writeFileSync(resolve(dist,'404.html'),page('en'));
 writeFileSync(resolve(dist,'robots.txt'),`User-agent: *\nAllow: /\n`);writeFileSync(resolve(dist,'.nojekyll'),'');
 console.log('Built public coming-soon page only. The full journal remains in the private/local preview.');
}
export function checkComingSoon({data,base}){
 const dist=resolve(root,'dist'),allowed=new Set(['index.html','404.html','en/index.html','et/index.html','robots.txt','.nojekyll',...['launch.css','favicon.svg','favicon-run.svg','manrope-700.ttf','dm-sans-400.ttf','LICENSE-manrope.txt','LICENSE-dm-sans.txt'].map(n=>'assets/'+n)]);
 const photo=launchPhoto(data);if(photo.asset){allowed.add(photo.asset);assert(readFileSync(resolve(dist,photo.asset)).equals(readFileSync(photo.file)),'The public background must match the selected homepage photograph.');}
 const list=folder=>readdirSync(folder).flatMap(n=>{const p=resolve(folder,n);return statSync(p).isDirectory()?list(p):[p];});
 for(const file of list(dist)){const relative=file.slice(dist.length+1);assert(allowed.has(relative),`Full-site content leaked into the public coming-soon build: ${relative}`);if(file.endsWith('.html')){const html=readFileSync(file,'utf8');assert(html.includes('data-publication="coming-soon"'));assert(html.includes('content="noindex,follow"'));assert(!/<script\b/i.test(html),'Coming soon must not load Analytics or other scripts.');for(const link of html.matchAll(/(?:href|src)="([^"#]+)"/g)){if(/^https?:/.test(link[1]))continue;const local=link[1].split(/[?#]/)[0];assert(local.startsWith(base+'/'));assert(statSync(resolve(dist,'.'+local.slice(base.length))));}}}
 for(const lang of ['en'])assert(readFileSync(resolve(dist,lang,'index.html'),'utf8').includes(esc(data.publication[lang].title)));
 assert(readFileSync(resolve(dist,'et/index.html'),'utf8').includes('url='+base+'/en/'));assert(!readFileSync(resolve(dist,'en/index.html'),'utf8').includes('hreflang="et"'));assert(!readFileSync(resolve(dist,'en/index.html'),'utf8').includes('aria-label="Language"'));
 const home=readFileSync(resolve(dist,'en/index.html'),'utf8');assert(home.includes('class="launch-background"'));assert(home.includes(esc(photo.src.startsWith('/')?base+photo.src:photo.src)));assert(!home.includes('launch-art'));
 assert.equal(list(dist).length,allowed.size);
 console.log('Passed public launch checks: only coming-soon pages/assets, shared background photo, English page and legacy redirect, correct paths, no blog content, scripts or Analytics.');
}
