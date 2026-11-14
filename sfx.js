/* Tiny locally synthesized UI sounds; independent from the optional wind bed. */
window.CampusSfx=(()=>{
  const KEY='campus-ui-sfx-v1';let enabled=true,ctx=null,last=-100,played=0;
  try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
  function play(kind='tap'){
    if(!enabled||document.hidden)return;const now=performance.now();if(now-last<45)return;last=now;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      if(!ctx)ctx=new Audio();if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sine';osc.frequency.setValueAtTime(kind==='confirm'?780:520,t);osc.frequency.exponentialRampToValueAtTime(kind==='confirm'?1040:330,t+.045);
      gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.035,t+.005);gain.gain.exponentialRampToValueAtTime(.0001,t+.065);
      osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.07);osc.onended=()=>{osc.disconnect();gain.disconnect();};played++;
    }catch{/* A browser without Web Audio still plays the game normally. */}
  }
  document.addEventListener('click',e=>{
    const el=e.target.closest?.('button,.dialogue-text');
    if(!el||el.disabled||el.closest('[inert],.opening-screen')||!e.isTrusted)return;
    play(el.matches('.primary-button,.novel-choice,[data-weekend-choice]')?'confirm':'tap');
  },true);
  function set(value){enabled=Boolean(value);try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}if(enabled)play('confirm');return enabled;}
  return {play,set,get enabled(){return enabled;},get playedCount(){return played;},get state(){return ctx?.state||'not-started';}};
})();
