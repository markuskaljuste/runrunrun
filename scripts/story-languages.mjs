export {languageOptions,languageLabel,languageLocale,completeStory,translationFields,publishedStoryLanguages,blankTranslation} from '../public/assets/story-languages.js';
import {completeStory,translationFields,publishedStoryLanguages} from '../public/assets/story-languages.js';
export const storyLanguages=['en'];
export const storyHasTranslation=(post,lang)=>lang==='en'?completeStory(post.en):publishedStoryLanguages(post).includes(lang);
export const storyLanguage=(post,preferred)=>storyHasTranslation(post,preferred)?preferred:'en';
export const storyFields=(post,preferred)=>translationFields(post,storyLanguage(post,preferred))??{};
export const storyPath=(post,preferred)=>`/${storyLanguage(post,preferred)}/journal/${post.slug}/`;
