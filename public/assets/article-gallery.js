(()=>{
 if(typeof HTMLDialogElement==='undefined')return;
 const photos=[...document.querySelectorAll('article .article-image>img, article .prose .story-media img, article .shared-story-media img')].filter(img=>!img.closest('a'));
 if(!photos.length)return;
 const dialog=document.createElement('dialog');dialog.className='article-gallery';dialog.setAttribute('aria-label','Article photos');
 dialog.innerHTML='<div class="gallery-toolbar"><span class="gallery-count" aria-live="polite"></span><button type="button" class="gallery-close" aria-label="Close photo">×</button></div><div class="gallery-stage"><button type="button" class="gallery-prev" aria-label="Previous photo">‹</button><img class="gallery-image" alt=""><button type="button" class="gallery-next" aria-label="Next photo">›</button></div><p class="gallery-caption"></p>';
 document.body.append(dialog);
 const image=dialog.querySelector('.gallery-image'),caption=dialog.querySelector('.gallery-caption'),count=dialog.querySelector('.gallery-count'),previous=dialog.querySelector('.gallery-prev'),next=dialog.querySelector('.gallery-next');
 let index=0,opener=null,oldOverflow='';
 function show(i){index=(i+photos.length)%photos.length;const photo=photos[index];image.src=photo.currentSrc||photo.src;image.alt=photo.alt;caption.textContent=photo.closest('figure')?.querySelector('figcaption')?.textContent||photo.alt||'';count.textContent=`${index+1} / ${photos.length}`;previous.hidden=next.hidden=photos.length<2;}
 function open(i){opener=photos[i];show(i);oldOverflow=document.documentElement.style.overflow;dialog.showModal();document.documentElement.style.overflow='hidden';}
 photos.forEach((photo,i)=>{photo.dataset.galleryPhoto='';photo.tabIndex=0;photo.setAttribute('role','button');photo.setAttribute('aria-haspopup','dialog');photo.setAttribute('aria-label',photo.alt?`Enlarge photo: ${photo.alt}`:'Enlarge photo');photo.addEventListener('click',()=>open(i));photo.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(i);}});});
 previous.addEventListener('click',()=>show(index-1));next.addEventListener('click',()=>show(index+1));dialog.querySelector('.gallery-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowLeft'?-1:1));}});
 dialog.addEventListener('close',()=>{document.documentElement.style.overflow=oldOverflow;image.removeAttribute('src');opener?.focus({preventScroll:true});});
})();
