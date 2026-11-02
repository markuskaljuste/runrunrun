import {extname} from 'node:path';
export const attachmentExtensions=['gpx','pdf','txt','csv','zip'];
export function attachmentUpload(input){
 const extension=extname(input.name??'').slice(1).toLowerCase();
 if(!attachmentExtensions.includes(extension))throw new Error('Choose a GPX, PDF, TXT, CSV or ZIP file.');
 const match=/^data:[^;,]*(?:;charset=[^;,]+)?;base64,([A-Za-z0-9+/=]+)$/.exec(input.data??'');
 if(!match)throw new Error('The file could not be read.');
 const bytes=Buffer.from(match[1],'base64');if(!bytes.length||bytes.length>8_000_000)throw new Error('Maximum file size is 8 MB.');
 if(extension==='gpx'){
  const text=bytes.toString('utf8');
  if(!/<(?:[a-z\d_]+:)?gpx\b/i.test(text)||!/<\/(?:[a-z\d_]+:)?gpx\s*>/i.test(text)||/<!DOCTYPE|<!ENTITY|<script\b/i.test(text))throw new Error('Choose a valid GPX file.');
 }
 if(extension==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Choose a valid PDF file.');
 if(extension==='zip'&&!['504b0304','504b0506','504b0708'].includes(bytes.subarray(0,4).toString('hex')))throw new Error('Choose a valid ZIP file.');
 if(['txt','csv'].includes(extension)&&bytes.includes(0))throw new Error('Choose a plain-text file.');
 const basename=(input.name??'file').split(/[\\/]/).pop().replace(/\.[^.]*$/,'').normalize('NFKD').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'file';
 return {bytes,extension,basename};
}
