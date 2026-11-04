import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,createContext,runInContext} from 'node:vm';
import {readContent,validateRecord} from './core.mjs';
import {renderSignup} from './newsletter.mjs';
import {renderComingSoonPage} from './publication.mjs';
import {signupConsentText,signupConsentVersion,validSignupEndpoint} from './newsletter-config.mjs';

const data=readContent(),endpoint='https://script.google.com/macros/s/'+'A'.repeat(40)+'/exec';
assert(validSignupEndpoint(endpoint));
for(const bad of ['https://evil.example/exec',endpoint.replace('/exec','/dev'),endpoint+'?token=secret',endpoint.replace('script.google.com','script.google.com.evil.example')])assert(!validSignupEndpoint(bad));
const config=structuredClone(data.engagement);config.newsletter={enabled:true,appsScriptUrl:''};assert.throws(()=>validateRecord('engagement',config));config.newsletter.appsScriptUrl=endpoint;validateRecord('engagement',config);
const inactive=structuredClone(data);inactive.engagement.newsletter={enabled:false,appsScriptUrl:''};
assert.equal(renderSignup({data:inactive,url:p=>p}),'');
assert(renderSignup({data:inactive,url:p=>p,preview:true}).includes('<fieldset disabled>'));
const active=structuredClone(data);active.engagement.newsletter={enabled:true,appsScriptUrl:endpoint};
const html=renderComingSoonPage({data:active,origin:'https://runograph.com'});assert(html.includes('data-signup'));assert(html.includes('name="consent" value="yes" required'));assert(!html.includes('name="consent" value="yes" required checked'));assert(html.includes('/assets/newsletter.js'));assert(html.includes(signupConsentText));
assert(!renderComingSoonPage({data:inactive}).includes('data-signup'));
assert(!renderComingSoonPage({data:active,privacy:true,content:'Privacy'}).includes('data-signup'));

const backend=readFileSync(new URL('../integrations/google-sheets/Code.gs',import.meta.url),'utf8');
function server({writeFails=false,flushFails=false,busy=false,collision=false}={}){
 const rows=collision?[['Existing owner data']]:[],properties=new Map();let releases=0,writes=0;
 const sheet={getLastRow:()=>rows.length,getMaxRows:()=>1000,insertRowsAfter(){},setFrozenRows(){},getRange(r,c,n,m){return {getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>rows[r+i-1]?.[c+j-1]??'')),setValues(values){if(writeFails&&r>1)throw Error('Storage unavailable');writes++;for(let i=0;i<values.length;i++){rows[r+i-1]??=[];for(let j=0;j<values[i].length;j++)rows[r+i-1][c+j-1]=values[i][j];}}};}};
 let created=collision;
 const spreadsheet={getId:()=> 'private-test-sheet',getSheetByName:()=>created?sheet:null,insertSheet(name){assert.equal(name,'Runograph subscribers');created=true;return sheet;}};
 const props={getProperty:k=>properties.get(k)??null,setProperty(k,v){properties.set(k,v);return props;}};
 const context=createContext({console,Date,SpreadsheetApp:{getActiveSpreadsheet:()=>spreadsheet,openById(id){assert.equal(id,'private-test-sheet');return spreadsheet;},flush(){if(flushFails&&rows.length>1)throw Error('Flush failed');}},PropertiesService:{getScriptProperties:()=>props},LockService:{getScriptLock:()=>({waitLock(){},tryLock:()=>!busy,releaseLock(){releases++;}})},Utilities:{getUuid:()=> 'subscriber-id'},HtmlService:{XFrameOptionsMode:{ALLOWALL:'allowall'},createHtmlOutput:html=>({html,setXFrameOptionsMode(){return this;}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})}});
 runInContext(backend,context);
 return {context,rows,properties,get releases(){return releases;},get writes(){return writes;},setup:()=>context.setup(),post(parameters={},event={}){const p={email:'runner@example.com',consent:'yes',version:signupConsentVersion,website:'',startedAt:String(Date.now()-3000),nonce:'a'.repeat(48),origin:'https://runograph.com',...parameters};const output=context.doPost({parameter:p,contentLength:300,...event});let result={ok:false};const script=output.html.match(/<script>([\s\S]*?)<\/script>/)?.[1];if(script)runInNewContext(script,{window:{top:{postMessage(value,origin){assert.equal(origin,p.origin);result=value;}}}});assert(!output.html.includes(p.email),'No email address belongs in the acknowledgement.');return result;}};
}
let s=server();s.setup();assert.equal(s.rows.length,1);assert.equal(s.properties.get('SPREADSHEET_ID'),'private-test-sheet');
assert.equal(s.post().ok,true);assert.equal(s.rows.length,2);assert.equal(s.rows[1][1],'runner@example.com');assert.equal(s.rows[1][2],signupConsentText);assert.equal(s.rows[1][3],signupConsentVersion);assert.equal(s.rows[1][5],'collected');
assert.equal(s.post({email:' RUNNER@EXAMPLE.COM '}).ok,true);assert.equal(s.rows.length,2,'Retries and case differences must not create duplicate subscribers.');
for(const bad of [{consent:''},{version:'old'},{website:'bot'},{email:'not-an-email'},{email:'runner\n@example.com'},{startedAt:String(Date.now()+5000)},{startedAt:String(Date.now()-90000000)},{nonce:'bad'},{origin:'https://evil.example'}]){assert.equal(s.post(bad).ok,false);assert.equal(s.rows.length,2);}
assert.equal(s.post({}, {contentLength:5000}).ok,false);assert.equal(s.rows.length,2);
assert.equal(s.post({email:'=runner@example.com'}).ok,true);assert.equal(s.rows[2][1],"'=runner@example.com",'Formula-like email strings must be stored as text.');
s.properties.set('SIGNUP_DAILY',new Date().toISOString().slice(0,10)+':1000');assert.equal(s.post({email:'another@example.com'}).code,'busy');assert.equal(s.rows.length,3);
assert(!s.context.doGet().text.includes('runner@example.com'));
s=server();assert.equal(s.post().code,'unavailable');assert.equal(s.rows.length,0);
s=server({writeFails:true});s.setup();assert.equal(s.post().ok,false);assert.equal(s.rows.length,1);assert.equal(s.releases,2);
s=server({flushFails:true});s.setup();assert.equal(s.post().ok,false,'An unconfirmed write must not claim success.');
s=server({busy:true});s.setup();assert.equal(s.post().code,'busy');assert.equal(s.rows.length,1);
s=server({collision:true});assert.throws(()=>s.setup());assert.equal(s.rows[0][0],'Existing owner data');assert.equal(s.writes,0);

