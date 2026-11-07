import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,esc} from './core.mjs';
export const safeRoutePath=value=>/^\/assets\/routes\/[a-z0-9]+(?:-[a-z0-9]+)*\.gpx$/.test(value??'');
export function validateSanitizedGpx(xml){
 // Accept only the deliberately small export format, never arbitrary Garmin XML.
 const match=/^<\?xml version="1\.0" encoding="UTF-8"\?>\n<gpx version="1\.1" creator="Runograph" xmlns="http:\/\/www\.topografix\.com\/GPX\/1\/1"><trk><name>[A-Za-z0-9 .,-]+<\/name><trkseg>((?:<trkpt lat="-?\d+(?:\.\d+)?" lon="-?\d+(?:\.\d+)?"><ele>-?\d+(?:\.\d+)?<\/ele><\/trkpt>)+)<\/trkseg><\/trk><\/gpx>\n?$/.exec(xml);
 if(!match)throw Error('Route download must contain only coordinates and elevation, without timestamps, sensors, metadata or waypoints.');
 const points=[...match[1].matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)"><ele>([^<]+)<\/ele><\/trkpt>/g)];
 if(points.length<2||points.length>20000||points.some(p=>Math.abs(Number(p[1]))>90||Math.abs(Number(p[2]))>180||!Number.isFinite(Number(p[3]))||Math.abs(Number(p[3]))>10000))throw Error('Invalid route coordinates.');
 return points.length;
}
export function renderRouteDownload(post,layer,url){
 if(!post.routeMap?.enabled||post.routeMap.downloadsEnabled===false||layer.kind!=='personal'||!layer.routeFile)return '';
 if(!safeRoutePath(layer.routeFile))throw Error('Choose a prepared GPX route.');
 validateSanitizedGpx(readFileSync(resolve(root,'public','.'+layer.routeFile),'utf8'));
 return `<a class="map-route-download" aria-label="Download GPX: ${esc(layer.label)}" href="${url(layer.routeFile)}" download>Download GPX</a>`;
}
