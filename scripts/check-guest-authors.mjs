import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord} from './core.mjs';
import {isFriend,friendBadge,guestByline,guestFooter,guestStructuredData} from './guest-authors.mjs';
const data=readContent(),post=data.posts.find(p=>p.slug==='fuengirola');
assert(post);validateRecord('posts',post);
for(const k of ['instagram','strava','website']){const bad=structuredClone(post);bad.guestAuthor[k]='javascript:alert(1)';assert.throws(()=>validateRecord('posts',bad));}
const escaped=structuredClone(post);escaped.guestAuthor.name='<script>alert(1)</script>';assert(!guestByline(escaped,p=>p).includes('<script>'));
assert.equal(friendBadge({}),'');assert.equal(guestFooter({},p=>p),'');
const footer=guestFooter(post,p=>p);assert(footer.indexOf('class="social-links"')<footer.indexOf('class="story-author-name"'));assert(footer.includes(post.guestAuthor.strava));assert(footer.includes(post.guestAuthor.instagram));
const schema=JSON.parse(guestStructuredData(post,data).match(/<script[^>]*>([\s\S]+)<\/script>/)[1]);assert.equal(schema.author.name,post.guestAuthor.name);assert(schema.author.sameAs.includes(post.guestAuthor.strava));
const page=readFileSync(resolve(root,'dist/journal/fuengirola/index.html'),'utf8');assert(page.includes('class="guest-byline"'));assert(page.includes('class="guest-author')||page.includes('story-author guest-author'));assert(page.includes('content="index,follow"'));assert(page.includes('rel="canonical" href="https://runograph.com/journal/fuengirola/"'));assert(page.includes('data-story-comments'));assert(!page.includes('About Markus'));
for(const p of ['index.html','journal/index.html','countries/spain/index.html']){const html=readFileSync(resolve(root,'dist',p),'utf8');assert(html.includes('class="friend-story-badge"'));assert(html.includes('/journal/fuengirola/'));}
assert(readFileSync(resolve(root,'dist/sitemap.xml'),'utf8').includes('https://runograph.com/journal/fuengirola/'));
for(const own of data.posts.filter(p=>p.status==='published'&&!isFriend(p))){
 const html=readFileSync(resolve(root,'dist/journal',own.slug,'index.html'),'utf8');
 const heading=html.match(/<header class="article-heading section">([\s\S]+?)<\/header>/)[1];
 const footer=html.match(/<aside class="story-author guest-author"[\s\S]+?<\/aside>/)[0];
 assert(heading.includes('By Markus'));assert(heading.includes(data.images.about.src));assert(!heading.includes('guest-story-label'));
 assert(footer.includes(data.images.about.src));assert(footer.includes('href="/about/"'));assert(footer.indexOf('class="social-links"')<footer.indexOf('class="story-author-name"'));
 for(const social of data.engagement.socials.filter(s=>s.enabled))assert(footer.includes(social.url));
}
console.log('Passed guest stories: safe author fields, portrait and social order, badges in listings, correct author schema, comments, canonical URL and sitemap.');
