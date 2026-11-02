export const storyLanguages=['en','et'];
export const storyHasTranslation=(post,lang)=>['title','excerpt','body'].every(key=>typeof post[lang]?.[key]==='string'&&post[lang][key].trim());
export const storyLanguage=(post,preferred)=>storyHasTranslation(post,preferred)?preferred:storyLanguages.find(lang=>storyHasTranslation(post,lang))??preferred;
export const storyFields=(post,preferred)=>post[storyLanguage(post,preferred)]??{};
export const storyPath=(post,preferred)=>`/${storyLanguage(post,preferred)}/journal/${post.slug}/`;
