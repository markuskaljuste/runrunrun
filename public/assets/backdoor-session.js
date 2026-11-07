(()=>{
 const key='runograph-reader-session-v1';
 const valid=()=>{try{const saved=JSON.parse(sessionStorage.getItem(key));return Boolean(saved&&/^[a-f0-9]{64}$/.test(saved.key)&&saved.expires>Date.now());}catch{return false;}};
 const base=new URL(document.currentScript.src).pathname.replace(/\/assets\/backdoor-session\.js$/,'');
 for(const button of document.querySelectorAll('[data-reader-logout]'))button.addEventListener('click',()=>{try{sessionStorage.removeItem(key);}catch{}document.documentElement.hidden=true;location.replace(base+'/backdoor/');});
 // A cached Back navigation must not reopen a page after sign-out or expiry.
 addEventListener('pageshow',()=>{if(!valid()){document.documentElement.hidden=true;location.reload();}});
 addEventListener('focus',()=>{if(!valid()){document.documentElement.hidden=true;location.reload();}});
})();
