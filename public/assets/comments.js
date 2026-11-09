(() => {
 'use strict';
 const endpointPattern=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,200}\/exec$/;
 const googleOrigin=value=>{try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com')||u.hostname.endsWith('.script.googleusercontent.com'));}catch{return false;}};
 const sections=document.querySelectorAll('[data-story-comments]');if(!sections.length)return;
 const random=length=>{const a=new Uint8Array(length);crypto.getRandomValues(a);return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('');};
 let client=random(16);try{const old=JSON.parse(localStorage.getItem('runograph-comment-client')||'null');if(old&&/^[a-f0-9]{32}$/.test(old.id)&&Date.now()-old.at<30*86400000)client=old.id;else localStorage.setItem('runograph-comment-client',JSON.stringify({id:client,at:Date.now()}));}catch{}
 function request(endpoint,values){return new Promise((resolve,reject)=>{
  const nonce=random(24),frame=document.createElement('iframe'),transport=values.action==='add'?document.createElement('form'):null;
  frame.name='runograph-comments-'+nonce;frame.hidden=true;frame.title='Comments response';frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin');
  // Keep the response sandboxed; supported browsers also isolate it from Google sign-in cookies.
  frame.setAttribute('credentialless','');
  const params={...values,origin:window.location.origin,nonce,client};
  if(transport){transport.hidden=true;transport.method='POST';transport.action=endpoint;transport.target=frame.name;
   for(const [name,value]of Object.entries(params)){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value);transport.append(input);}
  }
  let done=false,timer;const finish=(error,result)=>{if(done)return;done=true;clearTimeout(timer);window.removeEventListener('message',receive);transport?.remove();frame.remove();if(error)reject(error);else resolve(result);};
  const receive=event=>{const r=event.data;if(!googleOrigin(event.origin)||!r||r.type!=='runograph-comments-result'||r.nonce!==nonce||typeof r.ok!=='boolean')return;if(!r.ok)finish(Object.assign(Error(r.code),{code:r.code}));else finish(null,r.data);};
  window.addEventListener('message',receive);timer=setTimeout(()=>finish(Object.assign(Error('timeout'),{code:'timeout'})),45000);
  try{
   if(transport){document.body.append(frame,transport);transport.submit();}
   else{frame.src=endpoint+'?'+new URLSearchParams(params);document.body.append(frame);}
  }catch(error){finish(error);}
 });}
 function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
 function dateLabel(value){const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}
 function commentNode(item){
  const node=element('article',undefined,'reader-comment'),header=element('header');header.append(element('strong',item.name),element('time',dateLabel(item.date)));node.append(header,element('p',item.body));
  if(item.reply){const reply=element('div',undefined,'author-reply');reply.append(element('strong','Markus · Author'),element('p',item.reply));node.append(reply);}return node;
 }
 for(const section of sections){
  const endpoint=section.dataset.endpoint,story=section.dataset.story;if(!endpointPattern.test(endpoint)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story))continue;
  const list=section.querySelector('.comment-list'),loadStatus=section.querySelector('.comments-load-status'),more=section.querySelector('[data-comments-more]'),refresh=section.querySelector('[data-comments-refresh]'),form=section.querySelector('.comment-form'),fieldset=form.querySelector('fieldset'),status=form.querySelector('.comment-submit-status'),button=form.querySelector('[type="submit"]'),question=section.querySelector('[data-comment-question]');
  let token='',offset=null,loading=false,posting=false;
  const fields=Object.fromEntries(['name','body','answer','website'].map(name=>[name,form.querySelector('[name="'+name+'"]')]));
  async function load(append=false){
   if(loading||posting)return;loading=true;refresh.disabled=true;more.disabled=true;loadStatus.textContent='Loading comments…';
   try{const r=await request(endpoint,{action:'list',story,offset:append?offset||0:0});if(!r||!Array.isArray(r.items)||!r.challenge||typeof r.challenge.token!=='string'||typeof r.challenge.question!=='string'||r.items.some(i=>!i||['id','date','name','body','reply'].some(k=>typeof i[k]!=='string')))throw Error('Invalid response');
    if(!append)list.replaceChildren();for(const item of r.items)list.append(commentNode(item));
    offset=Number.isInteger(r.nextOffset)?r.nextOffset:null;more.hidden=offset===null;token=r.challenge.token;question.textContent=r.challenge.question;fieldset.disabled=false;loadStatus.textContent=list.children.length?'':'No comments yet. Be the first to share a thought.';
   }catch(error){loadStatus.textContent='Couldn’t load comments. Please try Refresh comments.';}finally{loading=false;refresh.disabled=false;more.disabled=false;}
  }
  refresh.addEventListener('click',()=>load());more.addEventListener('click',()=>load(true));
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(posting||loading||!token||!form.reportValidity())return;posting=true;fieldset.disabled=true;button.textContent='Posting…';status.textContent='';
   try{await request(endpoint,{action:'add',story,token,name:fields.name.value.trim(),body:fields.body.value.trim(),answer:fields.answer.value.trim(),website:fields.website.value});form.reset();status.textContent='Your comment is posted. Thanks!';posting=false;token='';await load();}
   catch(error){status.textContent=error.code==='invalid'?'Check your name, comment and quick-check answer, then try again.':error.code==='busy'?'Please wait a minute before trying again.':'Couldn’t confirm your comment. Your text is still here; try again.';}
   finally{posting=false;fieldset.disabled=!token;button.textContent='Post comment';}
  });
  load();
 }
})();
