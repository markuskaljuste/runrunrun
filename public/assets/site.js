const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});
const input=document.querySelector('.search input');
const filters=[...document.querySelectorAll('[data-filter]')];
const cards=[...document.querySelectorAll('[data-list] .card')];
const kind=document.querySelector('[data-list]')?.dataset.countKind||(location.pathname.includes('/routes/')?'guides':'stories');
const normalize=value=>value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let selected='all';
function filter(){const term=normalize((input?.value??'').trim());let count=0;for(const card of cards){const show=(selected==='all'||card.dataset.category===selected)&&normalize(card.dataset.search).includes(term);card.hidden=!show;if(show)count++;}const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;const counter=document.querySelector('.results-count');if(counter)counter.textContent=document.documentElement.lang==='et'?`${count} ${kind==='places'?(count===1?'paik':'paika'):kind==='countries'?(count===1?'riik':'riiki'):kind==='guides'?'teejuhti':'lugu'}`:`${count} ${kind==='places'?(count===1?'place':'places'):kind==='countries'?(count===1?'country':'countries'):kind==='guides'?(count===1?'guide':'guides'):(count===1?'story':'stories')}`;}
for(const button of filters)button.addEventListener('click',()=>{selected=button.dataset.filter;filters.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});filter();});
input?.addEventListener('input',filter);

document.querySelector('[data-country-filter]')?.addEventListener('change',event=>{selected=event.target.value;filter();});