const client=readFileSync(new URL('../public/assets/newsletter.js',import.meta.url),'utf8');
function browser({url=endpoint,throwOnSubmit=false,buttonText='Join the waitlist',successMessage}={}){
 const listeners=new Map(),timers=new Map(),created=[],body=[];let sequence=0,submissions=0,resets=0;
 const status={textContent:''},button={textContent:buttonText},fieldset={disabled:false},email={value:'runner@example.com'},consent={checked:true},trap={value:''};
 const form={dataset:{endpoint:url,consentVersion:signupConsentVersion,successMessage},reportValidity:()=>true,querySelector:selector=>({'fieldset':fieldset,'[name="email"]':email,'[name="consent"]':consent,'[name="website"]':trap,'button[type="submit"]':button,'.signup-status':status})[selector],addEventListener:(name,fn)=>listeners.set('form:'+name,fn),reset(){resets++;email.value='';consent.checked=false;}};
 const document={querySelectorAll:()=>[form],body:{append(...nodes){body.push(...nodes);}},createElement(tag){const node={tag,children:[],setAttribute(k,v){this[k]=v;},append(child){this.children.push(child);},remove(){this.removed=true;},submit(){submissions++;if(throwOnSubmit)throw Error('Blocked');}};created.push(node);return node;}};
 const window={location:{origin:'https://runograph.com'},addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 runInNewContext(client,{document,window,URL,Uint8Array,Date,crypto:{getRandomValues(bytes){bytes.fill(7);}},setTimeout(fn){const id=++sequence;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)});
 return {status,button,fieldset,email,consent,body,created,get submissions(){return submissions;},get resets(){return resets;},submit(){listeners.get('form:submit')?.({preventDefault(){}});},ack({origin='https://n-random-script.googleusercontent.com',nonce,ok=true,code='saved'}={}){const transport=created.find(n=>n.tag==='form');const token=nonce??transport?.children.find(n=>n.name==='nonce')?.value;listeners.get('message')?.({origin,data:{type:'runograph-signup-result',nonce:token,ok,code}});},timeout(){for(const fn of [...timers.values()])fn();}};
}
let b=browser();assert.equal(b.body.length,0);assert.equal(b.submissions,0);b.submit();assert.equal(b.submissions,1);assert.equal(b.fieldset.disabled,true);
b.ack({origin:'https://script.googleusercontent.com.evil.example'});b.ack({nonce:'guessed'});b.ack({ok:'true'});assert.equal(b.resets,0);assert.equal(b.status.textContent,'');
b.ack();assert.equal(b.resets,1);assert(b.status.textContent.includes('You’re on the waitlist'));assert.equal(b.fieldset.disabled,false);assert(b.created.filter(n=>n.tag==='iframe'||n.tag==='form').every(n=>n.removed));
for(const failure of ['server','timeout','transport']){b=browser({throwOnSubmit:failure==='transport'});b.submit();if(failure==='server')b.ack({ok:false,code:'unavailable'});if(failure==='timeout')b.timeout();assert.equal(b.resets,0);assert.equal(b.email.value,'runner@example.com');assert.equal(b.consent.checked,true);assert(!b.status.textContent.includes('You’re on the waitlist'));assert.equal(b.fieldset.disabled,false);b.ack();assert.equal(b.resets,0,'Late acknowledgements after timeout must not change the result.');}
b=browser({url:'https://evil.example/collect'});b.submit();assert.equal(b.submissions,0);
const footerButton='New stories by email',footerSuccess='Thanks for subscribing! You’ll receive new Runograph stories by email.';
for(const result of ['saved','timeout']){b=browser({buttonText:footerButton,successMessage:footerSuccess});b.submit();if(result==='saved')b.ack();else b.timeout();assert.equal(b.button.textContent,footerButton,'Keep the footer button label after every submission.');assert.equal(b.resets,result==='saved'?1:0);if(result==='saved')assert.equal(b.status.textContent,footerSuccess);}

console.log('Passed email signup checks: endpoint validation, inactive public defaults, consent, private sheet setup, deduplication, formula escaping, failed writes, request limits, no subscriber reads, authenticated response origin/nonces and honest success/timeout states.');
