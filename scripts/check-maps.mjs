import {googleMyMap} from './google-maps.mjs';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord} from './core.mjs';
import {prepareRoute} from './map-privacy.mjs';
import {validateMapData} from '../public/assets/map-data.js';
import {renderStoryMap} from './story-maps.mjs';
import {setupStoryMaps} from '../public/assets/story-maps.js';

const track=[[41,2],[41,2.001],[41,2.002],[41,2.003],[41,2.004]];
const prepared=prepareRoute(track);
assert.deepEqual(prepared,[track],'The complete route should be retained without endpoint trimming.');
assert.deepEqual(prepareRoute([...track,...track.slice().reverse()])[0].at(-1),track[0],'Out-and-back geometry must keep the return leg.');
assert.deepEqual(prepareRoute([[41,2],[41,2],[41,2.001]]),[[[41,2],[41,2.001]]]);
assert.equal(prepareRoute([...track,[41,3],[41,3.001]]).length,2,'Long GPS gaps should split the line.');
assert.throws(()=>prepareRoute([[41,2],[NaN,1]]));
assert.throws(()=>prepareRoute([[41,2,120],[41,2.001,121]]));

const mapId='test-map-ABC123';
for(const path of ['edit','viewer','embed','u/0/edit']){
 const map=googleMyMap('https://www.google.com/maps/d/'+path+'?mid='+mapId+'&usp=sharing');
 assert.equal(map.embedUrl,'https://www.google.com/maps/d/embed?mid='+mapId+'&hl=en');
 assert.equal(map.viewerUrl,'https://www.google.com/maps/d/viewer?mid='+mapId);
}
assert.equal(googleMyMap('   '),null);
for(const url of ['http://www.google.com/maps/d/viewer?mid='+mapId,'https://www.google.com.evil.example/maps/d/viewer?mid='+mapId,'https://name@www.google.com/maps/d/viewer?mid='+mapId,'https://www.google.com:8443/maps/d/viewer?mid='+mapId,'https://www.google.com/maps?mid='+mapId,'https://www.google.com/maps/d/viewer?mid='+mapId+'&mid=other','https://www.google.com/maps/d/viewer?mid=%22%3E%3Cscript%3E','<iframe src="https://www.google.com/maps/d/embed?mid='+mapId+'"></iframe>',42])assert.throws(()=>googleMyMap(url));

const data=readContent(),base=(process.env.BASE_PATH??'').replace(/\/$/,''),home=readFileSync(resolve(root,'dist/index.html'),'utf8'),launch=home.includes('data-publication="coming-soon"');
for(const name of readdirSync(resolve(root,'public/assets/maps'))){
 const map=validateMapData(JSON.parse(readFileSync(resolve(root,'public/assets/maps',name),'utf8')));
 assert(map.layers.some(layer=>layer.kind==='personal'));
 for(const layer of map.layers)assert(!('privateEndsOmitted' in layer),'No false clipping claim should remain.');
}
const barcelona=validateMapData(JSON.parse(readFileSync(resolve(root,'public/assets/maps/barcelona.json'),'utf8'))),guide=barcelona.layers.find(l=>l.id==='seafront');
assert(guide?.kind==='guide'&&guide.distanceKm>4.4&&guide.distanceKm<4.6);
assert.equal(barcelona.layers.length,3);
const legend=renderStoryMap(data.posts.find(p=>p.slug==='barcelona'),p=>p);assert(legend.includes('9.0 km out-and-back total (4.5 km each way)'));assert(legend.includes('9.4 km out-and-back total'));assert(legend.includes('m elevation gain (GPX)'));assert(!legend.includes('9.4 km one way'));
for(const patch of [{ascentM:-1},{distanceKm:0},{distanceMode:'unknown'},{routeFile:'/assets/uploads/raw.gpx'}])assert.throws(()=>validateMapData({version:1,layers:[{...barcelona.layers[0],...patch}]}));
assert.equal(barcelona.layers.find(l=>l.id==='gentler-run')?.kind,'personal');
assert.equal(barcelona.layers.filter(l=>l.kind==='personal').length,2);
for(const fields of [{version:1,layers:[]},{...barcelona,rawTrack:[]},{version:1,layers:[{...barcelona.layers[0],privateEndsOmitted:false}]},{version:1,layers:[{...barcelona.layers[0],paths:[[[1,2,3],[1,2,4]]]}]}])assert.throws(()=>validateMapData(fields));
for(const post of data.posts){
 if(!post.routeMap?.enabled)continue;
 assert.throws(()=>validateRecord('posts',{...post,routeMap:{enabled:true,mapId:'../private'}}));
 assert.throws(()=>validateRecord('posts',{...post,routeMap:{enabled:true,googleMyMapsUrl:'https://evil.example/maps/d/viewer?mid='+mapId}}));
 const google=googleMyMap(post.routeMap.googleMyMapsUrl),markup=renderStoryMap(post,p=>base+p);
 if(google){
  validateRecord('posts',{...post,routeMap:{enabled:true,googleMyMapsUrl:google.viewerUrl}});
  assert(markup.includes(google.embedUrl.replaceAll('&','&amp;')));assert(markup.includes('loading="eager"'));assert(markup.includes('data-google-story-map'));assert(!markup.includes('data-story-map'));assert(!markup.includes('/edit?'));assert(markup.includes('Open in Google Maps'));assert(markup.includes('aria-label="Route colors"'));assert(!markup.includes('OpenStreetMap / FOSSGIS'));assert(!markup.includes('routing.openstreetmap.de'));
  assert.equal(renderStoryMap({...post,routeMap:{...post.routeMap,enabled:false}},p=>p),'');
 }else{
  assert(markup.includes(base+'/assets/maps/'+post.routeMap.mapId+'.json'));assert(markup.includes('data-retry-map hidden'));assert(!markup.includes('data-open-map'));assert(markup.includes('aria-label="Running routes map"></div>'));assert(!markup.includes('start and finish omitted'));
 }
 if(!launch&&post.status==='published'){
  const html=readFileSync(resolve(root,'dist/journal',post.slug,'index.html'),'utf8');assert(html.includes(markup));assert.equal(html.includes(base+'/assets/story-maps.js'),!google);assert(!html.includes('https://tile.openstreetmap.org/'));
 }
}
if(launch){assert(!home.includes('data-story-map'));assert(!home.includes('data-google-story-map'));assert(!existsSync(resolve(root,'dist/assets/maps')));}

