import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../public/assets/privacy.js',import.meta.url),'utf8');
const key='runograph-consent',lifetime=180*86400000;
const remembered=(analytics=true,override={})=>{const now=Date.now();return {version:1,analytics,updatedAt:now-1000,expiresAt:now+lifetime-1000,...override};};
function browser({config={},saved,cookies='session=keep; runograph_ga=client; runograph_ga_TEST=state',storageBlocked=false,origin='https://example.com'}={}){
 const elements=new Map(),scripts=[],jar=new Map(cookies.split(';').map(c=>c.trim().split('='))),storage=new Map(saved?[[key,JSON.stringify(saved)]]:[]),windowListeners={};
 const element=()=>({hidden:true,disabled:false,checked:false,open:false,textContent:'',dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},showModal(){this.open=true;},close(){this.open=false;}});
 for(const id of ['runograph-integrations','cookie-banner','cookie-dialog','cookie-analytics','cookie-analytics-status','cookie-save','cookie-close'])elements.set('#'+id,element());
 elements.get('#runograph-integrations').textContent=JSON.stringify({enabled:true,id:'G-TEST123456',version:1,basePath:'/runrunrun/',allowAnalytics:true,...config});
 const consent=['accept','deny','deny'].map(c=>({...element(),dataset:{consent:c}})),settings=[element(),element()];
 let reloads=0;
 const location={protocol:new URL(origin).protocol,hostname:new URL(origin).hostname,href:origin+'/runrunrun/et/?email=private@example.com#secret',reload(){reloads++;}};
 const document={documentElement:{lang:'et'},referrer:'https://elsewhere.example/path?private=1#anchor',head:{appendChild(e){scripts.push(e);}},querySelector:s=>elements.get(s),querySelectorAll:s=>s==='[data-consent]'?consent:settings,createElement:()=>({})};
 Object.defineProperty(document,'cookie',{get(){return [...jar].map(([k,v])=>`${k}=${v}`).join('; ');},set(value){const [name,v]=value.split(';')[0].split('=');if(value.includes('Max-Age=0'))jar.delete(name);else jar.set(name,v);}});
 const localStorage={getItem(k){if(storageBlocked)throw Error('Blocked');return storage.get(k)||null;},setItem(k,v){if(storageBlocked)throw Error('Blocked');storage.set(k,v);},removeItem(k){if(storageBlocked)throw Error('Blocked');storage.delete(k);}};
 const window={addEventListener(type,fn){windowListeners[type]=fn;}};
 runInNewContext(code,{document,window,location,localStorage,Date,URL,Set,JSON,Number,Boolean,encodeURIComponent});
 return {window,scripts,jar,storage,elements,click(action){consent.find(b=>b.dataset.consent===action).listeners.click();},settings(){settings[0].listeners.click();},save(value){elements.get('#cookie-analytics').checked=value;elements.get('#cookie-save').listeners.click();},storageEvent(value){if(value)storage.set(key,JSON.stringify(value));else storage.delete(key);windowListeners.storage({key});},get reloads(){return reloads;}};
}
let b=browser();assert.equal(b.scripts.length,0);assert.equal(b.window.dataLayer,undefined);assert.equal(b.elements.get('#cookie-banner').hidden,false);assert.equal(b.window['ga-disable-G-TEST123456'],true);
b.click('deny');assert.equal(b.scripts.length,0);assert.equal(JSON.parse(b.storage.get(key)).analytics,false);assert.equal(b.elements.get('#cookie-banner').hidden,true);
b=browser();b.click('accept');assert.equal(b.scripts.length,1);assert.match(b.scripts[0].src,/^https:\/\/www.googletagmanager.com\/gtag\/js\?id=G-TEST123456$/);assert.equal(b.window['ga-disable-G-TEST123456'],false);
let commands=b.window.dataLayer.map(x=>Array.from(x)),config=commands.find(c=>c[0]==='config')[2];assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);assert.equal(config.cookie_path,'/runrunrun/');assert.equal(config.cookie_expires,15552000);assert.equal(config.page_location,'https://example.com/runrunrun/et/');assert.equal(config.page_referrer,'https://elsewhere.example/path');assert(!JSON.stringify(commands).includes('private@'));assert(commands.filter(c=>c[0]==='consent').every(c=>c[2].ad_storage==='denied'&&c[2].ad_user_data==='denied'&&c[2].ad_personalization==='denied'));b.click('accept');assert.equal(b.scripts.length,1);assert.equal(b.window.dataLayer.filter(c=>c[0]==='event'&&c[1]==='page_view').length,1);
b=browser({saved:remembered()});assert.equal(b.scripts.length,1);assert.equal(b.jar.get('runograph_ga'),'client','Remembered opt-in must retain the returning-client cookie.');b.settings();assert.equal(b.elements.get('#cookie-dialog').open,true);assert.equal(b.elements.get('#cookie-analytics').checked,true);b.save(false);assert.equal(b.reloads,1);assert.equal(b.window['ga-disable-G-TEST123456'],true);assert(!b.jar.has('runograph_ga'));assert(!b.jar.has('runograph_ga_TEST'));assert.equal(b.jar.get('session'),'keep');assert.equal(JSON.parse(b.storage.get(key)).analytics,false);
for(const saved of [remembered(false),remembered(true,{expiresAt:Date.now()-1}),remembered(true,{version:2}),remembered(true,{expiresAt:Date.now()+lifetime*2}),remembered(true,{updatedAt:Date.now()+100000})]){b=browser({saved});assert.equal(b.scripts.length,0);assert(!b.jar.has('runograph_ga'));}
for(const config of [{enabled:false},{id:''},{id:'G-<script>'},{allowAnalytics:false}]){b=browser({config,saved:remembered()});assert.equal(b.scripts.length,0);assert.equal(b.elements.get('#cookie-banner').hidden,true);b.settings();assert.equal(b.elements.get('#cookie-analytics').disabled,true);b.save(true);assert.equal(b.scripts.length,0);}
b=browser({origin:'https://test.chatgpt.site',saved:remembered()});assert.equal(b.scripts.length,0);
b=browser({origin:'http://localhost',saved:remembered()});assert.equal(b.scripts.length,0);
b=browser({storageBlocked:true});assert.equal(b.scripts.length,0);b.click('accept');assert.equal(b.scripts.length,1);b.save(false);assert.equal(b.reloads,1);
b=browser({saved:remembered()});b.storageEvent(remembered(false));assert.equal(b.reloads,1);assert.equal(b.window['ga-disable-G-TEST123456'],true);
b=browser();b.storageEvent(remembered());assert.equal(b.scripts.length,1);
console.log('Passed consent checks: no pre-consent requests, rejection, opt-in, one page view, sanitized URLs, returning visits, expiry/version renewal, withdrawal, cross-tab changes, disabled previews and blocked storage.');
