import {renderBranding} from './branding.js';
import {renderImages,renderSeo} from './settings.js';
const settingTypes=['site','branding','images','seo'];
const $=s=>document.querySelector(s);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let token,content,type='posts',record=null,originalSlug=null,lang='en',dirty=false,uploading=false;
const copy=value=>JSON.parse(JSON.stringify(value));
function message(text,error=false){$('#message').textContent=text;$('#message').classList.toggle('error',error);}
function change(){dirty=true;$('#save').disabled=false;message('Unsaved changes / Salvestamata muudatused');}
async function api(path,payload){const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Editor-Token':token},body:JSON.stringify(payload)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save.');return result;}
function confirmSwitch(){if(uploading){message('Wait for the logo upload to finish.');return false;}return !dirty||confirm('Discard unsaved changes? / Loobun salvestamata muudatustest?');}
async function uploadImage(file){
 if(file.size>8_000_000)throw new Error('Maximum image size is 8 MB.');
 uploading=true;$('#save').disabled=true;
 try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});return (await api('/api/media',{data})).path;}
 finally{uploading=false;$('#save').disabled=!dirty;}
}
function field(key,label,value,{textarea=false,readOnly=false,wide=false}={}){return `<label class="${wide?'wide ':''}${key==='body'||key==='aboutBody'?'body-field':''}">${label}${textarea?`<textarea data-key="${key}" ${readOnly?'readonly':''}>${escape(value)}</textarea>`:`<input data-key="${key}" value="${escape(value)}" ${readOnly?'readonly':''}>`}</label>`;}
function renderList(){
 $('#new-entry').hidden=settingTypes.includes(type);
 const entries=settingTypes.includes(type)?[]:content[type];
 $('#entry-list').innerHTML=entries.map(p=>`<button data-slug="${escape(p.slug)}" class="${originalSlug===p.slug?'selected':''}">${escape(p.en.title||p.slug)}<small>${p.status.toUpperCase()}</small></button>`).join('');
 document.querySelectorAll('[data-slug]').forEach(button=>button.onclick=()=>{if(confirmSwitch())selectRecord(content[type].find(p=>p.slug===button.dataset.slug));});
}
function selectRecord(item,isNew=false){record=copy(item);originalSlug=isNew?null:item.slug;dirty=false;lang='en';renderList();render();message('');$('#save').disabled=true;}
function render(){
 $('#entry-form').hidden=!record;if(!record)return;
 $('#record-label').textContent=type==='images'?'PILDID / IMAGES':type==='seo'?'SEO':type==='branding'?'LOGO & SPONSORS':type==='site'?'SITE & MY STORY':type==='routes'?'ROUTE GUIDE':'JOURNAL';
 $('#editor-title').textContent=type==='images'?'Sinu pildid / Your images':type==='seo'?'SEO seaded / SEO settings':type==='branding'?'Make it yours':type==='site'?'Your site, your story':(record.en.title||'New entry');
 const branding=['branding','images','seo'].includes(type);
 $('#metadata').classList.toggle('branding-metadata',branding);
 for(const selector of ['.language-tabs','#language-fields','.markdown-help','.preview-details'])$(selector).hidden=branding;
 if(branding){const options={root:$('#metadata'),record,changed:change,upload:uploadImage,notify:message,site:content.site};if(type==='branding')renderBranding(options);else if(type==='images')renderImages(options);else renderSeo(options);return;}
 if(type==='site')$('#metadata').innerHTML=field('brand','Site name / Lehe nimi',record.brand,{wide:true});
 else{
  const categories=type==='routes'?['estonia','portugal','other']:['story','running','travel'];
  $('#metadata').innerHTML=field('slug','URL slug / Aadress',record.slug,{readOnly:!!originalSlug})+`<label>Status / Olek<select data-key="status"><option value="draft" ${record.status==='draft'?'selected':''}>Draft / Mustand</option><option value="published" ${record.status==='published'?'selected':''}>Published / Avaldatud</option></select></label><label>Publication date / Kuupäev<input type="date" data-key="date" value="${escape(record.date)}"></label><label>Topic / Teema<select data-key="category">${categories.map(c=>`<option ${record.category===c?'selected':''}>${c}</option>`).join('')}</select></label>`+field('image','Image path / Pildi aadress',record.image,{wide:true})+`<label class="wide">Upload a photograph / Laadi foto<div class="image-tools"><input type="file" id="upload" accept="image/jpeg,image/png,image/webp"><img id="image-preview" src="${escape(record.image||'../assets/forest.jpg')}" alt="Current image preview"></div><small>JPG, PNG or WebP · up to 8 MB. Use your own or licensed photos.</small></label>`;
  if(type==='routes')$('#metadata').innerHTML+=field('sourceUrl','Official source URL / Ametlik allikas',record.sourceUrl,{wide:true})+field('sourceLabel','Source name / Allika nimi',record.sourceLabel,{wide:true})+`<label>Source checked / Kontrollitud<input type="date" data-key="checked" value="${escape(record.checked)}"></label>`+field('distance','Official segment length, optional / Pikkus (valikuline)',record.distance);
 }
 $('#metadata').querySelectorAll('[data-key]').forEach(input=>input.addEventListener('input',()=>{record[input.dataset.key]=input.value;change();if(input.dataset.key==='image')$('#image-preview').src=input.value;}));
 $('#upload')?.addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{record.image=await uploadImage(file);change();render();message('Photograph uploaded. Save the entry to use it.');}catch(error){message(error.message,true);}});
 renderLanguage();
}
function renderLanguage(){
 document.querySelectorAll('[data-lang]').forEach(button=>{button.setAttribute('aria-selected',String(button.dataset.lang===lang));button.tabIndex=button.dataset.lang===lang?0:-1;});
 $('#language-fields').setAttribute('aria-labelledby','tab-'+lang);
 const labels=type==='site'?{tagline:'Tagline / Alapealkiri',hero:'Homepage headline / Avalehe pealkiri',intro:'Homepage introduction / Avalehe sissejuhatus',aboutTitle:'My story headline / Minu loo pealkiri',aboutExcerpt:'My story introduction / Minu loo sissejuhatus',aboutBody:'My story / Minu lugu'}:{title:'Title / Pealkiri',...(type==='routes'?{place:'Destination / Sihtkoht'}:{}),excerpt:'Introduction / Sissejuhatus',imageAlt:'Pildi kirjeldus (alt) / Image description',imageCaption:'Pildiallkiri, soovi korral / Image caption',body:'Story / Sisu'};
 $('#language-fields').innerHTML=Object.entries(labels).map(([key,label])=>field(key,label,record[lang][key],{textarea:['excerpt','body','aboutBody','intro','hero','aboutTitle'].includes(key)})).join('');
 if(type!=='site')$('#language-fields').insertAdjacentHTML('beforeend',`<details class="entry-seo"><summary>SEO ja jagamine / SEO & sharing</summary><p class="seo-help">Tühjad väljad kasutavad postituse pealkirja, sissejuhatust ja kaanepilti. / Leave empty to use the story title, introduction and cover image.</p>${field('seoTitle','SEO pealkiri / SEO title',record[lang].seoTitle)}${field('seoDescription','Meta kirjeldus / Meta description',record[lang].seoDescription,{textarea:true})}${field('socialImage','Jagamispildi aadress / Social image URL',record[lang].socialImage)}<label class="upload-button">Upload sharing image / Laadi jagamispilt<input type="file" id="entry-social-upload" accept="image/jpeg,image/png,image/webp"></label></details>`);
 $('#entry-social-upload')?.addEventListener('change',async event=>{const file=event.target.files[0],targetLang=lang;if(!file)return;try{record[targetLang].socialImage=await uploadImage(file);change();renderLanguage();message('Jagamispilt laaditud. Salvesta muudatused.');}catch(error){message(error.message,true);}});
 $('#language-fields').querySelectorAll('[data-key]').forEach(input=>input.addEventListener('input',()=>{record[lang][input.dataset.key]=input.value;change();renderPreview();}));renderPreview();
}
function renderPreview(){const text=record?.[lang]?.[type==='site'?'aboutBody':'body']||'';$('#body-preview').innerHTML=text.split(/\n\s*\n/).map(p=>p.startsWith('## ')?`<h2>${escape(p.slice(3))}</h2>`:`<p>${escape(p).replaceAll('\n','<br>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')}</p>`).join('');}
document.querySelectorAll('[data-lang]').forEach(button=>{button.onclick=()=>{if(uploading)return;lang=button.dataset.lang;renderLanguage();};button.onkeydown=event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();lang=event.key==='Home'?'en':event.key==='End'?'et':lang==='en'?'et':'en';renderLanguage();$('#tab-'+lang).focus();}};});
document.querySelectorAll('[data-collection]').forEach(button=>button.onclick=()=>{if(!confirmSwitch())return;type=button.dataset.collection;record=null;originalSlug=null;dirty=false;document.querySelectorAll('[data-collection]').forEach(b=>b.classList.toggle('selected',b===button));if(settingTypes.includes(type))selectRecord(content[type]);else if(content[type].length)selectRecord(content[type][0]);else{renderList();render();}message('');});
$('#new-entry').onclick=()=>{if(!confirmSwitch())return;const blank={title:'',excerpt:'',body:'',...(type==='routes'?{place:''}:{})};selectRecord({slug:'',status:'draft',date:new Date().toISOString().slice(0,10),category:type==='routes'?'other':'story',image:'/assets/forest.jpg',en:copy(blank),et:copy(blank),...(type==='routes'?{sourceUrl:'',sourceLabel:'',checked:new Date().toISOString().slice(0,10),distance:''}:{})},true);};
$('#entry-form').onsubmit=event=>event.preventDefault();
$('#save').onclick=async()=>{if(!record||uploading)return;$('#save').disabled=true;message(settingTypes.includes(type)?'Saving settings / Salvestan seaded…':'Saving both languages…');try{const result=await api('/api/save',{type,item:record,originalSlug});content=result.content;originalSlug=record.slug;dirty=false;renderList();render();message(record.status==='draft'?'Draft saved. Hidden from the public site. / Mustand salvestatud.':'Saved. The local preview is up to date. / Salvestatud. Eelvaade on uuendatud.');}catch(error){message(error.message,true);}finally{$('#save').disabled=!dirty;}};
$('#discard').onclick=()=>{if(!confirmSwitch())return;if(settingTypes.includes(type))selectRecord(content[type]);else{const saved=content[type].find(p=>p.slug===originalSlug);if(saved)selectRecord(saved);else{dirty=false;$('#new-entry').click();}}};
$('#download').onclick=()=>{const blob=new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'});const link=document.createElement('a');const objectUrl=URL.createObjectURL(blob);link.href=objectUrl;link.download=settingTypes.includes(type)?type+'.json':(record.slug||'new-entry')+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
(async()=>{try{if(!['localhost','127.0.0.1'].includes(location.hostname))throw new Error('Static hosting');const session=await fetch('/api/session').then(r=>{if(!r.ok)throw new Error('Static hosting');return r.json();});token=session.token;content=await fetch('/api/content').then(r=>r.json());$('#workspace').hidden=false;const section=new URLSearchParams(location.search).get('section');if(settingTypes.includes(section)){type=section;document.querySelectorAll('[data-collection]').forEach(b=>b.classList.toggle('selected',b.dataset.collection===type));selectRecord(content[type]);}else selectRecord(content.posts[0]);}catch{$('#hosted').hidden=false;}finally{$('#connecting').hidden=true;}})();
