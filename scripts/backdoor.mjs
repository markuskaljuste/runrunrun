import {readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {createRequire} from 'node:module';
import {root} from './core.mjs';
const require=createRequire(import.meta.url);
export const cryptoEngine=require('staticrypt/lib/cryptoEngine.js');
export const codec=require('staticrypt/lib/codec.js').init(cryptoEngine);
const {buildStaticryptJS}=require('staticrypt/cli/helpers.js');
export const username='Runrunrun';
// A salt is public. Keep it stable so a tab can stay signed in across CMS updates.
export const salt='570ab2714b3896ffbdc8af612924e897';
export const sessionKey='runograph-reader-session-v1';
export const sessionDuration=12*60*60*1000;
export const passphrase=password=>JSON.stringify([username,password]);
export function files(folder){return readdirSync(folder).flatMap(name=>{const path=resolve(folder,name);return statSync(path).isDirectory()?files(path):[path];});}
export function routePath(path,folder){return '/'+relative(folder,path).split(sep).join('/').replace(/index\.html$/,'');}
export function prepareReaderHtml(html,base=''){
 // Resolve old preview/local links too, if one has been pasted into a CMS story.
 html=html.replace(/https?:\/\/(?:[a-z0-9.-]+\.chatgpt\.site|(?:localhost|127\.0\.0\.1)(?::\d+)?)(?=[/"'\s<])/gi,'https://runograph.com');
 html=html.replace(/(["'])https:\/\/(?:www\.)?runograph\.com(?=\/)/g,'$1');
 html=html.replace(/(["'])\/en(?=\/)/g,'$1');
 html=html.replace(/(["'])\/credits\//g,'$1/photo_credits/');
 html=html.replace(new RegExp(`(["'])${base}/privacy/`, 'g'),`$1${base}/backdoor/privacy/`);
 html=html.replace(new RegExp(`(["'])${base}/(?=["'#?])`, 'g'),`$1${base}/backdoor/`);
 html=html.replace(/<a\b[^>]*href="[^"]*\/admin\/"[^>]*>[\s\S]*?<\/a>/g,'');
 html=html.replace(/<meta name="robots" content="[^"]*">/g,'<meta name="robots" content="noindex,nofollow">');
 // Reader previews should not pollute the launch site's Analytics.
 html=html.replace(/(<script type="application\/json" id="runograph-integrations">)([\s\S]*?)(<\/script>)/,(_,open,json,close)=>open+JSON.stringify({...JSON.parse(json),allowAnalytics:false})+close);
 const control=`<button type="button" data-reader-logout>Sign out</button>`;
 html=html.replace(/(<div class="footer-bottom">[\s\S]*?<div>)/,'$1'+control);
 return html.replace('</head>',`<script src="${base}/assets/backdoor-session.js" defer></script></head>`);
}
export function gatePage(encrypted,base=''){
 const config={staticryptEncryptedMsgUniqueVariableName:encrypted,staticryptSaltUniqueVariableName:salt,isRememberEnabled:false,rememberDurationInDays:0};
 return readFileSync(resolve(root,'scripts/backdoor-template.html'),'utf8')
 .replaceAll('@@BASE@@',base).replace('@@CONFIG@@',JSON.stringify(config)).replace('@@CRYPT@@',buildStaticryptJS())
 .replace('@@SESSION_KEY@@',JSON.stringify(sessionKey)).replace('@@SESSION_DURATION@@',String(sessionDuration));
}
export function payload(html){const match=html.match(/const readerConfig=(\{[^\n]+\});/);if(!match)throw Error('Missing encrypted reader payload.');return JSON.parse(match[1]);}
