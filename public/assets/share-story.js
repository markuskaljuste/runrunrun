(() => {
 const form = document.getElementById('friend-story-form');
 const endpoint = form.dataset.shareStoryEndpoint;
 const origin = 'https://runograph.com';
 const chunkSize = 2_000_000;
 const status = document.getElementById('friend-test-status');
 const button = document.getElementById('test-friend-form');
 const question = document.getElementById('friend-challenge-question');
 const answer = document.getElementById('friend-challenge-answer');
 const retry = document.getElementById('friend-challenge-retry');
 if (location.origin !== origin || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
  status.textContent = 'Open this form at runograph.com to submit a story.';
  return;
 }
 const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(24)),byte=>byte.toString(16).padStart(2,'0')).join('');
 let attempt;
 let challenge;
 let checking = false;
 let uploading = false;
 const unconfirmed = 'Delivery could not be confirmed. Your form is still filled in. Please try again.';
 function googleResponse(value) {
  try {
   const url = new URL(value);
   return url.protocol === 'https:' && !url.port && (url.hostname === 'script.googleusercontent.com' ||
    url.hostname.endsWith('-script.googleusercontent.com') || url.hostname.endsWith('.script.googleusercontent.com'));
  } catch { return false; }
 }
 function request(action,id,values={}) {
  return new Promise((resolve,reject) => {
   const nonce = randomId();
   const frame = document.createElement('iframe');
   frame.hidden = true;
   frame.name = 'runograph-friend-intake-'+nonce;
   frame.title = 'Runograph submission response';
   frame.referrerPolicy = 'no-referrer';
   frame.setAttribute('sandbox','allow-scripts allow-forms allow-same-origin');
   frame.setAttribute('credentialless','');
   const params = {action,id,nonce,origin,...values};
   const transport = action === 'challenge' ? null : document.createElement('form');
   if (transport) {
    transport.hidden = true;
    transport.method = 'post';
    transport.action = endpoint;
    transport.target = frame.name;
    transport.setAttribute('data-clarity-mask','true');
    for (const [name,value] of Object.entries(params)) {
     const input = document.createElement('input');
     input.type = 'hidden';
     input.name = name;
     input.value = value;
     transport.append(input);
    }
   } else {
    frame.src = endpoint+'?'+new URLSearchParams(params);
   }
   function finish(error,result) {
    clearTimeout(timer);
    removeEventListener('message',receive);
    transport?.remove();
    frame.remove();
    if (error) reject(error);
    else resolve(result);
   }
   function receive(event) {
    const data = event.data;
    if (!googleResponse(event.origin) || data?.type !== 'runograph-friends-result' || data.nonce !== nonce ||
     typeof data.ok !== 'boolean' || typeof data.message !== 'string') return;
    finish(data.ok ? null : new Error(data.message),data);
   }
   const timer = setTimeout(() => finish(new Error(unconfirmed)),45000);
   addEventListener('message',receive);
   try {
    document.body.append(frame);
    if (transport) {
     document.body.append(transport);
     transport.submit();
    }
   } catch {
    finish(new Error(unconfirmed));
   }
  });
 }
 async function loadChallenge() {
  if (checking || uploading) return;
  checking = true;
  attempt ??= {id:randomId(),started:false,next:0};
  challenge = undefined;
  answer.value = '';
  answer.disabled = button.disabled = retry.disabled = true;
  question.textContent = 'Loading the quick check…';
  try {
   const result = await request('challenge',attempt.id);
   const next = result.challenge;
   if (typeof next?.token !== 'string' || typeof next.question !== 'string') throw new Error();
   challenge = next;
   question.textContent = next.question;
   answer.disabled = button.disabled = false;
  } catch {
   question.textContent = 'Couldn’t load the quick check. Please try again.';
  } finally {
   checking = false;
   retry.disabled = false;
  }
 }
 retry.hidden = false;
 retry.addEventListener('click',loadChallenge);
 answer.addEventListener('focus',() => { if (!challenge) loadChallenge(); });
 async function encodedChunk(file,start) {
  const bytes = new Uint8Array(await file.slice(start,start+chunkSize).arrayBuffer());
  let binary = '';
  for (let offset=0; offset<bytes.length; offset+=16384) binary += String.fromCharCode(...bytes.subarray(offset,offset+16384));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_');
 }
 form.addEventListener('input', event => {
  if (uploading) return;
  if (attempt?.submitted && event.target !== answer) {
   attempt = undefined;
   loadChallenge();
  }
  status.textContent = '';
 });
 form.addEventListener('submit', async event => {
  event.preventDefault();
  if (uploading || !challenge || !form.reportValidity()) return;
  const source = new FormData(form);
  source.delete('quickAnswer');
  const story = Object.fromEntries([...source].filter(([,value])=>typeof value==='string'));
  const uploads = [...source.getAll('photos').map(file=>({file,kind:'photo'}))];
  if (source.get('gpx')?.size) uploads.push({file:source.get('gpx'),kind:'gpx'});
  story.files = uploads.map(({file,kind})=>({kind,size:file.size,extension:file.name.split('.').pop().toLowerCase()}));
  if (story.files.some(file=>!file.size || file.size>8_000_000)) {
   status.textContent = 'Each attachment can be up to 8 MB.';
   return;
  }
  const pass = {token:challenge.token,answer:answer.value.trim()};
  const controls = [...form.elements].filter(control=>!control.disabled);
  uploading = true;
  for (const control of controls) control.disabled = true;
  try {
   if (!attempt.started) {
    attempt.submitted = true;
    status.textContent = 'Preparing your submission…';
    await request('start',attempt.id,{...pass,story:JSON.stringify(story)});
    attempt.started = true;
   }
   const chunks = uploads.flatMap(({file},index)=>Array.from({length:Math.ceil(file.size/chunkSize)},(_,part)=>({file,index,part})));
   for (let next=attempt.next;next<chunks.length;next++) {
    const {file,index,part} = chunks[next];
    status.textContent = 'Uploading attachments ('+(next+1)+' of '+chunks.length+')…';
    await request('chunk',attempt.id,{...pass,file:index,part,bytes:await encodedChunk(file,part*chunkSize)});
    attempt.next = next+1;
   }
   status.textContent = 'Saving your story…';
   const result = await request('finish',attempt.id,pass);
   if (result.message !== 'saved') throw new Error(unconfirmed);
   form.reset();
   for (const control of form.querySelectorAll('input, textarea, select')) {
    control.dispatchEvent(new Event(control.type === 'file' || control.type === 'radio' ? 'change' : 'input'));
   }
   attempt = undefined;
   challenge = undefined;
   status.textContent = 'Thanks. Your story and attachments were sent for review.';
  } catch (error) {
   if (error.message === 'quick-check') {
    status.textContent = 'The answer was incorrect or the quick check expired. Please try again.';
    challenge = undefined;
   } else {
    status.textContent = error.message;
   }
  } finally {
   uploading = false;
   for (const control of controls) control.disabled = false;
  }
  if (!challenge) await loadChallenge();
 });
 loadChallenge();
})();
