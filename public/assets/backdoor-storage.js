(()=>{
 const key='runograph-reader-session-v1';
 const decode=value=>{try{const saved=JSON.parse(value);return saved&&/^[a-f0-9]{64}$/.test(saved.key)&&Number.isFinite(saved.expires)&&saved.expires>Date.now()?saved:null;}catch{return null;}};
 const stores=()=>['localStorage','sessionStorage'].map(name=>{try{return globalThis[name];}catch{return null;}});
 function clearTab(){try{globalThis.sessionStorage.removeItem(key);}catch{}}
 function clear(){for(const store of stores())try{store?.removeItem(key);}catch{}}
 function write(saved){
  if(!decode(JSON.stringify(saved)))return false;
  const [local,tab]=stores();let shared=false,temporary=false;
  const value=JSON.stringify({key:saved.key,expires:saved.expires,shared:true});
  try{local.setItem(key,value);shared=local.getItem(key)===value;}catch{}
  try{const fallback=JSON.stringify({key:saved.key,expires:saved.expires,shared});tab.setItem(key,fallback);temporary=tab.getItem(key)===fallback;}catch{}
  return shared||temporary;
 }
 function read(){
  const [local,tab]=stores();let available=false,saved=null,legacy=null;
  try{saved=decode(local.getItem(key));available=true;}catch{}
  if(saved){try{tab.setItem(key,JSON.stringify({...saved,shared:true}));}catch{}return saved;}
  try{legacy=decode(tab.getItem(key));}catch{}
  // Migrate a previous tab-only login without extending its original expiry.
  // A shared login removed in another tab must never be restored from a stale tab copy.
  if(legacy&&(!available||!legacy.shared)){write(legacy);return legacy;}
  clear();return null;
 }
 globalThis.RunographReaderSession=Object.freeze({key,read,write,clear,clearTab});
})();
