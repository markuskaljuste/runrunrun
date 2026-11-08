import {esc} from './core.mjs';

const rows=[['goodFor','Good for'],['terrain','Terrain'],['keepInMind','Keep in mind']];
const hasSummary=value=>rows.some(([key])=>value?.[key]?.trim());

export function renderPracticalSummary(post,fields=post.en,lang='en'){
 const own=hasSummary(fields?.practicalSummary),summary=own?fields.practicalSummary:post.en?.practicalSummary;
 const entries=rows.filter(([key])=>summary?.[key]?.trim());
 const map=post.routeMap?.enabled;
 if(!entries.length&&!map)return '';
 return `<section class="story-summary" lang="${own?esc(lang):'en'}" aria-label="Run overview">${entries.length?`<dl>${entries.map(([key,label])=>`<div><dt>${label}</dt><dd>${esc(summary[key])}</dd></div>`).join('')}</dl>`:''}${map?'<a class="story-map-link" href="#route-map">View route map</a>':''}</section>`;
}
