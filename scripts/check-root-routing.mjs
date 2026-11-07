import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent} from './core.mjs';
import {canonicalPath,languagePath} from '../public/assets/paths.js';
import {storyPath} from './story-languages.mjs';
import {renderMetadata} from './metadata.mjs';
import {shareBar} from './engagement.mjs';

assert.equal(languagePath('en'),'/');assert.equal(languagePath('en','journal/story/'),'/journal/story/');assert.equal(languagePath('es','journal/story/'),'/es/journal/story/');
assert.equal(canonicalPath('/en?test=1'),'/?test=1');assert.equal(canonicalPath('/english/'),'/english/');assert.equal(canonicalPath('https://example.com/en/'),'https://example.com/en/');
const data=readContent(),base=(process.env.BASE_PATH??'').replace(/\/$/,''),home=readFileSync(resolve(root,'dist/index.html'),'utf8');
const comingSoon=home.includes('data-publication="coming-soon"'),paths=comingSoon?['','privacy/']:['','about/','journal/','countries/','places/','privacy/',...data.posts.filter(p=>p.status==='published').map(p=>'journal/'+p.slug+'/')];
for(const path of paths){
 const page=readFileSync(resolve(root,'dist',path,'index.html'),'utf8');assert(page.includes('<html lang="en"'));assert(!page.includes('http-equiv="refresh"'),'English pages must render directly.');
 const canonical=page.match(/rel="canonical" href="([^"]+)"/);if(canonical)assert.equal(new URL(canonical[1]).pathname,base+'/'+path);
 const old=readFileSync(resolve(root,'dist/en',path,'index.html'),'utf8');assert(old.includes('url='+base+'/'+path));assert(old.includes('noindex,follow'));
}
if(!comingSoon){const oldContact=readFileSync(resolve(root,'dist/contact/index.html'),'utf8');assert(oldContact.includes('url='+base+'/about/#contact'));assert(oldContact.includes('noindex,follow'));}
const fixture={slug:'root-routing-fixture',status:'published',en:{title:'Original',excerpt:'Introduction',body:'Body'},translations:[{language:'es',status:'published',title:'ES fixture',excerpt:'ES introduction',body:'ES body'}]};
assert.equal(storyPath(fixture,'en'),'/journal/root-routing-fixture/');assert.equal(storyPath(fixture,'es'),'/es/journal/root-routing-fixture/');
for(const lang of ['en','es']){const head=renderMetadata({lang,path:'journal/root-routing-fixture/',title:'Fixture',description:'Description',data,origin:'https://example.com',base:'/repo',availableLanguages:['en','es']});assert(head.includes('hreflang="en" href="https://example.com/repo/journal/root-routing-fixture/"'));assert(head.includes('hreflang="es" href="https://example.com/repo/es/journal/root-routing-fixture/"'));}
const sharing=shareBar({data,lang:'en',path:'/en/journal/root-routing-fixture/',title:'Fixture'});if(data.engagement.sharingEnabled){assert(sharing.includes(encodeURIComponent('https://runograph.com/journal/root-routing-fixture/')));assert(!sharing.includes(encodeURIComponent('https://runograph.com/en/journal/')));}
console.log('Passed root routing checks: direct English pages, old English redirects, language-prefixed translations, reciprocal canonical metadata and canonical sharing links.');
