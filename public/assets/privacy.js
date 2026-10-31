/* Runograph: optional analytics is loaded only after a stored or explicit opt-in. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s), key='runograph-consent', lifetime=180*24*60*60*1000;
 let config;try{config=JSON.parse($('#runograph-integrations').textContent);}catch{return;}
 const et=document.documentElement.lang==='et',id=config.id||'';
 const available=config.enabled===true&&/^G-[A-Z0-9]{4,30}$/.test(id)&&config.allowAnalytics===true&&location.protocol==='https:'&&!location.hostname.endsWith('.chatgpt.site');
 const banner=$('#cookie-banner'),dialog=$('#cookie-dialog'),checkbox=$('#cookie-analytics'),status=$('#cookie-analytics-status');
 if(!banner||!dialog||!checkbox||!status)return;
 let loaded=false,choice=null;
 const cleanUrl=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)?u.origin+u.pathname:'';}catch{return '';}};
 function stored(){try{const c=JSON.parse(localStorage.getItem(key)),now=Date.now();return c&&c.version===config.version&&typeof c.analytics==='boolean'&&Number.isFinite(c.updatedAt)&&Number.isFinite(c.expiresAt)&&c.updatedAt<=now&&c.expiresAt>now&&c.expiresAt<=c.updatedAt+lifetime?c:null;}catch{return null;}}
 function clearCookies(){
  const names=document.cookie.split(';').map(c=>c.split('=')[0].trim()).filter(n=>/^_?runograph(?:_|$)/i.test(n));
  for(const name of names)for(const path of new Set([config.basePath,'/']))for(const domain of ['',location.hostname,'.'+location.hostname])document.cookie=`${name}=; Max-Age=0; Path=${path}; SameSite=Lax; Secure${domain?'; Domain='+domain:''}`;
 }
 function disable(){
  if(id)window['ga-disable-'+id]=true;
  if(loaded)window.gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  clearCookies();
 }
 function start(){
  if(!available||loaded||!choice?.analytics)return;
  window['ga-disable-'+id]=false;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments);};
  window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.gtag('js',new Date());
  window.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_prefix:'runograph',cookie_domain:location.hostname,cookie_path:config.basePath,cookie_expires:15552000,cookie_update:true,cookie_flags:'SameSite=Lax;Secure',page_location:cleanUrl(location.href),page_referrer:cleanUrl(document.referrer)});
  window.gtag('event','page_view',{page_location:cleanUrl(location.href),page_referrer:cleanUrl(document.referrer)});
  const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);script.id='runograph-google-tag';
  loaded=true;document.head.appendChild(script);
 }
 function render(){
  banner.hidden=!available||choice!==null;
  checkbox.disabled=!available;checkbox.checked=available&&choice?.analytics===true;
  status.textContent=!config.enabled?(et?'Analytics pole praegu sisse lülitatud.':'Analytics is currently switched off.'):!available?(et?'Analytics ei tööta selles eelvaates või vajab veel seadistamist.':'Analytics is unavailable in this preview or still needs configuration.'):(et?'Laaditakse ainult sinu nõusolekul.':'Loads only with your permission.');
 }
 function close(){if(dialog.open)dialog.close();}
 function save(analytics){
  const now=Date.now(),wasLoaded=loaded;choice={version:config.version,analytics:available&&analytics===true,updatedAt:now,expiresAt:now+lifetime};
  try{localStorage.setItem(key,JSON.stringify(choice));}catch{try{localStorage.removeItem(key);}catch{/* Choice remains in memory if browser storage is blocked. */}}
  close();render();if(choice.analytics)start();else{disable();if(wasLoaded)location.reload();}
 }
 for(const button of document.querySelectorAll('[data-consent]'))button.addEventListener('click',()=>save(button.dataset.consent==='accept'));
 for(const button of document.querySelectorAll('[data-cookie-settings]'))button.addEventListener('click',()=>{render();dialog.showModal();});
 $('#cookie-save').addEventListener('click',()=>save(checkbox.checked));
 $('#cookie-close').addEventListener('click',close);
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){choice=stored();render();if(choice?.analytics&&available)start();else{disable();if(loaded)location.reload();}}});
 choice=stored();if(id)window['ga-disable-'+id]=true;if(!choice?.analytics||!available)disable();render();if(choice?.analytics)start();
})();
