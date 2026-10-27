const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('#navigation');
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav?.classList.contains('open')){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.focus();}});
const input=document.querySelector('.search input');
const filters=[...document.querySelectorAll('[data-filter]')];
const cards=[...document.querySelectorAll('[data-list] .card')];
let selected='all';
function filter(){const term=(input?.value??'').trim().toLocaleLowerCase();let count=0;for(const card of cards){const show=(selected==='all'||card.dataset.category===selected)&&card.dataset.search.includes(term);card.hidden=!show;if(show)count++;}const empty=document.querySelector('.empty-state');if(empty)empty.hidden=count!==0;const counter=document.querySelector('.results-count');if(counter)counter.textContent=document.documentElement.lang==='et'?`${count} ${location.pathname.includes('/routes/')?'teejuhti':'lugu'}`:`${count} ${location.pathname.includes('/routes/')?(count===1?'guide':'guides'):(count===1?'story':'stories')}`;}
for(const button of filters)button.addEventListener('click',()=>{selected=button.dataset.filter;filters.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});filter();});
input?.addEventListener('input',filter);
