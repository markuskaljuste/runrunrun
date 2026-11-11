(() => {
 'use strict';
 const et=document.documentElement.lang==='et';
 const origin=window.location.origin;
 const endpointPattern=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,200}\/exec$/;
 const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),byte=>byte.toString(16).padStart(2,'0')).join('');
 const isGoogleResponse=origin=>/^https:\/\/(?:[a-z0-9-]+[.-])?script\.googleusercontent\.com$/.test(origin);
 const unconfirmed=et?'Saatmist ei saanud kinnitada. Sinu sõnum on alles. Proovi uuesti.':'We couldn’t confirm delivery. Your message is still here. Please try again.';

 function request(endpoint, method, values){
  return new Promise((resolve,reject)=>{
   const nonce=randomId();
   const params={...values,origin,nonce};
   const frame=document.createElement('iframe');
   frame.name='runograph-contact-'+nonce;
   frame.title='Contact form response';
   frame.hidden=true;
   frame.referrerPolicy='no-referrer';
   frame.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin');
   const transport=method==='POST'?document.createElement('form'):null;
   if(transport){
    transport.hidden=true;
    transport.action=endpoint;
    transport.method='post';
    transport.target=frame.name;
    transport.setAttribute('data-clarity-mask','true');
    for(const [name,value] of Object.entries(params)){
     const input=document.createElement('input');
     input.type='hidden';
     input.name=name;
     input.value=value;
     transport.append(input);
    }
   }else{
    frame.src=endpoint+'?'+new URLSearchParams(params);
   }

   function finish(error,result){
    clearTimeout(timer);
    window.removeEventListener('message',receive);
    transport?.remove();
    frame.remove();
    if(error)reject(error);
    else resolve(result);
   }
   function receive(event){
    const result=event.data;
    if(!isGoogleResponse(event.origin)||result?.type!=='runograph-contact-result'||result.nonce!==nonce||typeof result.ok!=='boolean')return;
    finish(null,result);
   }
   const timer=setTimeout(()=>finish(new Error('Contact response timed out')),method==='POST'?25000:12000);
   window.addEventListener('message',receive);
   try{
    document.body.append(frame);
    if(transport){
     document.body.append(transport);
     transport.submit();
    }
   }catch(error){
    finish(error);
   }
  });
 }

 for(const form of document.querySelectorAll('[data-contact-endpoint]')){
  const status=form.querySelector('.contact-status');
  const endpoint=form.dataset.contactEndpoint;
  if(!endpointPattern.test(endpoint))continue;
  if(!['https://runograph.com','https://www.runograph.com'].includes(origin)){
   status.textContent=et?'Sõnumi saad saata aadressil runograph.com.':'Send your message at runograph.com.';
   continue;
  }

  const fieldset=form.querySelector('fieldset');
  const send=form.querySelector('[type="submit"]');
  const group=form.querySelector('[data-contact-challenge]');
  const question=form.querySelector('[data-contact-question]');
  const answer=form.querySelector('[name="answer"]');
  const retry=form.querySelector('[data-contact-retry]');
  const startedAt=String(Math.round(performance.timeOrigin));
  let challenge;
  let attempt;
  let pending=false;

  async function loadChallenge(requestId=randomId(), notice=''){
   challenge=undefined;
   send.disabled=true;
   answer.disabled=true;
   answer.value='';
   group.hidden=true;
   retry.hidden=true;
   status.textContent=notice||(et?'Laadin kontrollküsimust…':'Loading the quick check…');
   try{
    const result=await request(endpoint,'GET',{action:'challenge',requestId});
    const check=result.challenge;
    if(!result.ok||result.code!=='challenge'||typeof check?.token!=='string'||typeof check?.question!=='string'){
     throw new Error('Quick check unavailable');
    }
    challenge={requestId,token:check.token};
    question.textContent=check.question;
    answer.disabled=false;
    group.hidden=false;
    send.disabled=false;
    status.textContent=notice;
   }catch{
    const unavailable=et?'Kontrollküsimust ei saanud laadida. Proovi uuesti.':'Couldn’t load the quick check. Try again.';
    status.textContent=notice?notice+' '+unavailable:unavailable;
    retry.hidden=false;
    retry.onclick=()=>loadChallenge(requestId,notice);
   }
  }

  form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(pending||!challenge||!form.reportValidity())return;
   const fields=new FormData(form);
   const values=Object.fromEntries(['name','email','message','_gotcha','answer'].map(name=>[name,fields.get(name).trim()]));
   const {answer: response, ...message}=values;
   const content=JSON.stringify(message);
   const {requestId,token}=challenge;
   if(attempt?.requestId===requestId&&attempt.content!==content){
    await loadChallenge(undefined,et?'Palun vasta uuele kontrollküsimusele.':'Please answer the new quick check.');
    answer.focus();
    return;
   }
   attempt={requestId,content};
   pending=true;
   fieldset.disabled=true;
   status.textContent=et?'Saadan sõnumit…':'Sending your message…';
   let result;
   try{
    result=await request(endpoint,'POST',{...message,startedAt,requestId,challengeToken:token,answer:response});
   }catch{
    status.textContent=unconfirmed;
   }finally{
    pending=false;
    fieldset.disabled=false;
   }
   if(!result)return;
   if(result.ok&&result.code==='saved'){
    form.reset();
    attempt=undefined;
    await loadChallenge(undefined,et?'Sõnum on saadetud. Aitäh!':'Your message has been sent. Thank you!');
   }else if(result.code==='wrong-answer'){
    status.textContent=et?'Kontrollküsimuse vastus oli vale. Proovi uuesti.':'That answer was incorrect. Try again.';
    answer.value='';
    answer.focus();
   }else if(result.code==='challenge-expired'){
    await loadChallenge(requestId,et?'Kontrollküsimus aegus. Vasta uuele küsimusele ja saada sõnum uuesti.':'The quick check expired. Answer the new question and send again.');
    answer.focus();
   }else{
    status.textContent=unconfirmed;
   }
  });

  fieldset.disabled=false;
  loadChallenge();
 }
})();