function el(extra={}){return {hidden:false,disabled:false,textContent:'',dataset:{},listeners:{},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},...extra};}
async function exercise(failInitially=false){
 const button=el({hidden:true}),status=el(),canvas=el(),controls=['all','personal','seafront','gentler-run'].map(id=>el({dataset:{mapLayer:id}}));
 const tools=el({hidden:true,querySelectorAll:()=>controls}),rootElement=el({dataset:{mapUrl:'/assets/maps/barcelona.json',mapAssets:'/assets/vendor/leaflet/'},querySelector:s=>({'[data-retry-map]':button,'.map-status':status,'.map-canvas':canvas,'.map-tools':tools})[s]});
 let fetches=0,tileCalls=0,fitCalls=0,fail=failInitially;const layerSet=new Set(),tileEvents={};
 const map={hasLayer:l=>layerSet.has(l),removeLayer:l=>layerSet.delete(l),fitBounds(){fitCalls++;},remove(){}};
 const fakeL={map:(_,options)=>{assert.equal(options.scrollWheelZoom,false);return map;},tileLayer:(url,options)=>{tileCalls++;assert.equal(url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');assert.equal(options.referrerPolicy,'strict-origin-when-cross-origin');assert(options.attribution.includes('OpenStreetMap'));return {addTo(){return this;},on(k,fn){tileEvents[k]=fn;return this;}};},polyline:(path,options)=>{assert(Array.isArray(path));assert.equal(options.weight,5);return {path};},featureGroup:paths=>({addTo(){layerSet.add(this);return this;},getBounds:()=>({paths})}),latLngBounds:()=>({extend(){return this;},isValid:()=>true})};
 const saved={document:globalThis.document,fetch:globalThis.fetch,L:globalThis.L};
 try{
  globalThis.document={querySelectorAll:()=>[rootElement]};globalThis.L=fakeL;globalThis.fetch=async()=>{fetches++;return {ok:!fail,json:async()=>barcelona};};
  const ready=setupStoryMaps();assert.equal(fetches,1,'The map must start without a click.');assert.equal(canvas.hidden,false);assert.equal(canvas['aria-busy'],'true');
  await setupStoryMaps();assert.equal(fetches,1,'Repeated setup must not create another map.');
  await ready;
  if(failInitially){
   assert.equal(tileCalls,0);assert.equal(button.disabled,false);assert.equal(button.hidden,false);assert(canvas.hidden);assert(status.textContent.includes('try again'));
   fail=false;await button.listeners.click();assert.equal(fetches,2,'Retry must request the route again.');
  }
  assert.equal(tileCalls,1);assert.equal(canvas.hidden,false);assert.equal(canvas['aria-busy'],'false');assert.equal(button.hidden,true);assert.equal(layerSet.size,3);
  controls[3].listeners.click();assert.equal(layerSet.size,1);assert.equal(controls[3]['aria-pressed'],'true');
  controls[2].listeners.click();assert.equal(layerSet.size,1);assert.equal(controls[2]['aria-pressed'],'true');
  controls[0].listeners.click();assert.equal(layerSet.size,3);assert.equal(fitCalls,4);
  await button.listeners.click();assert.equal(fetches,failInitially?2:1);assert.equal(tileCalls,1);
  tileEvents.tileerror();assert(status.textContent.includes('tiles'));assert.equal(layerSet.size,3);
 }finally{for(const [key,value] of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
}
await exercise();await exercise(true);
console.log('Passed maps: full route lines without endpoint markers or sensor fields, separate sourced seafront guide, validated public Google embeds, automatic maps with three selectable routes, layer switching, base paths, retry states and launch isolation.');
