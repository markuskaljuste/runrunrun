import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,readContent,validateRecord} from './core.mjs';
import {blankTranslation,publishedStoryLanguages,translationFields,storyPath} from './story-languages.mjs';
import {sharedStoryMedia} from './story-media.mjs';
import {renderMetadata} from './metadata.mjs';

const english={title:'Original fixture',excerpt:'English introduction.',body:'Original body.'};
const es={...blankTranslation('es'),title:'ES fixture',excerpt:'ES introduction.',body:'ES body.'};
const fr={...blankTranslation('fr'),status:'published',title:'FR fixture',excerpt:'FR introduction.',body:'FR body.'};
const post={slug:'translation-fixture',status:'published',date:'2026-11-02',countries:[],en:english,translations:[es,fr]};
validateRecord('posts',post);assert.deepEqual(publishedStoryLanguages(post),['en','fr']);
assert.equal(storyPath(post,'es'),'/journal/translation-fixture/');assert.equal(storyPath(post,'fr'),'/fr/journal/translation-fixture/');
es.status='published';validateRecord('posts',post);assert.deepEqual(publishedStoryLanguages(post),['en','es','fr']);
es.body='';assert.throws(()=>validateRecord('posts',post));es.status='draft';validateRecord('posts',post);assert.deepEqual(publishedStoryLanguages(post),['en','fr']);
assert.throws(()=>validateRecord('posts',{...post,translations:[fr,fr]}));
assert.throws(()=>validateRecord('posts',{...post,translations:[{...fr,language:'unsupported'}]}));
assert.throws(()=>validateRecord('posts',{...post,translations:[{...fr,language:'en'}]}));
assert.deepEqual(publishedStoryLanguages({...post,status:'draft'}),[]);
assert.throws(()=>validateRecord('posts',{...post,en:{title:'Unfinished'}}));
assert.equal(translationFields(post,'fr').body,'FR body.');

const mediaPost={en:{body:'Original prose.\n\n![One](/assets/forest.jpg "First photo")\n\nPhoto: [Author](https://example.com/photo).\n\n![Two](/assets/ocean.jpg)'}};
const media=sharedStoryMedia(mediaPost,{body:'Translated prose.\n\n![One](/assets/forest.jpg)'},'/blog');
assert(!media.includes('forest.jpg'));assert(media.includes('/blog/assets/ocean.jpg'));assert(!media.includes('Original prose.'));
assert(sharedStoryMedia(mediaPost,{body:''}).includes('<figcaption>First photo · Photo:'));

const data=readContent(),metadata=renderMetadata({lang:'fr',path:'journal/translation-fixture/',title:fr.title,description:fr.excerpt,seo:fr,data,origin:'https://example.com',availableLanguages:publishedStoryLanguages(post)});
assert(metadata.includes('content="fr_FR"'));assert(metadata.includes('https://example.com/fr/journal/translation-fixture/'));assert(metadata.includes('hreflang="en"'));assert(metadata.includes('hreflang="fr"'));assert(!metadata.includes('hreflang="es"'));
const config=JSON.parse(readFileSync(resolve(root,'.pages.yml'),'utf8')),fields=config.content.find(c=>c.name==='posts').fields;
assert(!fields.some(f=>f.name==='et'));assert(fields.some(f=>f.name==='en'));
const translations=fields.find(f=>f.name==='translations');assert(translations.list);assert(translations.fields.some(f=>f.name==='language'));assert.equal(translations.fields.find(f=>f.name==='status').default,'draft');assert.equal(translations.fields.find(f=>f.name==='body').type,'rich-text');
function noMandatoryEstonian(fields){for(const field of fields){assert.notEqual(field.name,'et');if(field.fields)noMandatoryEstonian(field.fields);}}
for(const collection of config.content)noMandatoryEstonian(collection.fields);
const base=(process.env.BASE_PATH??'').replace(/\/$/,'');
for(const path of ['','about/','journal/','countries/','privacy/','contact/']){
 const englishPage=readFileSync(resolve(root,'dist',path,'index.html'),'utf8');assert(!englishPage.includes('class="languages"'));assert(!englishPage.split('</head>')[0].includes('hreflang="et"'));
 for(const prefix of ['en','et']){const legacy=readFileSync(resolve(root,'dist',prefix,path,'index.html'),'utf8');assert(legacy.includes('url='+base+'/'+path));assert(legacy.includes('noindex,follow'));}
}
console.log('Passed translation workflow checks: English originals, optional language/status fields, published-only badges and URLs, validation, shared media, localized metadata, English settings and legacy redirects.');
