import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const code=readFileSync(new URL('../public/assets/engagement.js',import.meta.url),'utf8');
function element(extra={}){return {hidden:false,disabled:false,textContent:'',dataset:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},...extra};}
function fixture({clipboard='ok',share='ok',response='ok'}={}){
 const status=element(),fallbackInput=element({focus(){this.focused=true;},select(){this.selected=true;}}),fallback=element({hidden:true,querySelector:()=>fallbackInput}),shareRoot={querySelector:s=>s==='.share-status'?status:fallback};
 const copy=element({dataset:{copyLink:'https://runograph.com/et/places/tallinn/'},closest:()=>shareRoot}),native=element({hidden:true,dataset:{nativeShare:'https://runograph.com/et/places/tallinn/',shareTitle:'Tallinn'},closest:()=>shareRoot});
 const mount={children:[],append(frame){this.children.push(frame);},get firstChild(){return this.children[0];}},commentStatus=element(),commentRoot={querySelector:s=>s==='.comments-mount'?mount:commentStatus};
 const comments=element({dataset:{commentKey:'00000000-0000-4000-8000-000000000001',commentUrl:'https://runograph.com/et/places/tallinn/',commentTitle:'Tallinn'},closest:()=>commentRoot});
 const formStatus=element(),submit=element(),form=element({action:'https://formspree.io/f/abcdefgh',valid:true,resets:0,reportValidity(){return this.valid;},reset(){this.resets++;},querySelector:s=>s==='.contact-status'?formStatus:submit});
 let fetches=0,copies=0,shares=0;
 const navigator={clipboard:{async writeText(value){copies++;assert.equal(value,copy.dataset.copyLink);if(clipboard==='fail')throw Error('Denied');}}};
 if(share!=='missing')navigator.share=async()=>{shares++;if(share==='abort')throw Object.assign(Error('Canceled'),{name:'AbortError'});if(share==='fail')throw Error('Denied');};
 const document={documentElement:{lang:'et'},querySelectorAll:s=>s==='[data-copy-link]'?[copy]:s==='[data-native-share]'?[native]:s==='[data-load-comments]'?[comments]:s==='[data-contact-form]'?[form]:[],createElement:()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}})};
 runInNewContext(code,{document,navigator,URL,FormData:class{},fetch:async(url,options)=>{fetches++;assert.equal(url,form.action);assert.equal(options.method,'POST');assert.equal(options.headers.Accept,'application/json');if(response==='network')throw Error('Offline');return {ok:response==='ok'};}});
 return {copy,native,comments,form,status,fallback,fallbackInput,mount,formStatus,submit,get fetches(){return fetches;},get copies(){return copies;},get shares(){return shares;}};
}
let f=fixture();assert.equal(f.fetches,0);assert.equal(f.mount.children.length,0);await f.copy.listeners.click();assert.equal(f.copies,1);assert.equal(f.status.textContent,'Link on kopeeritud.');await f.native.listeners.click();assert.equal(f.shares,1);
f.comments.listeners.click();assert.equal(f.mount.children.length,1);const frame=f.mount.children[0],url=new URL(frame.src);assert.equal(url.origin,'https://my.remarkbox.com');assert.equal(url.searchParams.get('thread_uri'),'https://runograph.com/et/places/tallinn/');assert.equal(frame.referrerPolicy,'no-referrer');f.comments.listeners.click();assert.equal(f.mount.children.length,1);
await f.form.listeners.submit({preventDefault(){}});assert.equal(f.fetches,1);assert.equal(f.form.resets,1);assert.equal(f.submit.disabled,false);assert(f.formStatus.textContent.includes('saadetud'));
f=fixture({clipboard:'fail',share:'missing'});await f.copy.listeners.click();assert.equal(f.fallback.hidden,false);assert.equal(f.fallbackInput.selected,true);assert(!f.status.textContent.includes('kopeeritud'));assert.equal(f.native.hidden,true);
for(const response of ['failure','network']){f=fixture({response});await f.form.listeners.submit({preventDefault(){}});assert.equal(f.form.resets,0);assert.equal(f.submit.disabled,false);assert(f.formStatus.textContent.includes('ei õnnestunud'));}
f=fixture();f.form.valid=false;await f.form.listeners.submit({preventDefault(){}});assert.equal(f.fetches,0);
f=fixture({share:'abort'});await f.native.listeners.click();assert.equal(f.status.textContent,'');
console.log('Passed reader UI checks: clipboard fallback, native sharing, comments loaded only on request, fixed provider URL, real success/failure states and preserved failed messages.');
