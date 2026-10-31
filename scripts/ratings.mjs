import {esc} from './core.mjs';
import {ratingCriteria,ratingAverage} from './rating-data.mjs';
export {ratingCriteria,ratingAverage} from './rating-data.mjs';
export function renderRating(place,lang){
 if(!place?.ratings?.enabled)return '';const et=lang==='et',ratings=place.ratings,average=ratingAverage(ratings),score=new Intl.NumberFormat(et?'et-EE':'en-GB',{maximumFractionDigits:1,minimumFractionDigits:1}).format(average);
 return `<section class="destination-rating" aria-label="${et?'Runographi hinnang':'Runograph score'}"><div class="rating-header"><div><div class="eyebrow">${et?'Minu jooksukogemus':'My running experience'}</div><h2>${et?'Runographi hinnang':'Runograph score'}</h2><p>${et?'Viie näitaja keskmine. Suurem hinne tähendab paremat kogemust.':'The average of five criteria. Higher scores mean a better experience.'}</p></div><div class="rating-overall" aria-label="${esc(score)} / 10"><strong>${esc(score)}</strong><span>/ 10</span></div></div><div class="rating-criteria">${ratingCriteria.map(([key,etLabel,enLabel])=>{const r=ratings[key];return `<div class="rating-item"><div><h3>${et?etLabel:enLabel}</h3><span>${r.score}<small> / 10</small></span></div><meter min="0" max="10" value="${r.score}" aria-label="${et?etLabel:enLabel}">${r.score}/10</meter>${r[lang]?`<p>${esc(r[lang])}</p>`:''}</div>`;}).join('')}</div></section>`;
}
