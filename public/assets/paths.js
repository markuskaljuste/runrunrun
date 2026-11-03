// English is the default website language; other languages prefix their articles.
export function canonicalPath(path){
 const result=String(path).replace(/^\/en(?=\/|[?#]|$)/,'');
 return !result||/^[?#]/.test(result)?'/'+result:result;
}
export function languagePath(language,path=''){
 return canonicalPath('/'+language+'/'+String(path).replace(/^\/+/,''));
}
