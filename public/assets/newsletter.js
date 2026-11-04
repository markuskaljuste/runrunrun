(() => {
 const endpointPattern=/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,200}\/exec$/;
 const googleOrigin=value=>{try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com')||u.hostname.endsWith('.script.googleusercontent.com'));}catch{return false;}};
 for(const form of document.querySelectorAll('[data-signup]')){
  const endpoint=form.dataset.endpoint;if(!endpointPattern.test(endpoint))continue;
  const fieldset=form.querySelector('fieldset'),email=form.querySelector('[name="email"]'),consent=form.querySelector('[name="consent"]'),trap=form.querySelector('[name="website"]'),button=form.querySelector('button[type="submit"]'),status=form.querySelector('.signup-status');
  const buttonText=button.textContent,successMessage=form.dataset.successMessage||'You’re on the waitlist. Thanks for joining!';
 const startedAt=Date.now();let pending=false;
  form.addEventListener('submit',event=>{
   event.preventDefault();if(pending||!form.reportValidity())return;
   const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);const nonce=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   const frame=document.createElement('iframe'),transport=document.createElement('form');
   frame.name='runograph-signup-'+nonce;frame.hidden=true;frame.title='Email signup response';frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin');
   transport.hidden=true;transport.method='POST';transport.action=endpoint;transport.target=frame.name;
   const values={email:email.value.trim(),consent:consent.checked?'yes':'',version:form.dataset.consentVersion,website:trap.value,startedAt:String(startedAt),nonce,origin:window.location.origin};
   for(const [name,value] of Object.entries(values)){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;transport.append(input);}
   pending=true;fieldset.disabled=true;button.textContent='Joining…';status.textContent='';
   let timer;
   const finish=(ok,code)=>{
    if(!pending)return;pending=false;clearTimeout(timer);window.removeEventListener('message',receive);transport.remove();frame.remove();fieldset.disabled=false;button.textContent=buttonText;
    if(ok){form.reset();status.textContent=successMessage;}
    else status.textContent=code==='invalid'?'Check your email and consent, then try again.':code==='busy'?'Please wait a moment and try again.':'Couldn’t confirm your signup. Please try again.';
   };
   const receive=event=>{const result=event.data;if(!googleOrigin(event.origin)||!result||result.type!=='runograph-signup-result'||result.nonce!==nonce||typeof result.ok!=='boolean')return;finish(result.ok,result.code);};
   window.addEventListener('message',receive);timer=setTimeout(()=>finish(false,'timeout'),25000);
   try{document.body.append(frame,transport);transport.submit();}catch{finish(false,'network');}
  });
 }
})();
