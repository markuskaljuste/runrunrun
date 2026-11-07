import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {markdown,inline,readContent,root,validateRecord} from './core.mjs';
import {attachmentUpload} from './upload-files.mjs';
import {insertMarkup} from '../public/admin/markdown-editor.js';

assert.equal(inline('A **bold** word'),'A <strong>bold</strong> word');
assert.equal(markdown('A paragraph.\n## Free run clubs\nA club introduction.'),'<p>A paragraph.</p>\n<h2>Free run clubs</h2>\n<p>A club introduction.</p>');
assert.equal(markdown('A paragraph.\r\n###\tClub name\r\nDetails.'),'<p>A paragraph.</p>\n<h3>Club name</h3>\n<p>Details.</p>');
assert.equal(markdown('Use ## marks inside a sentence.'),'<p>Use ## marks inside a sentence.</p>');
assert(inline('**[Strava](https://strava.com/athletes/example)**').includes('<strong><a '));
assert(inline('[**Strava**](https://strava.com/athletes/example)').includes('><strong>Strava</strong></a>'));
assert(!markdown('[Download GPX](/assets/uploads/course.gpx)','/blog').includes('href='));
assert(!markdown('[Download KML](/assets/uploads/course.kml)','/blog').includes('href='));
const picture=markdown('[![Route screenshot](/assets/uploads/map.jpg "My run")](https://strava.com/athletes/example)','/blog');
assert(picture.includes('<figure class="story-media">'));assert(picture.includes('<a href="https://strava.com/athletes/example"'));assert(picture.includes('src="/blog/assets/uploads/map.jpg"'));assert(picture.includes('<figcaption>My run</figcaption>'));
for(const unsafe of ['[bad](javascript:alert(1))','[bad](//example.com)','![bad](javascript:alert(1))','<script>alert(1)</script>']){
 const html=markdown(unsafe);assert(!html.includes('href="javascript:'));assert(!html.includes('href="//'));assert(!html.includes('src="javascript:'));assert(!html.includes('<script>'));
}
assert(markdown('![<img onerror=bad>](/assets/uploads/photo.jpg)').includes('alt="&lt;img onerror=bad&gt;"'));
const bold=insertMarkup('Nice to Monaco',0,4,'bold');assert.equal(markdown(bold.value),'<p><strong>Nice</strong> to Monaco</p>');
const link=insertMarkup('My Strava',3,9,'link',{url:'https://strava.com/athletes/example'});assert(markdown(link.value).includes('>Strava</a>'));
const file=insertMarkup('',0,0,'link',{url:'/assets/uploads/notes.pdf',label:'Download notes'});assert(markdown(file.value).includes(' download'));
const gpx='<?xml version="1.0"?><gpx version="1.1"><trk><trkseg><trkpt lat="43.67" lon="7.22"/></trkseg></trk></gpx>';
const data='data:application/gpx+xml;base64,'+Buffer.from(gpx).toString('base64');
assert.throws(()=>attachmentUpload({name:'../../A route.gpx',data}));
const pdf='%PDF-1.4\nNotes';const upload=attachmentUpload({name:'../../My notes.pdf',data:'data:application/pdf;base64,'+Buffer.from(pdf).toString('base64')});assert.equal(upload.basename,'My-notes');assert.equal(upload.extension,'pdf');assert.equal(upload.bytes.toString(),pdf);
assert.throws(()=>attachmentUpload({name:'bad.html',data}));
assert.throws(()=>attachmentUpload({name:'bad.gpx',data:'data:application/gpx+xml;base64,'+Buffer.from('<!DOCTYPE gpx><gpx></gpx>').toString('base64')}));
const kml='<kml xmlns="http://www.opengis.net/kml/2.2"><Placemark><LineString><coordinates>0.09,38.68 0.13,38.69</coordinates></LineString></Placemark></kml>';
const kmlData='data:application/vnd.google-earth.kml+xml;base64,'+Buffer.from(kml).toString('base64');
assert.throws(()=>attachmentUpload({name:'My route.kml',data:kmlData}));
assert.throws(()=>attachmentUpload({name:'disguised.kml',data}));
for(const prefix of ['<!DOCTYPE kml>','<!ENTITY unsafe "value">','<script>alert(1)</script>'])assert.throws(()=>attachmentUpload({name:'unsafe.kml',data:'data:application/xml;base64,'+Buffer.from(prefix+kml).toString('base64')}));
assert.throws(()=>attachmentUpload({name:'bad.pdf',data}));
assert.throws(()=>attachmentUpload({name:'bad.zip',data}));
const config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8')),postConfig=config.content.find(c=>c.name==='posts');
for(const lang of ['en']){const body=postConfig.fields.find(f=>f.name===lang).fields.find(f=>f.name==='body');assert.equal(body.type,'rich-text');assert.equal(body.options.format,'markdown');}
assert(postConfig.fields.some(f=>f.name==='attachments'&&f.type==='file'));
assert(!config.media.extensions.includes('gpx'));
assert(!config.media.extensions.includes('kml'));
assert(!postConfig.fields.find(f=>f.name==='attachments').options.extensions.includes('kml'));
const dataSet=readContent();
for(const post of dataSet.posts){
 const invalid={...structuredClone(post),attachments:['javascript:alert(1)']};assert.throws(()=>validateRecord('posts',invalid));
 if(post.status!=='draft')continue;
 for(const lang of ['en']){
  const page=resolve(root,'dist',lang==='en'?'':lang,'preview',post.slug,'index.html');const expected=process.env.DRAFT_PREVIEW==='1'&&process.env.PUBLIC_BUILD!=='1';assert.equal(existsSync(page),expected);
  if(expected){const html=readFileSync(page,'utf8');assert(html.includes('content="noindex,follow"'));assert(!html.includes('data-copy-link'));}
  assert(!existsSync(resolve(root,'dist',lang==='en'?'':lang,'journal',post.slug,'index.html')));
 }
}
console.log('Passed authoring checks: bold and nested links, photos/captions, linked screenshots, file downloads, upload formats, safe rendering, rich-text CMS and guarded draft previews.');
