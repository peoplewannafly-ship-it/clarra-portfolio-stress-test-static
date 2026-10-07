(()=>{const root=document.querySelector('#modal-root');let focus;const close=()=>{root.innerHTML='';document.body.style.overflow='';focus?.focus()};const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const modal=html=>{focus=document.activeElement;root.innerHTML='<div class="modal-backdrop"><section class="modal wide" role="dialog" aria-modal="true" tabindex="-1"><div class="modal-head"><h2>Mercury Bureau</h2><button class="icon-btn" data-action="close-modal" aria-label="Закрыть">✕</button></div>'+html+'</section></div>';document.body.style.overflow='hidden';root.querySelector('.modal').focus()};function feedback(text){const el=document.querySelector('#client-feedback');if(el)el.innerHTML='<div class="feedback-note"><div>'+escape(text)+'<div class="small">Это демонстрация. Сообщение не отправлено; для реальной связи используйте ваш чат с командой.</div></div></div>'}document.addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))return close();const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;if(a==='close-modal')close();else if(a==='client-media'){const card=b.classList.contains('gallery-card')?b:document.querySelector('.gallery-card[data-id="'+CSS.escape(b.dataset.id)+'"]');const img=card?.querySelector('img')||b;const title=card?.querySelector('h3')?.textContent||img.alt,caption=card?.querySelector('p')?.textContent||'';modal((card?.dataset.videoSrc?'<video controls playsinline src="'+escape(card.dataset.videoSrc)+'" poster="'+escape(img.src)+'"></video>':'<img class="modal-photo" src="'+escape(img.src)+'" alt="'+escape(title)+'">')+'<p class="modal-caption">'+escape(title)+' · '+escape(caption)+'</p>')}else if(a==='ack')feedback('Вы отметили, что всё понятно.');else if(a==='question')modal('<h3>Что хотели бы уточнить?</h3><label class="field"><span class="field-label">Ваш вопрос · необязательно</span><textarea id="question-text" placeholder="Напишите, что вас интересует"></textarea></label><p class="small" style="margin-top:15px">Демо без отправки сообщений. В рабочей системе запрос поступит руководителю проекта.</p><div class="modal-actions"><button class="button primary" data-action="send-question">Свяжитесь со мной</button></div>');else if(a==='send-question'){close();feedback('Показан сценарий обращения к руководителю проекта.')}});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-action]')){e.preventDefault();e.target.click()}if(e.key==='Tab'&&root.querySelector('.modal')){const list=[...root.querySelectorAll('button,input,textarea,select,video[controls]')],first=list[0],last=list.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.querySelector('.modal'))){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}})})();

// Shared by the interactive prototype and the exported client report.
function brandIntro(){return `<div class="mb-intro" role="dialog" aria-modal="true" aria-label="Mercury Bureau — вступление"><video muted playsinline webkit-playsinline preload="auto" disablepictureinpicture aria-label="Фирменная анимация Mercury Bureau"></video><img class="mb-intro-fallback" src="${document.querySelector('.mb-footer>img')?.src||''}" alt="Mercury Bureau"><div class="mb-intro-message"><span>Поздравляем!</span><p>Ещё один шаг к вашему<br>дому — завершён.</p></div><div class="mb-intro-prompt"><button class="mb-intro-play">Смотреть вступление ${icon('arrow')}</button><p role="status"></p></div><button class="mb-intro-skip">Перейти к отчёту ${icon('arrow')}</button><div class="mb-intro-line"></div></div>`}
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

