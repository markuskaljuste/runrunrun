import {esc,safeUrl} from './core.mjs';
import {verificationTag} from './privacy.mjs';
export function renderMetadata({lang,path,title,description,ogImage,seo:entry,data,base='',origin=''}) {
  const key=path===''?'home':path.replace(/\/$/,'');
  const page=data.seo.pages[key]?.[lang]??{};
  const headline=entry?.seoTitle?.trim()||page.title?.trim()||`${title} — ${data.site.brand}`;
  const summary=entry?.seoDescription?.trim()||page.description?.trim()||description;
  const picture=entry?.socialImage||page.socialImage||ogImage||data.seo.defaultSocialImage||data.images.homeHero.src;
  const absolute=value=>/^https?:\/\//.test(value)?safeUrl(value):origin+base+value;
  const location=`${origin}${base}/${lang}/${path}`;
  let html=`<title>${esc(headline)}</title><meta name="description" content="${esc(summary)}"><meta name="robots" content="${data.seo.indexing?'index,follow':'noindex,follow'}"><meta property="og:title" content="${esc(headline)}"><meta property="og:description" content="${esc(summary)}"><meta property="og:site_name" content="${esc(data.site.brand)}"><meta property="og:locale" content="${lang==='et'?'et_EE':'en_GB'}"><meta property="og:type" content="${entry?'article':'website'}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(headline)}"><meta name="twitter:description" content="${esc(summary)}">`;
  if(origin){
    html+=`<link rel="canonical" href="${esc(location)}"><link rel="alternate" hreflang="en" href="${esc(origin+base+'/en/'+path)}"><link rel="alternate" hreflang="et" href="${esc(origin+base+'/et/'+path)}"><meta property="og:url" content="${esc(location)}">`;
    if(picture)html+=`<meta property="og:image" content="${esc(absolute(picture))}"><meta name="twitter:image" content="${esc(absolute(picture))}">`;
  }
  return html+verificationTag(data);
}
