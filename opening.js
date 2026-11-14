/* Opening film controller: no changes to narrative saves or new-game flow. */
window.CampusOpening=(()=>{
  'use strict';
  const KEY='campus-opening-film-v1-seen',game=document.getElementById('game');
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active=null;
  const hasSeen=()=>{try{return localStorage.getItem(KEY)==='yes';}catch{return false;}};
  const remember=()=>{try{localStorage.setItem(KEY,'yes');}catch{}};
  function show(){
    if(active)return;
    const previous=document.activeElement,oldInert=game.inert;
    const el=document.createElement('section');el.className='opening-screen';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','校园三年开场短片');
    el.innerHTML=`<div class="opening-atmosphere"></div><video id="opening-video" class="opening-video" muted playsinline preload="auto" poster="assets/opening/poster.jpg" aria-label="走进教室，遇见这三年"><source src="assets/opening/campus-opening-v1.mp4" type="video/mp4"></video><canvas class="opening-canvas" width="1280" height="720" hidden aria-label="校园开场动画"></canvas><header class="opening-header"><span>九月 · 开学前<br>一段还没开始的日常</span><div class="opening-controls"><button id="opening-sound" aria-pressed="false">开启声音</button><button id="opening-pause">暂停</button></div></header><div class="opening-mobile-copy"><strong>校园三年</strong><small>风经过座位<br>这一次，从你走进教室开始。</small></div><footer class="opening-footer"><p>19 秒 · 铃声、操场、还空着的座位</p><button id="opening-skip" class="opening-skip">先去教室 →</button></footer><div class="opening-progress"><i></i></div><p class="opening-status" role="status">正在推开教室的门……</p>`;
    document.body.append(el);game.inert=true;document.documentElement.classList.remove('opening-pending');
    const video=el.querySelector('video'),canvas=el.querySelector('canvas'),bar=el.querySelector('.opening-progress i'),status=el.querySelector('.opening-status'),pause=el.querySelector('#opening-pause'),sound=el.querySelector('#opening-sound');
    const session={el,video,mode:'video',frame:0,fallbackTime:0,fallbackPaused:false,last:0,hiddenPaused:false,closed:false};active=session;
    function close(){
      if(session.closed)return;session.closed=true;remember();cancelAnimationFrame(session.frame);video.pause();video.removeAttribute('src');video.querySelector('source')?.remove();video.load();el.remove();game.inert=oldInert;active=null;
      document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);
      const target=previous?.isConnected&&previous!==document.body?previous:document.querySelector('#continue-game:not([hidden])')||document.getElementById('new-game');target?.focus({preventScroll:true});
    }
    function update(){
      if(session.closed||session.mode!=='video')return;
      bar.style.transform=`scaleX(${Math.min(1,video.currentTime/18.8)})`;session.frame=requestAnimationFrame(update);
    }
    function play(){
      if(session.mode==='fallback'){session.fallbackPaused=false;session.last=performance.now();pause.textContent='暂停';return;}
      const attempt=video.play();if(attempt)attempt.catch(()=>{if(!session.closed&&session.mode==='video'){status.hidden=false;status.textContent='点“开始播放”，一起走进教室。';pause.textContent='开始播放';}});
    }
    function toggle(){
      if(session.mode==='fallback'){session.fallbackPaused=!session.fallbackPaused;session.last=performance.now();pause.textContent=session.fallbackPaused?'继续播放':'暂停';return;}
      if(video.paused)play();else video.pause();
    }
    async function fallback(){
      if(session.closed||session.mode==='fallback')return;session.mode='fallback';cancelAnimationFrame(session.frame);video.pause();video.hidden=true;canvas.hidden=false;sound.disabled=true;sound.textContent='静音画面';status.hidden=false;status.textContent='正在打开校园画面……';
      try{
        await window.CampusOpeningFilm.load();if(session.closed)return;status.hidden=true;session.last=performance.now();const ctx=canvas.getContext('2d',{alpha:false});
        const tick=now=>{
          if(session.closed)return;const dt=Math.min(.1,(now-session.last)/1000);session.last=now;
          if(!session.fallbackPaused&&!document.hidden)session.fallbackTime+=dt;
          window.CampusOpeningFilm.draw(ctx,session.fallbackTime);bar.style.transform=`scaleX(${Math.min(1,session.fallbackTime/18.8)})`;
          if(session.fallbackTime>=18.8){close();return;}session.frame=requestAnimationFrame(tick);
        };session.frame=requestAnimationFrame(tick);
      }catch{if(!session.closed){status.textContent='画面暂时没有载入。可以先去教室，故事照常开始。';pause.disabled=true;}}
    }
    function key(e){
      if(session.closed)return;
      if(e.key==='Escape'){e.preventDefault();close();e.stopImmediatePropagation();return;}
      if(e.code==='Space'&&!e.repeat&&!e.target.closest('button')){e.preventDefault();toggle();}
      if(e.key==='Tab'){
        const controls=[...el.querySelectorAll('button:not(:disabled)')];const i=controls.indexOf(document.activeElement);
        if(e.shiftKey&&i<=0){e.preventDefault();controls.at(-1).focus();}else if(!e.shiftKey&&(i<0||i===controls.length-1)){e.preventDefault();controls[0].focus();}
      }
      e.stopImmediatePropagation();
    }
    function visibility(){
      if(session.mode==='fallback'){if(document.hidden){session.hiddenPaused=!session.fallbackPaused;session.fallbackPaused=true;}else if(session.hiddenPaused){session.fallbackPaused=false;session.hiddenPaused=false;session.last=performance.now();}return;}
      if(document.hidden){session.hiddenPaused=!video.paused;video.pause();}else if(session.hiddenPaused){session.hiddenPaused=false;play();}
    }
    pause.onclick=toggle;sound.onclick=()=>{video.muted=!video.muted;sound.textContent=video.muted?'开启声音':'声音已开启';sound.setAttribute('aria-pressed',String(!video.muted));if(video.paused)play();};
    el.querySelector('#opening-skip').onclick=close;
    video.addEventListener('playing',()=>{status.hidden=true;pause.textContent='暂停';});video.addEventListener('pause',()=>{if(!session.closed&&session.mode==='video')pause.textContent='继续播放';});video.addEventListener('ended',close);video.addEventListener('error',fallback);video.querySelector('source').addEventListener('error',fallback);
    document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);
    el.querySelector('#opening-skip').focus({preventScroll:true});update();video.muted=true;play();
  }
  document.getElementById('opening-replay').onclick=show;
  if(!hasSeen()&&!reduced())show();else document.documentElement.classList.remove('opening-pending');
  return {show,get active(){return !!active;},get mode(){return active?.mode||null;}};
})();
