export const postPlaceSlugs=post=>post.places??(post.place?[post.place]:[]);
export const normalizePlaceName=name=>name.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase().replace(/[-\s]+/g,' ').trim();
export const storyPlaceKey=entry=>entry.place?'place:'+entry.place.slug:'name:'+normalizePlaceName(entry.name);

export function storyPlaceEntries(post,data,lang){
 const countries=post.countries??(post.country?[post.country]:[]);
 const candidates=(data.places??[]).filter(place=>place.status==='published'&&countries.includes(place.country));
 const entries=[],seen=new Set();
 function add(place,name){const key=place?'place:'+place.slug:'name:'+normalizePlaceName(name);if(seen.has(key))return;seen.add(key);entries.push({name:place?place[lang].name:name,place});}
 for(const slug of postPlaceSlugs(post)){const place=candidates.find(p=>p.slug===slug);if(place)add(place);}
 for(const name of post.placeNames??[]){const normalized=normalizePlaceName(name);const matches=candidates.filter(p=>[p.slug,p.en.name,p.et.name].some(value=>normalizePlaceName(value)===normalized));add(matches.length===1?matches[0]:null,name);}
 return entries;
}

export const storiesForPlace=(data,place)=>data.posts.filter(post=>post.status==='published'&&storyPlaceEntries(post,data,'en').some(entry=>entry.place?.slug===place.slug)).sort((a,b)=>b.date.localeCompare(a.date));
export const placeHasContent=(place,data)=>place.status==='published'&&(!place.comingSoon||storiesForPlace(data,place).length>0);
export const comparePlaces=(data,lang)=>(a,b)=>Number(placeHasContent(b,data))-Number(placeHasContent(a,data))||a[lang].name.localeCompare(b[lang].name,lang);
