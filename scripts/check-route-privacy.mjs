import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord,markdown} from './core.mjs';
import {isRouteFile} from '../public/assets/attachment-policy.js';
import {renderAttachments} from './attachments.mjs';
import {attachmentUpload} from './upload-files.mjs';

const routes=['/assets/uploads/private.gpx','/assets/uploads/private.KML?download=1','https://example.com/private%2Egpx#track'];
for(const file of routes){
 assert(isRouteFile(file));
 assert(!markdown(`[Route](${file})`).includes('href='),'Route files must not be linked in article text.');
 assert.equal(renderAttachments({attachments:[file]},'en',path=>path),'','A route-only attachment section must disappear.');
}
const mixed=renderAttachments({attachments:[routes[0],'/assets/uploads/notes.pdf']},'en',path=>path);
assert(mixed.includes('notes.pdf'));assert(!mixed.includes('private.gpx'));
for(const extension of ['gpx','kml'])assert.throws(()=>attachmentUpload({name:`route.${extension}`,data:'data:application/xml;base64,'+Buffer.from(`<${extension}></${extension}>`).toString('base64')}),'Route files must not be uploaded to the site.');
const data=readContent(),post=structuredClone(data.posts[0]);
for(const file of routes)assert.throws(()=>validateRecord('posts',{...post,attachments:[file]}),'CMS saves must reject route file attachments.');
const schema=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8'));
for(const values of [schema.media.extensions,schema.content.find(c=>c.name==='posts').fields.find(f=>f.name==='attachments').options.extensions])for(const extension of ['gpx','kml'])assert(!values.includes(extension));
function files(folder){return readdirSync(folder).flatMap(name=>{const path=resolve(folder,name);return statSync(path).isDirectory()?files(path):[path];});}
const retired=['garmin-course.svg','route-line.svg','strava-activity.jpg'];
for(const folder of ['public','dist']){
 const directory=resolve(root,folder);if(!existsSync(directory))continue;
 for(const file of files(directory)){
  assert(!isRouteFile(file),`Private route export is present in ${folder}: ${file}`);
  assert(!retired.includes(file.split('/').pop()),`Retired geographic route asset is present: ${file}`);
  if(file.endsWith('.html')){
   const html=readFileSync(file,'utf8');
   for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g))assert(!isRouteFile(match[1]),'A built page exposes a route download.');
   for(const name of retired)assert(!html.includes(name),'A built page still shows an exact geographic route.');
  }
 }
}
console.log('Passed route privacy: no route downloads, route uploads, original route exports or old start/finish maps in the website output.');
