import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {markdown,inline,readContent,root,validateRecord} from './core.mjs';
import {attachmentUpload} from './upload-files.mjs';
import {insertMarkup} from '../public/admin/markdown-editor.js';

assert.equal(inline('A **bold** word'),'A <strong>bold</strong> word');
assert(inline('**[Strava](https://strava.com/athletes/example)**').includes('<strong><a '));
assert(inline('[**Strava**](https://strava.com/athletes/example)').includes('><strong>Strava</strong></a>'));
assert(markdown('[Download GPX](/assets/uploads/course.gpx)','/blog').includes('href="/blog/assets/uploads/course.gpx" rel="noopener noreferrer" download'));
const picture=markdown('[![Route screenshot](/assets/uploads/map.jpg "My run")](https://strava.com/athletes/example)','/blog');
assert(picture.includes('<figure class="story-media">'));assert(picture.includes('<a href="https://strava.com/athletes/example"'));assert(picture.includes('src="/blog/assets/uploads/map.jpg"'));assert(picture.includes('<figcaption>My run</figcaption>'));
for(const unsafe of ['[bad](javascript:alert(1))','[bad](//example.com)','![bad](javascript:alert(1))','<script>alert(1)</script>']){
 const html=markdown(unsafe);assert(!html.includes('href="javascript:'));assert(!html.includes('href="//'));assert(!html.includes('src="javascript:'));assert(!html.includes('<script>'));
}
assert(markdown('![<img onerror=bad>](/assets/uploads/photo.jpg)').includes('alt="&lt;img onerror=bad&gt;"'));
const bold=insertMarkup('Nice to Monaco',0,4,'bold');assert.equal(markdown(bold.value),'<p><strong>Nice</strong> to Monaco</p>');
const link=insertMarkup('My Strava',3,9,'link',{url:'https://strava.com/athletes/example'});assert(markdown(link.value).includes('>Strava</a>'));
const file=insertMarkup('',0,0,'link',{url:'/assets/uploads/course.gpx',label:'Download GPX'});assert(markdown(file.value).includes(' download'));
const gpx='<?xml version="1.0"?><gpx version="1.1"><trk><trkseg><trkpt lat="43.67" lon="7.22"/></trkseg></trk></gpx>';
const data='data:application/gpx+xml;base64,'+Buffer.from(gpx).toString('base64');
const upload=attachmentUpload({name:'../../A route.gpx',data});assert.equal(upload.basename,'A-route');assert.equal(upload.extension,'gpx');assert.equal(upload.bytes.toString(),gpx);
assert.throws(()=>attachmentUpload({name:'bad.html',data}));
assert.throws(()=>attachmentUpload({name:'bad.gpx',data:'data:application/gpx+xml;base64,'+Buffer.from('<!DOCTYPE gpx><gpx></gpx>').toString('base64')}));
assert.throws(()=>attachmentUpload({name:'bad.pdf',data}));
assert.throws(()=>attachmentUpload({name:'bad.zip',data}));
const config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8')),postConfig=config.content.find(c=>c.name==='posts');
for(const lang of ['en']){const body=postConfig.fields.find(f=>f.name===lang).fields.find(f=>f.name==='body');assert.equal(body.type,'rich-text');assert.equal(body.options.format,'markdown');}
assert(postConfig.fields.some(f=>f.name==='attachments'&&f.type==='file'));
assert(config.media.extensions.includes('gpx'));
const dataSet=readContent();
for(const post of dataSet.posts){
 const invalid={...structuredClone(post),attachments:['javascript:alert(1)']};assert.throws(()=>validateRecord('posts',invalid));
 if(post.status!=='draft')continue;
 for(const lang of ['en']){
  const page=resolve(root,'dist',lang,'preview',post.slug,'index.html');const expected=process.env.DRAFT_PREVIEW==='1'&&process.env.PUBLIC_BUILD!=='1';assert.equal(existsSync(page),expected);
  if(expected){const html=readFileSync(page,'utf8');assert(html.includes('content="noindex,follow"'));assert(!html.includes('data-copy-link'));}
  assert(!existsSync(resolve(root,'dist',lang,'journal',post.slug,'index.html')));
 }
}
console.log('Passed authoring checks: bold and nested links, photos/captions, linked screenshots, file downloads, upload formats, safe rendering, rich-text CMS and guarded draft previews.');
