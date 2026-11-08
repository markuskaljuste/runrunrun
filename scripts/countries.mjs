import {renderRating} from './ratings.mjs';
import {compareStoryRatings} from './rating-data.mjs';
import {shareBar} from './engagement.mjs';
import {esc,safeUrl,markdown,postCountries} from './core.mjs';
import {storiesForPlace,placeHasContent,comparePlaces,storyPlaceEntries,publishedStoryPlaces} from './story-places.mjs';

export const countrySlugs=post=>postCountries(post).length?postCountries(post):['general'];
export function countryName(slug,lang,data){return slug==='general'?(lang==='et'?'Üldine':'General'):data.countries.find(c=>c.slug===slug)?.[lang].name||slug;}
export const publishedPlaces=data=>(data.places??[]).filter(p=>p.status==='published');
const asset=(path,url)=>{const value=path||'/assets/forest.jpg';return value.startsWith('/')?url(value):safeUrl(value);};
const quantity=(count,lang,kind)=>lang==='et'?`${count} ${kind==='places'?(count===1?'paik':'paika'):kind==='countries'?(count===1?'riik':'riiki'):'lugu'}`:`${count} ${kind==='places'?(count===1?'place':'places'):kind==='countries'?(count===1?'country':'countries'):(count===1?'story':'stories')}`;
const pendingLabel=lang=>lang==='et'?'Info varsti':'Coming soon';
const pendingBadge=lang=>`<span class="destination-state">${pendingLabel(lang)}</span>`;

export function countryGroups(data,lang){
 const posts=data.posts.filter(p=>p.status==='published').sort((a,b)=>b.date.localeCompare(a.date)),places=publishedPlaces(data);
 const groups=data.countries.map(country=>{
  const group={listed:country.listed!==false,slug:country.slug,coverImage:country.coverImage||'',name:country[lang].name,description:country[lang].description||'',posts:posts.filter(p=>postCountries(p).includes(country.slug)),places:places.filter(p=>p.country===country.slug).sort(comparePlaces(data,lang)),storyPlaces:publishedStoryPlaces(data,lang,{country:country.slug})};
  group.hasContent=group.posts.length>0;
  return group;
 }).sort((a,b)=>b.posts.length-a.posts.length||a.name.localeCompare(b.name,lang));
 const general=posts.filter(p=>!postCountries(p).length);
 if(general.length)groups.push({slug:'general',name:countryName('general',lang,data),description:'',posts:general,places:[],storyPlaces:publishedStoryPlaces({...data,posts:general},lang),hasContent:true});
 return groups;
}

function countryCard(group,{data,lang,url}){
 const cover=group.posts.find(p=>p.image)??group.places.find(p=>placeHasContent(p,data))??group.places[0];
 const search=[group.name,...group.storyPlaces.map(p=>p.name),...group.posts.flatMap(p=>[p.en?.title,p.et?.title,...storyPlaceEntries(p,data,lang).map(e=>e.name)])].filter(Boolean).join(' ');
 return `<article class="card destination-card${group.hasContent?'':' destination-pending'}" data-has-content="${group.hasContent}" data-search="${esc(search)}" data-category="${esc(group.slug)}"><a class="destination-cover" aria-label="${esc(group.name)}${group.hasContent?'':': '+pendingLabel(lang)}" href="${url('/'+lang+'/countries/'+group.slug+'/')}"><img src="${esc(asset(group.coverImage||cover?.image,url))}" width="1000" height="700" alt="" loading="lazy">${group.storyPlaces.length?`<span class="destination-count">${quantity(group.storyPlaces.length,lang,'places')}</span>`:''}${group.hasContent?'':pendingBadge(lang)}</a><div class="destination-copy"><h2><a href="${url('/'+lang+'/countries/'+group.slug+'/')}">${esc(group.name)}</a></h2>${group.storyPlaces.length?`<p>${esc(group.storyPlaces.map(p=>p.name).join(' · '))}</p>`:''}${group.posts.length?`<small>${quantity(group.posts.length,lang,'stories')}</small>`:''}</div></article>`;
}

export function countryBrowse({data,lang,url,full=false}){
 const groups=countryGroups(data,lang),countries=groups.filter(g=>g.slug!=='general'&&g.listed!==false);
 if(full)return `<div class="destination-grid" data-list data-count-kind="countries">${countries.map(g=>countryCard(g,{data,lang,url})).join('')}</div>${groups.some(g=>g.slug==='general')?`<a class="text-link general-stories" href="${url('/'+lang+'/countries/general/')}">${lang==='et'?'Üldised jooksulood':'General running stories'}</a>`:''}`;
 if(!countries.length)return '';
 return `<div class="country-discovery"><div class="destination-discovery-heading"><h2>${lang==='et'?'Kus olen jooksnud':'Destination stories'}</h2><a class="text-link" href="${url('/'+lang+'/countries/')}">${lang==='et'?'Vaata kõiki riike':'Explore all countries'}</a></div><div class="country-links">${countries.slice(0,6).map(g=>`<a class="country-link" href="${url('/'+lang+'/countries/'+g.slug+'/')}"><span>${esc(g.name)}</span><small>${g.hasContent?quantity(g.posts.length,lang,'stories'):pendingLabel(lang)}</small></a>`).join('')}</div></div>`;
}

