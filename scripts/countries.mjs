import {esc} from './core.mjs';
export const countrySlug=post=>post.country||'general';
export function countryName(slug,lang,data){return slug==='general'?(lang==='et'?'Üldine':'General'):data.countries.find(c=>c.slug===slug)?.[lang].name||slug;}
export function countryGroups(data,lang){
 const posts=data.posts.filter(p=>p.status==='published').sort((a,b)=>b.date.localeCompare(a.date));
 const groups=data.countries.map(country=>({slug:country.slug,name:country[lang].name,description:country[lang].description||'',posts:posts.filter(p=>p.country===country.slug)})).filter(g=>g.posts.length).sort((a,b)=>a.name.localeCompare(b.name,lang));
 const general=posts.filter(p=>!p.country);if(general.length)groups.push({slug:'general',name:countryName('general',lang,data),description:lang==='et'?'Isiklikud lood, mis ei kuulu ühe kindla riigi alla.':'Personal stories that are not filed under a single country.',posts:general});
 return groups;
}
export function countryBrowse({data,lang,url,full=false}){
 const groups=countryGroups(data,lang);if(!groups.length)return '';
 const links=groups.map(g=>`<a class="country-link" href="${url('/'+lang+'/countries/'+g.slug+'/')}"><span>${esc(g.name)}</span><small>${g.posts.length} ${lang==='et'?'lugu':g.posts.length===1?'story':'stories'}</small><span aria-hidden="true">↗</span></a>`).join('');
 return full?`<div class="country-grid">${links}</div>`:`<div class="country-discovery"><div class="eyebrow">${lang==='et'?'Lood riikide kaupa':'Stories by country'}</div><div class="country-links">${links}</div></div>`;
}
export function buildCountryPages({data,lang,url,write,shell,card}){
 const groups=countryGroups(data,lang),heading=lang==='et'?'Lood riikide kaupa':'Stories by country';
 const intro=lang==='et'?'Vali riik ja leia selle alla kogutud blogilood.':'Choose a country to explore its journal entries.';
 const all=lang==='et'?'Kõik lood':'All stories';
 write('/'+lang+'/countries/',shell(lang,'countries/',heading,intro,`<section class="section page-heading"><a class="breadcrumb" href="${url('/'+lang+'/journal/')}">← ${all}</a><div class="eyebrow">${lang==='et'?'Päevik / Riigid':'Journal / Countries'}</div><h1>${heading}</h1><p>${intro}</p></section><section class="section country-index">${countryBrowse({data,lang,url,full:true})||`<p>${lang==='et'?'Avaldatud lugusid veel pole.':'No published stories yet.'}</p>`}</section>`));
 for(const group of groups){
  const path='countries/'+group.slug+'/',description=group.description||(lang==='et'?`Blogilood kategoorias ${group.name}.`:`Journal entries filed under ${group.name}.`);
  write('/'+lang+'/'+path,shell(lang,path,group.name+' · '+(lang==='et'?'Jooksu- ja reisilood':'Running & travel stories'),description,`<section class="section page-heading"><a class="breadcrumb" href="${url('/'+lang+'/countries/')}">← ${heading}</a><div class="eyebrow">${lang==='et'?'Päevik / Riik':'Journal / Country'}</div><h1>${esc(group.name)}</h1><p>${esc(description)}</p><a class="text-link country-all" href="${url('/'+lang+'/journal/')}">${all} ↗</a></section><section class="section listing"><div class="listing-tools"><span>${group.posts.length} ${lang==='et'?'lugu':group.posts.length===1?'story':'stories'}</span><label class="search"><span aria-hidden="true">⌕</span><input type="search" placeholder="${lang==='et'?'Otsi selle riigi lugusid':'Search these stories'}" aria-label="${lang==='et'?'Otsi lugusid':'Search stories'}"></label></div><p class="results-count" aria-live="polite">${group.posts.length} ${lang==='et'?'lugu':group.posts.length===1?'story':'stories'}</p><div class="card-grid" data-list>${group.posts.map(p=>card(p,lang)).join('')}</div><p class="empty-state" hidden>${lang==='et'?'Vasteid ei leitud. Proovi teist sõna.':'No matches. Try another word.'}</p></section>`));
 }
}
