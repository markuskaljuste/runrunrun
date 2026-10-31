import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
export const root = resolve(import.meta.dirname, '..');
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeUrl = value => /^(https?:\/\/|\/(?!\/))[^\s<>"']*$/i.test(value ?? '') ? value : '#';
export function inline(value) {
  return esc(value).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => `<a href="${esc(safeUrl(url.replaceAll('&amp;', '&')))}" rel="noopener noreferrer">${label}</a>`).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
export function markdown(body = '', base = '') {
  return body.split(/\n\s*\n/).map(block => {
    const picture = /^!\[([^\]]*)\]\((\/[^\s)]+|https?:\/\/[^\s)]+)\)$/.exec(block.trim());
    if (picture) return `<img src="${esc(picture[2].startsWith('/')?base+safeUrl(picture[2]):safeUrl(picture[2]))}" alt="${esc(picture[1])}" loading="lazy">`;
    if (/^> /.test(block)) return `<blockquote>${inline(block.replace(/^> /gm,'')).replaceAll('\n','<br>')}</blockquote>`;
    if (/^\d+\. /.test(block)) return `<ol>${block.split('\n').map(line=>`<li>${inline(line.replace(/^\d+\. /,''))}</li>`).join('')}</ol>`;
    if (/^### /m.test(block)) return `<h3>${inline(block.replace(/^### /,''))}</h3>`;
    if (/^## /m.test(block)) return `<h2>${inline(block.replace(/^## /,''))}</h2>`;
    if (/^# /m.test(block)) return `<h2>${inline(block.replace(/^# /,''))}</h2>`;
    if (/^- /.test(block)) return `<ul>${block.split('\n').map(line=>`<li>${inline(line.replace(/^- /,''))}</li>`).join('')}</ul>`;
    return `<p>${inline(block).replaceAll('\n','<br>')}</p>`;
  }).join('\n');
}
export function readContent() {
  const data = {};
  data.photoCredits=JSON.parse(readFileSync(resolve(root,'content/photo-credits.json'),'utf8'));
  for (const type of ['site','branding','images','seo','integrations','publication']) data[type]=JSON.parse(readFileSync(resolve(root,'content',type+'.json'),'utf8'));
  for (const key of ['logo','footerLogo','logoAlt']) data.branding[key] ??= '';
  data.branding.logoWidth ??= 160;
  data.branding.sponsors ??= [];
  for (const sponsor of data.branding.sponsors) for (const key of ['name','logo','url']) sponsor[key] ??= '';
  for (const key of ['gaMeasurementId','searchConsoleVerification','privacyControllerName','privacyContactEmail']) data.integrations[key] ??= '';
  data.seo.defaultSocialImage ??= '';
  for (const page of Object.values(data.seo.pages)) for (const lang of ['en','et']) for (const key of ['title','description','socialImage']) page[lang][key] ??= '';
  for (const key of ['homeHero','homeStory','about']) for (const lang of ['en','et']) data.images[key][lang].caption ??= '';
  for (const type of ['posts','routes','countries','places']) data[type] = readdirSync(resolve(root,'content',type)).filter(f=>f.endsWith('.json')).map(file => JSON.parse(readFileSync(resolve(root,'content',type,file),'utf8')));
  for (const country of data.countries) for (const lang of ['en','et']) country[lang].description ??= '';
  for (const post of data.posts) {post.country ??= '';post.place ??= '';}
  for (const place of data.places) for (const lang of ['en','et']) for(const key of ['region','imageAlt','imageCaption','seoTitle','seoDescription']) place[lang][key] ??= '';
  return data;
}
export function validateRecord(type, item) {
  if(type==='publication'){
    if(!['coming-soon','live'].includes(item.mode))throw new Error('Choose Coming soon or Live.');
    for(const lang of ['en','et'])for(const key of ['title','description'])if(typeof item[lang]?.[key]!=='string'||!item[lang][key].trim())throw new Error(`Add the coming-soon ${key} in ${lang.toUpperCase()}.`);
    return;
  }
  if (type === 'integrations') {
    if (typeof item.analyticsEnabled!=='boolean') throw new Error('Choose whether Analytics is enabled.');
    for (const key of ['gaMeasurementId','searchConsoleVerification','privacyControllerName','privacyContactEmail']) if (typeof item[key]!=='string') throw new Error(`Check ${key}.`);
    if (item.gaMeasurementId&&!/^G-[A-Z0-9]{4,30}$/.test(item.gaMeasurementId)) throw new Error('Use a GA4 measurement ID beginning with G-.');
    if (item.searchConsoleVerification&&!/^[A-Za-z0-9_-]{10,256}$/.test(item.searchConsoleVerification)) throw new Error('Paste only the Search Console HTML-tag verification code.');
    if (item.privacyContactEmail&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(item.privacyContactEmail)) throw new Error('Add a valid privacy contact email address.');
    if (item.analyticsEnabled&&(!item.gaMeasurementId||!item.privacyControllerName.trim()||!item.privacyContactEmail)) throw new Error('Before enabling Analytics, add the measurement ID and privacy contact name/email.');
    if (!Number.isInteger(item.consentVersion)||item.consentVersion<1) throw new Error('Consent version must be a positive whole number.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.privacyUpdated??'')) throw new Error('Add the privacy notice date.');
    return;
  }

  if (type === 'places') {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug??'')) throw new Error('Choose a place URL using lowercase letters and hyphens.');
    if (!['draft','published'].includes(item.status)) throw new Error('Choose draft or published.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.country??'')) throw new Error('Choose the country for this place.');
    if (typeof item.comingSoon!=='boolean') throw new Error('Choose whether the place is coming soon.');
    if (item.image&&safeUrl(item.image)==='#') throw new Error('Choose a valid place image.');
    if (item.status==='published'&&!item.image) throw new Error('Add an image before publishing a place.');
    for(const lang of ['en','et']) {
      for(const key of ['name','excerpt','body']) if(typeof item[lang]?.[key]!=='string'||(item.status==='published'&&!item[lang][key].trim())) throw new Error(`Add the place ${key} in ${lang.toUpperCase()}.`);
      for(const key of ['region','imageAlt','imageCaption','seoTitle','seoDescription']) if(item[lang][key]!=null&&typeof item[lang][key]!=='string') throw new Error(`Check ${key} in ${lang.toUpperCase()}.`);
    }
    for(const lang of ['en','et'])if(item[lang].socialImage&&safeUrl(item[lang].socialImage)==='#')throw new Error('Choose a valid sharing image.');
    return;
  }

  if (type === 'countries') {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug??'') || item.slug==='general') throw new Error('Choose a country URL using lowercase letters and hyphens; general is reserved.');
    for (const lang of ['en','et']) if (!item[lang]?.name?.trim() || (item[lang].description!=null&&typeof item[lang].description!=='string')) throw new Error(`Add the country name in ${lang.toUpperCase()}.`);
    return;
  }

  if (type === 'images') {
    if (!item.favicon || safeUrl(item.favicon)==='#') throw new Error('Choose a favicon image or keep the original.');
    for (const key of ['homeHero','homeStory','about']) {
      if (!item[key]?.src || safeUrl(item[key].src)==='#') throw new Error(`Choose a valid image for ${key}.`);
      for (const lang of ['en','et']) if (typeof item[key][lang]?.alt!=='string'||!item[key][lang].alt.trim()||typeof item[key][lang]?.caption!=='string') throw new Error(`Add an image description in ${lang.toUpperCase()} for ${key}.`);
    }
    return;
  }
  if (type === 'seo') {
    if (typeof item.indexing!=='boolean') throw new Error('Choose whether search engines may index the site.');
    if (item.defaultSocialImage && safeUrl(item.defaultSocialImage)==='#') throw new Error('Choose a valid sharing image.');
    for (const page of ['home','journal','routes','about']) for (const lang of ['en','et']) {
      const fields=item.pages?.[page]?.[lang];
      if (!fields || ['title','description'].some(key=>typeof fields[key]!=='string')) throw new Error(`Check SEO settings for ${page}, ${lang.toUpperCase()}.`);
      if (fields.socialImage && safeUrl(fields.socialImage)==='#') throw new Error('Choose a valid page sharing image.');
    }
    return;
  }
  if (type === 'branding') {
    for (const key of ['logo','footerLogo']) if (typeof item[key] !== 'string' || (item[key] && safeUrl(item[key]) === '#')) throw new Error('Use an uploaded logo or a valid image URL.');
    if (typeof item.logoAlt !== 'string') throw new Error('Logo description must be text.');
    if (!Number.isInteger(item.logoWidth) || item.logoWidth < 80 || item.logoWidth > 240) throw new Error('Choose a logo width from 80 to 240 pixels.');
    if (typeof item.sponsorsEnabled !== 'boolean' || !Array.isArray(item.sponsors)) throw new Error('Invalid sponsor settings.');
    for (const lang of ['en','et']) if (!item.sponsorTitle?.[lang]?.trim()) throw new Error(`Add the sponsor heading in ${lang.toUpperCase()}.`);
    for (const [index,sponsor] of item.sponsors.entries()) {
      if (typeof sponsor.name !== 'string' || typeof sponsor.logo !== 'string' || typeof sponsor.url !== 'string' || typeof sponsor.enabled !== 'boolean') throw new Error(`Complete sponsor ${index+1}.`);
      if (sponsor.enabled && (!sponsor.name.trim() || !sponsor.logo.trim())) throw new Error(`Sponsor ${index+1} needs a name and logo, or must be hidden.`);
      if (sponsor.logo && safeUrl(sponsor.logo) === '#') throw new Error(`Use a valid logo path for sponsor ${index+1}.`);
      if (sponsor.url && (!/^https:\/\//i.test(sponsor.url) || safeUrl(sponsor.url) === '#')) throw new Error(`Sponsor ${index+1} needs a complete https:// website link.`);
    }
    return;
  }
  if (type === 'site') {
    if (!item.brand?.trim()) throw new Error('The site needs a name.');
    for (const lang of ['en','et']) for (const field of ['tagline','hero','intro','aboutTitle','aboutExcerpt','aboutBody']) if (!item[lang]?.[field]?.trim()) throw new Error(`Add ${field} in ${lang.toUpperCase()}.`);
    return;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug??'')) throw new Error('Use a URL slug with lowercase letters, numbers and hyphens.');
  if (!['draft','published'].includes(item.status)) throw new Error('Choose draft or published.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date??'') || !Number.isFinite(Date.parse(item.date))) throw new Error('Add a valid publication date.');
  if (type==='routes'&&!['estonia','portugal','other'].includes(item.category)) throw new Error('Choose a supported category.');
  if (type==='posts'&&item.place!=null&&(typeof item.place!=='string'||(item.place&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.place)))) throw new Error('Choose a valid place.');
  if (type==='posts'&&item.country!=null&&(typeof item.country!=='string'||(item.country&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.country)))) throw new Error('Choose a country from the list, or General.');
  if (item.image && safeUrl(item.image)==='#') throw new Error('Use a local image path or an https image URL.');
  for (const lang of ['en','et']) for (const field of ['title','excerpt','body',...(type==='routes'?['place']:[])]) if (typeof item[lang]?.[field] !== 'string' || (item.status==='published'&&!item[lang][field].trim())) throw new Error(`Add ${field} in ${lang.toUpperCase()} before publishing.`);
  for (const lang of ['en','et']) {
    for (const key of ['seoTitle','seoDescription','imageAlt','imageCaption']) if (item[lang][key]!=null&&typeof item[lang][key]!=='string') throw new Error(`Check ${key} in ${lang.toUpperCase()}.`);
    if (item[lang].socialImage&&safeUrl(item[lang].socialImage)==='#') throw new Error('Choose a valid post sharing image.');
  }
  if (type==='routes' && item.status==='published' && (!/^https:\/\//.test(item.sourceUrl??'') || safeUrl(item.sourceUrl)==='#' || !item.sourceLabel?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(item.checked??''))) throw new Error('Published route guides need an official https source, source name and checked date.');
}
export function validateAll(data) {
  validateRecord('publication',data.publication);
  validateRecord('site',data.site);
  validateRecord('branding',data.branding);
  validateRecord('images',data.images);
  validateRecord('seo',data.seo);
  validateRecord('integrations',data.integrations);
  for (const type of ['posts','routes','countries','places']) {
    const slugs = new Set();
    for (const item of data[type]) {
      validateRecord(type,item);
      if(slugs.has(item.slug)) throw new Error(`Duplicate URL: ${item.slug}`);
      if(type==='places'&&!data.countries.some(country=>country.slug===item.country)) throw new Error(`Add the country ${item.country} before assigning it to a place.`);
      if(type==='posts'&&item.place){const place=data.places.find(p=>p.slug===item.place);if(!place||place.country!==item.country)throw new Error('Choose a place belonging to the selected country.');if(item.status==='published'&&place.status!=='published')throw new Error('Publish the place before publishing a story linked to it.');}
      if(type==='posts'&&item.country&&!data.countries.some(country=>country.slug===item.country)) throw new Error(`Add the country ${item.country} under Countries before assigning it to a story.`);
      slugs.add(item.slug);
    }
  }
}