export function placeCard(place,{data,lang,url}){
 const v=place[lang],country=countryName(place.country,lang,data),ready=placeHasContent(place,data),stories=storiesForPlace(data,place);
 return `<article class="card destination-card place-card${ready?'':' destination-pending'}" data-has-content="${ready}" data-search="${esc([v.name,v.region,country,v.excerpt].join(' '))}" data-category="${esc(place.country)}"><a class="destination-cover" aria-label="${esc(v.name)}${ready?'':': '+pendingLabel(lang)}" href="${url('/'+lang+'/places/'+place.slug+'/')}"><img src="${esc(asset(place.image,url))}" width="1000" height="700" alt="" loading="lazy">${ready?(stories.length?`<span class="destination-count">${quantity(stories.length,lang,'stories')}</span>`:''):pendingBadge(lang)}</a><div class="destination-copy"><div class="eyebrow">${esc([v.region,country].filter(Boolean).join(' · '))}</div><h3><a href="${url('/'+lang+'/places/'+place.slug+'/')}">${esc(v.name)}</a></h3>${ready?`<p>${esc(place.comingSoon?(lang==='et'?'Ava selle paiga jooksulood.':'Read the running stories from this place.'):v.excerpt)}</p>`:''}</div></article>`;
}

export function buildCountryPages({data,lang,url,write,shell,card}){
 const groups=countryGroups(data,lang),countries=groups.filter(g=>g.slug!=='general'&&g.listed!==false),et=lang==='et',heading=et?'Kus olen jooksnud':'Destination stories';
 const intro=et?'Riigid, linnad ja paigad, kuhu jooksutossud on mind viinud.':'Countries, cities and places I’ve explored in my running shoes.';
 write('/'+lang+'/countries/',shell(lang,'countries/',heading,intro,`<section class="section page-heading destination-heading"><div class="eyebrow">${et?'Runograph / Jooksupaigad':'Runograph / Running places'}</div><h1>${heading}</h1><p>${intro}</p><div class="destination-totals"><span>${quantity(countries.length,lang,'countries')}</span><span>${quantity(publishedStoryPlaces(data,lang).length,lang,'places')}</span><a href="${url('/'+lang+'/places/')}">${et?'Kõik jooksukohad':'All running places'}</a></div></section><section class="section destination-index"><div class="listing-tools"><span class="results-count" aria-live="polite">${quantity(countries.length,lang,'countries')}</span><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="${et?'Otsi riiki või kohta':'Search countries or places'}" aria-label="${et?'Otsi riiki või kohta':'Search countries or places'}"></label></div>${countryBrowse({data,lang,url,full:true})}<p class="empty-state" hidden>${et?'Vasteid ei leitud.':'No matches found.'}</p></section>`));
 for(const group of groups){
  const path='countries/'+group.slug+'/',description=et?'Lood sellest riigist.':'Stories from this country.';
  const cover=group.posts.find(p=>p.image)??group.places[0];
  const header=`<section class="section country-heading"><a class="breadcrumb" href="${url('/'+lang+'/countries/')}">${heading}</a><h1>${esc(group.name)}</h1><p>${description}</p></section>`;
  const items=[...group.posts].sort(compareStoryRatings).map(p=>card(p,lang,{showScore:true})).join('');
  const grid=`<section class="section country-content" aria-label="${description}"><div class="destination-grid country-content-grid">${items}</div>${items?'':`<p class="country-empty">${et?'Lood on tulekul.':'Stories coming soon.'}</p>`}</section>`;
  write('/'+lang+'/'+path,shell(lang,path,group.name+' · '+(et?'Jooksupaigad':'Running places'),description,header+grid,{ogImage:group.coverImage||cover?.image,noindex:!group.hasContent}));
 }
}


function storyPlaceCard(group,{data,lang,url}){
 const href=group.place?url('/'+lang+'/places/'+group.place.slug+'/'):url('/'+lang+'/journal/')+'?place='+encodeURIComponent(group.key);
 const cover=group.posts.find(p=>p.image)?.image;
 const countries=group.countries.map(c=>countryName(c,lang,data)).join(' · ');
 return `<article class="card destination-card place-card" data-has-content="true" data-search="${esc([group.name,countries,...group.posts.map(p=>p.en.title)].join(' '))}" data-category="${esc(group.countries.join(' '))}"><a class="destination-cover" aria-label="${esc(group.name)}" href="${href}"><img src="${esc(asset(cover,url))}" width="1000" height="700" alt="" loading="lazy"><span class="destination-count">${quantity(group.posts.length,lang,'stories')}</span></a><div class="destination-copy"><div class="eyebrow">${esc(countries)}</div><h3><a href="${href}">${esc(group.name)}</a></h3><p>${lang==='et'?'Loe selle paiga jooksulugusid.':'Read the running stories from this place.'}</p></div></article>`;
}

