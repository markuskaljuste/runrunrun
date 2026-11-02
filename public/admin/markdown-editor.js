const clean=value=>String(value).replace(/[\[\]\n]/g,' ').trim();
export function insertMarkup(value,start,end,kind,{url='',label=''}={}){
 const selected=value.slice(start,end);let text,selectionStart,selectionEnd;
 if(kind==='bold'){
  const body=selected||label||'bold text';text='**'+body+'**';selectionStart=start+2;selectionEnd=selectionStart+body.length;
 }else{
  const body=clean(selected||label||(kind==='image'?'Image':'Link'));
  text=(kind==='image'?'!':'')+'['+body+']('+url+')';
  if(kind==='image')text='\n\n'+text+'\n\n';
  selectionStart=start+text.length;selectionEnd=selectionStart;
 }
 return {value:value.slice(0,start)+text+value.slice(end),selectionStart,selectionEnd};
}
export function attachMarkdownToolbar({textarea,uploadImage,uploadFile,changed,notify,lang='en'}){
 const et=lang==='et',bar=document.createElement('div');bar.className='markdown-toolbar';bar.setAttribute('role','toolbar');bar.setAttribute('aria-label',et?'Teksti vormindamine':'Text formatting');
 bar.innerHTML=`<button type="button" data-format="bold" title="${et?'Rasvane tekst':'Bold text'}"><strong>B</strong></button><button type="button" data-format="link">${et?'Lisa link':'Add link'}</button><button type="button" data-format="image">${et?'Lisa pilt':'Add image'}</button><button type="button" data-format="file">${et?'Lisa fail':'Add file'}</button><input type="file" data-insert-image accept="image/jpeg,image/png,image/webp" hidden><input type="file" data-insert-file accept=".gpx,.pdf,.txt,.csv,.zip" hidden>`;
 const label=textarea.parentElement;
 if(label?.tagName==='LABEL'){
  textarea.id||='markdown-'+lang+'-'+textarea.dataset.key;
  const wrapper=document.createElement('div');wrapper.className=(label.className+' markdown-field').trim();
  const caption=document.createElement('label');caption.htmlFor=textarea.id;caption.textContent=[...label.childNodes].filter(node=>node.nodeType===3).map(node=>node.textContent).join('');
  label.replaceWith(wrapper);wrapper.append(caption,bar,textarea);
 }else textarea.before(bar);
 let range=null;
 const selection=()=>({start:textarea.selectionStart,end:textarea.selectionEnd});
 function apply(kind,options={},at=selection()){
  const next=insertMarkup(textarea.value,at.start,at.end,kind,options);textarea.value=next.value;textarea.focus();textarea.setSelectionRange(next.selectionStart,next.selectionEnd);changed(next.value);
 }
 const valid=url=>/^(https?:\/\/|\/(?!\/))[^\s<>"']+$/.test(url);
 function link(){const at=selection(),url=prompt(et?'Lingi aadress (https://…)':'Link address (https://…)','https://');if(!url)return;if(!valid(url)){notify(et?'Lisa täielik veebiaadress.':'Add a complete website address.',true);return;}apply('link',{url,label:et?'lingi tekst':'link text'},at);}
 for(const button of bar.querySelectorAll('[data-format]'))button.onclick=()=>{
  const action=button.dataset.format;if(action==='bold')apply('bold',{label:et?'rasvane tekst':'bold text'});else if(action==='link')link();else{range=selection();bar.querySelector(action==='image'?'[data-insert-image]':'[data-insert-file]').click();}
 };
 for(const [selector,upload,kind] of [['[data-insert-image]',uploadImage,'image'],['[data-insert-file]',uploadFile,'link']]){
  const input=bar.querySelector(selector);input.onchange=async()=>{const file=input.files[0];if(!file)return;try{const at=range??selection(),url=await upload(file);const label=kind==='image'?(prompt(et?'Pildi lühikirjeldus':'Short image description',file.name.replace(/\.[^.]+$/,''))||''):file.name;apply(kind,{url,label},at);notify(et?'Lisatud. Salvesta postitus.':'Added. Save the story to keep your changes.');}catch(error){notify(error.message,true);}finally{input.value='';}};
 }
 textarea.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&['b','k'].includes(event.key.toLowerCase())){event.preventDefault();if(event.key.toLowerCase()==='b')apply('bold');else link();}});
}
