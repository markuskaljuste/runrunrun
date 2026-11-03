export function isRouteFile(value){
 let path=String(value??'');
 try{path=decodeURIComponent(new URL(path,'https://runograph.invalid/').pathname);}catch{path=path.split(/[?#]/)[0];}
 return /\.(?:gpx|kml)$/i.test(path);
}
