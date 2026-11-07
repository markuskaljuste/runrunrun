import {mkdtempSync,rmSync,cpSync,readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {root,readContent} from './core.mjs';
import {salt,passphrase,cryptoEngine,codec,files,prepareReaderHtml,gatePage} from './backdoor.mjs';
const require=createRequire(import.meta.url);
const data=readContent(),dist=resolve(root,'dist'),base=(process.env.BASE_PATH??'').replace(/\/$/,'');
if(data.publication.mode!=='coming-soon'){console.log('Live mode: password preview is no longer needed.');process.exit(0);}
const password=process.env.READER_PREVIEW_PASSWORD;
if(!password||password.length<16)throw Error('Set the READER_PREVIEW_PASSWORD repository secret before building the reader preview.');
if(!existsSync(resolve(dist,'index.html'))||!readFileSync(resolve(dist,'index.html'),'utf8').includes('data-publication="coming-soon"'))throw Error('Build and check the public Coming soon page first.');
const staging=mkdtempSync(resolve(tmpdir(),'runograph-reader-'));
try{
 const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,env:{...process.env,PUBLIC_BUILD:'0',DRAFT_PREVIEW:'0',BUILD_DIRECTORY:staging,SITE_URL:'https://runograph.com',BASE_PATH:base},encoding:'utf8'});
 if(result.status!==0)throw Error('Reader site build failed: '+result.stderr);process.stdout.write(result.stdout);
 cpSync(resolve(staging,'assets'),resolve(dist,'assets'),{recursive:true});
 const license=require.resolve('staticrypt/LICENSE');cpSync(license,resolve(dist,'assets/staticrypt-LICENSE.txt'));
 const hashed=await cryptoEngine.hashPassword(passphrase(password),salt);let count=0;
 for(const source of files(staging).filter(p=>p.endsWith('.html'))){
  let path=relative(staging,source);
  if(path.startsWith('admin/')||path==='404.html')continue;
  if(path==='index.html')path='backdoor/index.html';
  if(path==='privacy/index.html')path='backdoor/privacy/index.html';
  // Keep all existing public Coming soon and privacy redirects intact.
  if(existsSync(resolve(dist,path)))continue;
  const html=prepareReaderHtml(readFileSync(source,'utf8'),base);
  const output=resolve(dist,path);mkdirSync(dirname(output),{recursive:true});
  writeFileSync(output,gatePage(await codec.encodeWithHashedPassword(html,hashed),base));count++;
 }
 console.log(`Built ${count} encrypted reader pages. Public Coming soon and privacy pages preserved.`);
}finally{rmSync(staging,{recursive:true,force:true});}
