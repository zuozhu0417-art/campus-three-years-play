/* 校园三年 — local, dependency-free playable chapter. MIT licensed source. */
(() => {
  'use strict';
  const C = window.CAMPUS_CONTENT;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const KEY = 'campus-three-years-portraits-v3';
  const E=window.CampusExperience;
  let activeSpeaker=null;
  const COST={friend:12,girl:12,running:14,inspection:8};
  const categoryName = {study:'订正功课',friend:'和人待一会儿',rest:'留一点空白'};
  let S = null, toastTimer, audio = null, soundOn = false;
  const screens = [];
  let saved = readSave();

  const ICONS = {
    school:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-7h6v7M8 9h8"/>',
    bowl:'<path d="M3 11h18a9 9 0 0 1-18 0ZM6 21h12M8 3v4m4-4v4m4-4v4"/>',
    home:'<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-12 5h2m3 0h2"/>'
  };
  $$('[data-icon]').forEach(el => el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[el.dataset.icon]||''}</svg>`);

  function initial() {
    return {version:3,profile:{gender:null,name:'你'},fitness:0,caught:0,cgSeen:[],week:1,place:'classroom',remaining:3,seat:null,plan:null,done:[],
      study:0,friend:0,warm:0,family:0,energy:64,promise:null,promiseKept:false,echoResolved:false,
      taste:null,notePromise:false,noteKept:false,memories:[],diaries:[],ended:false};
  }
  function readSave() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('campus-three-years-dynamic-v2')||localStorage.getItem('campus-three-years-chapter1-v1'));
      if (!d || ![1,2,3].includes(d.version) || !Number.isInteger(d.week) || d.week<1 || d.week>4 || !C.places[d.place]) return null;
      if (!Number.isInteger(d.remaining) || d.remaining<0 || d.remaining>3 || !Array.isArray(d.done) || !Array.isArray(d.memories) || !Array.isArray(d.diaries)) return null;
      if (!['study','friend','warm','family','energy'].every(k=>Number.isFinite(d[k]))) return null;
      if (d.seat!==null && (!Number.isInteger(d.seat) || d.seat<0 || d.seat>43)) return null;
      if (d.plan!==null && (!Array.isArray(d.plan) || d.plan.length!==3 || !d.plan.every(k=>categoryName[k]))) return null;
      d.version=3;d.profile={gender:['male','female'].includes(d.profile?.gender)?d.profile.gender:null,name:typeof d.profile?.name==='string'?d.profile.name.slice(0,10):'你'};d.fitness=Number.isFinite(d.fitness)?d.fitness:0;d.caught=Number.isFinite(d.caught)?d.caught:0;d.cgSeen=Array.isArray(d.cgSeen)?d.cgSeen:[];d.energy=Math.max(0,Math.min(100,d.energy));return d;
    } catch { return null; }
  }
  function save() {
    try {localStorage.setItem(KEY,JSON.stringify(S));saved=structuredClone(S);$('#save-indicator').textContent='已记下这一步';}
    catch {$('#save-indicator').textContent='浏览器未允许自动保存，可在菜单导出进度';}
  }
  function toast(text) {
    const t=$('#toast');t.textContent=text;t.hidden=false;clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>t.hidden=true,3400);
  }
  function memory(text,tag='小事') {
    S.memories.push({week:S.week,text,tag});
  }
  function showModal({kicker='',title='',body='',wide=false,narrow=false,closable=true,onClose=null}) {
    clearTimeout(toastTimer);$('#toast').hidden=true;
    const previous = document.activeElement;
    const backdrop=document.createElement('div');backdrop.className='modal-backdrop';
    backdrop.innerHTML=`<section class="modal ${wide?'wide':''} ${narrow?'narrow':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-top"><span class="modal-kicker">${esc(kicker)}</span>${closable?'<button class="close-button" aria-label="关闭">×</button>':''}</div><h2>${esc(title)}</h2><div class="modal-body">${body}</div></section>`;
    if (screens.length) screens.at(-1).backdrop.inert=true;
    const entry={backdrop,closable,onClose,previous};screens.push(entry);$('#overlay-root').append(backdrop);
    const close=$('.close-button',backdrop);if(close)close.addEventListener('click',()=>closeModal());
    queueMicrotask(()=>{const focus=$('button:not(:disabled), select',backdrop);if(focus)focus.focus({preventScroll:true});});
    return backdrop;
  }
  function closeModal(force=false) {
    const entry=screens.at(-1);if(!entry || (!entry.closable && !force))return;
    screens.pop();entry.backdrop.remove();if(screens.length)screens.at(-1).backdrop.inert=false;
    if(entry.previous?.isConnected)entry.previous.focus({preventScroll:true});
    if(entry.onClose)entry.onClose();
  }
  function clearModals(){while(screens.length){screens.pop().backdrop.remove();}}
  function linesFor(text,who){return text.split('\n').filter(Boolean).map(text=>({who:text.includes('「')&&who?who:'narrator',text}));}
  function result(title,text,after=null,detail='') {
    E.dialogue({title,lines:linesFor(text,activeSpeaker),detail},()=>{if(after)after();});
  }
  const CGS={rain:{scene:'rain-cg',title:'等雨小一点',text:'她没有催你。伞沿的水，落在走廊外面。',duration:5},notebook:{scene:'notebook-cg',title:'借来的那一页',text:'她把笔记推过来。纸页上，留着铅笔的温度。',duration:5.5},arrival:{scene:'classroom',title:'风经过座位',text:'窗帘被风吹起。\n你还不知道，会在这里记住谁。',duration:5},flag:{scene:'flag-cg',title:'一起留下的放学后',text:'最后一笔蓝色，还没有干。\n这一次，答应过的人真的来了。',duration:6},dinner:{scene:'home',title:'饭还温着',text:'你把台灯关小。\n门外有人，替你留了一碗热饭。',duration:4.5},track:{scene:'track',title:'最后一圈',text:'风还是从原来的方向吹来。\n你终于听清了自己的呼吸。',duration:3}};
  function playCG(id,after=()=>{}){if(!S.cgSeen.includes(id)){S.cgSeen.push(id);save();}E.cg(CGS[id],after);}
  function studyCount(){return S.done.filter(x=>x==='notebook'||x.startsWith('notebook-')).length;}
  function actionCost(id){return id==='notebook'?26+studyCount()*4:COST[id]||0;}
  function enough(id){const cost=actionCost(id);if(S.energy>=cost)return true;result('脑子已经有些转不动了',`这件事需要 ${cost} 点精力，现在只有 ${S.energy} 点。\n先去吃饭、陪家人坐会儿，或者早点休息。时间还在，你不必硬撑。`,null,'没有扣除时间或精力。');return false;}
  function cgGallery(){
    const m=showModal({kicker:'记忆放映室 · 插画运镜短片',title:'有些画面，会留在这里',body:`<div class="gallery-grid">${Object.entries(CGS).map(([id,c])=>`<button class="cg-card" data-cg="${id}" ${S.cgSeen.includes(id)?'':'disabled'}><img src="assets/${c.scene}.jpg" alt="${esc(c.title)}"><strong>${S.cgSeen.includes(id)?esc(c.title):'还没遇见的画面'}</strong><small>${c.duration} 秒 · ${S.cgSeen.includes(id)?'点此重看':'在剧情里解锁'}</small></button>`).join('')}</div>`});
    $$('[data-cg]',m).forEach(b=>b.onclick=()=>E.cg(CGS[b.dataset.cg]));
  }
  function markPlay(){$('#title-screen').hidden=true;$('#play-screen').hidden=false;}
  function identitySetup(after){
    let selected=null;
    const m=showModal({kicker:'报到之前 · 先认识你',title:'这三年，由谁来度过？',wide:true,closable:false,body:`<p class="modal-note">选择你的主角，再写下名字。两种身份的初始能力相同，也都可以认识同一群人。</p><div class="identity-cards">${['female','male'].map(g=>`<button class="identity-card" data-gender="${g}" aria-pressed="false"><div class="identity-art"><img src="assets/expressions/player-${g}.png" alt="${g==='female'?'女生':'男生'}主角立绘"></div><strong>${g==='female'?'以女生的身份':'以男生的身份'}</strong><span>从同一个九月开始</span></button>`).join('')}</div><label class="identity-name" for="player-name">你的名字 <input id="player-name" maxlength="10" placeholder="可以先不填，故事里会称呼你" autocomplete="off"></label><div class="modal-actions"><button class="primary-button" id="identity-confirm" disabled>选好了，去报到</button></div>`});
    $('.modal',m).classList.add('identity-setup');
    $$('[data-gender]',m).forEach(b=>b.onclick=()=>{selected=b.dataset.gender;$$('[data-gender]',m).forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});$('#identity-confirm',m).disabled=false;});
    $('#identity-confirm',m).onclick=()=>{if(!selected)return;const name=$('#player-name',m).value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,10)||'你';S.profile={gender:selected,name};window.CampusCharacters.setProfile(S.profile);memory(`${name==='你'?'你':name}以${selected==='female'?'女生':'男生'}的身份，在九月报到。`,'报到');save();closeModal(true);render();after();};
  }
  function opening(){
    const name=S.profile.name;
    playCG('arrival',()=>E.dialogue({title:'九月 · 报到日',lines:[
      {id:'arrival.mother',who:'mother',mood:'smile',text:(name==='你'?'':name+'，')+'饭卡放外面的袋子了。放学回来，跟我说说新同桌。'},
      {id:'arrival.player',who:'you',mood:'smile',text:'知道啦。我先去找教室，回来再说。'},
      {id:'arrival.register',who:'narrator',text:`名单上${S.profile.gender==='female'?'女生':'男生'}那一栏，多了一个勾。你把领来的练习册抱在怀里，站到教室门口。`},
      {id:'arrival.teacher',who:'teacher',text:name==='你'?'新同学，先进去找个位子。书包放好了，等会儿领书。':name+'同学，先进去找个位子。书包放好了，等会儿领书。'},
      {id:'arrival.desk',who:'zhaocheng',mood:'smile',text:'哎，同学，这边还有空位。书包先放这儿？'},
      {id:'arrival.time',who:'narrator',text:'每周只有三段自由时间。精力会消耗，答应过的人也会等你。先给自己选一个座位吧。'}]},()=>seatPicker(true)));
  }
  function startNew(){clearModals();S=initial();markPlay();render();save();identitySetup(opening);}
  function continueGame(){
    if(!saved)return;S=structuredClone(saved);clearModals();markPlay();render();
    const resume=()=>{window.CampusCharacters.setProfile(S.profile);if(S.ended)showEnding();else if(S.seat===null)seatPicker(true);else if(!S.plan)weekIntro();else toast('书包还在原来的位置。');};
    if(!S.profile.gender)identitySetup(resume);else resume();
  }
  function identityCard(){
    if(!S||screens.length||E.busy)return;
    E.dialogue({title:'这三年里的你',lines:[{who:'you',mood:'neutral',text:`${S.profile.name==='你'?'名字还没有填。':S.profile.name+'。'}${S.profile.gender==='female'?'女生':'男生'}，高一（六）班。书包里的练习册越来越厚，但我还想记住一些题目以外的事。`},{who:'you',mood:'smile',text:'下一段时间，还是由我来决定。'}]});
  }
  function characterAlbum(){
    const actors=window.CampusCharacters.actors;
    const m=showModal({kicker:'人物小册 · 表情与两秒短动画',title:'慢慢熟悉他们的样子',wide:true,body:`<div class="actor-grid">${Object.values(actors).map(a=>`<button class="actor-card" data-actor="${a.id}"><img src="${a.base}" alt="${esc(a.name)}"><strong>${esc(a.role)}</strong><small>${a.id.startsWith('player')?esc(a.role):esc(a.name)} · 看看表情</small></button>`).join('')}</div><p class="modal-note">动态由生成的表情帧制作，打开“人物动态”后会播放约 2 秒的透明短片。关闭后保留静态表情。</p>`});
    $$('[data-actor]',m).forEach(b=>b.onclick=()=>{const a=actors[b.dataset.actor];E.dialogue({title:a.role+' · '+a.name,lines:[{id:'album.'+a.id+'.neutral',who:a.id,mood:'neutral',text:'刚见面的时候，还不知道该说些什么。'},{id:'album.'+a.id+'.smile',who:a.id,mood:'smile',text:'慢慢熟起来，一抬头，就知道是在叫谁。'},...(a.poses.blink?[{id:'album.'+a.id+'.blink',who:a.id,mood:'blink',motion:false,text:'有些很短的停顿，也会被记住。'}]:[]),...(a.poses.sad?[{id:'album.'+a.id+'.sad',who:a.id,mood:'sad',motion:false,text:'有的时候，话说到一半，就没有再往下说。'}]:[])]});});
  }
  function render(){
    const p=C.places[S.place],w=C.weeks[S.week-1];
    $('#profile-avatar').hidden=!S.profile.gender;if(S.profile.gender)$('#profile-avatar').src=`assets/expressions/player-${S.profile.gender}.png`;$('#profile-name').textContent=S.profile.name==='你'?'高一 · 秋':S.profile.name;
    $('#world').className=`world ${S.place}`;$('#game').classList.toggle('at-home',S.place==='home');
    $('#date-label').textContent=w.date;$('#week-label').textContent=`第 ${S.week} / 4 个关键周`;
    $('#scene-name').textContent=p.name;$('#scene-desc').textContent=p.desc;
    $('#time-dots').innerHTML=Array.from({length:3},(_,i)=>`<i class="time-dot ${i>=S.remaining?'spent':''}"></i>`).join('');
    $('#time-label').textContent=`还剩 ${S.remaining} 段`;
    $('#observation').textContent=p.observation[S.week-1];
    $('#energy-number').textContent=`${S.energy} / 100`;$('#energy-fill').style.width=S.energy+'%';$('#energy-budget').classList.toggle('low',S.energy<26);$('.energy-track').setAttribute('aria-valuenow',S.energy);$('#energy-hint').textContent=S.energy<26?'已经很累，先吃饭或休息':'周末恢复 12，睡觉恢复 36';
    $$('[data-place]').forEach(b=>{b.classList.toggle('active',b.dataset.place===S.place);b.setAttribute('aria-current',b.dataset.place===S.place?'location':'false');});
    const hotspots=$('#hotspots');hotspots.innerHTML='';
    p.spots.forEach(spot=>{
      const b=document.createElement('button');b.className=`hotspot ${S.done.includes(spot.id)&&spot.id!=='notebook'?'done':''}`;
      b.dataset.spot=spot.id;b.style.left=`${spot.x}%`;b.style.top=`${spot.y}%`;
      let label=spot.label,sub=spot.sub;
      if(spot.id==='friend' && S.week===2 && S.promise==='yes'&&!S.promiseKept)sub='班旗还差一点 · 兑现约定';
      if(spot.id==='friend'&&S.week>=3&&S.promise==='yes'&&!S.promiseKept)sub='他的桌上多了另一把椅子';
      if(spot.id==='girl'&&S.week===3&&S.taste)sub='她记得你的口味';
      if(S.done.includes(spot.id))sub='这周已留过时间';
      if(spot.id==='notebook')sub=studyCount()?`继续加练 · 第 ${studyCount()+1} 段 · 收益递减`:'订正错题 · 留一段时间';
      const cost=actionCost(spot.id),gain={rest:36,mom:10,lunch:16}[spot.id];
      if(cost)sub+=` · 精力 −${cost}`;else if(gain)sub+=` · 精力 +${gain}${spot.id==='lunch'?' / 同桌吃 +8':''}`;
      b.innerHTML=`<span class="hotspot-ring" aria-hidden="true"></span><span class="hotspot-label">${esc(label)}<small>${esc(sub)}</small></span>`;
      b.onclick=()=>interact(spot.id);hotspots.append(b);
    });
    const r=$('#reminder');r.hidden=true;
    if(S.week<=2&&S.promise==='yes'&&!S.promiseKept){r.hidden=false;r.innerHTML='<small>夹在手记里的约定</small>第二周放学后，帮赵程把班旗画完。';}
    else if(S.week===2&&S.notePromise&&!S.noteKept){r.hidden=false;r.innerHTML='<small>答应过的事</small>周三的课堂笔记，给林遥留一份。';}
    else if(S.week===4){r.hidden=false;r.innerHTML='<small>黑板右边的新通知</small>这周结束后月考。成绩出来，就要换座位了。';}
    $('#finish-week').classList.toggle('ready',S.remaining===0);
    $('#finish-week').innerHTML=S.week===4?'交卷，迎接月考 <span aria-hidden="true">→</span>':'收好这一周 <span aria-hidden="true">→</span>';
  }
  function move(place){if(screens.length||E.busy)return;S.place=place;render();save();}
  function spend(id,category,effects,entry,text,title='这一小段时间',detail=''){
    if(S.done.includes(id)||S.remaining<=0){toast('这周能自己安排的时间，已经用完了。');return false;}
    const cost=id.startsWith('notebook')?26+studyCount()*4:COST[id]||0;if(S.energy<cost)return false;if(cost)effects.energy=-cost;
    const index=3-S.remaining,matched=S.plan?.[index]===category;
    S.remaining--;S.done.push(id);
    Object.entries(effects).forEach(([key,value])=>S[key]+=value);
    if(matched){if(category==='study')S.study+=1;if(category==='friend')S.friend+=1;if(category==='rest')S.energy+=3;}
    S.energy=Math.max(0,Math.min(100,S.energy));
    memory(entry);save();closeModal(true);render();
    const present=()=>result(title,text,null,detail||(matched?'你照着原来的安排，给这件事留足了时间。':'你临时改了安排。原来想做的事，只能再往后放。'));
    const cg=id==='girl'?(S.week===4?'rain':'notebook'):id==='mom'?'dinner':id==='friend'&&S.week===2?'flag':null;if(cg&&!S.cgSeen.includes(cg))playCG(cg,present);else present();
    return true;
  }
  function interact(id){
    if(screens.length||E.busy)return;activeSpeaker={friend:'zhaocheng',girl:'linyao',mom:'mother',inspection:'teacher',running:'zhaocheng'}[id]||null;
    if(id==='seat'){seatPicker(false);return;}
    if(id==='phone'){phone();return;}
    if(id!=='notebook'&&S.done.includes(id)){toast('这周，你已经给这件事留过时间了。还有别的地方可以看看。');return;}
    if(S.remaining<=0){result('窗外已经暗了','这周能自己安排的三段时间，都已经用完。\n你还可以看看手机和手记，或者把这一周收好。');return;}
    if(!enough(id))return;
    ({notebook:exercise,friend:friend,girl:girl,lunch:lunch,mom:family,rest:rest,running:running,inspection:inspection}[id]||(()=>{}))();
  }
  function seatPicker(first){
    let selection=S.seat??14;
    const m=showModal({kicker:first?'第一天 · 教室':'教室里的位置',title:first?'你想坐在哪里？':'你的名字，还在这张表上',wide:true,closable:!first,
      body:`<p class="modal-note">${first?'靠窗能看见树，前排能听清老师，后排离朋友近一些。选定后，这个月都坐在这里。':'这张表是你这个月的座位。月考之后，班主任会重新安排。'}</p><div class="seat-legend"><span>左侧是窗户</span><span>前排</span><span>右侧是走廊</span></div><div class="blackboard">黑 板</div><div class="seat-grid" id="seat-grid"></div><p class="seat-neighbor" id="seat-description"></p><div class="modal-actions"><button class="primary-button" id="seat-confirm">${first?'把书包放在这里':'记住这个位置'}</button></div>`});
    const occupied={1:'班长',6:'林遥',13:'赵程',22:'阿哲',26:'小胖'};
    const describe=()=>{
      const row=Math.floor(selection/6)+1,col=selection%6;
      $('#seat-description',m).textContent=`第 ${row} 排，${col<2?'靠窗，风能吹到这里。':col>3?'靠走廊，能听见别班下课。':'中间的位置，前后都是新同学。'}${selection===14?' 赵程坐在你左边。':''}`;
      $$('.seat',m).forEach(b=>b.classList.toggle('selected',Number(b.dataset.seat)===selection));
    };
    for(let i=0;i<44;i++){
      const b=document.createElement('button');b.className='seat';b.dataset.seat=i;
      const isOther=Object.hasOwn(occupied,i)&&i!==S.seat;
      b.textContent=i===S.seat?'你':occupied[i]||'空位';b.setAttribute('aria-label',`第${Math.floor(i/6)+1}排第${i%6+1}列 ${b.textContent}`);
      if(isOther||!first){b.disabled=true;b.classList.toggle('occupied',isOther);}
      b.onclick=()=>{selection=i;describe();};$('#seat-grid',m).append(b);
    }
    describe();$('#seat-confirm',m).onclick=()=>{if(first){S.seat=selection;memory(`你把书包放在第 ${Math.floor(selection/6)+1} 排。`,'开学');save();}closeModal(true);if(first)openPlan(true);};
  }
  function openPlan(required=false){
    if(S.plan){
      const m=showModal({kicker:'三段能自己安排的时间',title:'你这一周原本想这样过',body:`<div class="plan-preview">${S.plan.map((p,i)=>`<div class="plan-chip"><small>第 ${i+1} 段 ${i<3-S.remaining?'· 已经过了':''}</small>${categoryName[p]}</div>`).join('')}</div><p class="modal-lead">计划写下来了，到了那一刻，仍然由你决定。</p><p class="modal-note">按原计划行动，会有一点额外收获。改变计划也可以，但时间不会多出来。</p><div class="modal-actions"><button class="primary-button" id="plan-done">合上本子</button></div>`});
      $('#plan-done',m).onclick=()=>closeModal();return;
    }
    const m=showModal({kicker:C.weeks[S.week-1].name,title:'这一周，把时间留给什么？',closable:!required,body:`<p class="modal-lead">上课、吃饭、通勤，占去了大半日子。\n剩下的三段时间，你想先留给谁？</p><div class="plan-rows">${['周一放学后','周三放学后','周五放学后'].map((x,i)=>`<div class="plan-row"><label for="slot-${i}">${x}</label><select id="slot-${i}">${Object.entries(categoryName).map(([key,label])=>`<option value="${key}" ${['study','friend','rest'][i]===key?'selected':''}>${label}</option>`).join('')}</select></div>`).join('')}</div><p class="modal-note">只是先写下打算。实际去做，才会改变这一周。前往不同地点不花时间。</p><div class="modal-actions"><button class="primary-button" id="plan-confirm">写好了，去看看他们</button></div>`});
    $('#plan-confirm',m).onclick=()=>{S.plan=[0,1,2].map(i=>$(`#slot-${i}`,m).value);save();closeModal(true);render();toast('先点点桌上的错题本，或找同桌说句话。');};
  }
  const EXTRA=[
    {title:'再做一页 · 先把分配律写全',question:'展开：2(3x + 4)',steps:['2 × 3x + 2 × 4','6x + 4','6x + 4'],wrong:1,solution:'每一项都要乘 2，结果是 6x + 8。',hint:'一页写完，窗外又暗了一点。'},
    {title:'再做一页 · 分数两边都要乘',question:'解方程：x / 3 + 2 = 5',steps:['x / 3 = 3','x = 3 / 3','x = 1'],wrong:1,solution:'两边乘 3 得到 x = 9。',hint:'留给别人的时间，正在被这一页占去。'},
    {title:'再做一页 · 负数相乘',question:'计算：(−3) × (−4) + 2',steps:['(−3) × (−4) + 2','−12 + 2','−10'],wrong:1,solution:'负数乘负数得正数，12 + 2 = 14。',hint:'开始前，先看看还剩多少精力。'},
    {title:'再做一页 · 同类项',question:'化简：3x + 2x − 4',steps:['(3 + 2)x − 4','5x² − 4','5x² − 4'],wrong:1,solution:'同类项相加只加系数，得到 5x − 4。',hint:'加练仍然占用一整段时间。'}
  ];
  function running(){
    E.dialogue({title:'操场 · 最后一圈',lines:[{who:'zhaocheng',text:S.fitness?'这次还比不比？别一开始就冲。':'跑一圈？就一圈。你跟着自己的呼吸，别管我。'}],choices:[{text:'系好鞋带，去跑道上',note:'400 米节奏跑 · 完成后 1 段时间 / 精力 −14',value:true},{text:'今天先坐一会儿',note:'返回场景，不消耗时间',value:false}]},yes=>{if(!yes)return;E.running(out=>{if(!out)return;const after=()=>{activeSpeaker='zhaocheng';spend('running','rest',{fitness:out.won?1:0,friend:out.won?1:0,energy:0},out.won?'你跑完了最后一圈。赵程在终点递来一瓶水。':'你没有跑完一圈，弯腰缓了很久。',out.won?'你扶着膝盖喘气。赵程没有催你。\n「比上次稳。下回再跑。」':'「没事，先走一段，别马上坐下。」\n赵程把脚步放慢，和你一起走回看台。',out.won?'四百米，跑完了':'这次先到这里',`稳稳落脚 ${out.hits} 次 · 跑过 ${out.distance} 米 · 精力 −14`);};if(out.won&&!S.cgSeen.includes('track'))playCG('track',after);else after();});});
  }
  function inspection(){
    E.dialogue({title:'晚自习 · 教室的灯还亮着',lines:[{who:'teacher',text:S.caught?'上次说过的，手机放好。想看消息，下课再看。':'我去后排看看。大家把手边那道题做完。'},{who:'zhaocheng',text:'我把班旗草稿发你了。要不下课看？'}],choices:[{text:'趁老师转身，看看草稿',note:'视野躲避 · 1 段时间 / 精力 −8 · 可能被发现',value:true},{text:'把手机留在书包里，下课再看',note:'返回场景，不消耗时间',value:false}]},yes=>{if(!yes)return;E.phone(out=>{if(!out)return;activeSpeaker=out.caught?'teacher':'zhaocheng';spend('inspection','friend',{friend:out.won?1:0,caught:out.caught?1:0,energy:0},out.caught?'晚自习时，手机的亮光被韩老师看见了。':out.won?'你看完了赵程发来的班旗草稿。':'下课前，你把还没读完的消息收了起来。',out.caught?'韩老师停在你的桌边。\n「这次先收起来。下课来找我，说说今天这道题。」\n那段原本能聊班旗的时间，留给了课后谈话。':out.won?'草稿最后留了一整块空白。\n「那儿给全班签名字。」赵程发来一条新消息。':'铃声响了，你才发现最后一句还没看完。\n「算了，下课当面说。」赵程把椅子转了过来。',out.caught?'屏幕的亮光':'等到下课以后',`读到 ${out.read} / 3 条消息 · 精力 −8${out.caught?' · 被发现会记在手记里':''}`);});});
  }
  function exercise(){
    const count=studyCount(),ex=count?EXTRA[(S.week-1+count-1)%EXTRA.length]:C.exercises[S.week-1];let selected=null;
    const m=showModal({kicker:'桌上的错题本 · 留下一段时间',title:ex.title,body:`<p class="modal-note">${ex.hint} · 精力 −${actionCost('notebook')} · ${count?'加练收益递减，仍需一段时间':'留一段时间'}</p><div class="paper-work"><h3>${esc(ex.question)}</h3>${ex.steps.map((s,i)=>`<button class="math-line" data-line="${i}"><small>第 ${i+1} 行</small>${esc(s)}</button>`).join('')}</div><p id="exercise-hint" class="modal-note">用鼠标点一行，拿红笔圈出来。选错了也可以改。</p><div class="modal-actions"><button class="secondary-button" id="leave-book">先合上本子</button><button class="primary-button" id="submit-correction" disabled>圈好了，写下订正</button></div>`});
    $$('.math-line',m).forEach(b=>b.onclick=()=>{selected=Number(b.dataset.line);$$('.math-line',m).forEach(x=>x.classList.toggle('selected',x===b));$('#submit-correction',m).disabled=false;});
    $('#leave-book',m).onclick=()=>closeModal();
    $('#submit-correction',m).onclick=()=>{
      const correct=selected===ex.wrong;
      if(S.week===2&&S.notePromise)S.noteKept=true;
      const entry=correct?'你把一道原本会错的题，重新写对了。':'你在错题本上留下了一个红圈，后来才看懂原因。';
      spend(count?'notebook-'+(count+1):'notebook','study',{study:correct?Math.max(1,3-count):1,energy:0},entry,correct?'你这次没有急着往下写。\n'+ex.solution:'你圈的这一行不是最先出错的地方。\n'+ex.solution,correct?'红笔停在了这里':'再看一遍，还是有收获',S.week===2&&S.noteKept?'你顺手把课堂笔记抄了一份，夹进林遥的书里。':'这页订正会影响月底的考试。今晚少了一段能做别的事的时间。');
    };
  }
  function friend(){
    const w=S.week;
    let title='赵程把椅子往后挪了挪',text='',action='',entry='',response='';
    if(w===1){text='「班旗让我们自己画。我画人不行，你能不能来帮忙？」\n他把一张皱巴巴的草稿摊在你桌上。\n「下周放学后，一起弄？」';action='坐下聊草稿，答应下周一起画';entry='你答应赵程，下周一起画班旗。';response='「那我把颜料带来。」\n他把草稿仔细叠好，像这件事已经办成了一半。';}
    if(w===2){text=S.promise==='yes'?'「今天有空吗？我带了颜料。」\n班旗只铺了一半，赵程的手指上沾着蓝色。':'赵程正对着班旗发愁。\n「你要是有空，帮我扶一下这边？」';action='放下书包，和他把班旗画完';entry='你和赵程趴在两张拼起来的课桌上，把班旗画完了。';response='你扶着布，他一笔一笔描。\n最后收拾的时候，窗外已经没有太阳。\n「幸好你来了。」他说。';}
    if(w===3){text=S.promiseKept?'赵程把洗干净的调色盘塞进桌肚。\n「周末打球吗？阿哲说他也来。」':'赵程正和阿哲商量周末打球。\n看见你，他还是招了招手。\n「一起吗？」';action='留下来，和他们聊到铃响';entry='你开始知道，赵程最讨厌别人叫他全名。';response='聊到最后，谁都忘了最开始在说什么。\n赵程笑起来的时候，前排也回头看了一眼。';}
    if(w===4){text='「我都复习不完了。」\n赵程说完，把凳子转过来。\n「但先陪我去操场走一圈吧，脑子快冒烟了。」';action='合上书，陪他出去走一圈';entry='月考前，你和赵程绕操场走了一圈。';response='你们没谈考试。他说自己初中跑一千米，最后一圈吐了。\n走回教室的时候，你终于也笑了出来。';}
    E.dialogue({title,lines:linesFor(text,'zhaocheng'),choices:[{id:'friend-yes',text:action,note:`1 段时间 · 精力 −12${w===1?' · 下周还要来兑现约定':''}`,value:true},{id:'friend-no',text:w===1?'这次先不答应':'抱歉，先忙自己的事',note:'离开，不消耗时间或精力',value:false}]},yes=>{
      if(yes){if(w===1)S.promise='yes';if(w===2)S.promiseKept=true;spend('friend','friend',{friend:3,energy:0},entry,response,w===2?'班旗终于画完了':'坐在一块儿的时候');}
      else {if(w===1){S.promise='no';save();}E.dialogue({title:'你还有别的打算',lines:[{who:'zhaocheng',text:w===1?'行，那我再问问别人。':'好。那我先把东西收了。'}]});}
    });
  }
  function girl(){
    let lines=C.girlLines[S.week-1].join('\n'),label='坐下来，把这页笔记看完',response='你们对着同一道题看了半天。\n她在最后一行点了点：「哦，原来在这。」';
    if(S.week===2){label=S.done.includes('notebook')?'把已经订正好的课堂笔记借给她':'帮她记下画室那天的课堂内容';response=S.done.includes('notebook')?'你把这周认真整理的那页翻给她看。\n「就是这道。」她接过去，在封面贴了张写着你名字的小纸条。':'「那谢谢。」\n她在笔记本封面贴了张小纸条，写着你的名字。\n这周还要抽空去订正一次，才算真的把笔记留给她。';}
    if(S.week===3&&S.taste&&S.place==='canteen'){lines=`她把餐盘往你这边推了一点。\n「${S.taste==='不吃香菜'?'这份没放香菜。':S.taste==='爱吃香菜'?'我让阿姨多加了点香菜。':'今天有你上次点的土豆。'}」\n她说完，低头继续吃自己的。`;label='接过餐盘，在她对面坐下';response='你还没说自己想吃什么。\n筷子碰到餐盘边，你忽然不知道该先说谢谢，还是先笑一下。';}
    if(S.week===3&&S.notePromise){lines+='\n'+(S.noteKept?'她拍了拍那份课堂笔记：「上次的，我看懂了。」':'她停了一下：「那天的课，我找别人补过了。」');}
    if(S.week===4){lines='「外面下雨了。你带伞了吗？」\n林遥把笔帽扣好，没有马上离开。';label='收好书包，和她在走廊等一会儿';response='雨声盖住了楼下的铃声。\n「我的伞不大，等雨小一点再走吧。」\n你们没有再讨论明天的考试。';}
    E.dialogue({title:'借来的那本笔记',lines:linesFor(lines,'linyao'),choices:[{id:'girl-yes',text:label,note:'1 段时间 · 精力 −12'+(S.week===2?' · 还要真正整理一份笔记':''),value:true},{id:'girl-no',text:'今天先不了',note:'还有别的事要做，不消耗时间',value:false}]},yes=>{
      if(yes){if(S.week===2){S.notePromise=true;if(S.done.includes('notebook'))S.noteKept=true;}spend('girl','friend',{warm:3,energy:0},'你和林遥一起待过一小段放学后的时间。',response,'窗边的一小会儿');}
      else E.dialogue({title:'她把本子收回去',lines:[{who:'linyao',text:'嗯，那你先忙。'}]});
    });
  }
  function lunch(){
    let selected=null;
    const m=showModal({kicker:'食堂 · 先把饭吃好',title:'今天想吃哪一份？',body:`<p class="modal-note">点一道菜放进餐盘，再决定坐在哪里。口味会被你身边的人记住。</p><div class="meal-work"><div class="dish-shelf">${C.meals.map(d=>`<button class="dish" data-dish="${d.id}">${d.name}<small>${d.detail}</small></button>`).join('')}</div><div class="tray"><div class="tray-rice" aria-hidden="true"></div><div id="tray-food" class="tray-food">还没打菜</div><span class="tray-label">你的餐盘</span></div></div><div class="choices"><button class="choice" id="lunch-together" disabled><span>端过去，和他们坐一桌<small>留下一段时间 · 也让别人记得你的口味</small></span><span class="arrow">↗</span></button><button class="choice" id="lunch-alone" disabled><span>找个安静的位置，慢慢吃完<small>留下一段时间 · 歇一会儿</small></span></button></div>`});
    $$('.dish',m).forEach(b=>b.onclick=()=>{selected=C.meals.find(d=>d.id===b.dataset.dish);$$('.dish',m).forEach(x=>x.classList.toggle('selected',x===b));const f=$('#tray-food',m);f.textContent=selected.name;f.classList.add('filled');f.style.background=selected.color;$('#lunch-together',m).disabled=false;$('#lunch-alone',m).disabled=false;});
    function eat(together){S.taste=selected.taste;spend('lunch',together?'friend':'rest',together?{friend:1,warm:1,energy:8}:{energy:16},`你在食堂点了${selected.name}，${together?'和他们坐在一起。':'一个人慢慢吃完。'}`,together?'赵程用筷子敲了敲空位。\n「这儿。」\n你把餐盘放下，林遥顺手给你让出了放汤碗的地方。':'你挑了靠窗的角落。\n汤还烫着。你没有一边吃，一边翻明天要交的练习册。','热饭端到了桌上');}
    $('#lunch-together',m).onclick=()=>eat(true);$('#lunch-alone',m).onclick=()=>eat(false);
  }
  function family(){
    E.dialogue({title:'饭还温着',lines:linesFor(C.familyLines[S.week-1],'mother'),choices:[{id:'family-yes',text:'端着碗出去，坐下聊一会儿',note:'1 段时间 · 精力 +10 · 今晚少做一页题',value:true},{id:'family-no',text:'先放着，待会儿吃',note:'不消耗时间',value:false}]},yes=>{
      if(yes)spend('mom','friend',{family:3,energy:10},'你端着饭，坐到妈妈旁边，讲了学校里的事。','你说起新同桌，妈妈笑了一下。\n「赵程，是这个程啊。我刚还以为是橙子的橙。」\n她拿走空碗，又问你还要不要盛一点。','电视声又调大了一点');
      else E.dialogue({title:'门被轻轻带上',lines:[{who:'mother',text:'那你记得吃。别放到凉了。'}]});
    });
  }
  function rest(){
    const m=showModal({kicker:'今晚 · 留一点空白',title:'可以先睡一觉',body:'<p class="modal-lead">练习册没写完，消息也还有两条。\n你把明天要穿的校服搭好，手停在台灯开关上。</p><p class="modal-note">早点休息恢复 36 点精力（按休息计划再 +3），需要一段时间。考试会看你有没有学进去，也会看你是不是已经累坏了。</p><div class="modal-actions"><button class="secondary-button" id="rest-no">再想想</button><button class="primary-button" id="rest-yes">关灯，今晚到这里</button></div>'});
    $('#rest-no',m).onclick=()=>closeModal();$('#rest-yes',m).onclick=()=>spend('rest','rest',{energy:36},'有一晚，你在十一点之前关了灯。','隔壁的琴声也停了。\n醒来时，你第一次在闹钟响之前睁开了眼睛。','明天再接着过');
  }
  function phone(){
    const promise=S.promise==='yes'?(S.promiseKept?'赵程：班旗挂上去了！明天给你看。':S.week<=2?'赵程：颜料我带。你人来就行。':'赵程：没事，后来阿哲帮我弄完了。'):'赵程：班群文件里有月考安排。';
    const girlMessage=S.week>=3&&S.taste?'林遥：你上次点的菜，明天应该也有。':'林遥：笔记看完放我桌上就好。';
    const m=showModal({kicker:'手机 · 看消息不花时间',title:'屏幕亮了一下',body:`<div class="receipt">${esc(promise)}<br><br>${esc(girlMessage)}<br><br>妈妈：饭在锅里。凉了叫我。</div><p class="modal-note">看消息可以知道别人正在忙什么。兑现约定，需要在相应场景里真正留出时间。</p><div class="modal-actions"><button class="primary-button" id="phone-close">把手机倒扣回去</button></div>`});
    $('#phone-close',m).onclick=()=>closeModal();
  }
  function weekIntro(){
    const w=C.weeks[S.week-1];
    const m=showModal({kicker:w.date,title:w.name,closable:false,body:`<p class="modal-lead">${esc(w.intro)}</p><div class="modal-actions"><button class="primary-button" id="week-start">翻开这一周</button></div>`});
    $('#week-start',m).onclick=()=>{closeModal(true);openPlan(true);};
  }
  function finishWeek(){
    if(screens.length||E.busy)return;
    activeSpeaker=null;if(S.remaining>0){
      const m=showModal({kicker:'还没到周末',title:`还有 ${S.remaining} 段时间，留空吗？`,body:'<p class="modal-lead">你可以去别的地方看看。\n也可以什么都不安排，让这几天安静地过去。</p><div class="modal-actions"><button class="secondary-button" id="keep-week">回去看看</button><button class="primary-button" id="skip-time">留空，收好这一周</button></div>'});
      $('#keep-week',m).onclick=()=>closeModal();$('#skip-time',m).onclick=()=>{closeModal();S.energy=Math.min(100,S.energy+S.remaining*3);S.remaining=0;save();render();diary();};
    }else diary();
  }
  function diary(){
    const entries=S.memories.filter(x=>x.week===S.week),w=C.weeks[S.week-1];
    const text=entries.length?entries.slice(-4).map(x=>x.text).join('\n'):'这周没安排什么特别的事。日子也照样过去了。';
    const m=showModal({kicker:`周日晚上 · ${w.date}`,title:'这一页，先写到这里',closable:false,body:`<p class="handwritten">${esc(text)}</p><div class="receipt">${esc(w.diary)}</div><div class="modal-actions"><button class="primary-button" id="next-week">${S.week===4?'收起手记，去考试':'翻到下一周'}</button></div>`});
    $('#next-week',m).onclick=()=>{
      S.diaries.push({week:S.week,text});closeModal(true);
      if(S.week===4){S.ended=true;save();render();showEnding();return;}
      S.week++;S.remaining=3;S.plan=null;S.done=[];S.place='classroom';S.energy=Math.min(100,S.energy+12);save();render();
      if(S.week===3&&!S.echoResolved){
        S.echoResolved=true;
        if(S.promise==='yes'){
          const kept=S.promiseKept;
          if(!kept)S.friend=Math.max(0,S.friend-2);
          memory(kept?'赵程把画班旗那晚的合照，放进了你的书里。':'你答应画班旗，却没去。后来，赵程找了阿哲。','回响');save();
          E.dialogue({title:kept?'书里多了一张合照':'他还是和你打了招呼',detail:'这是第一周那句答应，在两周之后留下的变化。',lines:kept?[
            {who:'narrator',text:'班旗挂在教室后面。赵程把那天的合照，塞进了你的书里。'},
            {who:'zhaocheng',mood:'smile',text:'背面我写了字。下次还一起。'},
            {who:'you',mood:'smile',text:'好。下次别等到天黑才洗调色盘。'}
          ]:[
            {who:'narrator',text:'你走到赵程桌边，才看见阿哲正坐在那儿。'},
            {who:'you',mood:'neutral',text:'班旗画完了？'},
            {who:'zhaocheng',mood:'sad',motion:false,text:'嗯，昨天弄完的。阿哲帮忙，一会儿就好了。'},
            {who:'narrator',text:'他把画笔收进盒子，没有问你为什么没来。'}
          ]},weekIntro);return;
        }
      }
      weekIntro();
    };
  }
  function rank(){return Math.max(1,Math.min(44,Math.round(29-S.study*1.15+(S.energy<35?4:S.energy<50?2:0))));}
  function showEnding(){
    const r=rank(),row=Math.ceil(r/6),oldRow=Math.floor(S.seat/6)+1;
    let title='九月，你开始有了自己的生活',line='你还没有和谁特别熟。可是下次走进教室，已经知道该往哪里看。';
    if(S.promiseKept){title='有人把空位留给了你';line='换座位那天，赵程隔着两排桌子晃了晃手里的颜料盒。你知道他在叫你。';}
    else if(S.study>=10){title='你的名字，往前挪了几格';line='卷子发下来，你先看了一眼自己订正过的那道题。这回，你没有写错。';}
    else if(S.family>=6){title='回家以后，也有人等着听';line='妈妈已经能叫出赵程的名字。吃饭的时候，她问你：后来那张班旗呢？';}
    else if(S.warm>=7){title='她记得你坐在哪里';line='教室重新排了座位。林遥还笔记的时候，绕了半间教室，还是走到了你桌边。';}
    const cost=S.study<5?'这一个月，你给学习留的时间不多。卷子上还有几处不会。':S.friend<3?'你把不少时间留给了题目。赵程说的几个笑话，你后来才听别人讲。':S.family<3?'你在学校里认识了更多人。回家之后，却没怎么坐下来讲给妈妈听。':'你给几件在意的事留了时间，也还是有没做完的题。';
    const m=showModal({kicker:'第一章试玩 · 九月的最后一天',title,wide:true,closable:false,body:`<div class="photo-strip"><div class="polaroid"><img src="assets/classroom.jpg" alt="九月的教室"><p>${S.promiseKept?'一起留下的放学后':'你坐过的教室'}</p></div><div class="polaroid"><img src="assets/canteen.jpg" alt="食堂里的餐盘"><p>${S.taste?`记得你${esc(S.taste)}`:'午间的食堂'}</p></div><div class="polaroid"><img src="assets/home.jpg" alt="家里的灯"><p>${S.family>0?'门外那碗热饭':'台灯亮着的晚上'}</p></div></div><p class="modal-lead">${esc(line)}</p><div class="stat-line"><span>第一次月考 · 班级排名</span><strong class="exam-number">${r}<small>/ 44</small></strong></div><p class="modal-note">原来坐在第 ${oldRow} 排，月考后按成绩安排在第 ${row} 排。${S.energy<35?'这次精力不足，也影响了发挥。':'卷子上，有你这一个月留下的痕迹。'}</p><div class="receipt">${esc(cost)}</div><p class="handwritten">窗外的树还绿着。\n十月快到了。</p><p class="modal-note">试玩到这里结束。完整的三年还没有展开，这一章的选择已经记在手记里。</p><div class="modal-actions"><button class="secondary-button" id="end-journal">翻看这一个月的手记</button><button class="secondary-button" id="end-seat">看看新座位</button><button class="secondary-button" id="end-export">导出进度</button><button class="primary-button" id="end-title">回到标题</button></div>`});
    $('.modal',m).classList.add('ending');$('#end-seat',m).onclick=seatAfterExam;$('#end-journal',m).onclick=journal;$('#end-export',m).onclick=exportSave;$('#end-title',m).onclick=()=>{clearModals();$('#play-screen').hidden=true;$('#title-screen').hidden=false;$('#continue-game').hidden=false;$('#world').className='world classroom';};
  }
  function seatAfterExam(){
    const position=rank()-1;
    const m=showModal({kicker:'月考之后 · 重新排座',title:'你把书搬到了这里',wide:true,body:`<p class="modal-note">你原来坐在第 ${Math.floor(S.seat/6)+1} 排，新的座位在第 ${Math.floor(position/6)+1} 排。新座位按本次排名逐行排列。</p><div class="blackboard">黑 板</div><div class="seat-grid">${Array.from({length:44},(_,i)=>`<button class="seat ${i===position?'selected':'occupied'}" disabled>${i===position?'你':i===S.seat?'原座位':'同学'}</button>`).join('')}</div><p class="modal-lead">${position%6<2?'窗户还在左边。阳光照到桌角的时候，你想起了报到那天。':'你坐下来，抬头重新看了一眼黑板。下次递笔记，要多走几步了。'}</p><div class="modal-actions"><button class="primary-button" id="new-seat-close">把书放好</button></div>`});
    $('#new-seat-close',m).onclick=()=>closeModal();
  }
  function journal(){
    const warm=S.warm>=6?'会特地绕过来找你':S.warm>=3?'能自然地说上几句话':'还在慢慢认识';
    const f=S.friend>=6?'会给你留一个空位':S.friend>=3?'开始找你一起做事':'见面会打招呼';
    const m=showModal({kicker:'你的本子 · 九月',title:'有些事，写下来才发现过了很久',wide:true,body:`<p class="identity-note">${esc(S.profile.name==='你'?'你的手记':S.profile.name+'的手记')} · ${S.profile.gender==='female'?'女生':'男生'} · 高一（六）班</p><div class="journal-pages"><div class="journal-section"><h3>这几天</h3>${S.memories.length?S.memories.slice(-12).map(x=>`<div class="journal-entry"><small>第 ${x.week} 周 · ${esc(x.tag)}</small>${esc(x.text)}</div>`).join(''):'<p class="modal-note">还没有写下什么。先去教室里看看。</p>'}</div><div class="journal-section"><h3>还放在心上的</h3><div class="stat-line"><span>功课</span><span>${S.study>=9?'能把错题自己讲明白':S.study>=4?'有几页认真订正过':'还有些地方没弄懂'}</span></div><div class="stat-line"><span>赵程</span><span>${f}</span></div><div class="stat-line"><span>林遥</span><span>${warm}</span></div><div class="stat-line"><span>操场</span><span>完成 ${S.fitness} 圈 · 手机被发现 ${S.caught} 次</span></div><div class="stat-line"><span>精力</span><span>${S.energy} / 100</span></div><div class="stat-line"><span>自己</span><span>${S.energy>=65?'还能精神地过明天':S.energy>=40?'有点累，需要缓一缓':'已经很久没睡好了'}</span></div>${S.promise==='yes'?`<p class="receipt">和赵程的班旗：${S.promiseKept?'一起画完了。':S.week<=2?'还记着，要去。':'那天没去。后来他找了阿哲。'}</p>`:''}${S.taste?`<span class="memory-label">${esc(S.taste)}</span>`:''}${S.promiseKept?'<span class="memory-label">一张班旗合照</span>':''}<p class="modal-note">这里记录你和别人相处的样子。没有一张表能告诉你，这个月过得值不值。</p></div></div><div class="modal-actions"><button class="primary-button" id="journal-close">合上手记</button></div>`});
    $('#journal-close',m).onclick=()=>closeModal();
  }
  function exportSave(){
    const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`campus-three-years-week-${S.week}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出进度文件。这个文件也能作为你这局的选择记录。');
  }
  function menu(){
    if(!S||screens.length||E.busy)return;
    const m=showModal({kicker:'课间 · 暂停一下',title:'书包先放在这里',narrow:true,body:'<div class="choices"><button class="choice" id="menu-actors">人物小册 · 表情与短动画</button><button class="choice" id="menu-motion">人物动态</button><button class="choice" id="menu-resume">继续这一周</button><button class="choice" id="menu-help">看看怎么玩</button><button class="choice" id="menu-cg">记忆放映室 · 重看短 CG</button><button class="choice" id="menu-export">导出进度记录</button><button class="choice" id="menu-title">回到标题</button></div><p class="keyboard-tip">Tab 选中 · Enter 确认 · Esc 返回<br>场景中 1 / 2 / 3 / 4 切换地点，J 打开手记，P 查看安排。</p>'});
    const motionButton=$('#menu-motion',m);const motionLabel=()=>motionButton.textContent='人物动态：'+(E.motionEnabled?'开启':'关闭');motionLabel();motionButton.onclick=()=>{E.setMotion(!E.motionEnabled);motionLabel();};$('#menu-actors',m).onclick=characterAlbum;
    $('#menu-cg',m).onclick=cgGallery;$('#menu-resume',m).onclick=()=>closeModal();$('#menu-help',m).onclick=help;$('#menu-export',m).onclick=exportSave;$('#menu-title',m).onclick=()=>{save();clearModals();$('#title-screen').hidden=false;$('#play-screen').hidden=true;$('#continue-game').hidden=false;$('#world').className='world classroom';};
  }
  function help(){
    const m=showModal({kicker:'给刚走进教室的你',title:'在校园里，留一点自己的时间',body:'<p class="modal-lead">点画面里的人或物件，就能靠近他们。\n用底部的地点按钮，在教室、食堂、操场和家里走一走。</p><div class="receipt">每周有三段自由时间和一条精力槽。学习每次消耗 26 / 30 / 34 精力，能连续加练，但收益会递减；聊天 −12，跑步 −14，晚自习看手机 −8。睡觉 +36，陪家人 +10，独自吃饭 +16。周末只恢复 12。<br><br>对话可点正文、空格或 Enter 继续；“读完本段”可快速到选择。短 CG 可跳过，可在暂停菜单重看。人物小册可以查看每个人的表情；“人物动态”控制约两秒的表情帧短动画。<br><br>查看物件、看消息、换地点都免费；决定留下来做一件事，才会用掉一段。<br><br>先写下安排，实际行动时仍然能改变。和计划一致会有一点额外收获。<br><br>留意手记里的约定。有些事现在答应了，下周还得真的去做。</div><p class="modal-note">会自动保存到当前浏览器。离线也能玩；换浏览器或移动游戏文件夹后，原存档可能无法读取。声音默认关闭，可点右上角“声”开启合成环境声。</p><div class="modal-actions"><button class="primary-button" id="help-close">知道了</button></div>'});
    $('#help-close',m).onclick=()=>closeModal();
  }
  function toggleSound(){
    try {
      if(!audio){
        const ctx=new (window.AudioContext||window.webkitAudioContext)(),master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
        const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
        for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)*.98;data[i]=last;}
        const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
        const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=800;source.connect(filter);filter.connect(master);source.start();audio={ctx,master};
      }
      soundOn=!soundOn;audio.ctx.resume().catch(()=>{});audio.master.gain.setTargetAtTime(soundOn?.28:0,audio.ctx.currentTime,.5);
      $('#sound-button').textContent=soundOn?'静':'声';$('#sound-button').setAttribute('aria-label',soundOn?'关闭环境声':'开启环境声');$('#sound-button').title=soundOn?'关闭合成风声':'开启合成风声';toast(soundOn?'窗外的风声，轻轻打开了。':'环境声已关闭。');
    }catch{toast('这个浏览器暂时不能播放环境声，游戏可以继续。');}
  }

  $('#new-game').onclick=()=>{
    if(saved){const m=showModal({kicker:'重新报到',title:'从九月的第一天重来？',body:'<p class="modal-lead">这会替换当前浏览器里的试玩进度。\n想留住上一局，可以先继续游戏并导出记录。</p><div class="modal-actions"><button class="secondary-button" id="cancel-new">再想想</button><button class="primary-button" id="confirm-new">重新走进教室</button></div>'});$('#cancel-new',m).onclick=()=>closeModal();$('#confirm-new',m).onclick=startNew;}else startNew();
  };
  $('#continue-game').hidden=!saved;$('#continue-game').onclick=continueGame;$('#title-help').onclick=help;
  $$('[data-place]').forEach(b=>b.onclick=()=>move(b.dataset.place));
  $('#profile-button').onclick=identityCard;
  $('#finish-week').onclick=finishWeek;$('#plan-button').onclick=()=>{if(!screens.length&&!E.busy)openPlan();};$('#journal-button').onclick=()=>{if(!screens.length&&!E.busy)journal();};$('#menu-button').onclick=menu;$('#sound-button').onclick=toggleSound;
  document.addEventListener('keydown',event=>{
    if(E.busy)return;const top=screens.at(-1);
    if(top){
      if(event.key==='Escape'){event.preventDefault();closeModal();return;}
      if(event.key==='Tab'){
        const items=$$('button:not(:disabled),select,a[href]',top.backdrop).filter(x=>!x.hidden),first=items[0],last=items.at(-1);
        if(!first)return;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }return;
    }
    if(!S||$('#play-screen').hidden)return;
    if(event.key==='Escape'){menu();return;}
    if(['1','2','3','4'].includes(event.key))move(['classroom','canteen','track','home'][Number(event.key)-1]);
    if(event.key.toLowerCase()==='j')journal();if(event.key.toLowerCase()==='p')openPlan();
  });
  window.addEventListener('beforeunload',()=>{if(S)save();});
})();
