import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import {root,readContent,validateRecord} from './core.mjs';
const port=Number(process.env.PORT||4173),token=randomBytes(32).toString('hex');
const dist=resolve(root,'dist');
function build(){const result=spawnSync(process.execPath,[resolve(root,'scripts/build.mjs')],{cwd:root,encoding:'utf8',env:{...process.env,BASE_PATH:'',SITE_URL:''}});if(result.status!==0)throw new Error(result.stderr||'Build failed.');}
build();
function send(res,status,data,type='application/json'){res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store'});res.end(type==='application/json'?JSON.stringify(data):data);}
async function body(req){const chunks=[];let length=0;for await (const chunk of req){length+=chunk.length;if(length>12_000_000)throw new Error('File is too large. Maximum 8 MB.');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
const server=http.createServer(async(req,res)=>{
 try{
  if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(req.headers.host))return send(res,403,{error:'Use the localhost preview URL.'});
  const path=new URL(req.url,`http://localhost:${port}`).pathname;
  if(path==='/api/session'&&req.method==='GET')return send(res,200,{token});
  if(path==='/api/content'&&req.method==='GET')return send(res,200,readContent());
  if(path.startsWith('/api/')){
   const expected=`http://${req.headers.host}`;
   if(req.method!=='POST'||req.headers.origin!==expected||req.headers['x-editor-token']!==token)return send(res,403,{error:'Reopen the local editor to save changes.'});
   const input=await body(req);
   if(path==='/api/save'){
    const {type,item,originalSlug}=input;
    if(!['site','branding','images','seo','posts','routes'].includes(type))throw new Error('Unknown content type.');
    validateRecord(type,item);
    const settings=['site','branding','images','seo'].includes(type);
    if(!settings&&originalSlug&&originalSlug!==item.slug)throw new Error('Keep the URL of an existing entry. Create a new entry to use a new URL.');
    const file=settings?resolve(root,'content',type+'.json'):resolve(root,'content',type,item.slug+'.json');
    if(!settings&&!originalSlug&&existsSync(file))throw new Error('That URL already exists. Choose another slug.');
    const previous=existsSync(file)?readFileSync(file):null;
    const temp=file+'.tmp';writeFileSync(temp,JSON.stringify(item,null,2)+'\n');renameSync(temp,file);
    try{build();}catch(error){if(previous)writeFileSync(file,previous);else unlinkSync(file);build();throw error;}
    return send(res,200,{ok:true,content:readContent()});
   }
   if(path==='/api/media'){
    const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(input.data??'');
    if(!match)throw new Error('Choose a JPG, PNG or WebP image.');
    const bytes=Buffer.from(match[2],'base64');if(bytes.length>8_000_000)throw new Error('Maximum image size is 8 MB.');
    const valid=match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216:match[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
    if(!valid)throw new Error('The image format could not be verified.');
    const name=`${Date.now()}-${randomBytes(4).toString('hex')}.${match[1]==='jpeg'?'jpg':match[1]}`;
    const folder=resolve(root,'public/assets/uploads');mkdirSync(folder,{recursive:true});writeFileSync(resolve(folder,name),bytes);build();return send(res,200,{path:'/assets/uploads/'+name});
   }
   return send(res,404,{error:'Unknown editor action.'});
  }
  if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed.'});
  let file=resolve(dist,'.'+decodeURIComponent(path));
  if(!file.startsWith(dist+sep)&&file!==dist)return send(res,403,{error:'Forbidden.'});
  if(existsSync(file)&&statSync(file).isDirectory()){
   if(!path.endsWith('/')){res.writeHead(301,{Location:path+'/'});return res.end();}
   file=resolve(file,'index.html');
  }
  if(!existsSync(file))return send(res,404,readFileSync(resolve(dist,'404.html')),'text/html; charset=utf-8');
  const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.xml':'application/xml','.txt':'text/plain'};
  send(res,200,req.method==='HEAD'?'':readFileSync(file),mime[extname(file)]||'application/octet-stream');
 }catch(error){send(res,400,{error:error.message});}
});
server.listen(port,'127.0.0.1',()=>console.log(`RUN / ROAM\nLocal: http://localhost:${port}/en/\nEditor: http://localhost:${port}/admin/\nLocal editing writes to content/ and rebuilds the preview. Press Ctrl+C to stop.`));
