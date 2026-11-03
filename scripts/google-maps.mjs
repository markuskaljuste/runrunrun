export function googleMyMap(value){
 if(value==null||value==='')return null;
 if(typeof value!=='string')throw new Error('Paste a Google My Maps link.');
 const text=value.trim();if(!text)return null;
 let url;try{url=new URL(text);}catch{throw new Error('Paste a complete Google My Maps link.');}
 const id=url.searchParams.get('mid');
 if(url.protocol!=='https:'||!['www.google.com','google.com'].includes(url.hostname)||url.port||url.username||url.password||!/^\/maps\/d\/(?:u\/\d+\/)?(?:edit|viewer|embed)\/?$/.test(url.pathname)||url.searchParams.getAll('mid').length!==1||!/^[A-Za-z0-9_-]{8,160}$/.test(id??''))throw new Error('Use the sharing link from Google My Maps, including mid=.');
 return {id,embedUrl:'https://www.google.com/maps/d/embed?mid='+id+'&hl=en',viewerUrl:'https://www.google.com/maps/d/viewer?mid='+id};
}
