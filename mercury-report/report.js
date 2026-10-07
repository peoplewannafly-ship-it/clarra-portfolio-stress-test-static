(()=>{const root=document.querySelector('#modal-root');let focus;const close=()=>{root.innerHTML='';document.body.style.overflow='';focus?.focus()};const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const modal=html=>{focus=document.activeElement;root.innerHTML='<div class="modal-backdrop"><section class="modal wide" role="dialog" aria-modal="true" tabindex="-1"><div class="modal-head"><h2>Mercury Bureau</h2><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">✕</button></div>'+html+'</section></div>';document.body.style.overflow='hidden';root.querySelector('.modal').focus()};function feedback(text){const el=document.querySelector('#client-feedback');if(el)el.innerHTML='<div class="feedback-note"><div>'+escape(text)+'<div class="small">Это демонстрация. Сообщение не отправлено; для реальной связи используйте ваш чат с командой.</div></div></div>'}document.addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))return close();const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;if(a==='close-modal')close();else if(a==='client-media'){const card=b.classList.contains('gallery-card')?b:document.querySelector('.gallery-card[data-id="'+CSS.escape(b.dataset.id)+'"]');const img=card?.querySelector('img')||b;const title=card?.querySelector('h3')?.textContent||img.alt,caption=card?.querySelector('p')?.textContent||'';modal((card?.dataset.videoSrc?'<video controls playsinline src="'+escape(card.dataset.videoSrc)+'" poster="'+escape(img.src)+'"></video>':'<img class="modal-photo" src="'+escape(img.src)+'" alt="'+escape(title)+'">')+'<p class="modal-caption">'+escape(title)+' · '+escape(caption)+'</p>')}else if(a==='ack')feedback('Вы отметили, что всё понятно.');else if(a==='question')modal('<h3>Что хотели бы уточнить?</h3><label class="field"><span class="field-label">Ваш вопрос · необязательно</span><textarea id="question-text" placeholder="Напишите, что вас интересует"></textarea></label><p class="small" style="margin-top:15px">Демо без отправки сообщений. В рабочей системе запрос поступит руководителю проекта.</p><div class="modal-actions"><button class="button primary" data-action="send-question">Свяжитесь со мной</button></div>');else if(a==='send-question'){close();feedback('Показан сценарий обращения к руководителю проекта.')}});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-action]')){e.preventDefault();e.target.click()}if(e.key==='Tab'&&root.querySelector('.modal')){const list=[...root.querySelectorAll('button,input,textarea,select,video[controls]')],first=list[0],last=list.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.querySelector('.modal'))){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}})})();

