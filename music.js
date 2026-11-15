/* Original procedural score: September, After Class. No external recordings. */
(() => {
  'use strict';
  const KEY='campus-music-v17';
  let enabled=true,ctx,master,filter,timer,next=0,bar=0,unlocked=false;
  try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
  const chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59],
    [48,55,59,64],[45,52,60,64],[41,48,57,60],[43,50,59,62],
    [45,52,57,60],[40,47,55,59],[41,48,53,60],[48,55,60,64],
    [41,48,57,60],[43,50,55,62],[48,55,60,64],[48,55,60,64]];
  // Each phrase has space to breathe; 16 bars at 66 BPM, with a second sparse pass.
  const melody=[[0,76],[2,74],[0,72],[2.5,71],[0,69],[2,72],[0,71],[2,67],
    [0,72],[1.5,76],[0,74],[2.5,72],[0,69],[2,67],[0,67],null];
  const beat=60/66,measure=beat*4;
  function blocked(){return document.hidden||[...document.querySelectorAll('video,audio')].some(v=>!v.paused&&!v.ended&&!v.muted&&v.volume>0);}
  function fade(){if(!ctx)return;const t=ctx.currentTime;master.gain.cancelScheduledValues(t);master.gain.setTargetAtTime(enabled&&!blocked()?0.105:0,t,0.8);}
  function note(midi,time,velocity=0.2,length=2.5){
    const envelope=ctx.createGain();envelope.gain.setValueAtTime(0,time);envelope.gain.linearRampToValueAtTime(velocity,time+0.025);envelope.gain.exponentialRampToValueAtTime(0.0001,time+length);envelope.connect(filter);
    for(const [ratio,level] of [[1,1],[2,0.22],[3,0.045]]){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=440*2**((midi-69)/12)*ratio;g.gain.value=level;o.connect(g);g.connect(envelope);o.start(time);o.stop(time+length+0.05);o.onended=()=>{o.disconnect();g.disconnect();};}
    setTimeout(()=>envelope.disconnect(),Math.max(0,(time-ctx.currentTime+length+0.2)*1000));
  }
  function schedule(){
    if(!ctx||ctx.state!=='running'||!enabled||blocked())return;
    if(next<ctx.currentTime)next=ctx.currentTime+0.12;
    while(next<ctx.currentTime+0.6){
      const index=bar%16,chord=chords[index],second=Math.floor(bar/16)%2;
      note(chord[0],next,0.16,3.6);
      note(chord[1],next+beat,0.09,2.8);note(chord[2],next+beat*1.15,0.075,2.6);note(chord[3],next+beat*1.3,0.065,2.5);
      const phrase=melody[index];if(phrase&&(!second||index%2===0))note(phrase[1],next+phrase[0]*beat,0.17,3.1);
      next+=measure;bar++;
    }
  }
  function sync(){
    document.querySelectorAll('[data-music-toggle]').forEach(b=>{b.textContent='背景音乐：'+(enabled?'开':'关');b.setAttribute('aria-pressed',String(enabled));});
    const b=document.querySelector('#sound-button');if(b){b.textContent=enabled?'乐':'静';b.title=b.getAttribute('aria-label')||'';b.setAttribute('aria-label',enabled?'关闭背景音乐':'开启背景音乐');b.title=b.getAttribute('aria-label');b.setAttribute('aria-pressed',String(enabled));}
  }
  async function unlock(){
    if(!enabled)return;
    try{
      if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1800;filter.connect(master);
        const delay=ctx.createDelay(1),wet=ctx.createGain();delay.delayTime.value=0.32;wet.gain.value=0.15;filter.connect(delay);delay.connect(wet);wet.connect(master);
        timer=setInterval(schedule,150);
      }
      await ctx.resume();unlocked=true;fade();schedule();
    }catch{document.dispatchEvent(new CustomEvent('campus-music-error'));}
  }
  function set(value){enabled=!!value;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}sync();if(enabled)unlock();else fade();}
  document.addEventListener('pointerdown',()=>{if(!unlocked)unlock();},{passive:true});
  document.addEventListener('keydown',()=>{if(!unlocked)unlock();});
  document.addEventListener('visibilitychange',()=>{fade();if(ctx){if(document.hidden)setTimeout(()=>{if(document.hidden)ctx.suspend().catch(()=>{});},3000);else if(enabled)unlock();}});
  for(const event of ['play','pause','ended','volumechange'])document.addEventListener(event,()=>{fade();schedule();},true);
  window.CampusMusic={get enabled(){return enabled;},set,toggle:()=>set(!enabled),sync,get status(){return {enabled,unlocked,context:ctx?.state||'locked',volume:master?.gain.value||0,bar,blocked:blocked()};}};
  sync();
})();
