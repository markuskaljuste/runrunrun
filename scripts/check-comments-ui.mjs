import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {webcrypto} from 'node:crypto';
const code=readFileSync(new URL('../public/assets/comments.js',import.meta.url),'utf8');
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.listeners={};this.textContent='';this.value='';this.hidden=false;this.disabled=false;}
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}remove(){this.removed=true;}setAttribute(k,v){this[k]=v;}addEventListener(k,v){this.listeners[k]=v;}
 set innerHTML(value){throw Error('Untrusted HTML rendering is forbidden.');}
}
function browser({active=true}={}){
 const elements=Object.fromEntries(['.comment-list','.comments-load-status','[data-comments-more]','[data-comments-refresh]','.comment-form','fieldset','.comment-submit-status','[type="submit"]','[data-comment-question]',...['name','body','answer','website'].map(n=>'[name="'+n+'"]')].map(s=>[s,new Element()]));
 elements['fieldset'].disabled=true;
 const form=elements['.comment-form'];form.querySelector=s=>elements[s];form.reportValidity=()=>true;form.reset=()=>{for(const n of ['name','body','answer','website'])elements['[name="'+n+'"]'].value='';};
 const section=new Element();section.dataset={endpoint:'https://script.google.com/macros/s/'+'x'.repeat(30)+'/exec',story:'rome'};section.querySelector=s=>elements[s];
 const sent=[],frames=[],listeners=new Map(),timers=new Map();let seq=0,storageWrites=0;
 const window={location:{origin:'https://runograph.com'},addEventListener:(k,fn)=>listeners.set(k,fn),removeEventListener:k=>listeners.delete(k)};
 const document={querySelectorAll:()=>active?[section]:[],body:new Element('body'),createElement:tag=>{const e=new Element(tag);if(tag==='form')e.submit=()=>sent.push({method:e.method,params:Object.fromEntries(e.children.map(i=>[i.name,i.value]))});if(tag==='iframe')frames.push(e);return e;}};
 document.body.append=(...nodes)=>{document.body.children.push(...nodes);for(const node of nodes)if(node.tag==='iframe'&&node.src)sent.push({method:'GET',params:Object.fromEntries(new URL(node.src).searchParams)});};
 runInNewContext(code,{document,window,URL,URLSearchParams,crypto:webcrypto,Uint8Array,localStorage:{getItem:()=>null,setItem:()=>storageWrites++},setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),Date});
 const values=()=>sent.at(-1).params;
 const reply=(data,{origin='https://sandbox-script.googleusercontent.com',nonce=values().nonce,ok=true,code='loaded'}={})=>listeners.get('message')?.({origin,data:{type:'runograph-comments-result',nonce,ok,code,data}});
 return {elements,sent,frames,values,reply,timers,get storageWrites(){return storageWrites;}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
let b=browser({active:false});assert.equal(b.sent.length,0);assert.equal(b.storageWrites,0);
b=browser();assert.equal(b.sent.length,1);assert.equal(b.values().action,'list');assert.equal(b.sent[0].method,'GET');
assert.equal(b.frames[0].sandbox,'allow-scripts allow-forms allow-same-origin');assert.equal(b.frames[0].credentialless,'');assert.equal(b.elements['fieldset'].disabled,true);assert.equal(b.values().origin,'https://runograph.com');
const payload={items:[{id:'one',date:'2026-11-08T12:00:00Z',name:'<img src=x onerror=alert(1)>',body:'<script>bad()</script>',reply:'Author reply',replyDate:''}],nextOffset:null,challenge:{token:'token',question:'What is 2 + 3?'}};
b.reply(payload,{origin:'https://evil.example'});await tick();assert.equal(b.elements['fieldset'].disabled,true);assert.equal(b.elements['.comment-list'].children.length,0);
b.reply(payload,{origin:'https://sandbox-script.googleusercontent.com.evil.example'});await tick();assert.equal(b.elements['fieldset'].disabled,true);
b.reply(payload,{nonce:'wrong'});await tick();assert.equal(b.elements['.comment-list'].children.length,0);
b.reply(payload);await tick();assert.equal(b.elements['fieldset'].disabled,false);assert.equal(b.elements['.comment-list'].children[0].children[1].textContent,'<script>bad()</script>');assert.equal(b.elements['.comment-list'].children[0].children[2].className,'author-reply');
for(const [n,v]of Object.entries({name:'Reader',body:'Keep this text',answer:'5'}))b.elements['[name="'+n+'"]'].value=v;
const submit=b.elements['.comment-form'].listeners.submit({preventDefault(){}});assert.equal(b.values().action,'add');assert.equal(b.sent.at(-1).method,'POST');
b.reply(null,{ok:false,code:'busy'});await submit;assert.equal(b.elements['[name="body"]'].value,'Keep this text');assert(b.elements['.comment-submit-status'].textContent.includes('wait'));
const retry=b.elements['.comment-form'].listeners.submit({preventDefault(){}});b.reply(null,{code:'saved'});await tick();assert.equal(b.values().action,'list');b.reply({...payload,items:[]});await retry;assert.equal(b.elements['[name="body"]'].value,'');assert(b.elements['.comment-submit-status'].textContent.includes('posted'));
b=browser();for(const fn of b.timers.values())fn();await tick();assert(b.elements['.comments-load-status'].textContent.includes('Couldn’t load'));assert.equal(b.elements['[data-comments-refresh]'].disabled,false);
console.log('Passed comments UI: direct sandboxed GET loading, anonymous Google frames, authenticated replies before enabling the form, safe text, replies, preserved failures, confirmed success and refresh after timeout.');
