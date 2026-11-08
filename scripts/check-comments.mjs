import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createContext,runInContext,runInNewContext} from 'node:vm';
import {createHash,createHmac,randomUUID} from 'node:crypto';
import {readContent,root,validateRecord} from './core.mjs';
import {commentsSection} from './comments.mjs';

const source=readFileSync(resolve(root,'integrations/google-comments/Code.gs'),'utf8');
function service(){
 let now=Date.parse('2026-11-08T12:00:00Z'),locked=false,activeRow=2,failMail=false,quota=100;
 const cells=[],props=new Map([['COMMENTS_SHEET_ID','private-sheet'],['COMMENTS_EMAIL','owner@example.com'],['COMMENTS_SECRET','private-test-secret']]),cache=new Map(),mails=[];
 const range=(row,col,height=1,width=1)=>({
  getDisplayValues(){return Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>String(cells[row+r-1]?.[col+c-1]??'').replace(/^'/,'')));},
  getDisplayValue(){return this.getDisplayValues()[0][0];},
  setValues(values){values.forEach((record,r)=>record.forEach((value,c)=>{cells[row+r-1]??=[];cells[row+r-1][col+c-1]=value;}));return this;},
  setValue(value){return this.setValues([[value]]);},getRow:()=>row,getNumRows:()=>height
 });
 const sheet={getName:()=> 'Comments',getRange:range,getLastRow:()=>cells.length,getMaxRows:()=>1000,getActiveRange:()=>range(activeRow,1),deleteRow:row=>cells.splice(row-1,1),insertRowsAfter(){}};
 const ui={Button:{OK:'ok',YES:'yes'},ButtonSet:{OK_CANCEL:1,YES_NO:2},prompt:()=>({getSelectedButton:()=> 'ok',getResponseText:()=>'<b>Thanks!</b>'}),alert:()=> 'yes'};
 const ss={getSheetByName:()=>sheet,getActiveSheet:()=>sheet,getUrl:()=> 'https://docs.google.com/spreadsheets/d/private-sheet/edit'};
 const context=createContext({console,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},
  SpreadsheetApp:{openById:()=>ss,getActiveSpreadsheet:()=>ss,getUi:()=>ui,flush(){}},
  CacheService:{getScriptCache:()=>({get:k=>{const v=cache.get(k);return v&&v.expires>now?v.value:null;},put:(k,v,ttl)=>cache.set(k,{value:v,expires:now+ttl*1000})})},
  LockService:{getScriptLock:()=>({tryLock(){if(locked)return false;locked=true;return true;},releaseLock(){locked=false;}})},
  MailApp:{getRemainingDailyQuota:()=>quota,sendEmail(...args){if(failMail)throw Error('Mail unavailable');mails.push(args);quota--;}},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:content=>({content,setMimeType(){return this;}})},
  HtmlService:{XFrameOptionsMode:{ALLOWALL:1},createHtmlOutput:content=>({content,setXFrameOptionsMode(){return this;}})},
  Utilities:{getUuid:randomUUID,DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,v)=>[...createHash('sha256').update(v).digest()],computeHmacSha256Signature:(v,k)=>[...createHmac('sha256',k).update(v).digest()],base64EncodeWebSafe:v=>Buffer.from(typeof v==='string'?v:Uint8Array.from(v)).toString('base64url'),base64DecodeWebSafe:v=>[...Buffer.from(v,'base64url')],newBlob:v=>({getDataAsString:()=>Buffer.from(v).toString()})}
 });runInContext(source,context);
 const parse=output=>{const script=/<script>([\s\S]*?)<\/script>/.exec(output.content)?.[1];let result=null;if(script)runInNewContext(script,{window:{top:{postMessage:r=>{result=r;}}}});return result;};
 const defaults={origin:'https://runograph.com',nonce:'a'.repeat(48),client:'b'.repeat(32),story:'rome'};
 const list=(extra={})=>parse(context.doGet({parameter:{...defaults,action:'list',...extra}}));
 const post=(challenge,extra={})=>{const c=JSON.parse(Buffer.from(challenge.token.split('.')[0],'base64url').toString());return parse(context.doPost({parameter:{...defaults,action:'add',token:challenge.token,answer:String(c.a+c.b),name:'Reader',body:'A lovely morning run.',...extra},contentLength:1000}));};
 return {context,cells,props,cache,mails,list,post,range,advance:ms=>{now+=ms;},row:n=>{activeRow=n;},mailFailure:v=>{failMail=v;},quota:v=>{quota=v;}};
}
let s=service();let first=s.list();assert(first.ok);assert.equal(first.data.items.length,0);assert(first.data.challenge.token);
s.advance(1500);const saved=s.post(first.data.challenge,{name:'=IMPORTXML("bad")',body:'<script>alert(1)</script> A real comment.'});assert(saved.ok);assert.equal(s.cells.length,2);assert(s.cells[1][3].startsWith("'="));assert.equal(s.mails.length,1);
assert(s.post(first.data.challenge,{name:'=IMPORTXML("bad")',body:'<script>alert(1)</script> A real comment.'}).ok);assert.equal(s.cells.length,2,'Retry must not duplicate a saved comment.');
assert(!s.post(first.data.challenge,{body:'Changed replay'}).ok);
let visible=s.list();assert.equal(visible.data.items[0].body,'<script>alert(1)</script> A real comment.');assert(!JSON.stringify(visible).includes('owner@example.com'));assert(!JSON.stringify(visible).includes('private-test-secret'));assert(!Object.hasOwn(visible.data.items[0],'clientHash'));
s.advance(1500);assert.equal(s.post(visible.data.challenge).code,'busy');
s.context.replyToSelected();visible=s.list();assert.equal(visible.data.items[0].reply,'<b>Thanks!</b>');
s.context.hideSelected();assert.equal(s.list().data.items.length,0);s.context.showSelected();assert.equal(s.list().data.items.length,1);
assert.equal(s.list({action:'delete'}).ok,false);assert.equal(s.cells.length,2);s.context.deleteSelected();assert.equal(s.cells.length,1);
s=service();first=s.list();s.advance(1500);
for(const extra of [{answer:'999'},{story:'other'},{website:'bot'},{token:first.data.challenge.token+'x'},{body:'x'.repeat(3001)},{body:'https://a.com https://b.com https://c.com'}])assert.equal(s.post(first.data.challenge,extra).ok,false);
assert.equal(s.post(first.data.challenge,{origin:'https://evil.example'}),null);assert.equal(s.cells.length,1);
s.advance(1800001);assert.equal(s.post(first.data.challenge).ok,false);
s=service();s.mailFailure(true);first=s.list();s.advance(1500);assert(s.post(first.data.challenge).ok);assert.equal(s.range(2,9).getDisplayValue(),'pending');s.mailFailure(false);s.context.notifyPendingComments();assert.equal(s.range(2,9).getDisplayValue(),'sent');assert.equal(s.mails.length,1);
s=service();first=s.list();s.advance(1500);s.quota(0);assert(s.post(first.data.challenge).ok);assert.equal(s.mails.length,0);assert.equal(s.range(2,9).getDisplayValue(),'pending');s.quota(100);s.context.notifyPendingComments();assert.equal(s.mails.length,1);
s=service();s.list();for(let i=0;i<34;i++)s.cells.push(['id-'+i,'2026-11-08T12:00:00Z','rome','Reader','Comment '+i,i===0?'hidden':'visible','','','sent','request-'+i,'private-hash']);
first=s.list();assert.equal(first.data.items.length,30);assert.equal(first.data.nextOffset,30);assert.equal(s.list({offset:'30'}).data.items.length,3);assert.equal(s.list({story:'barcelona'}).data.items.length,0);assert(!JSON.stringify(first.data.items).includes('Comment 0"'));
s=service();first=s.list();s.advance(1500);s.props.set('COMMENTS_DAILY','2026-11-08:200');assert.equal(s.post(first.data.challenge).code,'busy');

const data=readContent();assert.equal(commentsSection({data:{...data,engagement:{...data.engagement,comments:{enabled:false,appsScriptUrl:''}}},slug:'rome',url:p=>p}), '');
const fixture=structuredClone(data);fixture.engagement.comments={enabled:true,appsScriptUrl:'https://script.google.com/macros/s/'+'x'.repeat(30)+'/exec'};validateRecord('engagement',fixture.engagement);
assert(commentsSection({data:fixture,slug:'rome',url:p=>'/base'+p}).includes('href="/base/privacy/"'));
fixture.engagement.comments.appsScriptUrl='https://evil.example';assert.throws(()=>validateRecord('engagement',fixture.engagement));
if(existsSync(resolve(root,'dist/journal/rome/index.html'))&&!data.engagement.comments.enabled)assert(!readFileSync(resolve(root,'dist/journal/rome/index.html'),'utf8').includes('data-story-comments'));
console.log('Passed comments: immediate publishing, private fields, formula escaping, safe response encoding, signed challenges, spam limits, duplicate retries, replies, hiding/deletion, paging, notification failures and inactive defaults.');
await import('./check-comments-ui.mjs');
