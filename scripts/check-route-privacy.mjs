import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord,markdown} from './core.mjs';
import {isRouteFile} from '../public/assets/attachment-policy.js';
import {safeRoutePath,validateSanitizedGpx,renderRouteDownload} from './route-downloads.mjs';
import {renderStoryMap} from './story-maps.mjs';
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
  if(isRouteFile(file)){const route='/'+file.slice(directory.length+1);assert(safeRoutePath(route),`Unprepared route export is present in ${folder}: ${file}`);validateSanitizedGpx(readFileSync(file,'utf8'));}
  assert(!retired.includes(file.split('/').pop()),`Retired geographic route asset is present: ${file}`);
  if(file.endsWith('.html')){
   const html=readFileSync(file,'utf8');
   for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g))assert(!isRouteFile(match[1])||safeRoutePath(match[1].replace(process.env.BASE_PATH??'','')),'A built page exposes an unprepared route export.');
   for(const name of retired)assert(!html.includes(name),'A built page still shows an exact geographic route.');
  }
 }
}
for(const file of files(resolve(root,'public/assets/routes'))){const xml=readFileSync(file,'utf8');assert(validateSanitizedGpx(xml)>2);for(const extra of ['<time>2024-02-18T07:31:10Z</time>','<extensions><hr>160</hr></extensions>','<speed>4</speed>','<wpt lat="1" lon="2"/>','<metadata/>'])assert.throws(()=>validateSanitizedGpx(xml.replace('</trkseg>',extra+'</trkseg>')));}
for(const post of data.posts.filter(p=>p.status==='published'&&p.routeMap?.enabled)){
 const layers=JSON.parse(readFileSync(resolve(root,'public/assets/maps',post.routeMap.mapId+'.json'),'utf8')).layers;
 const map=renderStoryMap(post,p=>p);
 for(const layer of layers){
  const markup=renderRouteDownload(post,layer,p=>p);
  if(layer.kind==='guide'){assert.equal(markup,'');continue;}
  assert(markup.includes('download>'));assert(map.includes(markup));assert(!markup.includes('application/gpx'));
  assert.equal(renderRouteDownload({...post,routeMap:{...post.routeMap,downloadsEnabled:false}},layer,p=>p),'');
  assert(renderRouteDownload(post,layer,p=>'/preview'+p).includes('href="/preview'+layer.routeFile+'"'));
  assert.throws(()=>renderRouteDownload(post,{...layer,routeFile:'/assets/uploads/raw.gpx'},p=>p));
 }
 assert(!renderStoryMap({...post,routeMap:{...post.routeMap,downloadsEnabled:false}},p=>p).includes('map-route-download'));
 const home=readFileSync(resolve(root,'dist/index.html'),'utf8');if(!home.includes('data-publication="coming-soon"')){
  const page=readFileSync(resolve(root,'dist/journal',post.slug,'index.html'),'utf8');assert(!page.includes('class="route-downloads"'));
  assert(page.indexOf('class="map-route-download"')<page.indexOf('class="destination-rating"'));
  assert.equal((page.match(/class="map-route-download"/g)??[]).length,layers.filter(l=>l.kind==='personal'&&l.routeFile).length);
 }
}
console.log('Passed route privacy: prepared coordinate/elevation-only GPX downloads inside map legends; disabled downloads, guide exclusion, base paths and rejection of timestamps, sensors and original exports.');
