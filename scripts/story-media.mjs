import {markdown} from './core.mjs';
export function sharedStoryMedia(post,fields,base=''){
 const blocks=(post.en?.body??'').split(/\n\s*\n/),items=[];
 for(let i=0;i<blocks.length;i++){
  const source=/!\[[^\]]*\]\(([^\s)]+)/.exec(blocks[i])?.[1];
  if(!source||fields.body?.includes(source))continue;
  items.push(blocks[i]+(/^(Photo|Foto):\s/i.test(blocks[i+1]??'')?'\n\n'+blocks[i+1]:''));
 }
 return items.length?`<section class="shared-story-media" aria-label="Photographs and route">${markdown(items.join('\n\n'),base)}</section>`:'';
}
