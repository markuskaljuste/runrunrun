export function metres(a,b){
 const rad=Math.PI/180,x=a[0]*rad,y=b[0]*rad;
 return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin((y-x)/2)**2+Math.cos(x)*Math.cos(y)*Math.sin((b[1]-a[1])*rad/2)**2)));
}
export function edgeClearance(a,b,centre){
 const rad=Math.PI/180,scale=6371000*rad,cos=Math.cos(centre[0]*rad);
 const point=p=>[(p[1]-centre[1])*scale*cos,(p[0]-centre[0])*scale];
 const x=point(a),y=point(b),dx=y[0]-x[0],dy=y[1]-x[1];
 const t=Math.max(0,Math.min(1,-(x[0]*dx+x[1]*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(x[0]+t*dx,x[1]+t*dy);
}
export function clipPersonalRoute(points,{hideMetres=1000,maxGapMetres=250}={}){
 if(!Array.isArray(points)||points.length<2||points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>90||Math.abs(p[1])>180))throw new Error('Invalid route geometry.');
 const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+metres(points[i-1],points[i]));
 const centres=[points[0],points.at(-1)],paths=[];let path=[];
 const finish=()=>{if(path.length>1)paths.push(path);path=[];};
 for(let i=0;i<points.length;i++){
  const p=points[i].map(n=>Number(n.toFixed(5)));
  const outside=distances[i]>=hideMetres&&distances.at(-1)-distances[i]>=hideMetres&&centres.every(c=>metres(c,p)>hideMetres+50);
  if(!outside){finish();continue;}
  if(path.length&&(metres(path.at(-1),p)>maxGapMetres||centres.some(c=>edgeClearance(path.at(-1),p,c)<=hideMetres+30)))finish();
  if(!path.length||metres(path.at(-1),p)>1)path.push(p);
 }
 finish();return paths;
}
