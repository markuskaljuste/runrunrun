export function validateMapData(data){
 if(data?.version!==1||Object.keys(data).some(k=>!['version','layers'].includes(k))||!Array.isArray(data.layers)||!data.layers.length||data.layers.length>5)throw new Error('Invalid map data.');
 const seen=new Set();
 for(const layer of data.layers){
  if(!layer||typeof layer!=='object'||Object.keys(layer).some(k=>!['id','kind','label','color','paths','sourceUrl','sourceLabel','distanceKm','ascentM','distanceMode','routeFile'].includes(k)))throw new Error('Unexpected map fields.');
  if(!/^[a-z0-9-]+$/.test(layer.id??'')||seen.has(layer.id)||!['personal','guide'].includes(layer.kind)||typeof layer.label!=='string'||!layer.label.trim()||layer.label.length>120||!/^#[0-9a-f]{6}$/i.test(layer.color??''))throw new Error('Invalid map layer.');
  seen.add(layer.id);
  if(layer.distanceKm!=null&&(!Number.isFinite(layer.distanceKm)||layer.distanceKm<=0))throw new Error('Invalid route length.');
  if(layer.ascentM!=null&&(!Number.isFinite(layer.ascentM)||layer.ascentM<0||layer.ascentM>100000))throw new Error('Invalid elevation gain.');
  if(layer.distanceMode!=null&&!['total','one-way','loop','out-and-back','one-way-guide'].includes(layer.distanceMode))throw new Error('Invalid distance description.');
  if(layer.routeFile!=null&&(layer.kind!=='personal'||!/^\/assets\/routes\/[a-z0-9]+(?:-[a-z0-9]+)*\.gpx$/.test(layer.routeFile)))throw new Error('Invalid prepared GPX path.');
  if(layer.kind==='guide'&&(!/^https:\/\//.test(layer.sourceUrl??'')||typeof layer.sourceLabel!=='string'||!Number.isFinite(layer.distanceKm)||layer.distanceKm<=0))throw new Error('Public guide maps need a source and length.');
  if(!Array.isArray(layer.paths)||!layer.paths.length||layer.paths.length>100)throw new Error('Invalid map paths.');
  for(const path of layer.paths)if(!Array.isArray(path)||path.length<2||path.length>20000||path.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180))throw new Error('Maps must contain latitude/longitude pairs only.');
 }
 return data;
}
