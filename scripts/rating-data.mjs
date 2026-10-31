export const ratingCriteria=[['safety','Ohutus','Safety'],['scenery','Vaated','Scenery'],['surface','Rajapind','Running surface'],['access','Ligipääsetavus','Access'],['experience','Jooksuelamus','Running experience']];
export function emptyRatings(){return {enabled:false,...Object.fromEntries(ratingCriteria.map(([key])=>[key,{score:null,en:'',et:''}]))};}
export function validateRatings(ratings){
 if(!ratings||typeof ratings.enabled!=='boolean')throw new Error('Choose whether the destination score is shown.');
 for(const [key] of ratingCriteria){const r=ratings[key];if(!r||!['en','et'].every(lang=>typeof r[lang]==='string'&&r[lang].length<=240))throw new Error('Add short rating notes, up to 240 characters per language.');if(r.score!=null&&(!Number.isInteger(r.score)||r.score<1||r.score>10))throw new Error('Rating scores must be whole numbers from 1 to 10.');if(ratings.enabled&&r.score==null)throw new Error('Fill in all five scores before showing the destination rating.');}
}
export function ratingAverage(ratings){if(!ratings?.enabled)return null;validateRatings(ratings);return Math.round(ratingCriteria.reduce((sum,[key])=>sum+ratings[key].score,0)/ratingCriteria.length*10)/10;}
