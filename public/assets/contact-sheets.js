(() => {
 'use strict';
 const et=document.documentElement.lang==='et';
 const origin=window.location.origin;
 const endpointPattern=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,200}\/exec$/;
 const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),byte=>byte.toString(16).padStart(2,'0')).join('');
 const isGoogleResponse=origin=>/^https:\/\/(?:[a-z0-9-]+[.-])?script\.googleusercontent\.com$/.test(origin);

 for(const form of document.querySelectorAll('[data-contact-endpoint]')){
  const status=form.querySelector('.contact-status');
  const endpoint=form.dataset.contactEndpoint;
  if(!endpointPattern.test(endpoint))continue;
  if(!['https://runograph.com','https://www.runograph.com'].includes(origin)){
   status.textContent=et?'Sõnumi saad saata aadressil runograph.com.':'Send your message at runograph.com.';
   continue;
  }

  const fieldset=form.querySelector('fieldset');
  const startedAt=String(Math.round(performance.timeOrigin));
  let pending=false;
  let previousAttempt;
  form.addEventListener('submit',event=>{
   event.preventDefault();
   if(pending||!form.reportValidity())return;
   const fields=new FormData(form);
   const values=Object.fromEntries(['name','email','message','_gotcha'].map(name=>[name,fields.get(name).trim()]));
   const content=JSON.stringify(values);
   if(previousAttempt?.content!==content)previousAttempt={content,id:randomId()};
   const nonce=randomId();
   const frame=document.createElement('iframe');
   frame.name='runograph-contact-'+nonce;
   frame.title='Contact form response';
   frame.hidden=true;
   frame.referrerPolicy='no-referrer';
   frame.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin');
   const transport=document.createElement('form');
   transport.hidden=true;
   transport.action=endpoint;
   transport.method='post';
   transport.target=frame.name;
   transport.setAttribute('data-clarity-mask','true');
   for(const [name,value] of Object.entries({...values,origin,nonce,startedAt,requestId:previousAttempt.id})){
    const input=document.createElement('input');
    input.type='hidden';
    input.name=name;
    input.value=value;
    transport.append(input);
   }

   pending=true;
   fieldset.disabled=true;
   status.textContent=et?'Saadan sõnumit…':'Sending your message…';
   function finish(ok){
    if(!pending)return;
    pending=false;
    clearTimeout(timer);
    window.removeEventListener('message',receive);
    transport.remove();
    frame.remove();
    fieldset.disabled=false;
    if(ok){
     form.reset();
     previousAttempt=undefined;
     status.textContent=et?'Sõnum on saadetud. Aitäh!':'Your message has been sent. Thank you!';
    }else{
     status.textContent=et?'Saatmist ei saanud kinnitada. Sinu sõnum on alles. Proovi uuesti.':'We couldn’t confirm delivery. Your message is still here. Please try again.';
    }
   }
   function receive(event){
    const result=event.data;
    if(!isGoogleResponse(event.origin)||result?.type!=='runograph-contact-result'||result.nonce!==nonce||typeof result.ok!=='boolean')return;
    finish(result.ok&&result.code==='saved');
   }
   const timer=setTimeout(()=>finish(false),25000);
   window.addEventListener('message',receive);
   try{
    document.body.append(frame,transport);
    transport.submit();
   }catch{
    finish(false);
   }
  });
  fieldset.disabled=false;
 }
})();
