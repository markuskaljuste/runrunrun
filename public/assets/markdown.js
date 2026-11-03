import {isRouteFile} from './attachment-policy.js';
export const escapeText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const contentUrl=value=>/^(https?:\/\/|\/(?!\/))[^\s<>"']+$/i.test(value??'')?value:'#';
const assetUrl=(value,base)=>value.startsWith('/')?base+value:value;
const isDownload=url=>/^\/assets\/(?:uploads|files)\/.+\.(?:pdf|txt|csv|zip)$/i.test(url);
export function inline(value='',base='',depth=0){
 const text=String(value);if(depth>8)return escapeText(text);
 const pattern=/\*\*([^\n]+?)\*\*|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]+)(?:\s+"([^"]*)")?\)|\*([^*\n]+)\*/g;
 let result='',cursor=0;
 for(const match of text.matchAll(pattern)){
  result+=escapeText(text.slice(cursor,match.index));
  if(match[1]!=null)result+=`<strong>${inline(match[1],base,depth+1)}</strong>`;
  else if(match[2]!=null){const href=contentUrl(match[3]);result+=isRouteFile(href)?inline(match[2],base,depth+1):href==='#'?escapeText(match[0]):`<a href="${escapeText(assetUrl(href,base))}" rel="noopener noreferrer"${isDownload(href)?' download':''}${match[4]?` title="${escapeText(match[4])}"`:''}>${inline(match[2],base,depth+1)}</a>`;}
  else result+=`<em>${inline(match[5],base,depth+1)}</em>`;
  cursor=match.index+match[0].length;
 }
 return result+escapeText(text.slice(cursor));
}
function picture(block,base,credit=''){
 let source=block,target='';
 const linked=/^\[(!\[[^\]]*\]\([^\n]+\))\]\((https?:\/\/[^\s)]+|\/(?!\/)[^\s)]+)\)$/.exec(block);
 if(linked){source=linked[1];target=contentUrl(linked[2]);}
 const image=/^!\[([^\]]*)\]\((https?:\/\/[^\s)"']+|\/(?!\/)[^\s)"']+)(?:\s+"([^"]*)")?\)$/.exec(source);
 if(!image||contentUrl(image[2])==='#'||target==='#')return null;
 const img=`<img src="${escapeText(assetUrl(image[2],base))}" alt="${escapeText(image[1])}" loading="lazy">`;
 const caption=[image[3],credit].filter(Boolean).map(text=>inline(text,base)).join(' · ');
 return `<figure class="story-media">${target?`<a href="${escapeText(assetUrl(target,base))}" rel="noopener noreferrer">${img}</a>`:img}${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;
}
export function markdown(body='',base=''){
 const blocks=String(body).split(/\n\s*\n/).map(block=>block.trim()).filter(Boolean),isCredit=text=>/^(?:Photo|Foto):\s/i.test(text??'');
 return blocks.map((text,index)=>{
  if(isCredit(text)&&index>0&&picture(blocks[index-1],base))return '';
  const image=picture(text,base,isCredit(blocks[index+1])?blocks[index+1]:'');if(image)return image;
  const heading=/^(#{1,3})\s+([^\n]+)$/.exec(text);if(heading){const level=heading[1].length===3?3:2;return `<h${level}>${inline(heading[2],base)}</h${level}>`;}
  if(/^> /.test(text))return `<blockquote>${inline(text.replace(/^> /gm,''),base).replaceAll('\n','<br>')}</blockquote>`;
  if(/^\d+\. /.test(text))return `<ol>${text.split('\n').map(line=>`<li>${inline(line.replace(/^\d+\. /,''),base)}</li>`).join('')}</ol>`;
  if(/^[-*] /.test(text))return `<ul>${text.split('\n').map(line=>`<li>${inline(line.replace(/^[-*] /,''),base)}</li>`).join('')}</ul>`;
  return `<p>${inline(text,base).replaceAll('\n','<br>')}</p>`;
 }).filter(Boolean).join('\n');
}
