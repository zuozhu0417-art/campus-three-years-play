/* Presentation and short games. Original source, MIT. No remote dependencies. */
window.CampusExperience = (() => {
  'use strict';
  const names={linyao:'林遥',zhaocheng:'赵程',teacher:'韩老师',mother:'妈妈',you:'你',narrator:'九月 · 手记'};
  const root=document.getElementById('overlay-root');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current=null,period='九月';
  const history=[];
  const characters=window.CampusCharacters;
  let motionOn=(()=>{try{const pref=localStorage.getItem('campus-motion-v3');return pref===null?!matchMedia('(prefers-reduced-motion: reduce)').matches:pref==='on';}catch{return false;}})();
  function setMotion(value){motionOn=Boolean(value);try{localStorage.setItem('campus-motion-v3',motionOn?'on':'off');}catch{}current?.refreshMotion?.();}
  function mount(kind,html,done){
    if(current)throw Error('An experience is already open');
    const previous=document.activeElement,el=document.createElement('section');
    el.className='experience '+kind;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
    el.setAttribute('aria-label',kind==='novel'?'校园对话':kind==='cg'?'校园短片':'校园小游戏');
    el.innerHTML=html;root.append(el);document.getElementById('game').classList.add('experience-active');document.getElementById('toast').hidden=true;
    const underneath=[...root.children].filter(x=>x!==el).map(x=>[x,x.inert]);underneath.forEach(([x])=>x.inert=true);
    const play=document.getElementById('play-screen'),oldInert=play.inert;play.inert=true;const title=document.getElementById('title-screen'),oldTitleInert=title.inert;title.inert=true;
    const clean=[];let ended=false;
    const session={el,key:null,pause:null,clean,finish(value){
      if(ended)return;ended=true;clean.forEach(f=>f());el.remove();current=null;play.inert=oldInert;title.inert=oldTitleInert;document.getElementById('game').classList.remove('experience-active');
      underneath.forEach(([x,v])=>x.inert=v);if(previous?.isConnected)previous.focus({preventScroll:true});
      if(done)done(value);
    }};
    current=session;
    queueMicrotask(()=>el.querySelector('button:not(:disabled)')?.focus({preventScroll:true}));
    return session;
  }
  document.addEventListener('keydown',e=>{
    if(!current)return;
    if(e.key==='Tab'){
      const items=[...current.el.querySelectorAll('button:not(:disabled),select')].filter(x=>x.getClientRects().length&&!x.closest('[inert]'));
      if(!items.length){e.preventDefault();return;}
      const index=items.indexOf(document.activeElement);
      if(e.shiftKey&&(index<=0)){e.preventDefault();items.at(-1).focus();}
      else if(!e.shiftKey&&(index===items.length-1||index<0)){e.preventDefault();items[0].focus();}
    }else current.key?.(e);
    e.stopImmediatePropagation();
  },true);
  window.addEventListener('blur',()=>current?.pause?.());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)current?.pause?.();});
  function dialogue({lines,choices=[],title='',detail='',scene=null},done){
    lines=lines.map((line,i)=>characters.enrich(line,i));
    let index=0,full='',count=0,timer,logOpen=false,lastPortrait=null,lastMood='neutral',motionTimer,mediaToken=0;
    const s=mount('novel',`<div class="novel-vignette"></div><img class="novel-character character-still" alt=""><video class="novel-character motion-video" hidden muted playsinline preload="none" aria-hidden="true"></video><div class="novel-caption">${escape(title)}</div><div class="novel-toolbar"><button id="dialogue-motion">人物动态</button><button id="dialogue-log">回看对话</button><button id="dialogue-fast">读完本段</button></div><div class="dialogue-box"><div class="dialogue-identity"><div class="speaker-avatar"></div><strong id="speaker-name"></strong><small id="line-counter"></small></div><div id="dialogue-text" class="dialogue-text" aria-live="polite"></div><div class="dialogue-foot"><span>${escape(detail||'点击正文 / 空格 / Enter 继续')}</span><button id="dialogue-next">继续 <span>▾</span></button></div><div id="dialogue-choices" class="dialogue-choices" hidden></div></div><div class="dialogue-log" hidden><h2>刚才说过的话</h2><div class="log-lines"></div><button id="log-close" class="primary-button">回到对话</button></div>`,done);
    if(scene&&/^[a-z0-9-]+$/.test(scene))s.el.style.background=`url("assets/${scene}.jpg") center / cover`;
    const $=q=>s.el.querySelector(q);
    function renderActor(){
      clearTimeout(motionTimer);mediaToken++;const token=mediaToken,video=$('.motion-video'),image=$('.character-still');
      video.onplaying=null;video.onended=null;video.onerror=null;video.pause();video.hidden=true;image.style.visibility='';
      $('#dialogue-motion').textContent=motionOn?'动态：开':'动态：关';$('#dialogue-motion').setAttribute('aria-pressed',String(motionOn));
      if(!lastPortrait){image.hidden=true;return;}
      const actor=characters.get(lastPortrait),mood=lastMood;
      image.hidden=false;image.src=actor.poses[mood]||actor.base;image.alt=(actor.id.startsWith('player')?characters.profile.name:actor.name)+' · '+({neutral:'平静',smile:'微笑',blink:'眨眼',sad:'失落',laugh:'掩嘴笑',thoughtful:'思考',shy:'害羞',wave:'挥手',pause:'停一停'}[mood]||mood);image.dataset.expression=mood;
      const clipName=lines[index].motion===false?null:mood==='smile'?'warm':mood==='neutral'?'idle':null;
      const clip=clipName&&actor.clips[clipName];if(!motionOn||!clip)return;
      const restore=()=>{if(token!==mediaToken)return;video.hidden=true;image.style.visibility='';};
      video.onplaying=()=>{if(token!==mediaToken)return;video.hidden=false;image.style.visibility='hidden';};
      video.onerror=restore;
      video.onended=()=>{restore();if(clipName==='idle')motionTimer=setTimeout(()=>{if(token===mediaToken&&motionOn&&s.el.isConnected&&!logOpen&&!document.hidden){video.currentTime=0;video.play().catch(restore);}},4300);};
      video.src=clip;video.muted=true;video.play().catch(restore);
    }
    function reveal(){clearInterval(timer);count=full.length;$('#dialogue-text').textContent=full;}
    function paint(){
      clearInterval(timer);const line=lines[index],who=line.who||'narrator',actor=characters.get(who),speaker=actor?(who==='you'?characters.profile.name:actor.name):who==='narrator'?period+' · 手记':names[who]||who;
      $('#speaker-name').textContent=speaker;$('#line-counter').textContent=`${index+1} / ${lines.length}`;
      $('.speaker-avatar').innerHTML=actor?`<img src="${actor.poses[line.mood]||actor.base}" alt="${escape(speaker)}的头像">`:'<span>记</span>';
      if(actor){lastPortrait=who;lastMood=line.mood||'neutral';}
      renderActor();
      full=line.text;count=0;$('#dialogue-text').textContent='';history.push({who:speaker,text:full});if(history.length>150)history.shift();
      $('#dialogue-choices').hidden=true;$('#dialogue-next').hidden=false;$('#dialogue-next').textContent=index===lines.length-1?(choices.length?'作出选择 ▾':'回到生活里 ▾'):'继续 ▾';
      if(matchMedia('(prefers-reduced-motion: reduce)').matches)reveal();
      else timer=setInterval(()=>{count=Math.min(count+1,full.length);$('#dialogue-text').textContent=full.slice(0,count);if(count===full.length)clearInterval(timer);},23);
    }
    function options(){
      const box=$('#dialogue-choices');box.innerHTML='';box.hidden=false;$('#dialogue-next').hidden=true;
      choices.forEach((choice,i)=>{const b=document.createElement('button');b.className='novel-choice';b.id=choice.id||'dialogue-choice-'+i;b.innerHTML=`<span>${escape(choice.text)}</span><small>${escape(choice.note||'')}</small>`;b.onclick=()=>s.finish(choice.value??i);box.append(b);});
      box.querySelector('button')?.focus();
    }
    function next(){if(logOpen)return;if(count<full.length){reveal();return;}if(index<lines.length-1){index++;paint();}else if(choices.length)options();else s.finish();}
    $('#dialogue-next').onclick=next;$('#dialogue-text').onclick=next;
    $('#dialogue-motion').onclick=()=>setMotion(!motionOn);s.refreshMotion=renderActor;
    $('#dialogue-fast').onclick=()=>{while(index<lines.length-1){reveal();index++;paint();}reveal();if(choices.length)options();};
    $('#dialogue-log').onclick=()=>{reveal();logOpen=true;$('.dialogue-box').inert=true;$('.novel-toolbar').inert=true;$('.dialogue-log').hidden=false;$('.log-lines').innerHTML=history.map(l=>`<p><strong>${escape(l.who)}</strong>${escape(l.text)}</p>`).join('');$('#log-close').focus();};
    $('#log-close').onclick=()=>{logOpen=false;$('.dialogue-box').inert=false;$('.novel-toolbar').inert=false;$('.dialogue-log').hidden=true;$('#dialogue-next').focus();};
    s.key=e=>{if(e.key==='Escape'&&logOpen){e.preventDefault();$('#log-close').click();return;}if(!e.repeat&&[' ','Enter'].includes(e.key)&&!logOpen&&!e.target.closest('.novel-choice,#dialogue-log,#dialogue-fast,#dialogue-motion')){e.preventDefault();next();}};
    s.clean.push(()=>{clearInterval(timer);clearTimeout(motionTimer);mediaToken++;const video=$('.motion-video');video.pause();video.removeAttribute('src');video.load();});paint();
  }
  function cg({scene='classroom',title,text,duration=5,period='九月'},done){
    const s=mount('cg',`<div class="cg-image" style="background-image:url('assets/${escape(scene)}.jpg');--cg-duration:${duration}s"></div><div class="cg-rays"></div><div class="cg-dust">${Array.from({length:12},(_,i)=>`<i style="--n:${i}"></i>`).join('')}</div><div class="cg-letterbox top"></div><div class="cg-letterbox bottom"></div><div class="cg-caption"><small>${escape(period)} · ${escape(title)}</small><p>${escape(text)}</p></div><button id="cg-skip">跳过短片 / 空格</button><div class="cg-progress"><i></i></div>`,done);
    let time=0,last=performance.now(),frame;
    const loop=now=>{if(!document.hidden)time+=Math.min((now-last)/1000,.1);last=now;s.el.querySelector('.cg-progress i').style.width=Math.min(100,time/duration*100)+'%';if(time>=duration)s.finish();else frame=requestAnimationFrame(loop);};
    frame=requestAnimationFrame(loop);s.clean.push(()=>cancelAnimationFrame(frame));s.el.querySelector('#cg-skip').onclick=()=>s.finish();
    s.key=e=>{if([' ','Enter','Escape'].includes(e.key)&&!e.repeat){e.preventDefault();s.finish();}};
  }
  function mini(kind,done,{practice=false}={}){
    const running=kind==='running',title=running?'最后一圈，跟上自己的呼吸':'晚自习 · 屏幕别亮太久';
    const s=mount('mini '+kind,`<div class="mini-background"></div><header class="mini-header"><div><small>${running?'操场 · 400 米节奏跑':'教室 · 视野躲避'}</small><h2>${title}</h2></div><button id="mini-pause">暂停 / Esc</button></header><div class="mini-stage">${running?'<div class="run-distance"><strong id="distance">0</strong><span>/ 400 m</span></div><div class="run-lanes"><i></i><i></i><i></i><i></i></div><div class="run-horizon"></div><div class="run-caption">一步，呼气。再一步，吸气。</div>':'<div class="class-map" aria-label="老师视野示意"><div class="mini-blackboard">晚 自 习</div><div class="desk-grid">'+Array.from({length:20},(_,i)=>`<i class="map-desk ${i===17?'your-desk':''}">${i===17?'你':''}</i>`).join('')+'</div><div class="teacher-marker"><div class="vision-cone"></div><span>韩</span></div><div class="teacher-key">扇形区域是老师当前的视野</div></div><div class="phone-readout"><small>赵程 · 班旗草稿</small><p id="phone-message">屏幕已收起</p><div class="mini-meter"><i id="read-meter"></i></div><span id="read-label">0 / 3 条消息</span></div>'}</div><div class="mini-console"><div class="mini-status"><span id="mini-signal">准备好再开始</span><strong id="mini-time">${running?'22':'18'} 秒</strong></div>${running?'<div class="rhythm-track"><div class="rhythm-target">落脚区</div><i id="rhythm-dot"></i></div>':'<div class="exposure-line"><span>被注意</span><div class="mini-meter"><i id="exposure-meter"></i></div><strong id="exposure-label">0%</strong></div>'}<div class="mini-controls"><button id="mini-action" class="primary-button" disabled>${running?'落脚 · 空格':'拿出手机 · 空格'}</button><span id="mini-feedback">${running?'光点到中央浅色区时按一下；乱按会打乱呼吸。':'按一下拿出，再按一下收起。老师转身前会提醒。'}</span></div></div><div class="mini-curtain"><div class="mini-instructions"><small>一段课余时间</small><h2>${title}</h2><p>${running?'22 秒内跑完 400 米。光点到中央落脚区时，按空格或点“落脚”。保持节奏会加速，连续乱按会减速。':'18 秒内读完 3 条消息。按空格或点按钮切换拿出 / 收起。老师背对你时看，准备转身时收起；进入视野后仍亮屏会积累注意。'}</p><p class="modal-note">${running?'离开小游戏不会扣时间或精力。完成后消耗 14 精力。':'离开小游戏不会扣时间或精力。完成或被发现消耗 8 精力，不会直接结束游戏。'}</p><button class="primary-button" id="mini-start">准备好了，开始</button><button class="secondary-button" id="mini-abandon">先回去，不消耗时间</button></div></div>`,done);
    const $=q=>s.el.querySelector(q);let started=false,paused=true,elapsed=0,frame,last=performance.now(),distance=0,hits=0,misses=0,lastTap=-10,read=0,exposure=0,phoneOut=false;
    if(practice){$('.mini-instructions small').textContent='独立练习';$('.mini-instructions .modal-note').textContent='这是主界面的练习。完成、失败或返回都不会消耗剧情时间和精力，也不会改变存档。';}
    const duration=running?22:18;
    const setPhone=v=>{phoneOut=v;$('#mini-action').textContent=v?'收起手机 · 空格':'拿出手机 · 空格';s.el.classList.toggle('phone-out',v);};
    function finish(won){s.finish({won,hits,misses,distance:Math.round(distance),read:Math.floor((read+1e-6)/1.6),caught:exposure>=100});}
    function pause(){if(!started||paused)return;paused=true;if(!running)setPhone(false);$('.mini-curtain').hidden=false;$('#mini-start').textContent='继续这一段';$('#mini-start').focus();s.el.classList.add('paused');}
    function action(){if(!started||paused)return;
      if(!running){setPhone(!phoneOut);return;}
      if(elapsed-lastTap<.18)return;
      lastTap=elapsed;const phase=(elapsed% .8)/.8,good=Math.abs(phase-.5)<=.18;
      if(good){hits++;distance=Math.min(400,distance+17);$('#mini-feedback').textContent='跟上了。呼吸没有乱。';s.el.classList.add('good-step');setTimeout(()=>s.el.classList.remove('good-step'),130);}
      else{misses++;distance=Math.max(0,distance-4);$('#mini-feedback').textContent='慢半拍，等光点到落脚区。';}
    }
    $('#mini-start').onclick=()=>{started=true;paused=false;last=performance.now();$('.mini-curtain').hidden=true;s.el.classList.remove('paused');$('#mini-action').disabled=false;$('#mini-action').focus();};
    $('#mini-abandon').onclick=()=>s.finish(null);$('#mini-pause').onclick=pause;$('#mini-action').onclick=action;s.pause=pause;
    s.key=e=>{if(e.repeat)return;if(e.key==='Escape'){e.preventDefault();pause();}else if(e.code==='Space'){e.preventDefault();if(!paused)action();}else if(e.key==='Enter'&&e.target===$('#mini-action')){e.preventDefault();action();}};
    function loop(now){
      const dt=Math.min((now-last)/1000,.05);last=now;
      if(started&&!paused&&!document.hidden){
        elapsed+=dt;$('#mini-time').textContent=Math.max(0,Math.ceil(duration-elapsed))+' 秒';
        if(running){
          distance=Math.min(400,distance+5*dt);$('#distance').textContent=Math.floor(distance);$('#rhythm-dot').style.left=((elapsed%.8)/.8*100)+'%';$('#mini-signal').textContent=`稳稳落脚 ${hits} 次 · 呼吸乱了 ${misses} 次`;
          s.el.style.setProperty('--run-progress',distance/400);
          if(distance>=400){finish(true);return;}
        }else{
          const phase=elapsed%6,watching=phase>=3.4&&phase<5.6,warning=phase>=2.5&&phase<3.4;
          s.el.dataset.teacher=watching?'watching':warning?'warning':'away';
          $('#mini-signal').textContent=watching?'老师正在看这一排 · 收起手机':warning?'老师准备转身 · 现在收起':'老师背对你 · 可以短暂看消息';
          $('.teacher-marker').style.left=(48+Math.sin(elapsed*.7)*6)+'%';
          if(phoneOut){if(watching)exposure=Math.min(100,exposure+90*dt);else read=Math.min(4.8,read+dt);}else exposure=Math.max(0,exposure-23*dt);
          $('#phone-message').textContent=phoneOut?['草稿我画好了，你看左边这个？','最后那一块，想留给全班签名字。','下周颜料我带。你人来就行。'][Math.min(2,Math.floor(read/1.6))]:'屏幕已收起';
          $('#read-meter').style.width=read/4.8*100+'%';$('#read-label').textContent=Math.min(3,Math.floor((read+1e-6)/1.6))+' / 3 条消息';
          $('#exposure-meter').style.width=exposure+'%';$('#exposure-label').textContent=Math.round(exposure)+'%';
          if(exposure>=100){finish(false);return;}if(read>=4.8){finish(true);return;}
        }
        if(elapsed>=duration){finish(false);return;}
      }
      frame=requestAnimationFrame(loop);
    }
    frame=requestAnimationFrame(loop);s.clean.push(()=>cancelAnimationFrame(frame));
  }
  function basketball({assist=false}={},done){
    const s=mount('mini basketball',`<div class="mini-background"></div><header class="mini-header"><div><small>周末 · 半场球</small><h2>投歪了，也有人给你捡回来</h2></div><button id="ball-pause">暂停 / Esc</button></header><div class="ball-court"><div class="ball-board"><i></i></div><div class="ball-shadow"></div><div class="ball-picture" aria-hidden="true">●</div><p id="ball-score">准备好后，试投三次</p></div><div class="ball-console"><p id="ball-feedback" role="status">光点进到中间的浅色区，再按投篮。</p><div class="ball-meter"><div class="ball-target"></div><i id="ball-dot"></i></div><div class="ball-actions"><button id="ball-shoot" class="primary-button" disabled>投篮 · 空格</button>${assist?'<button id="ball-signal" class="secondary-button" disabled>看赵程的接球暗号</button>':''}</div><small>三次投篮，输赢都能好好结束这一场。中途返回不消耗时间和精力。</small></div><div class="mini-curtain"><div class="mini-instructions"><small>周六 · 和赵程</small><h2>先打半场，不急着比分数</h2><p>光点经过中央浅色区时，点“投篮”或按空格。一共三球，没有倒计时；投不进也能和同学相处。</p><button id="ball-start" class="primary-button">系好鞋带，开始</button><button id="ball-abandon" class="secondary-button">先回去，不消耗时间</button></div></div>`,done);
    const $=q=>s.el.querySelector(q);let playing=false,paused=true,shots=0,hits=0,time=0,last=performance.now(),frame,boost=false,used=false,locked=false,cooldown=0;
    const paint=()=>{$('#ball-score').textContent=`投了 ${shots} / 3 球 · 命中 ${hits} 球`;$('#ball-dot').style.left=((time%1.4)/1.4*100)+'%';};
    function pause(){if(!playing||paused)return;paused=true;$('.mini-curtain').hidden=false;$('#ball-start').textContent='继续这场球';$('#ball-start').focus();}
    function shot(){
      if(!playing||paused||locked||shots>=3)return;locked=true;
      const good=Math.abs((time%1.4)/1.4-.5)<=(boost?.25:.16);shots++;if(good)hits++;
      boost=false;s.el.classList.remove('ball-assist');
      $('#ball-feedback').textContent=good?'进了！赵程已经把球传回来了。':'差一点。赵程捡起球：再来，我接着。';
      s.el.classList.remove('ball-hit','ball-miss');s.el.classList.add(good?'ball-hit':'ball-miss');paint();window.CampusSfx?.play(good?'confirm':'tap');
      $('#ball-shoot').disabled=true;
      cooldown=.7;
    }
    $('#ball-start').onclick=()=>{playing=true;paused=false;last=performance.now();$('.mini-curtain').hidden=true;$('#ball-shoot').disabled=locked;$('#ball-shoot').focus();if(assist)$('#ball-signal').disabled=used;paint();};
    $('#ball-pause').onclick=pause;$('#ball-abandon').onclick=()=>s.finish(null);$('#ball-shoot').onclick=shot;
    if(assist)$('#ball-signal').onclick=()=>{if(paused||used)return;used=true;boost=true;$('#ball-signal').disabled=true;s.el.classList.add('ball-assist');$('#ball-feedback').textContent='赵程已经站稳。这一次落点放宽，照你们的暗号投。';};
    s.pause=pause;s.key=e=>{if(e.repeat)return;if(e.key==='Escape'){e.preventDefault();pause();}else if(e.code==='Space'){e.preventDefault();shot();}};
    const loop=now=>{const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;if(playing&&!paused&&!document.hidden){if(locked){cooldown-=dt;if(cooldown<=0){locked=false;s.el.classList.remove('ball-hit','ball-miss');if(shots===3){s.finish({hits,shots});return;}$('#ball-shoot').disabled=false;}}else time+=dt;}paint();frame=requestAnimationFrame(loop);};
    frame=requestAnimationFrame(loop);s.clean.push(()=>cancelAnimationFrame(frame));
  }
  return {get busy(){return !!current;},get motionEnabled(){return motionOn;},setPeriod(value){period=value;},setMotion,dialogue,cg,basketball,running:(done,options)=>mini('running',done,options),phone:(done,options)=>mini('phone-game',done,options)};
})();
