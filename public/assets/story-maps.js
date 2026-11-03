import {validateMapData} from './map-data.js';
let leafletPromise;
function loadLeaflet(base){
 if(globalThis.L)return Promise.resolve(globalThis.L);
 if(leafletPromise)return leafletPromise;
 leafletPromise=Promise.all([
  new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=base+'leaflet.css';link.onload=resolve;link.onerror=()=>{link.remove();reject(new Error('Map styles could not load.'));};document.head.append(link);}),
  new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=base+'leaflet.js';script.onload=resolve;script.onerror=()=>{script.remove();reject(new Error('The map could not load.'));};document.head.append(script);})
 ]).then(()=>globalThis.L).catch(error=>{leafletPromise=null;throw error;});
 return leafletPromise;
}
export function setupStoryMaps(){
 for(const root of document.querySelectorAll('[data-story-map]')){
  const button=root.querySelector('[data-open-map]'),status=root.querySelector('.map-status'),canvas=root.querySelector('.map-canvas'),tools=root.querySelector('.map-tools');let loading=false,map;
  button.addEventListener('click',async()=>{
   if(loading||map)return;loading=true;button.disabled=true;status.textContent='Loading map…';
   try{
    const response=await fetch(root.dataset.mapUrl,{credentials:'same-origin'});if(!response.ok)throw new Error('The route could not load.');
    const data=validateMapData(await response.json()),L=await loadLeaflet(root.dataset.mapAssets);
    canvas.hidden=false;
    map=L.map(canvas,{scrollWheelZoom:false});
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,referrerPolicy:'strict-origin-when-cross-origin',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    let tileNotice=false;tiles.on('tileerror',()=>{if(!tileNotice){tileNotice=true;status.textContent='Some map tiles could not load. Your route is still shown. Try again later.';}});
    const groups=data.layers.map(layer=>({id:layer.id,group:L.featureGroup(layer.paths.map(path=>L.polyline(path,{color:layer.color,weight:5,opacity:.95}))).addTo(map)}));
    function select(id){
     for(const item of groups){const active=id==='all'||id===item.id;if(active&&!map.hasLayer(item.group))item.group.addTo(map);if(!active&&map.hasLayer(item.group))map.removeLayer(item.group);}
     const visible=groups.filter(item=>id==='all'||id===item.id),bounds=L.latLngBounds([]);for(const item of visible)bounds.extend(item.group.getBounds());
     if(bounds.isValid())map.fitBounds(bounds,{padding:[25,25],maxZoom:16});
     for(const control of tools.querySelectorAll('[data-map-layer]'))control.setAttribute('aria-pressed',String(control.dataset.mapLayer===id));
    }
    for(const control of tools.querySelectorAll('[data-map-layer]'))control.addEventListener('click',()=>select(control.dataset.mapLayer));
    root.querySelector('.map-gate').hidden=true;tools.hidden=data.layers.length<2;status.textContent='';
    select(data.layers.length>1?'all':data.layers[0].id);
   }catch(error){if(map){map.remove();map=null;}canvas.hidden=true;button.disabled=false;status.textContent='The map could not load. Please try again.';}
   finally{loading=false;}
  });
 }
}
if(typeof document!=='undefined')setupStoryMaps();
