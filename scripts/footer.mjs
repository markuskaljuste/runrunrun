import {esc,safeUrl} from './core.mjs';
import {socialLinks} from './engagement.mjs';

export function footerSponsors(data){
 return data.branding.sponsorsEnabled?data.branding.sponsors.filter(s=>s.enabled&&s.name.trim()&&s.logo.trim()):[];
}

export function renderFooter({data,url,image,comingSoon=false}){
 const branding=data.branding;
 const sponsors=footerSponsors(data);
 const supporters=sponsors.length?`<section class="footer-supporters" aria-labelledby="sponsor-heading"><svg class="sponsor-color" width="0" height="0" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs><filter id="sponsor-cream" color-interpolation-filters="sRGB"><feFlood flood-color="#f4f5eb" result="ink"/><feComposite in="ink" in2="SourceAlpha" operator="in"/></filter></defs></svg><h2 id="sponsor-heading">${esc(branding.sponsorTitle.en)}</h2><div class="sponsor-logos">${sponsors.map(s=>{const mark=`<img src="${esc(image(s.logo))}" alt="${esc(s.name)}" loading="lazy">`;return s.url?`<a href="${esc(safeUrl(s.url))}" target="_blank" rel="sponsored noopener noreferrer" aria-label="${esc(s.name)}: visit website">${mark}</a>`:`<div>${mark}</div>`;}).join('')}</div></section>`:'';
 return `<footer class="footer"><div class="footer-top">${socialLinks(data,'en')}${supporters}</div><div class="footer-bottom"><span>© ${new Date().getUTCFullYear()} ${esc(data.site.brand)}</span><div>${comingSoon?'':`<a href="${url('/contact/')}">Contact</a><a href="${url('/credits/')}">Photo credits</a>`}<a href="${url('/privacy/')}">Privacy</a><button type="button" data-cookie-settings>Cookie settings</button>${comingSoon?'':`<a href="${url('/admin/')}">Editor</a>`}</div></div></footer>`;
}
