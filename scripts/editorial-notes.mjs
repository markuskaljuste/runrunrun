import {markdown} from './core.mjs';
export function renderEditorialNote(note,base=''){
 if(!note?.trim())return '';
 return `<aside class="editorial-note" aria-label="Runograph’s notes"><p class="editorial-note-label">Runograph’s notes</p>${markdown(note,base)}</aside>`;
}