export function buildPlacePages({data,lang,url,write,shell,card,base}){
 const et=lang==='et',places=publishedPlaces(data).sort(comparePlaces(data,lang)),visible=publishedStoryPlaces(data,lang),countries=countryGroups(data,lang).filter(g=>g.storyPlaces.length);
 const title=et?'Kõik jooksukohad':'All running places';
 write('/'+lang+'/places/',shell(lang,'places/',title,et?'Linnad ja paigad, kus olen jooksnud.':'Cities and places where I’ve run.',`<section class="section page-heading destination-heading"><a class="breadcrumb" href="${url('/'+lang+'/countries/')}">${et?'Kõik riigid':'All countries'}</a><div class="eyebrow">Runograph</div><h1>${title}</h1><p>${quantity(visible.length,lang,'places')}</p></section><section class="section destination-index"><div class="listing-tools"><label class="country-select">${et?'Riik':'Country'}<select data-country-filter><option value="all">${et?'Kõik riigid':'All countries'}</option>${countries.map(c=>`<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('')}</select></label><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="${et?'Otsi jooksukohta':'Search running places'}" aria-label="${et?'Otsi jooksukohta':'Search running places'}"></label></div><p class="results-count" aria-live="polite">${quantity(visible.length,lang,'places')}</p><div class="destination-grid" data-list data-count-kind="places">${visible.map(p=>storyPlaceCard(p,{data,lang,url})).join('')}</div><p class="empty-state" hidden>${et?'Vasteid ei leitud.':'No matches found.'}</p></section>`));
 for(const p of places){
  const v=p[lang],country=countryName(p.country,lang,data),stories=storiesForPlace(data,p),siblings=places.filter(q=>q.country===p.country&&q.slug!==p.slug&&storiesForPlace(data,q).length>0),credit=(data.photoCredits??[]).find(c=>c.path===p.image),ready=placeHasContent(p,data);
  const compact=p.comingSoon&&stories.length>0,description=compact?(et?v.name+' jooksulood.':'Running stories from '+v.name+'.'):v.excerpt;
  const heading=`<section class="section page-heading place-heading${compact?' place-heading-compact':''}"><a class="breadcrumb" href="${url('/'+lang+'/countries/'+p.country+'/')}">${esc(country)}</a><div class="eyebrow">${esc([v.region,country].filter(Boolean).join(' · '))}</div><h1>${esc(v.name)}</h1>${!ready?`<span class="place-status">${pendingLabel(lang)}</span>`:!compact?`<p>${esc(v.excerpt)}</p>`:''}</section>`;
  const creditHtml=credit?`<span> · ${esc(credit.author)} · <a href="${esc(safeUrl(credit.sourceUrl))}" target="_blank" rel="noopener noreferrer">${et?'Foto allikas':'Photo source'}</a> · <a href="${esc(safeUrl(credit.licenseUrl))}" target="_blank" rel="noopener noreferrer">${esc(credit.license)}</a></span>`:'';
  const caption=v.imageCaption||(et?'Illustratiivne kohapilt, mitte autori foto.':'Illustrative location image; not the author’s photograph.');
  const article=compact?'':`<figure class="place-image"><img src="${esc(asset(p.image,url))}" alt="${esc(v.imageAlt||v.name)}" width="1600" height="1000" fetchpriority="high"><figcaption>${esc(caption)}${creditHtml}</figcaption></figure><section class="section place-body"><div class="prose">${markdown(v.body,base)}${renderRating(p,lang)}${shareBar({data,lang,path:`/${lang}/places/${p.slug}/`,title:v.name})}</div></section>`;
  const related=stories.length?`<section class="section place-stories${compact?' place-stories-compact':''}"><div class="section-heading"><h2>${et?'Lood sellest paigast':'Stories from this place'}</h2></div><div class="card-grid">${stories.map(s=>card(s,lang)).join('')}</div></section>`:'';
  const more=siblings.length?`<section class="section sibling-places"><div class="section-heading"><h2>${et?'Veel sama riigi jooksukohti':'More running places in this country'}</h2></div><div class="destination-grid">${siblings.slice(0,3).map(q=>placeCard(q,{data,lang,url})).join('')}</div></section>`:'';
  write('/'+lang+'/places/'+p.slug+'/',shell(lang,'places/'+p.slug+'/',v.name+' · '+country,description,heading+article+related+more,{ogImage:p.image,seo:v,noindex:!ready,ogType:'website'}));
 }
}
