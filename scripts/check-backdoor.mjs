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
function browser(saved,enteredUser=username,enteredPassword=password){
 const storage=new Map(saved?[[sessionKey,JSON.stringify(saved)]]:[]),events={},button={disabled:false},status={textContent:''};let written='',reset=0;
 const form={querySelector:()=>button,addEventListener:(name,fn)=>events[name]=fn,reportValidity:()=>true,reset:()=>reset++};
 const elements={'reader-login':form,'reader-status':status,'reader-user':{value:enteredUser},'reader-password':{value:enteredPassword}};
 const sessionStorage={getItem:name=>storage.get(name)??null,setItem:(name,value)=>storage.set(name,value),removeItem:name=>storage.delete(name)};
 const document={getElementById:name=>elements[name],open(){},write:html=>written=html,close(){}};
 const context=vm.createContext({crypto:webcrypto,TextEncoder,TextDecoder,document,sessionStorage,window:{crypto:webcrypto},URLSearchParams,console});
 const script=[...gate.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1].replace(/resume\(\);\s*$/,'globalThis.ready=resume();');
 vm.runInContext(script,context);
 return {context,storage,events,status,button,sessionStorage,get written(){return written;},get reset(){return reset;}};
}
const good=browser();await good.context.ready;assert(!good.written);await good.events.submit({preventDefault(){}});assert.equal(good.written,home);assert(good.reset);const saved=JSON.parse(good.storage.get(sessionKey));assert.equal(saved.key,key);assert(!JSON.stringify(saved).includes(password));assert(saved.expires>Date.now());
const resumed=browser(saved);await resumed.context.ready;assert.equal(resumed.written,home);
const incorrect=browser(null,username+'wrong');await incorrect.context.ready;await incorrect.events.submit({preventDefault(){}});assert(!incorrect.written);assert.match(incorrect.status.textContent,/incorrect/);assert(!incorrect.storage.size);assert(!incorrect.button.disabled);
const expired=browser({key,expires:Date.now()-1000});await expired.context.ready;assert(!expired.written);assert(!expired.storage.size);
const corrupt=browser({key:wrongKey,expires:Date.now()+sessionDuration});await corrupt.context.ready;assert(!corrupt.written);assert(!corrupt.storage.size);
const events={},logout={};let replaced='',reloads=0;
const document={currentScript:{src:'https://runograph.com'+base+'/assets/backdoor-session.js'},documentElement:{hidden:false},querySelectorAll:()=>[{addEventListener:(name,fn)=>logout[name]=fn}]};
vm.runInNewContext(readFileSync(resolve(dist,'assets/backdoor-session.js'),'utf8'),{document,sessionStorage:good.sessionStorage,location:{replace:url=>replaced=url,reload:()=>reloads++},URL,addEventListener:(name,fn)=>events[name]=fn});
logout.click();assert.equal(replaced,base+'/backdoor/');assert(!good.storage.size);events.pageshow();assert.equal(reloads,1);assert(document.documentElement.hidden);
console.log(`Passed reader security checks: ${decoded.size} encrypted pages, ${linkCount} local links, correct/wrong username and password, payload integrity, session resume/expiry, sign-out and cached Back navigation. Coming soon, privacy and sitemap preserved.`);