/* Interactive prototype only: no messages, payments or legal signatures are sent. */
const MercuryExperience=(()=>{
  const contexts=new WeakMap(),memory=new Map();
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const star='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 3 3.8 8 8.7 1.2-6.3 6.2 1.5 8.6-7.7-4.1-7.7 4.1 1.5-8.6-6.3-6.2 8.7-1.2Z"/></svg>';
  const idFor=d=>[d.project,d.period,d.version||1].join('|');
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
  const actId=(href,name,amount)=>hash([href,name,amount].join('|'));
  const key=c=>'mercury-experience-v1:'+c.id;
  const read=c=>{try{return memory.get(key(c))||JSON.parse(localStorage.getItem(key(c))||'null')||{}}catch{return memory.get(key(c))||{}}};
  const write=(c,value)=>{memory.set(key(c),value);try{localStorage.setItem(key(c),JSON.stringify(value));return true}catch{return false}};
  const current=()=>contexts.get(document.querySelector('.mb-client'));
  const date=t=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(t));
  let dialog=null,returnFocus=null,oldOverflow='';

  function rating(c,edit=false){
    const box=c.page.querySelector('#mb-contact');if(!box)return;
    const saved=read(c).review;const selected=Number(saved?.score)||0;
    box.classList.add('mb-review-section');
    const heading=`<div class="mb-contact-top"><span class="mb-eyebrow">05 / Обратная связь</span><span class="mb-eyebrow">${escape(c.period)}</span></div>`;
    if(saved&&!edit){
      box.innerHTML=heading+`<div class="mb-review-success"><span class="mb-review-check">✓</span><h2>Спасибо.<br>Ваше мнение важно.</h2><div class="mb-review-score"><strong>${selected}</strong><span>из 10 · оценка этапа</span></div>${saved.liked?`<div class="mb-review-quote"><span>Что понравилось</span><p>${escape(saved.liked)}</p></div>`:''}${saved.improve?`<div class="mb-review-quote"><span>Что стоит улучшить</span><p>${escape(saved.improve)}</p></div>`:''}${saved.contact?'<p class="mb-review-call">Вы отметили: хочу обсудить с командой.</p>':''}<button class="mb-text-button" data-mx="edit-review">Изменить отзыв ↗</button><p class="mb-demo-note">Демо: отзыв сохранён ${saved.persistent===false?'до закрытия страницы':'в этом браузере'}. Команде он не отправляется.</p></div>`;
      return;
    }
    box.innerHTML=heading+`<div class="mb-review-layout"><div><span class="mb-eyebrow">Оцените прошедший этап</span><h2>Как вам<br>результат?</h2><p class="mb-review-intro">Ваш отзыв помогает нам делать следующий этап лучше.</p><p class="mb-review-stage">${escape(c.stage)}</p></div><form class="mb-review-form" data-score="${selected}"><div class="mb-rating-title"><span id="mb-rating-label">Ваша оценка</span><output id="mb-score-output" aria-live="polite">${selected?selected+' из 10':'Выберите от 1 до 10'}</output></div><div class="mb-stars" role="radiogroup" aria-labelledby="mb-rating-label">${Array.from({length:10},(_,i)=>`<button type="button" class="mb-star ${i<selected?'is-on':''}" role="radio" aria-checked="${i+1===selected}" aria-label="${i+1} из 10" tabindex="${i+1===(selected||1)?0:-1}" data-score="${i+1}">${star}<span>${i+1}</span></button>`).join('')}</div><div class="mb-rating-ends"><span>Есть замечания</span><span>Всё отлично</span></div><div class="mb-review-fields" ${selected?'':'hidden'}><label>Что понравилось?<span>Необязательно</span><textarea name="liked" maxlength="1200" rows="2" placeholder="Например, аккуратность и внимание к деталям">${escape(saved?.liked||'')}</textarea></label><label>Что стоит улучшить?<span>Необязательно</span><textarea name="improve" maxlength="1200" rows="2" placeholder="Расскажите, что можно сделать лучше">${escape(saved?.improve||'')}</textarea></label><label class="mb-review-contact"><input name="contact" type="checkbox" ${saved?.contact?'checked':''}>Хочу обсудить с командой</label></div><button type="submit" class="mb-button solid mb-review-submit" ${selected?'':'disabled'}>Отправить отзыв <span>↗</span></button><p class="mb-demo-note">Демо: оценка и комментарии сохраняются на этом устройстве.</p></form></div>`;
  }
  function selectScore(button,focus=false){
    const form=button.closest('form'),score=Number(button.dataset.score);form.dataset.score=score;
    form.querySelectorAll('.mb-star').forEach(b=>{const n=Number(b.dataset.score);b.classList.toggle('is-on',n<=score);b.setAttribute('aria-checked',String(n===score));b.tabIndex=n===score?0:-1});
    form.querySelector('output').textContent=score+' из 10';form.querySelector('.mb-review-fields').hidden=false;form.querySelector('[type=submit]').disabled=false;if(focus)button.focus();
  }
  function signing(c){
    if(!c.act)return;
    const section=c.page.querySelector('#mb-act'),doc=section.querySelector('.mb-document');
    let box=section.querySelector('.mb-signing');if(!box){box=document.createElement('div');box.className='mb-signing';doc.after(box)}
    const stored=read(c).signature,signed=stored?.documentId===c.act.id;
    const original=doc.querySelector('a');original.textContent='Посмотреть акт ↗';original.classList.remove('solid');original.removeAttribute('download');original.target='_blank';original.rel='noopener';
    section.querySelector('.mb-tag').textContent=signed?'Принят · демо':'Ждёт приёмки';
    if(signed){
      box.innerHTML=`<div class="mb-sign-success"><span class="mb-review-check">✓</span><div><h3>Работы приняты.</h3><p>Подписание подтверждено в демо<br>${escape(date(stored.at))}</p></div></div><a class="mb-button solid mb-signed-download" href="${escape(c.act.href)}" download="${escape(c.act.filename)}">Скачать акт <span>↓</span></a><p class="mb-sign-delivery">Один документ — для вас и команды.</p><p class="mb-demo-note">ЭДО не подключено. В демо скачивается исходный акт без юридической подписи.</p><button class="mb-text-button" data-mx="reset-sign">Повторить демо подписания</button>`;
      return;
    }
    box.innerHTML=`<span class="mb-eyebrow">Приёмка выполненных работ</span><h3>Всё готово?<br>Примите этот этап.</h3><p class="mb-sign-copy">Проверьте акт и сдвиньте ползунок вправо. Далее — подтверждение подписания.</p><div class="mb-sign-slider"><span class="mb-swipe-label" aria-hidden="true">Проведите, чтобы подписать <b>→</b></span><input type="range" min="0" max="100" value="0" aria-label="Сдвиньте вправо, чтобы перейти к подписанию акта" aria-valuetext="Не подтверждено"><span class="mb-swipe-knob" aria-hidden="true">→</span></div><button class="mb-text-button" data-mx="open-sign">Или открыть подтверждение ↗</button><p class="mb-demo-note">Демонстрация приёмки и подписания через ЭДО.</p>`;
  }
  function closeSign(){if(!dialog)return;dialog.remove();dialog=null;document.body.style.overflow=oldOverflow;returnFocus?.focus({preventScroll:true})}
  function openSign(c){
    if(!c?.act||dialog)return;
    returnFocus=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog=document.createElement('div');dialog.className='mb-sign-backdrop';
    dialog.innerHTML=`<section class="mb-sign-dialog" role="dialog" aria-modal="true" aria-labelledby="mb-sign-title"><button class="mb-sign-close" data-mx="close-sign" aria-label="Закрыть подтверждение">✕</button><span class="mb-eyebrow">Приёмка и подписание · демо</span><h2 id="mb-sign-title">Подтвердим<br>завершённые работы.</h2><div class="mb-sign-doc"><strong>${escape(c.act.title)}</strong><span>${escape(c.project)}</span>${c.act.amount?`<b>${escape(c.act.amount)}</b>`:''}<a href="${escape(c.act.href)}" target="_blank" rel="noopener">Посмотреть документ ↗</a></div><form class="mb-sign-form"><label class="mb-sign-consent"><input name="accept" type="checkbox" required><span>Я ознакомился с актом и принимаю указанные в нём работы.</span></label><label class="mb-sign-code">Код подтверждения<input name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="000000"><small>Для демонстрации введите <strong>123456</strong>. SMS не отправляется.</small></label><p class="mb-sign-error" role="alert"></p><button class="mb-button solid" type="submit">Подтвердить подписание <span>↗</span></button><p class="mb-demo-note">Это прототип. Юридическая подпись не создаётся, оплата не производится.</p></form></section>`;
    document.body.append(dialog);dialog.querySelector('input').focus();
  }
  function team(){
    if(typeof state==='undefined'||typeof publicSnapshot!=='function')return;
    const host=document.querySelector('.manager-screen')||document.querySelector('.phone-main');
    if(!host||host.querySelector('.mb-team-response'))return;
    const d=state.published||publicSnapshot(),record=read({id:idFor(d)}),review=record.review;
    const a=d.act,signature=a?.file&&record.signature?.documentId===actId(a.file.dataUrl,a.title+(a.number?' № '+a.number:''),a.requestPayment&&actKopecks(a)?rub(actKopecks(a)):'')?record.signature:null;
    if(!review&&!signature)return;
    const block=document.createElement('section');block.className='mb-team-response';
    block.innerHTML=`<span class="mb-eyebrow">Ответ клиента · версия ${d.version}</span><h3>${review?escape(review.score)+' / 10':'Работы приняты'}</h3>${review?`<p>Оценка этапа · ${escape(d.period)}</p>${review.liked?`<p><strong>Понравилось:</strong> ${escape(review.liked)}</p>`:''}${review.improve?`<p><strong>Улучшить:</strong> ${escape(review.improve)}</p>`:''}${review.contact?'<p>Клиент хочет обсудить с командой.</p>':''}`:''}${signature?`<div class="mb-team-act"><strong>Акт принят · демо</strong><span>${escape(date(signature.at))}</span><a href="${escape(a.file.dataUrl)}" download="${escape(a.file.name)}">Скачать акт для команды ↓</a></div>`:''}<small>Демо: данные введены в клиентском виде этого браузера.</small>`;
    host.append(block);
  }
  function mount(){
    team();const page=document.querySelector('.mb-client');if(!page||contexts.has(page))return;
    const header=[...page.querySelectorAll('.mb-header-right>span')],project=header[0]?.textContent||'',period=header[1]?.textContent||'';
    const c={page,project,period,id:page.dataset.reportId||[project,period,2].join('|'),stage:[...page.querySelectorAll('.mb-work h3')].map(x=>x.textContent).join(' · ')};
    const section=page.querySelector('#mb-act'),link=section?.querySelector('.mb-document a');
    if(link){const title=section.querySelector('.mb-document strong').textContent,heading=section.querySelector('h2').textContent,amount=heading.includes('₽')?heading:'',href=link.getAttribute('href');c.act={title,amount,href,filename:link.getAttribute('download')||'act.pdf',id:actId(href,title,amount)}}
    contexts.set(page,c);if(page.dataset.feedbackEnabled!=='false')rating(c);signing(c);
    const nav=page.querySelector('.mb-menu a[href="#mb-contact"]');if(nav)nav.textContent='Оценить этап';
  }
  document.addEventListener('click',e=>{
    const score=e.target.closest('.mb-star');if(score)selectScore(score);
    const action=e.target.closest('[data-mx]')?.dataset.mx,c=current();
    if(action==='edit-review')rating(c,true);
    if(action==='open-sign')openSign(c);
    if(action==='close-sign'||e.target===dialog)closeSign();
    if(action==='reset-sign'){const record=read(c);delete record.signature;write(c,record);signing(c)}
  });
  document.addEventListener('input',e=>{
    if(!e.target.matches('.mb-sign-slider input'))return;
    const value=Number(e.target.value),wrap=e.target.parentElement;wrap.style.setProperty('--swipe',value/100);wrap.classList.toggle('is-dragging',value>8);e.target.setAttribute('aria-valuetext',value>=96?'Отпустите для подтверждения':'Сдвиньте до конца вправо');
  });
  document.addEventListener('change',e=>{
    if(!e.target.matches('.mb-sign-slider input'))return;
    const complete=Number(e.target.value)>=96;e.target.value=0;e.target.parentElement.style.setProperty('--swipe',0);e.target.parentElement.classList.remove('is-dragging');e.target.setAttribute('aria-valuetext','Не подтверждено');if(complete)openSign(current());
  });
  document.addEventListener('submit',e=>{
    const c=current();
    if(e.target.matches('.mb-review-form')){
      e.preventDefault();const score=Number(e.target.dataset.score);if(!Number.isInteger(score)||score<1||score>10)return;
      const form=new FormData(e.target),record=read(c);record.review={score,liked:String(form.get('liked')||'').trim(),improve:String(form.get('improve')||'').trim(),contact:form.get('contact')==='on',at:new Date().toISOString()};record.review.persistent=write(c,record);if(!record.review.persistent)memory.set(key(c),record);rating(c);c.page.querySelector('.mb-review-success').scrollIntoView({behavior:'smooth',block:'center'});
    }
    if(e.target.matches('.mb-sign-form')){
      e.preventDefault();const form=new FormData(e.target);if(form.get('accept')!=='on')return;
      if(form.get('code')!=='123456'){e.target.querySelector('.mb-sign-error').textContent='В демо используйте код 123456.';e.target.querySelector('[name=code]').focus();return}
      const record=read(c);record.signature={documentId:c.act.id,at:new Date().toISOString(),demo:true};write(c,record);closeSign();signing(c);c.page.querySelector('.mb-signed-download').focus({preventScroll:true});
    }
  });
  document.addEventListener('keydown',e=>{
    if(dialog){
      if(e.key==='Escape'){e.preventDefault();closeSign()}
      if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('button,a,input')],first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
    }
    const b=e.target.closest('.mb-star');if(b&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)){
      e.preventDefault();let n=Number(b.dataset.score);n=e.key==='Home'?1:e.key==='End'?10:Math.max(1,Math.min(10,n+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)));selectScore(b.parentElement.querySelector(`[data-score="${n}"]`),true);
    }
  });
  return {mount};
})();

let introPlayed=false;const icon=n=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
function mountBrand(){MercuryExperience.mount();const page=document.querySelector('.mb-client');if(!page)return;page.classList.add('mb-mounted');const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.06});page.querySelectorAll('.mb-reveal').forEach(e=>io.observe(e));if(!introPlayed){introPlayed=true;playBrandIntro()}else page.classList.add('mb-ready')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-brand]');if(b?.dataset.brand==='replay')playBrandIntro();if(b?.dataset.brand==='menu'){const nav=document.querySelector('.mb-menu');nav.hidden=!nav.hidden;b.setAttribute('aria-expanded',String(!nav.hidden))}const a=e.target.closest('.mb-client a[href^="#"]');if(a){e.preventDefault();document.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.querySelector('.mb-menu').hidden=true;document.querySelector('.mb-menu-button').setAttribute('aria-expanded','false')}});mountBrand();
