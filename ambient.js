/* Local illustrated scene films. No network service or save migration required. */
window.CampusAmbient = (() => {
  'use strict';
  const world=document.getElementById('world'),overlay=document.getElementById('overlay-root');
  const films={classroom:'classroom-study',lesson:'classroom-lesson',canteen:'canteen-lunch'};
  const video=document.createElement('video');
  video.className='ambient-film';video.muted=true;video.defaultMuted=true;video.loop=true;
  video.playsInline=true;video.preload='none';video.setAttribute('aria-hidden','true');video.tabIndex=-1;
  let context={place:'classroom',week:1},key='',host=null,failed=new Set(),queued=false,attempt=0;
  function hide(){attempt++;video.pause();video.classList.remove('is-playing');}
  function enabled(){return window.CampusExperience?.motionEnabled??!matchMedia('(prefers-reduced-motion: reduce)').matches;}
  function refresh(){
    queued=false;
    const top=overlay.lastElementChild;
    const novel=top?.matches('.novel[data-ambient-place]')?top:null;
    const lesson=top?.hasAttribute('data-ambient-lesson')?top:null;
    let place=lesson?'classroom':novel?.dataset.ambientPlace||context.place;
    const target=novel||world;
    const film=lesson?'lesson':place;
    // The second-year classroom has a different layout; retain its own illustration.
    const supported=films[film]&&!(context.week>=21&&place==='classroom');
    const covered=overlay.children.length&&!novel&&!lesson;
    if(document.hidden||!enabled()||!supported||covered){hide();return;}
    if(host!==target){hide();target.prepend(video);host=target;}
    if(key!==film){hide();key=film;video.dataset.scene=film;video.src=`assets/ambient/${films[film]}.mp4`;video.load();}
    if(failed.has(film)){hide();return;}
    if(video.paused){const token=++attempt;video.play().catch(()=>{if(token===attempt)hide();});}
  }
  function schedule(){if(!queued){queued=true;queueMicrotask(refresh);}}
  video.addEventListener('playing',()=>{if(!document.hidden&&enabled())video.classList.add('is-playing');else hide();});
  video.addEventListener('error',()=>{failed.add(key);hide();});
  document.addEventListener('visibilitychange',schedule);
  document.addEventListener('campus-motion-change',schedule);
  // A user gesture can resume a browser-blocked muted autoplay attempt.
  document.addEventListener('pointerdown',schedule,{passive:true});
  new MutationObserver(schedule).observe(overlay,{childList:true,subtree:true});
  window.addEventListener('pagehide',hide);
  return {setContext(value){context={...context,...value};schedule();},refresh:schedule};
})();
