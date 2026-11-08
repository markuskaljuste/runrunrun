import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {root,readContent} from './core.mjs';
import {cryptoEngine,codec,salt,passphrase,payload,files,username,sessionKey,sessionDuration} from './backdoor.mjs';
if(readContent().publication.mode!=='coming-soon'){console.log('Live mode: no encrypted preview to check.');process.exit(0);}
const password=process.env.READER_PREVIEW_PASSWORD;if(!password)throw Error('Reader secret is required for verification.');
const dist=resolve(root,'dist'),base=(process.env.BASE_PATH??'').replace(/\/$/,''),key=await cryptoEngine.hashPassword(passphrase(password),salt);
const wrongKey=await cryptoEngine.hashPassword(passphrase(password+'incorrect'),salt);
const publicFiles=new Set(['index.html','en/index.html','et/index.html','privacy/index.html','en/privacy/index.html','et/privacy/index.html','404.html']);
const decoded=new Map();let linkCount=0;
for(const file of files(dist).filter(f=>f.endsWith('.html'))){
 const relative=file.slice(dist.length+1),html=readFileSync(file,'utf8');
 assert(!html.includes(password),'Password leaked into generated HTML.');
 assert(!/https?:\/\/[^\s"'<>]*\.chatgpt\.site/.test(html),'Preview host leaked into a page.');
 if(publicFiles.has(relative)){assert(!html.includes('data-reader-gate'));continue;}
 assert(html.includes('data-reader-gate'),'A full-site page escaped encryption: '+relative);
 assert(html.includes('content="noindex,nofollow"'));assert(!html.includes('<article>'));
 const config=payload(html);assert.equal(config.staticryptSaltUniqueVariableName,salt);
 const result=await codec.decode(config.staticryptEncryptedMsgUniqueVariableName,key,salt);assert(result.success,'Cannot unlock '+relative);
 const plain=result.decoded;decoded.set(relative,plain);
 assert(plain.includes('content="noindex,nofollow"'));
 assert(!/href="[^"\s]*\/admin\/"/.test(plain));
 assert(!/https?:\/\/[^\s"'<>]*\.chatgpt\.site/.test(plain),'Old host in unlocked content.');
 assert(!/href="(?:https:\/\/runograph\.com)?\/(?:en\/)?"/.test(plain),'Preview Home link leads to Coming soon.');
 for(const match of plain.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)){
  const href=match[1].replaceAll('&amp;','&');if(/^(https?:|mailto:|data:)/.test(href))continue;
  const target=href.startsWith('/')?resolve(dist,'.'+(base?href.slice(base.length):href)):resolve(dirname(file),href);
  assert(target.startsWith(dist+'/')||target===dist,'Link escapes build.');assert(existsSync(target),'Broken reader link: '+href+' in '+relative);
  if(statSync(target).isDirectory())assert(existsSync(resolve(target,'index.html')),'Missing page: '+href);linkCount++;
 }
}
assert(decoded.has('backdoor/index.html'));assert(decoded.has('backdoor/privacy/index.html'));assert(decoded.has('photo_credits/index.html'));
assert(readFileSync(resolve(dist,'index.html'),'utf8').includes('data-publication="coming-soon"'));
if(existsSync(resolve(dist,'sitemap.xml')))assert(!readFileSync(resolve(dist,'sitemap.xml'),'utf8').includes('/journal/'));assert(!existsSync(resolve(dist,'admin')));
const home=decoded.get('backdoor/index.html');assert(home.includes('href="'+base+'/photo_credits/"'));assert(home.includes('href="'+base+'/backdoor/privacy/"'));assert(home.includes('data-reader-logout'));assert(home.includes('"allowAnalytics":false'));
for(const post of readContent().posts.filter(p=>p.status==='published'))assert(decoded.get('journal/'+post.slug+'/index.html').includes(post.en.title.replaceAll('&','&amp;')));
const gate=readFileSync(resolve(dist,'backdoor/index.html'),'utf8'),config=payload(gate);
assert.equal((await codec.decode(config.staticryptEncryptedMsgUniqueVariableName,wrongKey,salt)).success,false,'Wrong password unlocked a page.');
const tampered=config.staticryptEncryptedMsgUniqueVariableName.slice(0,-1)+(config.staticryptEncryptedMsgUniqueVariableName.endsWith('0')?'1':'0');
assert.equal((await codec.decode(tampered,key,salt)).success,false,'Tampered payload accepted.');

// Run the actual generated login JavaScript with a small DOM and real WebCrypto.
const adapter=(map,blocked=false)=>({getItem(name){if(blocked)throw Error('Storage blocked');return map.get(name)??null;},setItem(name,value){if(blocked)throw Error('Storage blocked');map.set(name,value);},removeItem(name){if(blocked)throw Error('Storage blocked');map.delete(name);}});
function browser({saved,shared=new Map(),tab=new Map(),gateHtml=gate,enteredUser=username,enteredPassword=password,blockedLocal=false,blockedTab=false}={}){
 if(saved)tab.set(sessionKey,JSON.stringify(saved));
 const events={},button={disabled:false},status={textContent:''};let written='',reset=0;
 const form={hidden:false,querySelector:()=>button,addEventListener:(name,fn)=>events[name]=fn,reportValidity:()=>true,reset:()=>reset++};
 const elements={'reader-login':form,'reader-status':status,'reader-user':{value:enteredUser},'reader-password':{value:enteredPassword}};
 const localStorage=adapter(shared,blockedLocal),sessionStorage=adapter(tab,blockedTab);
 const document={getElementById:name=>elements[name],open(){},write:html=>written=html,close(){}};
 const context=vm.createContext({crypto:webcrypto,TextEncoder,TextDecoder,document,localStorage,sessionStorage,window:{crypto:webcrypto},URLSearchParams,console});
 const script=[...gateHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1].replace(/resume\(\);\s*$/,'globalThis.ready=resume();');
 vm.runInContext(script,context);
 return {context,shared,tab,events,status,button,form,sessionStorage,localStorage,get written(){return written;},get reset(){return reset;}};
}
const good=browser();await good.context.ready;assert(!good.written);await good.events.submit({preventDefault(){}});assert.equal(good.written,home);assert(good.reset);
const saved=JSON.parse(good.shared.get(sessionKey));assert.equal(saved.key,key);assert(!JSON.stringify(saved).includes(password));assert(saved.expires>Date.now());
assert(good.tab.has(sessionKey),'Retain tab fallback for blocked shared storage and previously cached gates.');
// Share only browser storage: every new page has a fresh script context and a new-tab visit has no tab storage.
for(const path of ['journal/rome/index.html','countries/spain/index.html','journal/nice-to-monaco/index.html','backdoor/privacy/index.html','backdoor/index.html']){
 const page=browser({shared:good.shared,gateHtml:readFileSync(resolve(dist,path),'utf8')});
 assert(page.form.hidden,'Do not flash the login form when a valid login is being restored.');
 await page.context.ready;assert.equal(page.written,decoded.get(path),'A second login was required on '+path);
 assert.equal(JSON.parse(good.shared.get(sessionKey)).expires,saved.expires,'Navigation must not renew the session indefinitely.');
}
const resumed=browser({saved,shared:good.shared});await resumed.context.ready;assert.equal(resumed.written,home);
const migrated=browser({saved:{key,expires:saved.expires}});await migrated.context.ready;assert.equal(migrated.written,home);assert(migrated.shared.has(sessionKey));assert.equal(JSON.parse(migrated.shared.get(sessionKey)).expires,saved.expires);
const incorrect=browser({enteredUser:username+'wrong'});await incorrect.context.ready;await incorrect.events.submit({preventDefault(){}});assert(!incorrect.written);assert.match(incorrect.status.textContent,/incorrect/);assert(!incorrect.shared.size);assert(!incorrect.tab.size);assert(!incorrect.button.disabled);
const expired=browser({saved:{key,expires:Date.now()-1000}});await expired.context.ready;assert(!expired.written);assert(!expired.shared.size);assert(!expired.tab.size);
const corrupt=browser({saved:{key:wrongKey,expires:Date.now()+sessionDuration}});await corrupt.context.ready;assert(!corrupt.written);assert(!corrupt.shared.size);assert(!corrupt.tab.size);assert(!corrupt.form.hidden);
const fallback=browser({blockedLocal:true});await fallback.context.ready;await fallback.events.submit({preventDefault(){}});assert.equal(fallback.written,home);assert(fallback.tab.has(sessionKey));
const fallbackPage=browser({blockedLocal:true,tab:fallback.tab,gateHtml:readFileSync(resolve(dist,'journal/rome/index.html'),'utf8')});await fallbackPage.context.ready;assert.equal(fallbackPage.written,decoded.get('journal/rome/index.html'));
const blocked=browser({blockedLocal:true,blockedTab:true});await blocked.context.ready;await blocked.events.submit({preventDefault(){}});assert(!blocked.written);assert.match(blocked.status.textContent,/Allow browser storage/);
function unlocked(page){
 const events={},logout={};let replaced='',reloads=0;
 const document={currentScript:{src:'https://runograph.com'+base+'/assets/backdoor-session.js?v=2'},documentElement:{hidden:false},querySelectorAll:()=>[{addEventListener:(name,fn)=>logout[name]=fn}]};
 const context=vm.createContext({document,sessionStorage:page.sessionStorage,localStorage:page.localStorage,location:{replace:url=>replaced=url,reload:()=>reloads++},URL,addEventListener:(name,fn)=>events[name]=fn});
 vm.runInContext(readFileSync(resolve(dist,'assets/backdoor-storage.js'),'utf8'),context);
 vm.runInContext(readFileSync(resolve(dist,'assets/backdoor-session.js'),'utf8'),context);
 return {events,logout,document,get replaced(){return replaced;},get reloads(){return reloads;}};
}
const other=browser({shared:good.shared});await other.context.ready;
const active=unlocked(good),otherActive=unlocked(other);active.events.pageshow();assert.equal(active.reloads,0);
active.logout.click();assert.equal(active.replaced,base+'/backdoor/');assert(!good.shared.size);assert(!good.tab.size);
otherActive.events.storage({key:sessionKey,newValue:null});assert.equal(otherActive.reloads,1);assert(otherActive.document.documentElement.hidden);assert(!other.tab.size);
const afterLogout=browser({shared:good.shared});await afterLogout.context.ready;assert(!afterLogout.written);
const cached=unlocked(good);cached.events.pageshow();assert.equal(cached.reloads,1);assert(cached.document.documentElement.hidden);
const stale=browser({shared:new Map(),tab:new Map([[sessionKey,JSON.stringify({...saved,shared:true})]])});await stale.context.ready;assert(!stale.written,'Do not resurrect a shared login removed in another tab.');
console.log(`Passed reader security checks: ${decoded.size} encrypted pages, ${linkCount} local links, one login across stories, country and privacy pages/new tabs, legacy migration, blocked-storage fallback, expiry, cross-tab sign-out and cached Back navigation. Coming soon, privacy and sitemap preserved.`);
