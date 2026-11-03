export function metres(a,b){
 const rad=Math.PI/180,x=a[0]*rad,y=b[0]*rad;
 return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin((y-x)/2)**2+Math.cos(x)*Math.cos(y)*Math.sin((b[1]-a[1])*rad/2)**2)));
}
export function prepareRoute(points,{maxGapMetres=250}={}){
 if(!Array.isArray(points)||points.length<2||points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180))throw new Error('Invalid route geometry.');
 const paths=[];let path=[];
 const finish=()=>{if(path.length>1)paths.push(path);path=[];};
 for(const point of points){
  const p=point.map(n=>Number(n.toFixed(5)));
  if(path.length&&metres(path.at(-1),p)>maxGapMetres)finish();
  if(!path.length||metres(path.at(-1),p)>1)path.push(p);
 }
 finish();return paths;
}
