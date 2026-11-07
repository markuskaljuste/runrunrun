import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,esc} from './core.mjs';
import {validateMapData} from '../public/assets/map-data.js';
export const safeRoutePath=value=>/^\/assets\/routes\/[a-z0-9]+(?:-[a-z0-9]+)*\.gpx$/.test(value??'');
export function validateSanitizedGpx(xml){
 // Accept only the deliberately small export format, never arbitrary Garmin XML.
 const match=/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<gpx version="1\.1" creator="Runograph" xmlns="http:\/\/www\.topografix\.com\/GPX\/1\/1"><trk><name>[A-Za-z0-9 .,-]+<\/name><trkseg>((?:<trkpt lat="-?\d+(?:\.\d+)?" lon="-?\d+(?:\.\d+)?"><ele>-?\d+(?:\.\d+)?<\/ele><\/trkpt>)+)<\/trkseg><\/trk><\/gpx>\n?$/.exec(xml);
 if(!match)throw Error('Route download must contain only coordinates and elevation, without timestamps, sensors, metadata or waypoints.');
 const points=[...match[1].matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)"><ele>([^<]+)<\/ele><\/trkpt>/g)];
 if(points.length<2||points.length>20000||points.some(p=>Math.abs(Number(p[1]))>90||Math.abs(Number(p[2]))>180||!Number.isFinite(Number(p[3]))||Math.abs(Number(p[3]))>10000))throw Error('Invalid route coordinates.');
 return points.length;
}
export function renderRouteDownloads(post,url){
 if(!post.routeMap?.enabled||post.routeMap.downloadsEnabled===false)return '';
 const id=post.routeMap.mapId;if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id??''))return '';
 const file=resolve(root,'public/assets/maps',id+'.json');if(!existsSync(file))return '';
 const layers=validateMapData(JSON.parse(readFileSync(file,'utf8'))).layers.filter(l=>l.kind==='personal'&&l.routeFile);
 if(!layers.length)return '';
 for(const layer of layers)validateSanitizedGpx(readFileSync(resolve(root,'public','.'+layer.routeFile),'utf8'));
 return `<section class="route-downloads"><h2>Take the route with you</h2><ul>${layers.map(l=>`<li><a class="text-link" href="${url(l.routeFile)}" download>${esc(layers.length===1?'Download GPX':l.label+' · Download GPX')}</a></li>`).join('')}</ul><p>Route line and elevation only. No pace, timestamps or training data.</p></section>`;
}