// Shared by the interactive prototype and the exported client report.
function brandIntro(){return `<div class="mb-intro" role="dialog" aria-modal="true" aria-label="Mercury Bureau — вступление"><video muted playsinline webkit-playsinline preload="auto" disablepictureinpicture aria-label="Фирменная анимация Mercury Bureau"></video><img class="mb-intro-fallback" src="${document.querySelector('.mb-footer>img')?.src||''}" alt="Mercury Bureau"><div class="mb-intro-prompt"><button class="mb-intro-play">Смотреть вступление ${icon('arrow')}</button><p role="status"></p></div><button class="mb-intro-skip">Перейти к отчёту ${icon('arrow')}</button><div class="mb-intro-line"></div></div>`}
function playBrandIntro(){
  const page=document.querySelector('.mb-client');
  if(!page)return;
  history.scrollRestoration='manual';
  window.scrollTo({top:0,behavior:'instant'});
  document.querySelector('.mb-intro')?.remove();
  page.classList.remove('mb-ready');
  document.body.insertAdjacentHTML('beforeend',brandIntro());
  const shell=document.querySelector('.mb-intro'),video=shell.querySelector('video');
  const play=shell.querySelector('.mb-intro-play'),skip=shell.querySelector('.mb-intro-skip');
  const status=shell.querySelector('[role="status"]'),oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  let done=false,timer,mode='video';const objectURLs=[];
  const mediaURL=(source,type)=>{
    if(!source?.startsWith('data:'))return source;
    const bytes=Uint8Array.from(atob(source.split(',')[1]),c=>c.charCodeAt(0));
    const url=URL.createObjectURL(new Blob([bytes],{type}));objectURLs.push(url);return url;
  };
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motionAllowed=!reduced;
  const end=()=>{
    if(done)return;
    done=true;clearTimeout(timer);video.pause();
    document.removeEventListener('visibilitychange',visibility);
    shell.classList.add('leaving');document.body.style.overflow=oldOverflow;
    window.scrollTo({top:0,behavior:'instant'});page.classList.add('mb-ready');
    if(shell.contains(document.activeElement))page.querySelector('.mb-logo-pill')?.focus({preventScroll:true});
    setTimeout(()=>{shell.remove();objectURLs.forEach(url=>URL.revokeObjectURL(url))},800);
  };
  const offerPlay=(message)=>{
    if(done)return;
    clearTimeout(timer);shell.classList.add('blocked');video.pause();shell.classList.remove('playing','image-playing');
    status.textContent=message;play.textContent='Смотреть вступление →';
  };
  const imageFallback=()=>{
    if(done)return;
    if(!motionAllowed){offerPlay('Анимация — по вашему нажатию.');return}
    clearTimeout(timer);mode='image';video.autoplay=false;video.pause();
    shell.classList.remove('playing','blocked','image-playing');
    shell.querySelector('.mb-intro-animation')?.remove();
    const image=new Image();image.className='mb-intro-animation';image.alt='Анимация Mercury Bureau';
    image.onload=()=>{
      if(done||image!==shell.querySelector('.mb-intro-animation'))return;
      clearTimeout(timer);
      shell.classList.add('image-playing','playing');
      if(!document.hidden)timer=setTimeout(end,5000);
    };
    image.onerror=()=>offerPlay('Нажмите, чтобы повторить вступление, или перейдите к отчёту.');
    shell.prepend(image);
    const source=innerWidth<=760?page.dataset.introImagePortrait:page.dataset.introImageLandscape;
    if(!source){offerPlay('Нажмите, чтобы запустить анимацию.');return}
    timer=setTimeout(()=>offerPlay('Нажмите, чтобы повторить загрузку вступления.'),8000);
    try{image.src=mediaURL(source,'image/webp')}catch{image.src=source}
  };
  const start=()=>{
    if(done)return;
    motionAllowed=true;shell.querySelector('.mb-intro-animation')?.remove();
    clearTimeout(timer);mode='video';shell.classList.remove('blocked','image-playing');status.textContent='';
    if(video.error)video.load();
    video.muted=true;video.defaultMuted=true;video.playsInline=true;
    timer=setTimeout(imageFallback,2500);
    // Keep play() synchronous with the button gesture for mobile browsers.
    try{const result=video.play();if(result?.catch)result.catch(imageFallback)}
    catch{imageFallback()}
  };
  const visibility=()=>{
    if(document.hidden){clearTimeout(timer);return}
    if(!done&&!shell.classList.contains('blocked')){if(mode==='image')imageFallback();else start()}
  };
  video.muted=true;video.defaultMuted=true;video.playsInline=true;
  video.autoplay=!reduced;
  video.onended=()=>{if(mode==='video')end()};
  video.onerror=imageFallback;
  video.onplaying=()=>{
    if(done||mode==='image'){video.pause();return}
    clearTimeout(timer);shell.classList.remove('blocked');shell.classList.add('playing');
    // The fallback offers a retry, never silently skips a blocked intro.
    timer=setTimeout(()=>{if(video.ended)end();else imageFallback()},15000);
  };
  video.onpause=()=>{
    if(!done&&mode==='video'&&!video.ended&&!document.hidden&&!shell.classList.contains('blocked'))
      imageFallback();
  };
  const source=innerWidth<=760?page.dataset.introPortrait:page.dataset.introLandscape;
  try{
    video.src=mediaURL(source,'video/mp4');
  }catch{video.src=source}
  play.onclick=start;skip.onclick=end;
  skip.focus({preventScroll:true});
  shell.onkeydown=e=>{
    if(e.key==='Escape'){e.preventDefault();end()}
    if(e.key==='Tab'){
      const items=shell.classList.contains('blocked')?[play,skip]:[skip];
      const index=items.indexOf(document.activeElement);
      e.preventDefault();items[(index+(e.shiftKey?-1:1)+items.length)%items.length].focus();
    }
  };
  document.addEventListener('visibilitychange',visibility);
  if(reduced)offerPlay('Анимация — по вашему нажатию.');
  else if(!document.hidden)start();
}

let introPlayed=false;const icon=n=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
function mountBrand(){const page=document.querySelector('.mb-client');if(!page)return;page.classList.add('mb-mounted');const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.06});page.querySelectorAll('.mb-reveal').forEach(e=>io.observe(e));if(!introPlayed){introPlayed=true;playBrandIntro()}else page.classList.add('mb-ready')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-brand]');if(b?.dataset.brand==='replay')playBrandIntro();if(b?.dataset.brand==='menu'){const nav=document.querySelector('.mb-menu');nav.hidden=!nav.hidden;b.setAttribute('aria-expanded',String(!nav.hidden))}const a=e.target.closest('.mb-client a[href^="#"]');if(a){e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.querySelector('.mb-menu').hidden=true;document.querySelector('.mb-menu-button').setAttribute('aria-expanded','false')}});mountBrand();
