/* Voiced opening: a gesture starts sound; the film dissolves into the title. */
window.CampusOpening=(()=>{
  'use strict';
  const KEY='campus-opening-film-v10-seen',game=document.getElementById('game');
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasSeen=()=>{try{return localStorage.getItem(KEY)==='yes';}catch{return false;}};
  const remember=()=>{try{localStorage.setItem(KEY,'yes');}catch{}};
  let active=null;
  function show({autoplay=false}={}){
    if(active)return;
    const previous=document.activeElement,oldInert=game.inert;
    const el=document.createElement('section');el.className='opening-screen is-waiting';
    el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','校园三年配音开场');
    el.innerHTML=`<div class="opening-atmosphere"></div><video id="opening-video" class="opening-video" muted playsinline preload="auto" poster="assets/opening/poster-v10.jpg" aria-label="走进教室，遇见这三年"><source src="assets/opening/campus-opening-v10.mp4" type="video/mp4"></video><canvas class="opening-canvas" width="1280" height="720" hidden aria-label="校园开场动画"></canvas>
      <header class="opening-header"><span>九月 · 报到之前<br>风经过一个空着的座位</span><div class="opening-controls"><button id="opening-sound" aria-pressed="true">声音：开</button><button id="opening-pause" disabled>暂停</button></div></header>
      <div class="opening-gate"><p>有些故事，从一句话开始。</p><button id="opening-start">走进那年九月 <span aria-hidden="true">→</span></button><small>21 秒配音开场 · 建议开启声音</small></div>
      <div class="opening-mobile-copy"><strong>校园三年</strong><small>“这里，给你留着呢。”<br>从第一天，重新开始。</small></div><footer class="opening-footer"><p>铃声响起之前，再待一会儿。</p><button id="opening-skip" class="opening-skip">进入游戏 →</button></footer><div class="opening-progress"><i></i></div><p class="opening-status" role="status" hidden></p>`;
    document.body.append(el);game.inert=true;document.documentElement.classList.remove('opening-pending');
    const video=el.querySelector('video'),canvas=el.querySelector('canvas'),bar=el.querySelector('.opening-progress i'),status=el.querySelector('.opening-status'),pause=el.querySelector('#opening-pause'),sound=el.querySelector('#opening-sound'),start=el.querySelector('#opening-start');
    const session={el,video,mode:'video',frame:0,fadeFrame:0,fallbackTime:0,fallbackPaused:true,last:0,hiddenPaused:false,started:false,soundOn:true,closing:false,closed:false};active=session;
    function release(){
      if(session.closed)return;session.closed=true;cancelAnimationFrame(session.frame);cancelAnimationFrame(session.fadeFrame);
      video.pause();video.removeAttribute('src');video.querySelector('source')?.remove();video.load();el.remove();game.inert=oldInert;active=null;
      document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);game.classList.remove('opening-revealing');
      const target=previous?.isConnected&&previous!==document.body?previous:document.querySelector('#continue-game:not([hidden])')||document.getElementById('new-game');target?.focus({preventScroll:true});
    }
    function close(reason='skip'){
      if(session.closed||session.closing)return;session.closing=true;remember();cancelAnimationFrame(session.frame);
      const ms=reduced()?0:(reason==='end'?1150:650),volume=video.volume,began=performance.now();
      el.style.setProperty('--opening-leave',`${ms}ms`);el.classList.add('is-leaving');el.querySelectorAll('button').forEach(button=>button.disabled=true);game.classList.add('opening-revealing');
      const fade=now=>{if(session.closed)return;const t=Math.max(0,Math.min(1,(now-began)/Math.max(1,ms)));video.volume=Math.max(0,volume*(1-t)*(1-t));if(t<1)session.fadeFrame=requestAnimationFrame(fade);};
      if(!ms){release();return;}session.fadeFrame=requestAnimationFrame(fade);
      // Also finish if a background tab stops painting.
      setTimeout(release,ms+40);
    }
    function update(){
      if(session.closed||session.closing||session.mode!=='video')return;
      const duration=Number.isFinite(video.duration)?video.duration:21.2;bar.style.transform=`scaleX(${Math.min(1,video.currentTime/duration)})`;
      if(session.started&&!video.paused&&duration-video.currentTime<.65){close('end');return;}session.frame=requestAnimationFrame(update);
    }
    function play(){
      if(session.closed||session.closing)return;
      if(session.mode==='fallback'){session.started=true;session.fallbackPaused=false;session.last=performance.now();el.classList.remove('is-waiting');pause.disabled=false;pause.textContent='暂停';return;}
      start.disabled=true;status.hidden=false;status.textContent='正在推开教室的门……';video.muted=!session.soundOn;video.volume=.9;
      const attempt=video.play();if(attempt)attempt.catch(()=>{if(session.closed||session.closing||session.mode!=='video')return;start.disabled=false;start.innerHTML='点击开始播放 <span aria-hidden="true">→</span>';el.classList.add('is-waiting');status.hidden=true;pause.textContent='开始播放';pause.disabled=false;});
    }
    function toggle(){
      if(session.closed||session.closing)return;
      if(session.mode==='fallback'){if(!session.started){play();return;}session.fallbackPaused=!session.fallbackPaused;session.last=performance.now();pause.textContent=session.fallbackPaused?'继续播放':'暂停';return;}
      if(video.paused)play();else video.pause();
    }
    async function fallback(){
      if(session.closed||session.closing||session.mode==='fallback')return;session.mode='fallback';cancelAnimationFrame(session.frame);video.pause();video.hidden=true;canvas.hidden=false;sound.disabled=true;sound.textContent='静音画面';status.hidden=false;status.textContent='正在打开校园画面……';
      try{
        await window.CampusOpeningFilm.load();if(session.closed||session.closing)return;status.hidden=true;session.last=performance.now();pause.disabled=!session.started;session.fallbackPaused=!session.started;start.disabled=false;
        const ctx=canvas.getContext('2d',{alpha:false});
        const tick=now=>{if(session.closed||session.closing)return;const dt=Math.max(0,Math.min(.1,(now-session.last)/1000));session.last=now;if(!session.fallbackPaused&&!document.hidden)session.fallbackTime+=dt;window.CampusOpeningFilm.draw(ctx,session.fallbackTime);bar.style.transform=`scaleX(${Math.min(1,session.fallbackTime/18.8)})`;if(session.fallbackTime>=18.8){close('end');return;}session.frame=requestAnimationFrame(tick);};
        session.frame=requestAnimationFrame(tick);if(autoplay&&!session.started)play();
      }catch{if(!session.closed){status.textContent='画面暂时没有载入。可以直接进入游戏，故事照常开始。';pause.disabled=true;start.disabled=true;}}
    }
    function key(e){
      if(session.closed)return;
      if(e.key==='Escape'){e.preventDefault();close();}
      else if(!session.closing&&e.code==='Space'&&!e.repeat&&!e.target.closest('button')){e.preventDefault();toggle();}
      else if(!session.closing&&e.key==='Tab'){const controls=[...el.querySelectorAll('button:not(:disabled)')].filter(button=>button.getClientRects().length&&getComputedStyle(button).visibility!=='hidden'),i=controls.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();controls.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===controls.length-1)){e.preventDefault();controls[0]?.focus();}}
      e.stopImmediatePropagation();
    }
    function visibility(){
      if(session.closed||session.closing||!session.started)return;
      if(session.mode==='fallback'){if(document.hidden){session.hiddenPaused=!session.fallbackPaused;session.fallbackPaused=true;}else if(session.hiddenPaused){session.fallbackPaused=false;session.hiddenPaused=false;session.last=performance.now();}return;}
      if(document.hidden){session.hiddenPaused=!video.paused;video.pause();}else if(session.hiddenPaused){session.hiddenPaused=false;play();}
    }
    start.onclick=play;pause.onclick=toggle;
    sound.onclick=()=>{if(session.closing)return;session.soundOn=!session.soundOn;video.muted=!session.soundOn;sound.textContent=session.soundOn?'声音：开':'声音：关';sound.setAttribute('aria-pressed',String(session.soundOn));};
    el.querySelector('#opening-skip').onclick=()=>close();
    video.addEventListener('playing',()=>{if(session.closing)return;const waiting=el.classList.contains('is-waiting');session.started=true;status.hidden=true;el.classList.remove('is-waiting');pause.disabled=false;pause.textContent='暂停';if(waiting)pause.focus({preventScroll:true});});
    video.addEventListener('pause',()=>{if(!session.closed&&!session.closing&&session.mode==='video'&&session.started)pause.textContent='继续播放';});
    video.addEventListener('ended',()=>close('end'));video.addEventListener('error',fallback);video.querySelector('source').addEventListener('error',fallback);
    document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);start.focus({preventScroll:true});update();if(autoplay)play();
  }
  document.getElementById('opening-replay').onclick=()=>show({autoplay:true});
  for(const id of ['new-game','continue-game'])document.getElementById(id).addEventListener('click',()=>{game.classList.add('story-arriving');setTimeout(()=>game.classList.remove('story-arriving'),1000);},{capture:true});
  if(!hasSeen()&&!reduced())show();else document.documentElement.classList.remove('opening-pending');
  return {show,get active(){return !!active;},get mode(){return active?.mode||null;},get closing(){return !!active?.closing;}};
})();
