import {esc,safeUrl} from './core.mjs';
import {readFileSync} from 'node:fs';
import {root} from './core.mjs';
import {resolve} from 'node:path';
export const isFriend=post=>post?.guestAuthor?.enabled===true;
export function friendBadge(post){return isFriend(post)?'<span class="friend-story-badge">Stories by Friends</span>':'';}
export function guestByline(post,url){
 if(!isFriend(post))return '';const a=post.guestAuthor;
 return `<div class="guest-byline"><img src="${esc(url(a.image))}" alt="${esc(a.name)}" width="52" height="52"><span>By ${esc(a.name)}</span></div>`;
}
export function guestFooter(post,url){
 if(!isFriend(post))return '';const a=post.guestAuthor;
 const links=['instagram','strava','website'].filter(k=>a[k]).map(k=>{const icon=k==='website'?'<span>Website</span>':readFileSync(resolve(root,'public/assets/icons',k+'.svg'),'utf8').replace('<svg ','<svg class="social-icon" width="22" height="22" aria-hidden="true" ');return `<a class="social-icon-link" href="${esc(safeUrl(a[k]))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(a.name)} on ${k}">${icon}</a>`;}).join('');
 return `<aside class="story-author guest-author" aria-label="Story author"><span class="story-author-portrait"><img src="${esc(url(a.image))}" alt="${esc(a.name)}" width="64" height="64" loading="lazy"></span><nav class="social-links" aria-label="${esc(a.name)} profiles">${links}</nav><span class="story-author-name">${esc(a.name)}</span></aside>`;
}
export function guestStructuredData(post,data){
 if(!isFriend(post))return '';const a=post.guestAuthor,origin=data.engagement.publicOrigin;
 const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:post.en.title,description:post.en.excerpt,image:origin+post.image,datePublished:post.publishedAt||post.date,mainEntityOfPage:origin+'/journal/'+post.slug+'/',author:{'@type':'Person',name:a.name,image:origin+a.image,...(a.website||a.instagram?{url:a.website||a.instagram}:{}),sameAs:[a.instagram,a.strava,a.website].filter(Boolean)},publisher:{'@type':'Organization',name:'Runograph',url:origin}};
 return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`;
}
