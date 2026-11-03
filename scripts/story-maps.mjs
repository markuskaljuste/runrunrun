import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,esc} from './core.mjs';
import {validateMapData} from '../public/assets/map-data.js';
export function renderStoryMap(post,url){
 if(!post.routeMap?.enabled)return '';
 const id=post.routeMap.mapId;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id??''))throw new Error('Choose a prepared map.');
 const data=validateMapData(JSON.parse(readFileSync(resolve(root,'public/assets/maps',id+'.json'),'utf8')));
 const layers=data.layers;
 return `<section class="story-map" data-story-map data-map-url="${url('/assets/maps/'+id+'.json')}" data-map-assets="${url('/assets/vendor/leaflet/')}"><h2>Explore the map</h2><div class="map-legend">${layers.map(l=>`<span><i style="background:${esc(l.color)}" aria-hidden="true"></i>${esc(l.label)}</span>`).join('')}</div><button type="button" class="button button-green map-retry" data-retry-map hidden>Try map again</button><div class="map-tools" role="group" aria-label="Show routes" hidden>${layers.length>1?`<button type="button" data-map-layer="all" aria-pressed="true">${layers.length===2?'Both routes':'All routes'}</button>`:''}${layers.map(l=>`<button type="button" data-map-layer="${esc(l.id)}" aria-pressed="${layers.length===1?'true':'false'}">${esc(l.label)}</button>`).join('')}</div><div class="map-canvas" role="region" aria-label="Running routes map"></div><p class="map-status" role="status" aria-live="polite">Loading map…</p>${layers.filter(l=>l.kind==='guide').map(l=>`<p class="map-source">${esc(l.label)}: approximate public running route. <a href="${esc(l.sourceUrl)}" rel="noopener noreferrer">${esc(l.sourceLabel)}</a>.</p>`).join('')}<noscript><p>Enable JavaScript to use the interactive map.</p></noscript></section>`;
}
