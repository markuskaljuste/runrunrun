import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord} from './core.mjs';
import {clipPersonalRoute,metres,edgeClearance} from './map-privacy.mjs';
import {validateMapData} from '../public/assets/map-data.js';
import {renderStoryMap} from './story-maps.mjs';
import {setupStoryMaps} from '../public/assets/story-maps.js';

const outbound=Array.from({length:81},(_,i)=>[0,i*.001]);
for(const points of [outbound,[...outbound,...outbound.slice().reverse()]]){
 const paths=clipPersonalRoute(points);assert(paths.length);
 for(const path of paths){
  for(const p of path)for(const c of [points[0],points.at(-1)])assert(metres(p,c)>1000,'A visible point exposes a private endpoint area.');
  for(let i=1;i<path.length;i++)for(const c of [points[0],points.at(-1)])assert(edgeClearance(path[i-1],path[i],c)>1000,'A visible segment crosses a private endpoint area.');
 }
 assert(!paths.flat().some(p=>p[0]===points[0][0]&&p[1]===points[0][1]));
}
const revisit=[...outbound,...outbound.slice(2).reverse(),...outbound.slice(2)];
assert(clipPersonalRoute(revisit).length>=2,'Returning near the private start must split the line.');
assert.deepEqual(clipPersonalRoute([[0,0],[0,.001],[0,.002]]),[],'A short route entirely inside private areas must not be shown.');
assert.throws(()=>clipPersonalRoute([[0,0],[NaN,1]]));

const data=readContent(),base=(process.env.BASE_PATH??'').replace(/\/$/,''),home=readFileSync(resolve(root,'dist/index.html'),'utf8'),launch=home.includes('data-publication="coming-soon"');
for(const name of readdirSync(resolve(root,'public/assets/maps'))){
 const map=validateMapData(JSON.parse(readFileSync(resolve(root,'public/assets/maps',name),'utf8')));
 assert(map.layers.some(layer=>layer.kind==='personal'&&layer.privateEndsOmitted));
}
const barcelona=validateMapData(JSON.parse(readFileSync(resolve(root,'public/assets/maps/barcelona.json'),'utf8'))),guide=barcelona.layers.find(l=>l.id==='seafront');
assert(guide?.kind==='guide'&&guide.distanceKm>4.4&&guide.distanceKm<4.6);
assert.equal(barcelona.layers.find(l=>l.kind==='personal').privateEndsOmitted,true);
for(const fields of [{version:1,layers:[]},{...barcelona,rawTrack:[]},{version:1,layers:[{...barcelona.layers[0],privateEndsOmitted:false}]},{version:1,layers:[{...barcelona.layers[0],paths:[[[1,2,3],[1,2,4]]]}]}])assert.throws(()=>validateMapData(fields));
for(const post of data.posts){
 if(!post.routeMap?.enabled)continue;
 assert.throws(()=>validateRecord('posts',{...post,routeMap:{enabled:true,mapId:'../private'}}));
 const markup=renderStoryMap(post,p=>base+p);assert(markup.includes(base+'/assets/maps/'+post.routeMap.mapId+'.json'));assert(markup.includes('data-open-map'));
 if(!launch&&post.status==='published'){
  const html=readFileSync(resolve(root,'dist/journal',post.slug,'index.html'),'utf8');assert(html.includes(markup));assert(html.includes(base+'/assets/story-maps.js'));assert(!html.includes('https://tile.openstreetmap.org/'));
 }
}
if(launch){assert(!home.includes('data-story-map'));assert(!existsSync(resolve(root,'dist/assets/maps')));}

function el(extra={}){return {hidden:false,disabled:false,textContent:'',dataset:{},listeners:{},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},...extra};}
async function exercise(fail=false){
 const button=el(),status=el(),canvas=el({hidden:true}),gate=el(),controls=['all','personal','seafront'].map(id=>el({dataset:{mapLayer:id}}));
 const tools=el({hidden:true,querySelectorAll:()=>controls}),rootElement=el({dataset:{mapUrl:'/assets/maps/barcelona.json',mapAssets:'/assets/vendor/leaflet/'},querySelector:s=>({'[data-open-map]':button,'.map-status':status,'.map-canvas':canvas,'.map-tools':tools,'.map-gate':gate})[s]});
 let fetches=0,tileCalls=0,fitCalls=0,locationRequests=0;const layerSet=new Set(),tileEvents={};
 const map={hasLayer:l=>layerSet.has(l),removeLayer:l=>layerSet.delete(l),fitBounds(){fitCalls++;},remove(){}};
 const fakeL={map:(_,options)=>{assert.equal(options.scrollWheelZoom,false);return map;},tileLayer:(url,options)=>{tileCalls++;assert.equal(url,'https://tile.openstreetmap.org/{z}/{x}/{y}.png');assert.equal(options.referrerPolicy,'strict-origin-when-cross-origin');assert(options.attribution.includes('OpenStreetMap'));return {addTo(){return this;},on(k,fn){tileEvents[k]=fn;return this;}};},polyline:(path,options)=>{assert(Array.isArray(path));assert.equal(options.weight,5);return {path};},featureGroup:paths=>({addTo(){layerSet.add(this);return this;},getBounds:()=>({paths})}),latLngBounds:()=>({extend(){return this;},isValid:()=>true})};
 const saved={document:globalThis.document,fetch:globalThis.fetch,L:globalThis.L};
 try{
  globalThis.document={querySelectorAll:()=>[rootElement]};globalThis.L=fakeL;globalThis.fetch=async()=>{fetches++;return {ok:!fail,json:async()=>barcelona};};
  setupStoryMaps();assert.equal(fetches,0);assert.equal(tileCalls,0);assert(canvas.hidden);
  await button.listeners.click();
  if(fail){assert.equal(tileCalls,0);assert.equal(button.disabled,false);assert(canvas.hidden);assert(status.textContent.includes('try again'));return;}
  assert.equal(fetches,1);assert.equal(tileCalls,1);assert.equal(canvas.hidden,false);assert.equal(gate.hidden,true);assert.equal(layerSet.size,2);
  controls[2].listeners.click();assert.equal(layerSet.size,1);assert.equal(controls[2]['aria-pressed'],'true');
  controls[0].listeners.click();assert.equal(layerSet.size,2);assert.equal(fitCalls,3);
  await button.listeners.click();assert.equal(fetches,1);assert.equal(tileCalls,1);
  tileEvents.tileerror();assert(status.textContent.includes('tiles'));assert.equal(layerSet.size,2);
 }finally{for(const [key,value] of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
}
await exercise();await exercise(true);
console.log('Passed maps: private areas clipped from points and segments, separate sourced seafront guide, click-to-load tiles, layer switching, base paths, retry states and launch isolation.');
