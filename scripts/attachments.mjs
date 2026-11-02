import {esc,safeUrl} from './core.mjs';
export function renderAttachments(post,lang,url){
 const files=post.attachments??[];if(!files.length)return '';
 const names=file=>{const name=file.split('/').pop().split('?')[0];try{return decodeURIComponent(name);}catch{return name;}};
 return `<section class="story-downloads"><h2>${lang==='et'?'Selle loo failid':'Files for this story'}</h2><ul>${files.map(file=>`<li><a href="${esc(file.startsWith('/')?url(file):safeUrl(file))}"${file.startsWith('/')?' download':''} rel="noopener noreferrer">${esc(names(file))}</a></li>`).join('')}</ul></section>`;
}
