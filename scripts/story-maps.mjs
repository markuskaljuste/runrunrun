import {googleMyMap} from './google-maps.mjs';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,esc} from './core.mjs';
import {validateMapData} from '../public/assets/map-data.js';
export function renderStoryMap(post,url){
 if(!post.routeMap?.enabled)return '';
 const google=googleMyMap(post.routeMap.googleMyMapsUrl);
 if(google){
  const id=post.routeMap.mapId,sourceFile=/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id??'')?resolve(root,'public/assets/maps',id+'.json'):null;
  const layers=sourceFile&&existsSync(sourceFile)?validateMapData(JSON.parse(readFileSync(sourceFile,'utf8'))).layers:[];
  return `<section class="story-map story-map-google" data-google-story-map><h2>Explore the map</h2><iframe class="google-map-frame" title="${esc(post.en?.title??'Running routes')} on Google Maps" src="${esc(google.embedUrl)}" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>${googleLegend(layers)}<p class="map-source"><a href="${esc(google.viewerUrl)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p></section>`;
 }
 const id=post.routeMap.mapId;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id??''))throw new Error('Choose a prepared map.');
 const data=validateMapData(JSON.parse(readFileSync(resolve(root,'public/assets/maps',id+'.json'),'utf8')));
 const layers=data.layers;
 return `<section class="story-map" data-story-map data-map-url="${url('/assets/maps/'+id+'.json')}" data-map-assets="${url('/assets/vendor/leaflet/')}"><h2>Explore the map</h2><div class="map-legend">${layers.map(l=>`<span><i style="background:${esc(l.color)}" aria-hidden="true"></i><span>${esc(l.label)}${legendStats(l)}</span></span>`).join('')}</div><button type="button" class="button button-green map-retry" data-retry-map hidden>Try map again</button><div class="map-tools" role="group" aria-label="Show routes" hidden>${layers.length>1?`<button type="button" data-map-layer="all" aria-pressed="true">${layers.length===2?'Both routes':'All routes'}</button>`:''}${layers.map(l=>`<button type="button" data-map-layer="${esc(l.id)}" aria-pressed="${layers.length===1?'true':'false'}">${esc(l.label)}</button>`).join('')}</div><div class="map-canvas" role="region" aria-label="Running routes map"></div><p class="map-status" role="status" aria-live="polite">Loading map…</p>${legendNote(layers)}<noscript><p>Enable JavaScript to use the interactive map.</p></noscript></section>`;
}

function legendStats(layer){
 if(!Number.isFinite(layer.distanceKm))return '';
 const km=n=>n.toFixed(1);
 const distance=layer.distanceMode==='one-way-guide'?`${km(layer.distanceKm*2)} km out-and-back total (${km(layer.distanceKm)} km each way)`:layer.distanceMode==='out-and-back'?`${km(layer.distanceKm)} km out-and-back total`:layer.distanceMode==='one-way'?`${km(layer.distanceKm)} km one way`:`${km(layer.distanceKm)} km total`;
 const ascent=Number.isFinite(layer.ascentM)?` · ~${layer.ascentM} m elevation gain (GPX)`:'';
 return `<small>${esc(distance+ascent)}</small>`;
}
function legendNote(layers){return layers.some(l=>l.ascentM!=null)?'<p class="map-metrics-note">Distances include any return leg. Elevation gain is estimated from GPX.</p>':'';}

function googleLegend(layers){return layers.length?`<ul class="google-map-legend" aria-label="Route colors">${layers.map(layer=>`<li><span class="route-color-swatch" style="background:${esc(layer.color)}" aria-hidden="true"></span><span>${esc(layer.label)}${legendStats(layer)}</span></li>`).join('')}</ul>${legendNote(layers)}`:'';}
