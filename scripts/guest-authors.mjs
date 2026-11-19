import {esc,safeUrl} from './core.mjs';
import {readFileSync} from 'node:fs';
import {root} from './core.mjs';
import {resolve} from 'node:path';
export const isFriend=post=>post?.guestAuthor?.enabled===true;
export function friendBadge(post){return isFriend(post)?'<span class="friend-story-badge">Stories by Friends</span>':'';}
export function ownerAuthor(data){
 const profiles=data.engagement.socials.filter(s=>s.enabled);
 const profile=name=>profiles.find(s=>s.name.toLowerCase()===name)?.url||'';
 return {name:'Markus',image:data.images.about.src,instagram:profile('instagram'),strava:profile('strava'),profilePage:'/about/'};
}
export function guestByline(post,url,data){
 if(!isFriend(post)&&!data)return '';const a=isFriend(post)?post.guestAuthor:ownerAuthor(data);
 return `<div class="guest-byline"><img src="${esc(url(a.image))}" alt="${esc(a.name)}" width="52" height="52"><span>By ${esc(a.name)}</span></div>`;
}
export function guestFooter(post,url){
 if(!isFriend(post))return '';const a=post.guestAuthor;
 return authorFooter(a,url);
}
export function authorFooter(a,url){
 const links=['instagram','strava','website'].filter(k=>a[k]).map(k=>{const icon=k==='website'?'<span>Website</span>':readFileSync(resolve(root,'public/assets/icons',k+'.svg'),'utf8').replace('<svg ','<svg class="social-icon" width="22" height="22" aria-hidden="true" ');return `<a class="social-icon-link" href="${esc(safeUrl(a[k]))}" target="_blank" rel="noopener noreferrer" aria-label="${esc(a.name)} on ${k}">${icon}</a>`;}).join('');
 const portrait=`<img src="${esc(url(a.image))}" alt="${esc(a.name)}" width="64" height="64" loading="lazy">`;
 const photo=a.profilePage?`<a class="story-author-portrait" href="${esc(url(a.profilePage))}" aria-label="About ${esc(a.name)}">${portrait}</a>`:`<span class="story-author-portrait">${portrait}</span>`;
 const name=a.profilePage?`<a class="story-author-name" href="${esc(url(a.profilePage))}" rel="author">${esc(a.name)}</a>`:`<span class="story-author-name">${esc(a.name)}</span>`;
 return `<aside class="story-author guest-author" aria-label="Story author">${photo}<nav class="social-links" aria-label="${esc(a.name)} profiles">${links}</nav>${name}</aside>`;
}
export function guestStructuredData(post,data){
 if(!isFriend(post))return '';const a=post.guestAuthor,origin=data.engagement.publicOrigin;
 const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:post.en.title,description:post.en.excerpt,image:origin+post.image,datePublished:post.publishedAt||post.date,mainEntityOfPage:origin+'/journal/'+post.slug+'/',author:{'@type':'Person',name:a.name,image:origin+a.image,...(a.website||a.instagram?{url:a.website||a.instagram}:{}),sameAs:[a.instagram,a.strava,a.website].filter(Boolean)},publisher:{'@type':'Organization',name:'Runograph',url:origin}};
 return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`;
}
