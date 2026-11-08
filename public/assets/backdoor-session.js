(()=>{
 const session=globalThis.RunographReaderSession,key=session.key;let locked=false;
 const check=()=>{if(!locked&&!session.read()){locked=true;document.documentElement.hidden=true;location.reload();}};
 const base=new URL(document.currentScript.src).pathname.replace(/\/assets\/backdoor-session\.js$/,'');
 for(const button of document.querySelectorAll('[data-reader-logout]'))button.addEventListener('click',()=>{session.clear();locked=true;document.documentElement.hidden=true;location.replace(base+'/backdoor/');});
 // A cached Back navigation must not reopen a page after sign-out or expiry.
 addEventListener('pageshow',check);
 addEventListener('focus',check);
 addEventListener('storage',event=>{if(event.key===key||event.key===null){session.clearTab();check();}});
})();
