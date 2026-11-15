/* 校园三年 — local, dependency-free playable chapter. MIT licensed source. */
(() => {
  'use strict';
  const C = window.CAMPUS_CONTENT;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const KEY = 'campus-three-years-portraits-v3';
  const E=window.CampusExperience;
  const O=window.CampusOctober;
  const W=window.CampusWeekend;
  const B=window.CampusBalance;
  const Y1=window.CampusYearOne;
  const CF=window.CampusCanteen;
  const G=window.CampusGrowth;
  let weekendFilter="全部";
  let activeSpeaker=null;
  const COST={friend:12,girl:12,running:14,inspection:8,'friend-canteen':8,'girl-canteen':8,'pursuer-canteen':8};
  const categoryName = {study:'订正功课',friend:'和人待一会儿',rest:'留一点空白'};
  let S = null, toastTimer;
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
    return {version:8,growth:G.fresh(),year:Y1.fresh(),rhythm:B.fresh(),weekend:W.initial(1),october:O.initial(),profile:{gender:null,name:'你'},fitness:0,caught:0,cgSeen:[],week:1,place:'classroom',remaining:3,seat:null,plan:null,done:[],
      study:0,friend:0,warm:0,family:0,energy:64,promise:null,promiseKept:false,echoResolved:false,
      taste:null,notePromise:false,noteKept:false,memories:[],diaries:[],ended:false};
  }
  function readSave() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('campus-three-years-dynamic-v2')||localStorage.getItem('campus-three-years-chapter1-v1'));
      if (!d || ![1,2,3,4,5,6,7,8].includes(d.version) || !Number.isInteger(d.week) || d.week<1 || d.week>C.weeks.length || !C.places[d.place]) return null;
      if (!Number.isInteger(d.remaining) || d.remaining<0 || d.remaining>6 || !Array.isArray(d.done) || !Array.isArray(d.memories) || !Array.isArray(d.diaries)) return null;
      if (!['study','friend','warm','family','energy'].every(k=>Number.isFinite(d[k]))) return null;
      if (d.seat!==null && (!Number.isInteger(d.seat) || d.seat<0 || d.seat>43)) return null;
      if (d.plan!==null && (!Array.isArray(d.plan) || (d.plan.length<3||d.plan.length>6) || !d.plan.every(k=>categoryName[k]))) return null;
      const legacyOctober=d.october&&typeof d.october==='object'?d.october:{};
      d.october={...O.initial(),...legacyOctober};
      if(!['undecided','closer','friends'].includes(d.october.mode))d.october.mode='undecided';
      for(const k of ['introPending','seatBreak','poster','milk','sportsPhoto','metAzhe','tasteShared'])d.october[k]=d.october[k]===true;
      if(!legacyOctober.tasteShared)d.october.tasteShared=d.memories.some(x=>typeof x?.text==='string'&&x.text.includes('和他们坐在一起'));
      if(d.week>4&&(!d.october.exam||!Number.isInteger(d.october.exam.rank)||d.october.exam.rank<1||d.october.exam.rank>44||!Number.isInteger(d.october.exam.oldSeat)||d.october.exam.oldSeat<0||d.october.exam.oldSeat>43))return null;
      if(d.version<6&&d.week===4&&d.ended&&!d.october.exam)d.october.exam={rank:Math.max(1,Math.min(44,Math.round(29-d.study*1.15+(d.energy<35?4:d.energy<50?2:0)))),oldSeat:d.seat,energy:d.energy};
      const oldVersion=d.version;if(oldVersion<8&&!localStorage.getItem(KEY+'-before-growth-v16'))localStorage.setItem(KEY+'-before-growth-v16',JSON.stringify(d));d.energy=Math.max(0,Math.min(100,d.energy));B.migrate(d,oldVersion);
      d.year=Y1.normalize(d.year,d);G.ensure(d);d.version=8;d.weekend=W.normalize(d.weekend,d.week);d.profile={gender:['male','female'].includes(d.profile?.gender)?d.profile.gender:null,name:typeof d.profile?.name==='string'?d.profile.name.slice(0,10):'你'};d.fitness=Number.isFinite(d.fitness)?d.fitness:0;d.caught=Number.isFinite(d.caught)?d.caught:0;d.cgSeen=Array.isArray(d.cgSeen)?d.cgSeen:[];return d;
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
  Object.assign(CGS,O.cg,Y1.cg,CF.cg);
  function playCG(id,after=()=>{}){if(!S.cgSeen.includes(id)){S.cgSeen.push(id);save();}E.cg(CGS[id],after);}
  function studyCount(){return S.done.filter(x=>x==='notebook'||x.startsWith('notebook-')).length;}
  function actionCost(id){return id==='notebook'?B.modes.steady.cost:COST[id]||0;}
  function enough(id){const cost=actionCost(id);if(S.energy>=cost)return true;result('脑子已经有些转不动了',`这件事需要 ${cost} 点精力，现在只有 ${S.energy} 点。\n先去吃饭、陪家人坐会儿，或者早点休息。时间还在，你不必硬撑。`,null,'没有扣除时间或精力。');return false;}
  function cgGallery(){
    const m=showModal({kicker:'记忆放映室 · 插画运镜短片',title:'有些画面，会留在这里',body:`<div class="gallery-grid">${Object.entries(CGS).map(([id,c])=>`<button class="cg-card" data-cg="${id}" ${S.cgSeen.includes(id)?'':'disabled'}><img src="assets/${c.scene}.jpg" alt="${esc(c.title)}"><strong>${S.cgSeen.includes(id)?esc(c.title):'还没遇见的画面'}</strong><small>${c.duration} 秒 · ${S.cgSeen.includes(id)?'点此重看':'在剧情里解锁'}</small></button>`).join('')}</div>`});
    $$('[data-cg]',m).forEach(b=>b.onclick=()=>E.cg(CGS[b.dataset.cg]));
  }
  function markPlay(){$('#game').classList.remove('at-title');$('#title-screen').hidden=true;$('#play-screen').hidden=false;}
  function updateTitle(){
    const button=$('#continue-game');button.hidden=false;button.disabled=!saved;
    $('small',button).textContent=saved?`第 ${saved.week} 周 · ${saved.profile.name==='你'?'你的校园生活':saved.profile.name}`:'还没有留下的进度';
    $('#title-save-summary').textContent=saved?`${saved.ended?'已到本章收束':saved.weekend.current.started&&!saved.weekend.current.finished?`周${saved.weekend.current.day?'日':'六'} · 还剩 ${saved.weekend.current.remaining} 段`:`工作日 · 还剩 ${saved.remaining} 段`}，继续会接回这里。`:'从“新的开始”认识大家。小游戏可以先在“更多玩法”练习。';
  }
  function returnTitle(){clearModals();$('#play-screen').hidden=true;$('#title-screen').hidden=false;$('#game').classList.add('at-title');$('#world').className='world classroom';updateTitle();(saved?$('#continue-game'):$('#new-game')).focus({preventScroll:true});}
  function identitySetup(after,canCancel=false){
    let selected=null;
    const m=showModal({kicker:'报到之前 · 先认识你',title:'这三年，由谁来度过？',wide:true,closable:false,body:`<p class="modal-note">选择主角并写下名字。能力起点随机，与性别无关；每种起点都能通过后续投入成长。</p><div class="identity-cards">${['female','male'].map(g=>`<button class="identity-card" data-gender="${g}" aria-pressed="false"><div class="identity-art"><img src="assets/expressions/player-${g}.png" alt="${g==='female'?'女生':'男生'}主角立绘"></div><strong>${g==='female'?'以女生的身份':'以男生的身份'}</strong><span>从同一个九月开始</span></button>`).join('')}</div><div class="receipt">这一局的起点：理解力 ${Math.round(G.ensure(S).aptitude)} / 身体素质 ${Math.round(G.ensure(S).body)} / 人缘 ${Math.round(G.ensure(S).social)}<br>没有不可改变的天赋标签，之后会记录你实际做过的事。</div><label class="identity-name" for="player-name">你的名字 <input id="player-name" maxlength="10" placeholder="可以先不填，故事里会称呼你" autocomplete="off"></label><div class="modal-actions"><button class="primary-button" id="identity-confirm" disabled>选好了，去报到</button></div>`});
    $('.modal',m).classList.add('identity-setup');
    if(canCancel){const back=document.createElement('button');back.id='identity-back';back.className='secondary-button';back.textContent='返回主界面';back.onclick=()=>{S=null;returnTitle();};$('.modal-actions',m).prepend(back);}
    $$('[data-gender]',m).forEach(b=>b.onclick=()=>{selected=b.dataset.gender;$$('[data-gender]',m).forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b));});$('#identity-confirm',m).disabled=false;});
    $('#identity-confirm',m).onclick=()=>{if(!selected)return;const name=$('#player-name',m).value.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,10)||'你';if(canCancel&&saved){try{localStorage.setItem(KEY+'-before-new-v12',JSON.stringify(saved));}catch{}}S.profile={gender:selected,name};window.CampusCharacters.setProfile(S.profile);memory(`${name==='你'?'你':name}以${selected==='female'?'女生':'男生'}的身份，在九月报到。`,'报到');save();closeModal(true);render();after();};
  }
  function opening(){
    const name=S.profile.name;
    playCG('arrival',()=>E.dialogue({title:'九月 · 报到日',lines:[
      {id:'arrival.mother',who:'mother',mood:'smile',text:(name==='你'?'':name+'，')+'饭卡放外面的袋子了。放学回来，跟我说说新同桌。'},
      {id:'arrival.player',who:'you',mood:'smile',text:'知道啦。我先去找教室，回来再说。'},
      {id:'arrival.register',who:'narrator',text:`名单上${S.profile.gender==='female'?'女生':'男生'}那一栏，多了一个勾。你把领来的练习册抱在怀里，站到教室门口。`},
      {id:'arrival.teacher',who:'teacher',text:name==='你'?'新同学，先进去找个位子。书包放好了，等会儿领书。':name+'同学，先进去找个位子。书包放好了，等会儿领书。'},
      {id:'arrival.desk',who:'zhaocheng',mood:'smile',text:'哎，同学，这边还有空位。书包先放这儿？'},
      {id:'arrival.time',who:'narrator',text:'每周的空闲会随校园日历变化，周六、周日也能自己安排。每天都会正常睡觉，精力会随日期恢复；答应过的人，仍需要你真正留出时间。先给自己选一个座位吧。'}]},()=>seatPicker(true)));
  }
  function startNew(){clearModals();S=initial();markPlay();render();identitySetup(opening,true);}
  function continueGame(){
    try{const raw=localStorage.getItem(KEY);if(raw&&JSON.parse(raw).version<7&&!localStorage.getItem(KEY+'-before-year-v13'))localStorage.setItem(KEY+'-before-year-v13',raw);}catch{}
    if(!saved)return;
    try{const raw=localStorage.getItem(KEY)||localStorage.getItem('campus-three-years-dynamic-v2')||localStorage.getItem('campus-three-years-chapter1-v1');if(raw&&JSON.parse(raw).version<6&&!localStorage.getItem(KEY+'-before-balance-v12'))localStorage.setItem(KEY+'-before-balance-v12',raw);}catch{}
    S=structuredClone(saved);clearModals();markPlay();render();save();
    const resume=()=>{window.CampusCharacters.setProfile(S.profile);if(W.active(S)){render();if(S.weekend.current.pending)weekendOutcome();return;}if(S.weekend.current.started&&S.weekend.current.finished&&!S.ended){diary();return;}if(S.ended)showEnding();else if(S.week>4&&S.october.introPending)octoberArrival();else if(S.seat===null)seatPicker(true);else if(!S.plan)weekIntro();else toast('书包还在原来的位置。');};
    if(!S.profile.gender)identitySetup(resume);else resume();
  }
  function identityCard(){
    if(!S||screens.length||E.busy)return;
    E.dialogue({title:'这三年里的你',lines:[{who:'you',mood:'neutral',text:`${S.profile.name==='你'?'名字还没有填。':S.profile.name+'。'}${S.profile.gender==='female'?'女生':'男生'}，高一（六）班。书包里的练习册越来越厚，但我还想记住一些题目以外的事。`},{who:'you',mood:'smile',text:'下一段时间，还是由我来决定。'}]});
  }
  function characterAlbum(){
    const actors=window.CampusCharacters.actors;
    const visibleActors=Object.values(actors).filter(a=>!['qiaosui','chenyu','zhouyan'].includes(a.id)||(a.id==='zhouyan'?S.week>=21:a.id===Y1.visitor(S).who&&S.year.pursuit!=='unmet'));
    const m=showModal({kicker:'人物小册 · 表情与短动画',title:'慢慢熟悉他们的样子',wide:true,body:`<div class="actor-grid">${visibleActors.map(a=>`<button class="actor-card" data-actor="${a.id}"><img src="${a.base}" alt="${esc(a.name)}"><strong>${esc(a.role)}</strong><small>${a.id.startsWith('player')?esc(a.role):esc(a.name)} · 看看立绘</small></button>`).join('')}</div><p class="modal-note">林遥与乔穗新增多张表情、手势立绘，食堂剧情会实际切换使用。原有短动态保留；新增立绘目前是静态画面。</p>`});
    $$('[data-actor]',m).forEach(b=>b.onclick=()=>{const a=actors[b.dataset.actor];E.dialogue({title:a.role+' · '+a.name,lines:[{id:'album.'+a.id+'.neutral',who:a.id,mood:'neutral',text:'刚见面的时候，还不知道该说些什么。'},{id:'album.'+a.id+'.smile',who:a.id,mood:'smile',text:'慢慢熟起来，一抬头，就知道是在叫谁。'},...Object.keys(a.poses).filter(k=>['laugh','thoughtful','shy','wave','pause'].includes(k)).map(k=>({id:'album.'+a.id+'.'+k,who:a.id,mood:k,motion:false,text:({laugh:'笑的时候，手里的本子差点拿反。',thoughtful:'等一下，这个我还没有想明白。',shy:'你先别笑。我只是想把话说清楚。',wave:'这里有空位，要不要坐一会儿？',pause:'我慢一点讲。今天不用急着想好开场白。'})[k]})),...(a.poses.blink?[{id:'album.'+a.id+'.blink',who:a.id,mood:'blink',motion:false,text:'有些很短的停顿，也会被记住。'}]:[]),...(a.poses.sad?[{id:'album.'+a.id+'.sad',who:a.id,mood:'sad',motion:false,text:'有的时候，话说到一半，就没有再往下说。'}]:[])]});});
  }
  function slowGirl(id){
    const g=G.ensure(S),n=g.contactWeeks.length,w=S.week;
    const moments=[['她把本子合上','这页我还没写完。你要问哪一道？','只问那一步，给她留出写完的时间','她把等号前的那一行指给你看，随后继续写自己的。'],['借一把尺子','用完放桌边就好，我一会儿还要用。','用完当面归还，不顺手翻她的画本','她点点头，把尺子收进笔袋。'],['值日后还没走','我在等颜料干。你先去忙吧。','问能不能帮忙收工具，等她同意再动','她把需要清洗的笔挑出来，另外两支留在手边。'],['被认出的脚步声','今天你们也拖堂了？我刚准备走。','讲讲课堂上的小插曲，不追问私事','她听到粉笔断成三截，没忍住笑了一下。'],['留了一小张纸','上次你问的那题，我找到另一种写法了。','认真看完，也告诉她自己的想法','你们对了几行步骤。铃响以后，她把纸留在桌上。'],['不再只谈题目','新画还没画完。你想看的话，下周再说。','答应等她愿意展示时再看','她把本子收好，问你周末准备做什么。']];
    const a=moments[Math.min(n,5)];return {id,title:(id.includes('canteen')?'食堂':'课后')+' · '+a[0],cost:id.includes('canteen')?8:12,category:'friend',effects:{friend:2},lines:[['narrator',n<3?'林遥抬头看了一眼，手里的笔没有放下。':'她认出了你，给书本挪出一点位置。'],['linyao',a[1]],['you',w<10?'我就问一下，不耽误你。':'你现在方便说一会儿吗？']],choices:[{key:'respect',text:a[2],effects:{},flags:{},after:[['narrator',a[3]],['linyao',n<3?'嗯，谢谢。':'下次见。']]},{key:'brief',text:'简单打个招呼，聊几句各自的安排',effects:{},flags:{},after:[['linyao','好，我先把这点事情做完。'],['narrator','你们各自收好东西，没有把一次交谈当成更亲近的承诺。']]}]};
  }
  function renderGrowth(){
    const g=G.ensure(S);let bar=$('#growth-bar');if(!bar){bar=document.createElement('aside');bar.id='growth-bar';$('#play-screen').append(bar);}
    bar.innerHTML=`<button id="growth-open"><span>我的成长手册</span><strong>理解 ${Math.round(g.aptitude)} · 体能 ${Math.round(g.body)} · 人缘 ${Math.round(g.social)}</strong><small>${esc(g.role)} / ${esc(G.stage(S))} / 压力 ${Math.round(g.stress)}</small></button><button id="school-open">${g.schoolDone.includes('lesson')?'本周课堂已完成':'去上课'}<small>看课表与校园事件</small></button>`;
    $('#growth-open').onclick=()=>{if(!E.busy&&!screens.length)growthDesk();};$('#school-open').onclick=()=>{if(!E.busy&&!screens.length)growthDesk();};
  }
  const campusEvents=[
    ['临时的值日搭档','分工时有人把最脏的那一排留给了你。','把分工讲清，一起收尾','你把桌椅和垃圾分开列出来。原本闷着的人也接过扫帚。','social',3],
    ['广播里念错的名字','新来的播音员卡住了，后排有人起哄。','给他递一张写清读音的纸条','下一段顺利念完。他下楼来道谢，说自己手心全是汗。','social',3],
    ['食堂窗口的零钱','队伍很长，前面的同学发现饭卡没钱了。','陪他问清补卡窗口，不替他许诺借款','他借到临时卡，转头问你平时在哪张桌吃饭。','social',2],
    ['输掉的接力预赛','最后一棒交接掉了，队友都不说话。','重新试一次交接，看看错在哪里','你们换了起跑位置，第二次接稳了。成绩仍然记着第一次。','body',3],
    ['画稿被退回来','林遥把没选中的画压在书下面。','问她想说说，还是先安静一会儿','她说想自己改改。第二天见到你时，她主动说已经改了一角。','social',2],
    ['排名后的沉默','赵程看完榜单，把卷子折了两次。','先听他说最不甘心的那道题','他没让你安慰分数，只把那一步擦掉重新写了。','aptitude',1],
    ['妈妈发来的排班','周末有半天她要加班，冰箱上留着一张纸。','确认自己能承担的一件家务','你把需要买的东西圈出来。妈妈回了一句：两样就够，别拿不动。','reliable',2],
    ['第一份班刊','编辑空了一栏，征集大家的普通一天。','写自己真正经历过的一件小事','你的名字排在文章下面，没有奖状。课间有人说他也遇到过。','social',3],
    ['被借走的练习册','练习册还没回来，晚自习就要开始。','当面说清归还时间，今晚先拿回来','同学把本子递给你，说明只差一题。你们约定下次先问。','reliable',2],
    ['走廊上的雨','伞架挤在一起，放学的人迟迟没走。','和同学一起把滴水的伞移到门外','路让出来了，你的裤脚也湿了一点。有人借来拖把，没让你一个人收。','social',2],
    ['跑道边的替补','原本参加跳远的同学脚疼，老师问谁愿意补位。','先试动作，量力参加训练','你没有一下跳得很远，但知道起跳那一步该踩哪里。','body',3],
    ['一张没交的报名表','两个社团同一天开会，报名表还空着。','选自己更想试的一项，告诉另一边','两边都说收到。没参加的那组照常合了影。','reliable',2],
    ['午睡时的包装声','阿哲越想轻点拆饼干，塑料袋越响。','收好零食，给午睡的人留安静','放学后三个人才分完那包饼干。碎屑全落在赵程手心。','social',2],
    ['没来得及说的解释','走廊里有人聊起：答应别人的事临时做不了怎么办？','说清应该提前联系，也要认真听对方的意见','大家没给出万能答案。你说，至少别让等的人一直猜。','reliable',2],
    ['挤在同一天','学习小组和旧同学的安排撞在一起。','先对日历，只承诺能到场的部分','没有被选的安排照常进行。对方知道不用再等你。','reliable',2],
    ['第二次发来的时间','上回没碰上的朋友这次提前发了时间。','确认以后，先把自己的安排讲清','对方回了一个收到。谁也没把这句话算成已经见过。','social',2],
    ['纸上的外地地址','父亲把宿舍地址写在一张旧信封背面。','问清路线，把电话号码存好','电话里的人有了具体住处。那里的站名你还念不熟。','reliable',2],
    ['成绩不是唯一的话题','晚饭时妈妈先问了排名，你有点不想回答。','也说说这周做过的、还没做好的事','她听完，把原本准备追问的话停住了。饭还没凉。','social',2],
    ['讲台前的一分钟','试讲时突然卡住，后排有人轻轻提示。','承认卡住，从自己懂的一步重新讲','讲得不快，但最后几个人真的跟上了。','aptitude',2],
    ['空出来的教室','旧桌子要搬出去，抽屉里还有一张没署名的画。','放进失物袋，不擅自当作别人送的礼物','第二天有人来认领。你把纸角压平再还回去。','reliable',2],
    ['新班的门牌','你照旧走到老教室门前，里面全是不熟的脸。','和同样走错路的人一起找新班','一路数着门牌，你们终于在铃响前坐下。','social',2],
    ['晚饭的份数','你多做了一份，妈妈说她已经在单位吃过了。','先分装保存，下次提前问需要多少','她夸的是你愿意商量，没有让你把剩饭硬吃掉。','reliable',2],
    ['电话里的背景声','父亲回消息慢了，过了一会儿说刚下公交。','问什么时候方便，再说自己想聊的事','他发来晚饭照片，约了一个两边都不赶的时间。','social',2]
  ];
  function growthDesk(){
    const g=G.ensure(S),cal=G.calendar(S),done=g.schoolDone,active=W.active(S)||S.ended;
    const m=showModal({title:'我的高中生活',kicker:`${C.weeks[S.week-1].name} · ${cal.title}`,wide:true,body:`<div class="growth-layout"><section class="growth-profile"><img src="assets/expressions/player-${S.profile.gender||'male'}.png" alt="主角"><h3>${esc(S.profile.name==='你'?'新同学':S.profile.name)}</h3><p>${esc(g.role)}</p><dl>${[['理解力',g.aptitude],['身体素质',g.body],['人缘',g.social],['压力',g.stress]].map(([k,v])=>`<div><dt>${k}</dt><dd>${Math.round(v)}<meter min="0" max="100" value="${v}"></meter></dd></div>`).join('')}</dl><p class="modal-note">起点各有长处，能力可以练习。理解力影响听课吸收，体能影响自习耐力，人缘帮助承担班级职责。</p><p>与林遥：${G.stage(S)}<br><small>已经在 ${g.contactWeeks.length} 个不同周有过相处。熟悉需要时间，数值不能替别人答应。</small></p></section><section class="growth-main"><div class="growth-tabs"><button id="report-open">全班成绩单</button><button id="role-open">竞选与职责</button></div><h3>这周怎么过</h3><p>${cal.note} 本周 ${g.slots} 段自由安排，还剩 ${S.remaining} 段。</p><div class="school-grid"><button id="lesson-open" ${done.includes('lesson')||active?'disabled':''}><b>课堂 · 听懂一个问题</b><small>${done.includes('lesson')?'已完成，笔记已收好':'必修课内互动 · 不占课余时段 · 精力 −6'}</small></button><button id="study-open" ${S.remaining===0||active?'disabled':''}><b>晚自习 · 自己排复习顺序</b><small>专注科目与学习强度 · 1 段自由时间</small></button><button id="incident-open" ${done.includes('incident')||S.remaining===0||active?'disabled':''}><b>校园里正在发生</b><small>${done.includes('incident')?'本周事件已留下回响':campusEvents[(S.week-1)%campusEvents.length][0]+' · 1 段'}</small></button><button id="training-open" ${S.remaining===0||active?'disabled':''}><b>体能训练 · 挑一种节奏</b><small>慢跑 / 间歇训练 · 1 段</small></button></div><h3>六科掌握度</h3><div class="mastery-grid">${G.subjects.map((x,i)=>`<button data-focus="${i}" aria-pressed="${i===g.focus}"><span>${x}</span><strong>${Math.round(g.mastery[i])}</strong><meter min="0" max="100" value="${g.mastery[i]}"></meter></button>`).join('')}</div><p class="modal-note">点选科目，订正与课堂就围绕它积累。全班成绩由六科累计形成；考试周：W04、08、10、14、18、20、23。每科 150 分，总分 900。分数属于本作的综合教学模型。</p><div class="receipt">${g.reports.length?`最近一次检测：班级第 ${g.reports.at(-1).rank} 名 / 44 人`:'第一次月考在 W04。此前可以安心试试自己的学习方法。'}</div><p class="modal-note">必修课即使不操作也正常上课；亲自完成互动会有额外理解。周末仍能打球、兼职、约朋友和休息。</p></section></div>`});
    $('#report-open',m).onclick=reportCard;$('#role-open',m).onclick=roles;
    $$('[data-focus]',m).forEach(b=>b.onclick=()=>{g.focus=Number(b.dataset.focus);save();closeModal(true);growthDesk();});
    $('#lesson-open',m).onclick=()=>{closeModal(true);lesson();};$('#study-open',m).onclick=()=>{closeModal(true);selfStudy();};$('#incident-open',m).onclick=()=>{closeModal(true);incident();};$('#training-open',m).onclick=()=>{closeModal(true);training();};
  }
  const schoolQuestions=[
    ['读到“他把话咽了回去”，最适合怎样理解人物？',['联系上下文看他为什么停住','直接认定他胆小','只统计这句话字数'],0,'人物表现需要结合当时的处境，不能只贴一个标签。'],
    ['等差数列首项 3，公差 2，第五项是多少？',['11','13','10'],0,'从第一项到第五项是四个间隔：3 + 4×2 = 11。'],
    ['She has lived here ___ 2020. 应填？',['for','since','during'],1,'since 接一个起始时间点；for 接持续的时间长度。'],
    ['匀速直线运动中，物体的合力怎样？',['为零','一定与速度同向','速度越大合力越大'],0,'匀速直线运动加速度为零，因此合力为零。'],
    ['化学反应前后，封闭体系中什么保持不变？',['所有分子的数目','总质量','各物质的种类'],1,'质量守恒；分子数和物质种类可以变化。'],
    ['细胞中主要承担遗传信息储存的是？',['DNA','水','葡萄糖'],0,'DNA 储存主要遗传信息，其他物质有不同的作用。']
  ];
  const moreQuestions=[
    [
      ['概括一段文章，先抓什么？',['核心事件与作者着重表达的意思','只抄第一句话','选最长的句子'],0,'结合整段结构和反复出现的重点概括，不能只看句子长短。'],
      ['“风把信翻到了最后一页”主要用了什么修辞？',['比喻','拟人','排比'],1,'把风写成会翻信的人，赋予人的动作，是拟人。']
    ],
    [
      ['函数 f(x)=2x+3，f(4) 等于？',['7','11','14'],1,'把 x 换成 4，2×4+3=11。'],
      ['袋里 3 个红球、2 个白球，随机取一个是红球的概率？',['3/5','2/3','1/3'],0,'共有五个等可能的球，红球三个，概率为 3/5。']
    ],
    [
      ['If it rains tomorrow, we ___ at home.',['stayed','will stay','have stayed'],1,'if 条件从句用一般现在时表示将来，主句用 will stay。'],
      ['This is the book ___ I borrowed yesterday.',['who','where','that'],2,'先行词是 book，在从句中作 borrowed 的宾语，可用 that。']
    ],
    [
      ['质量 2 kg 的物体，加速度 3 m/s²，合力是多少？',['6 N','1.5 N','5 N'],0,'牛顿第二定律 F=ma，2×3=6 N。'],
      ['忽略空气阻力，自由下落时哪项随时间增加？',['质量','重力加速度','速度大小'],2,'重力加速度近似不变，速度大小随下落时间增加。']
    ],
    [
      ['pH=2 的水溶液呈什么性？',['酸性','中性','碱性'],0,'常温下 pH 小于 7 呈酸性。'],
      ['1 mol 氧气与 1 mol 氮气相同的是？',['质量','分子数','每个分子的质量'],1,'相同物质的量对应相同微粒数，摩尔质量可以不同。']
    ],
    [
      ['绿色植物光合作用把什么能转为有机物中的化学能？',['光能','声能','机械能'],0,'光合作用将光能转化并储存在有机物的化学能中。'],
      ['有丝分裂前 DNA 复制主要发生在哪个阶段？',['间期','末期','后期'],0,'细胞在分裂间期进行 DNA 复制，为后续分裂做准备。']
    ]
  ];
  function lessonQuestion(S){const i=G.ensure(S).focus,n=(S.week-1)%3;return n===0?schoolQuestions[i]:moreQuestions[i][n-1];}
  function lesson(){
    const g=G.ensure(S),q=lessonQuestion(S);if(g.schoolDone.includes('lesson'))return;
    const m=showModal({kicker:`${G.subjects[g.focus]}课 · ${S.week>=21?'新班':'高一（六）班'}`,title:'老师停在了这一步',body:`<div class="lesson-board"><small>本节重点</small><h3>${q[0]}</h3><p>先想一想，再听讲解。不会也可以提问。</p></div><p>老师没有马上往下讲。你可以试着回答，也可以请老师再解释一遍。</p><div class="school-answers">${q[1].map((x,i)=>`<button data-answer="${i}">${x}</button>`).join('')}<button data-answer="review">先听老师拆开讲</button></div><p class="modal-note">本周一次课堂互动，精力 −6；离开不扣除。</p>`});
    $$('[data-answer]',m).forEach(b=>b.onclick=()=>{if(g.schoolDone.includes('lesson'))return;if(S.energy<6){toast('先休息一下，精力不足 6。');return;}const correct=Number(b.dataset.answer)===q[2],gain=correct?4+Math.floor(g.aptitude/25):3;G.schoolCommit(S,'lesson',{mastery:gain,aptitude:.4,stress:correct?-2:1});S.energy-=6;S.study+=correct?2:1;memory(`你在${G.subjects[g.focus]}课上${correct?'答出了问题':'听完了讲解'}：${q[3]}`,'课堂');save();closeModal(true);render();E.dialogue({title:'黑板上的粉笔还没擦',scene:'classroom',lines:[{who:'teacher',text:correct?'这一步说清楚了，再换一道题也试试。':'先把原因弄懂。答错的那一步，留下来订正就行。'},{who:'narrator',text:`${G.subjects[g.focus]}掌握度 +${gain}。${q[3]}`}]});});
  }
  function selfStudy(){
    const g=G.ensure(S);let selected=[];
    const m=showModal({kicker:'晚自习 · 教室的灯还亮着',title:'先做什么，后做什么',body:`<p>选两件事排进今晚。先回忆再练习，比一上来对答案更扎实；疲惫时可以留一半时间整理。</p><div class="study-order">${['闭卷回忆知识点','做一组典型题','核对答案找原因','整理明天的问题'].map((x,i)=>`<button data-order="${i}">${x}</button>`).join('')}</div><p id="order-preview">尚未安排</p><label>今晚的科目 <select id="study-subject">${G.subjects.map((x,i)=>`<option value="${i}" ${g.focus===i?'selected':''}>${x}</option>`).join('')}</select></label><div class="modal-actions"><button id="study-steady" disabled>认真复习 · 精力 −16</button><button id="study-intensive" disabled>加练攻坚 · 精力 −25</button></div><p class="modal-note">都占 1 段自由时间。高压力会影响发挥；体能较好时能少一些疲劳。</p>`});
    $$('[data-order]',m).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.order);if(selected.includes(i))selected=selected.filter(x=>x!==i);else if(selected.length<2)selected.push(i);$$('[data-order]',m).forEach(x=>x.classList.toggle('selected',selected.includes(Number(x.dataset.order))));$('#order-preview',m).textContent=selected.map(i=>['回忆','练题','核对','整理'][i]).join(' → ');$('#study-steady',m).disabled=$('#study-intensive',m).disabled=selected.length!==2;});
    function commit(intense){const cost=intense?25:16;if(S.energy<cost){toast('精力不足，换一种安排或先休息。');return;}const good=selected[0]===0&&selected[1]===1||selected[0]===1&&selected[1]===2,subject=Number($('#study-subject',m).value),gain=(intense?7:5)+(good?2:0)+Math.floor(g.aptitude/30),id='selfstudy-'+S.done.length;g.focus=subject;const ok=spend(id,'study',{study:intense?5:3,energy:-cost},`你用“${selected.map(i=>['回忆','练题','核对','整理'][i]).join('再')}”复习了${G.subjects[subject]}。`,'', '晚自习', '',()=>{});if(!ok)return;g.mastery[subject]=G.clamp(g.mastery[subject]+gain);g.stress=G.clamp(g.stress+(intense?10:3)-Math.floor(g.body/25));g.records.push({week:S.week,id,subject,gain});save();render();E.dialogue({title:'熄灯前的最后一页',scene:'classroom',lines:[{who:'teacher',text:'把没解决的题标出来，明天再问。别把困着抄完当成学会。'},{who:'narrator',text:`${G.subjects[subject]}掌握度增加 ${gain+2}，学习积累增加 ${intense?5:3}。${good?'这个顺序帮你把原因串了起来。':'今晚整理出的问题，下次仍有用。'}`}]});}
    $('#study-steady',m).onclick=()=>commit(false);$('#study-intensive',m).onclick=()=>commit(true);
  }
  function incident(){
    const g=G.ensure(S),e=campusEvents[(S.week-1)%campusEvents.length];E.dialogue({title:e[0],scene:S.place,lines:[{who:'narrator',text:e[1]}],choices:[{text:e[2],note:'1 段自由时间 · 精力 −8',value:'join'},{text:'先说明自己的时间，只帮忙一小部分',note:'1 段自由时间 · 精力 −4 · 少一点压力',value:'limited'},{text:'今天有别的安排，先说明',note:'不消耗时间，仍可稍后回来',value:'leave'}]},v=>{if(v==='leave'||g.schoolDone.includes('incident'))return;const cost=v==='limited'?4:8;const after=v==='limited'?'你先说明自己能做的部分，其他人接着分工。事情没有全落在你一个人身上。':e[3];if(S.energy<cost){result('先缓一缓','精力不够，先休息或吃饭再来。');return;}const ok=spend('incident','friend',{energy:-cost,friend:1},after,'',e[0],'',()=>{});if(!ok)return;G.schoolCommit(S,'incident',v==='limited'?{social:1,stress:-2,reliable:1}:{[e[4]]:e[5],reliable:1});save();render();E.dialogue({title:e[0],lines:[{who:'narrator',text:after}]});});
  }
  function training(){const g=G.ensure(S);const m=showModal({title:'先找到自己的呼吸',kicker:'体育课后 · 一段训练',body:'<p>慢跑让身体适应节奏，间歇训练提升更多，也需要更多余力。</p><div class="school-answers"><button id="train-light">慢跑与拉伸 · 精力 −10 / 体能 +2 / 压力 −8</button><button id="train-hard">间歇训练 · 精力 −20 / 体能 +4 / 压力 −3</button></div>'});for(const [id,cost,body,stress] of [['light',10,2,-8],['hard',20,4,-3]])$('#train-'+id,m).onclick=()=>{if(S.energy<cost){toast('先恢复一点精力。');return;}if(spend('training-'+S.done.length,'rest',{energy:-cost},'你完成了'+(id==='light'?'慢跑和拉伸。':'一组间歇训练。'),'呼吸慢慢平稳下来，今天先练到这里。','训练结束')){g.body=G.clamp(g.body+body);g.stress=G.clamp(g.stress+stress);save();render();}};}
  function roles(){
    const g=G.ensure(S),can=S.week>=3;
    const m=showModal({kicker:'班级里的一份职责',title:'不是戴上袖章就结束了',body:`<p>班委从第三周开放。能力与实际参与达到条件才能承担；没有当班干部也能完整生活。</p><div class="school-answers">${[['学习委员',g.aptitude>=60&&S.study>=12,'理解力 ≥60，学习积累 ≥12'],['体育委员',g.body>=60,'体能 ≥60'],['班长',g.social>=60&&g.reliable>=3,'人缘 ≥60，实际事务参与 ≥3']].map(([name,ok,note])=>`<button data-role="${name}" ${!can||!ok||g.role!=='普通同学'?'disabled':''}>${name}<small>${note}</small></button>`).join('')}</div><p>当前：${g.role} · 完成职责 ${g.duty} 次</p><button id="role-duty" ${g.role==='普通同学'||g.schoolDone.includes('duty')||S.remaining===0||W.active(S)||S.ended?'disabled':''}>履行本周职责 · 1 段 / 精力 −10</button><p class="modal-note">竞选不会消耗时段；做出职责才有成长。可以不申请，班级事务仍会由别人完成。</p>`});
    $$('[data-role]',m).forEach(b=>b.onclick=()=>{if(W.active(S)||S.ended)return;g.role=b.dataset.role;memory(`你承担了${g.role}的职责。`,'班级');save();closeModal(true);render();roles();});$('#role-duty',m).onclick=()=>{if(S.energy<10){toast('精力不足。');return;}if(spend('role-duty','friend',{energy:-10,friend:2},`你为${g.role}的本周事务真正留出一段时间。`,'大家把各自负责的事情对清，终于不用临下课再挨个问。','职责完成')){G.schoolCommit(S,'duty',{duty:1,social:2,reliable:1});save();render();}};
  }
  function addReportButton(m){if(!G.ensure(S).reports.length)return;const b=document.createElement('button');b.className='secondary-button';b.id='ending-report';b.textContent='查看全班成绩单';b.onclick=reportCard.bind(null,null);$('.modal-actions',m).append(b);}
  function reportCard(index=null){const g=G.ensure(S);if(!g.reports.length){result('成绩单还没发下来','第一次月考在第四周结束。每科的掌握度、精力和压力都会影响发挥。');return;}const r=g.reports[index===null?g.reports.length-1:index],me=r.rows.find(x=>x.id==='player'),previous=g.reports[g.reports.indexOf(r)-1];const m=showModal({title:r.title,kicker:`第 ${r.week} 周 · 班级学情公示`,wide:true,body:`<div class="report-summary"><strong>${me.total}<small> / 900 分</small></strong><span>班级第 ${me.rank} / 44 名${previous?` · 上次第 ${previous.rank} 名`:''}</span></div><div class="growth-tabs">${g.reports.map((x,i)=>`<button data-report="${i}">W${x.week}</button>`).join('')}</div><p class="modal-note">全班 44 人，六科各 150 分；同分并列排名。姓名和发挥随同一周目保存，刷新不会重新抽成绩。</p><div class="report-scroll"><table><thead><tr><th>排名</th><th>姓名</th>${G.subjects.map(x=>`<th>${x}</th>`).join('')}<th>总分</th></tr></thead><tbody>${r.rows.map(x=>`<tr class="${x.id==='player'?'player-row':''}"><td>${x.rank}</td><th>${esc(x.name)}${x.id==='player'?'（你）':''}</th>${x.scores.map(n=>`<td>${n}</td>`).join('')}<td><b>${x.total}</b></td></tr>`).join('')}</tbody></table></div>`});$$('[data-report]',m).forEach(b=>b.onclick=()=>{closeModal(true);reportCard(Number(b.dataset.report));});}

  function render(){
    const p=C.places[S.place],w=C.weeks[S.week-1];
    S.year=Y1.normalize(S.year,S);G.enter(S);
    E.setPeriod(C.weeks[S.week-1].date.split('月')[0].trim()+'月');
    $('#profile-avatar').hidden=!S.profile.gender;if(S.profile.gender)$('#profile-avatar').src=`assets/expressions/player-${S.profile.gender}.png`;$('#profile-name').textContent=S.profile.name==='你'?(S.week>=21?'高二 · 上学期':`高一 · ${S.week<11?'上学期':'下学期'}`):S.profile.name;
    $('#world').className=`world ${S.place}`;
    $('#world').style.backgroundImage=S.week>=21&&S.place==='classroom'?"url('assets/year-newclass-v15.jpg')":'';$('#game').classList.toggle('at-home',S.place==='home');
    $('#date-label').textContent=w.date.split('月')[0].trim()+'月 · '+['周一','周二','周三','周四','周五','周五'][Math.min(5,G.total(S)-S.remaining)];$('#week-label').textContent=`第 ${S.week} / ${C.weeks.length} 个关键周`;
    $('#scene-name').textContent=S.week>=21&&S.place==='classroom'?'高二 · 新教室':p.name;$('#scene-desc').textContent=S.week>4&&S.place==='classroom'?S.week>=21?`新班第 ${Math.floor(S.seat/6)+1} 排 · 课后见旧同学要先问时间。`:`月考后第 ${Math.floor(S.seat/6)+1} 排，书又重新摞了一遍。`:p.desc;
    $('#time-dots').innerHTML=Array.from({length:G.total(S)},(_,i)=>`<i class="time-dot ${i>=S.remaining?'spent':''}"></i>`).join('');
    $('#time-label').textContent=`还剩 ${S.remaining} 段`;
    $('#observation').textContent=S.week===6&&S.place==='home'?(S.october.poster&&S.october.mode==='closer'?'书包侧袋里夹着那只小鸟。纸角被折得整整齐齐。':'你把书包放到椅子上。今天的收据从侧袋里露出来。'):p.observation[S.week-1];
    $('#energy-number').textContent=`${S.energy} / 100`;$('#energy-fill').style.width=S.energy+'%';$('#energy-budget').classList.toggle('low',S.energy<18);$('.energy-track').setAttribute('aria-valuenow',S.energy);$('#energy-hint').textContent=S.energy<18?'先恢复一点余力 · 每晚自动 +6':'每晚自动 +6 · 点此看恢复规则';
    $$('[data-place]').forEach(b=>{b.classList.toggle('active',b.dataset.place===S.place);b.setAttribute('aria-current',b.dataset.place===S.place?'location':'false');});
    const hotspots=$('#hotspots');hotspots.innerHTML='';
    p.spots.forEach(spot=>{
      const b=document.createElement('button');b.className=`hotspot ${S.done.includes(spot.id)&&spot.id!=='notebook'?'done':''}`;
      b.dataset.spot=spot.id;b.style.left=`${spot.x}%`;b.style.top=`${spot.y}%`;
      let label=spot.label,sub=spot.sub;
      if(spot.id==='friend' && S.week===2 && S.promise==='yes'&&!S.promiseKept)sub='班旗还差一点 · 兑现约定';
      if(spot.id==='friend'&&S.week>=3&&S.promise==='yes'&&!S.promiseKept)sub='他的桌上多了另一把椅子';
      if(spot.id==='girl'&&S.week===3&&S.taste)sub='她记得你的口味';
      if(S.week>4&&S.week<7){
        if(spot.id==='friend'){label=S.place==='track'?'赵程的拍摄计划':'过道那边的赵程';sub=S.week===5?'运动会，先问清时间':'摄影工作，接了就要留整段时间';}
        if(spot.id==='girl'){label='林遥';sub=S.week===5?'她把书包从椅子上拿开':'海报纸角，想请你帮忙按住';}
        if(spot.id==='lunch'&&S.week===6)sub='在窗边吃一顿午饭';
      }
      if(CF.isCanteen(spot.id)){label=spot.id==='girl-canteen'?'林遥 · 食堂':'赵程 · 食堂';const other=CF.classroomId(spot.id);sub=S.done.includes(other)?'教室聊过了，这里还能再聊一次':'食堂独立互动 · 教室另有一次';}
      if(S.week>=7&&!CF.isCanteen(spot.id)){const story=Y1.weekday(S,spot.id);if(story){label=story.title.split(' · ')[0];sub=story.title.split(' · ').slice(1).join(' · ')||'本周新的故事';}}
      if(S.done.includes(spot.id))sub='这周已留过时间';
      if(spot.id==='inspection'){label='晚自习安排';sub='排复习顺序 · 自选科目与强度';}
      if(spot.id==='notebook')sub=studyCount()?`继续订正 · 第 ${studyCount()+1} 段 · 收益不递减`:'稳步订正 / 集中攻坚';
      const cost=spot.id==='inspection'?0:actionCost(spot.id),gain={rest:36,mom:10,lunch:16}[spot.id];
      if(cost)sub+=` · 精力 −${cost}`;else if(gain)sub+=` · 精力 +${gain}${spot.id==='lunch'?' / 同桌吃 +8':''}`;
      b.innerHTML=`<span class="hotspot-ring" aria-hidden="true"></span><span class="hotspot-label">${esc(label)}<small>${esc(sub)}</small></span>`;
      b.onclick=()=>interact(spot.id);hotspots.append(b);
    });
    if(S.week>=21&&S.place==='classroom'){const b=document.createElement('button');b.className='year-visitor-button';b.dataset.spot='zhouyan';b.textContent='新同桌周砚 · '+(S.done.includes('zhouyan')?'本周已聊过':'解题方法与课间闲话 · 精力 −12');b.onclick=()=>interact('zhouyan');hotspots.append(b);}
    if(S.week>=7&&S.place==='classroom'&&Y1.bonus(S)){const b=document.createElement('button');b.className='year-visitor-button';b.dataset.spot='pursuer';b.textContent=S.year.pursuit==='unmet'?'后门有人找你 · 新的来客':Y1.visitor(S).name+' · 走廊的一声招呼';b.disabled=S.done.includes('pursuer');b.onclick=()=>interact('pursuer');hotspots.append(b);}
    if(S.place==='canteen'&&CF.visitorAvailable(S)){const b=document.createElement('button');b.className='hotspot';b.dataset.spot='pursuer-canteen';b.style.left='62%';b.style.top='32%';b.innerHTML=`<span class="hotspot-ring"></span><span class="hotspot-label">${esc(Y1.visitor(S).name)} · 食堂<small>${S.done.includes('pursuer-canteen')?'食堂这次已聊过':'和教室分开的一次 · 精力 −8'}</small></span>`;b.classList.toggle('done',S.done.includes('pursuer-canteen'));b.onclick=()=>interact('pursuer-canteen');hotspots.append(b);}
    const r=$('#reminder');r.hidden=true;
    if(S.week>=7){r.hidden=false;r.innerHTML='<small>本周的日历</small>'+esc(C.weeks[S.week-1].diary)+(S.week===15?' 周日纸店 / 试讲，全天安排只能选一个。':'');}
    if(S.week<=2&&S.promise==='yes'&&!S.promiseKept){r.hidden=false;r.innerHTML='<small>夹在手记里的约定</small>第二周放学后，帮赵程把班旗画完。';}
    else if(S.week===2&&S.notePromise&&!S.noteKept){r.hidden=false;r.innerHTML='<small>答应过的事</small>周三的课堂笔记，给林遥留一份。';}
    else if(S.week===4){r.hidden=false;r.innerHTML='<small>黑板右边的新通知</small>这周结束后月考。成绩出来，就要换座位了。';}
    else if(S.week===5){r.hidden=false;r.innerHTML='<small>十月 · 慢慢熟起来</small>换了座位，也可以自己走过去说句话。';}
    else if(S.week===6){r.hidden=false;r.innerHTML='<small>运动会在下周</small>'+ (S.october.sportsPhoto?'已接摄影工作：下周要留出完整一段。':'拍摄、海报、练跑，先问清时间再决定。');}
    renderGrowth();
    const isWeekend=W.active(S);$('#game').classList.toggle('weekend-active',isWeekend);$('#weekend-screen').hidden=!isWeekend;if(isWeekend)renderWeekend();
    $('#finish-week').classList.toggle('ready',S.remaining===0);
    $('#finish-week').innerHTML=S.weekend.current.finished?'写下这一周 <span aria-hidden="true">→</span>':S.weekend.current.started?'继续这个周末 <span aria-hidden="true">→</span>':'去过周六、周日 <span aria-hidden="true">→</span>';
  }
  function move(place){if(screens.length||E.busy||W.active(S))return;S.place=place;render();save();}
  function spend(id,category,effects,entry,text,title='这一小段时间',detail='',presentation=null,flags=null){
    if(S.done.includes(id)||S.remaining<=0){toast('这周能自己安排的时间，已经用完了。');return false;}
    const cost=id.startsWith('notebook')?(effects.energy<0?-effects.energy:B.modes.steady.cost):COST[id]||0;if(S.energy<cost)return false;if(cost)effects.energy=-cost;
    const index=G.total(S)-S.remaining,matched=S.plan?.[index]===category;
    S.remaining--;S.done.push(id);G.afterAction(S,id,category);
    Object.entries(effects).forEach(([key,value])=>S[key]+=value);
    if(matched){if(category==='study')S.study+=1;if(category==='friend')S.friend+=1;if(category==='rest')S.energy+=3;}
    S.energy=Math.max(0,Math.min(100,S.energy));
    const sleepGain=B.afterWeekday(S,index);
    if(flags)Object.assign(S.october,flags);
    memory(entry);save();closeModal(true);render();
    const receipt=[detail,matched?(category==='study'?'按学习计划再积累 +1。':'照着原来的安排，留出了这段时间。'):'临时换了安排，时间仍然只过一段。',sleepGain?`日期往前走了两天：正常睡眠恢复 +${sleepGain} 精力。`:'',`当前精力 ${S.energy} / 100。`].filter(Boolean).join(' ');
    const present=()=>result(title,text,null,receipt);
    if(presentation){presentation();return true;}
    const cg=id==='girl'?(S.week===4?'rain':'notebook'):id==='mom'?'dinner':id==='friend'&&S.week===2?'flag':null;if(cg&&!S.cgSeen.includes(cg))playCG(cg,present);else present();
    return true;
  }
  function interact(id){
    if(screens.length||E.busy||W.active(S))return;activeSpeaker={friend:'zhaocheng',girl:'linyao',mom:'mother',inspection:'teacher',running:'zhaocheng'}[id]||null;
    if(['girl','girl-canteen'].includes(id)&&G.guarded(S)){if(S.remaining>0&&!S.done.includes(id))yearStory(id);return;}
    if(id==='inspection'){selfStudy();return;}
    if(id==='seat'){seatPicker(false);return;}
    if(id==='phone'){phone();return;}
    if(id!=='notebook'&&S.done.includes(id)){toast('这周，你已经给这件事留过时间了。还有别的地方可以看看。');return;}
    if(S.remaining<=0){result('窗外已经暗了','本周的自由时段已经用完。\n看看消息和手记，然后点右下角，去安排周六和周日。');return;}
    if(CF.isCanteen(id)||S.week>=7&&['friend','girl','mom','pursuer','zhouyan'].includes(id)){yearStory(id);return;}
    if(!enough(id))return;
    ({notebook:exercise,friend:friend,girl:girl,lunch:lunch,mom:family,rest:rest,running:running,inspection:inspection}[id]||(()=>{}))();
  }
  function seatPicker(first){
    let selection=S.seat??14;
    const m=showModal({kicker:first?'第一天 · 教室':'教室里的位置',title:first?'你想坐在哪里？':'你的名字，还在这张表上',wide:true,closable:!first,
      body:`<p class="modal-note">${first?'靠窗能看见树，前排能听清老师，后排离朋友近一些。选定后，这个月都坐在这里。':S.week>=21?'这是新班安排的位置，承接高一下期末记录。周砚是新同桌，旧朋友在隔壁班。':S.week>4?'这张表已经换成月考后的座位。你现在坐在标记的位置。':'这张表是你这个月的座位。月考之后，班主任会重新安排。'}</p><div class="seat-legend"><span>左侧是窗户</span><span>前排</span><span>右侧是走廊</span></div><div class="blackboard">黑 板</div><div class="seat-grid" id="seat-grid"></div><p class="seat-neighbor" id="seat-description"></p><div class="modal-actions"><button class="primary-button" id="seat-confirm">${first?'把书包放在这里':'记住这个位置'}</button></div>`});
    const occupied=S.week>4?{}:{1:'班长',6:'林遥',13:'赵程',22:'阿哲',26:'小胖'};
    const describe=()=>{
      const row=Math.floor(selection/6)+1,col=selection%6;
      $('#seat-description',m).textContent=`第 ${row} 排，${col<2?'靠窗，风能吹到这里。':col>3?'靠走廊，能听见别班下课。':'中间的位置，前后都是新同学。'}${S.week>=21?' 周砚是你的新同桌。':selection===14?' 赵程坐在你左边。':''}`;
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
  function openPlan(required=false){G.enter(S);
    if(W.active(S)){weekendOverview();return;}
    if(S.plan){
      const m=showModal({kicker:'本周能自己安排的时间',title:'你这一周原本想这样过',body:`<div class="plan-preview">${S.plan.map((p,i)=>`<div class="plan-chip"><small>第 ${i+1} 段 ${i<G.total(S)-S.remaining?'· 已经过了':''}</small>${categoryName[p]}</div>`).join('')}</div><p class="modal-lead">计划写下来了，到了那一刻，仍然由你决定。</p><p class="modal-note">按原计划行动，会有一点额外收获。改变计划也可以，但时间不会多出来。</p><div class="modal-actions"><button class="primary-button" id="plan-done">合上本子</button></div>`});
      $('#plan-done',m).onclick=()=>closeModal();return;
    }
    const m=showModal({kicker:C.weeks[S.week-1].name,title:'这一周，把时间留给什么？',closable:!required,body:`<p class="modal-lead">上课、吃饭、通勤，占去了大半日子。\n这一周有 ${G.total(S)} 段自由安排，另有一堂可参与的课堂。你想怎样过？</p><div class="plan-rows">${Array.from({length:G.total(S)},(_,i)=>['周一课后','周二课后','周三课后','周四课后','周五课后','周五社团时段'][i]).map((x,i)=>`<div class="plan-row"><label for="slot-${i}">${x}</label><select id="slot-${i}">${Object.entries(categoryName).map(([key,label])=>`<option value="${key}" ${['study','friend','rest'][i%3]===key?'selected':''}>${label}</option>`).join('')}</select></div>`).join('')}</div><p class="modal-note">只是先写下打算。实际去做，才会改变这一周。前往不同地点不花时间。工作日结束后，周六、周日各有两段独立安排。</p><div class="modal-actions"><button class="primary-button" id="plan-confirm">写好了，去看看他们</button></div>`});
    $('#plan-confirm',m).onclick=()=>{S.plan=Array.from({length:G.total(S)},(_,i)=>i).map(i=>$(`#slot-${i}`,m).value);save();closeModal(true);render();growthDesk();};
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
    const count=studyCount(),base=count?EXTRA[(S.week-1+count-1)%EXTRA.length]:C.exercises[S.week-1];let ex=base,selected=null,mode='steady';
    const m=showModal({kicker:'桌上的错题本 · 一段学习时间',title:ex.title,body:`<p class="modal-note">${ex.hint} 每次都认真积累，同周再学不削减收益。</p><div class="study-modes" aria-label="学习强度">${Object.entries(B.modes).map(([id,v])=>`<button class="study-mode" data-study-mode="${id}" aria-pressed="${id==='steady'}" ${S.energy<v.cost?'disabled':''}><strong>${v.name}</strong><small>精力 −${v.cost} · 订正正确 +${v.gain} 积累<br>看懂讲解也有 +${v.review} · 均占一段</small></button>`).join('')}</div><p class="recovery-note">${S.remaining>1?'这段结束后会到下一次放学，期间两晚正常睡眠最多恢复 12 精力。':'这段结束后还是周五；进入周六时，一晚正常睡眠最多恢复 6 精力。'}学习计划另加 1 点积累。</p><div class="paper-work"><h3>${esc(ex.question)}</h3>${ex.steps.map((s,i)=>`<button class="math-line" data-line="${i}"><small>第 ${i+1} 行</small>${esc(s)}</button>`).join('')}</div><p id="exercise-hint" class="modal-note">用鼠标点一行，拿红笔圈出来。选错了也可以改。</p><div class="modal-actions"><button class="secondary-button" id="leave-book">先合上本子</button><button class="primary-button" id="submit-correction" disabled>圈好了，写下订正</button></div>`});
    const bindLines=()=>$$('.math-line',m).forEach(b=>b.onclick=()=>{selected=Number(b.dataset.line);$$('.math-line',m).forEach(x=>x.classList.toggle('selected',x===b));$('#submit-correction',m).disabled=false;});
    $$('[data-study-mode]',m).forEach(b=>b.onclick=()=>{mode=b.dataset.studyMode;ex=mode==='focus'?B.challenge(S.week,count):base;selected=null;$('#submit-correction',m).disabled=true;$$('[data-study-mode]',m).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('h2',m).textContent=ex.title;$('.modal',m).setAttribute('aria-label',ex.title);$('.paper-work',m).innerHTML=`<h3>${esc(ex.question)}</h3>${ex.steps.map((s,i)=>`<button class="math-line" data-line="${i}"><small>第 ${i+1} 行</small>${esc(s)}</button>`).join('')}`;$('#exercise-hint',m).textContent=ex.hint;bindLines();});bindLines();
    $('#leave-book',m).onclick=()=>closeModal();
    $('#submit-correction',m).onclick=()=>{
      const correct=selected===ex.wrong;
      const learning=B.study(mode,correct);if(S.energy<learning.cost)return;
      if(S.week===2&&S.notePromise)S.noteKept=true;
      const entry=correct?'你把一道原本会错的题，重新写对了。':'你在错题本上留下了一个红圈，后来才看懂原因。';
      spend(count?'notebook-'+(count+1):'notebook','study',{study:learning.points,energy:-learning.cost},entry,correct?'你这次没有急着往下写。\n'+ex.solution:'你圈的这一行不是最先出错的地方。\n'+ex.solution,correct?'红笔停在了这里':'再看一遍，还是有收获',`${learning.name}：学习积累 +${learning.points}，精力 −${learning.cost}。${S.week===2&&S.noteKept?'你也抄好了答应给林遥的课堂笔记。':'这页订正会影响考试，但这段时间不能再陪别人。'}`);
    };
  }
  function friend(){
    if(S.week>4){octoberFriend();return;}
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
    if(S.week>4){octoberGirl();return;}
    let lines=C.girlLines[S.week-1].join('\n'),label='坐下来，把这页笔记看完',response='你们对着同一道题看了半天。\n她在最后一行点了点：「哦，原来在这。」';
    if(S.week===2){label=S.done.includes('notebook')?'把已经订正好的课堂笔记借给她':'帮她记下画室那天的课堂内容';response=S.done.includes('notebook')?'你把这周认真整理的那页翻给她看。\n「就是这道。」她接过去，在封面贴了张写着你名字的小纸条。':'「那谢谢。」\n她在笔记本封面贴了张小纸条，写着你的名字。\n这周还要抽空去订正一次，才算真的把笔记留给她。';}
    if(S.week===3&&S.taste&&S.october.tasteShared&&S.place==='canteen'){lines=`她把餐盘往你这边推了一点。\n「${S.taste==='不吃香菜'?'这份没放香菜。':S.taste==='爱吃香菜'?'我让阿姨多加了点香菜。':'今天有你上次点的土豆。'}」\n她说完，低头继续吃自己的。`;label='接过餐盘，在她对面坐下';response='你还没说自己想吃什么。\n筷子碰到餐盘边，你忽然不知道该先说谢谢，还是先笑一下。';}
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
    function eat(together){
      if(S.week===6&&together){octoberLunch(selected);return;}
      S.taste=selected.taste;if(together)S.october.tasteShared=true;spend('lunch',together?'friend':'rest',together?{friend:1,warm:1,energy:8}:{energy:16},`你在食堂点了${selected.name}，${together?'和他们坐在一起。':'一个人慢慢吃完。'}`,together?'赵程用筷子敲了敲空位。\n「这儿。」\n你把餐盘放下，林遥顺手给你让出了放汤碗的地方。':'你挑了靠窗的角落。\n汤还烫着。你没有一边吃，一边翻明天要交的练习册。','热饭端到了桌上');}
    $('#lunch-together',m).onclick=()=>eat(true);$('#lunch-alone',m).onclick=()=>eat(false);
  }
  function family(){
    E.dialogue({title:'饭还温着',lines:linesFor(C.familyLines[S.week-1],'mother'),choices:[{id:'family-yes',text:'端着碗出去，坐下聊一会儿',note:'1 段时间 · 精力 +10 · 今晚少做一页题',value:true},{id:'family-no',text:'先放着，待会儿吃',note:'不消耗时间',value:false}]},yes=>{
      if(yes&&S.week>4){spend('mom','friend',{family:3,energy:10},'你向妈妈讲了换座位后的新日常。',S.october.seatBreak?'你只说林遥帮你对了课表。妈妈问这个名字是哪两个字，你指给她看。\n她把空碗接过去，没有接着问。':'你说新座位能看清黑板，只是水杯总忘在另一边。妈妈把洗好的杯套递给你，让你明天套上。','饭后再坐五分钟');return;}
      if(yes)spend('mom','friend',{family:3,energy:10},'你端着饭，坐到妈妈旁边，讲了学校里的事。','你说起新同桌，妈妈笑了一下。\n「赵程，是这个程啊。我刚还以为是橙子的橙。」\n她拿走空碗，又问你还要不要盛一点。','电视声又调大了一点');
      else E.dialogue({title:'门被轻轻带上',lines:[{who:'mother',text:'那你记得吃。别放到凉了。'}]});
    });
  }
  function rest(){
    const m=showModal({kicker:'今晚 · 留一点空白',title:'今晚，比平时早睡一点',body:'<p class="modal-lead">练习册没写完，消息也还有两条。\n你把明天要穿的校服搭好，手停在台灯开关上。</p><p class="modal-note">每天都会正常睡觉。今晚早点休息额外恢复 36 点精力（按休息计划再 +3），需要一段时间。考试会看你有没有学进去，也会看你是不是已经累坏了。</p><div class="modal-actions"><button class="secondary-button" id="rest-no">再想想</button><button class="primary-button" id="rest-yes">关灯，今晚到这里</button></div>'});
    $('#rest-no',m).onclick=()=>closeModal();$('#rest-yes',m).onclick=()=>spend('rest','rest',{energy:36},'有一晚，你在十一点之前关了灯。','隔壁的琴声也停了。\n醒来时，你第一次在闹钟响之前睁开了眼睛。','明天再接着过');
  }
  function phone(){
    if(S.week>=21){const f=S.year.flags;E.dialogue({title:'高二消息 · 看过不等于已赴约',lines:[{who:'zhaocheng',text:'我在隔壁班。找我先发一句，课表和上学期不一样了。'},{who:'mother',text:S.week===23?(f.fatherCall23?'你们刚才聊过了。下次有空再问时间，不用每天守着电话。':'你爸说周末有空可以好好讲一会儿。具体哪天，在周末安排里定。'):'周三和周五我晚班。晚饭吃什么、回不回来，提前说一声。'},{who:'narrator',text:`零用钱 ${S.weekend.wallet} 元。${S.year.loan>S.year.loanPaid?'阿哲尚有 '+(S.year.loan-S.year.loanPaid)+' 元借款未结。':'这周的具体安排仍要真正留出时间。'}`} ]});return;}

    if(S.week>=7){const f=S.year.flags;E.dialogue({title:'本周消息 · 不占额外时间',lines:[{who:'zhaocheng',text:S.week===7?(S.october.sportsPhoto?'摄影给你留了整段，记得在教室或操场找我确认。':'运动会按你自己的安排来。想拍照也要真留时间。'):S.week===15?'纸店和试讲都在周日，各要两段。别两边都答应。':S.week===19?'报名以后还得准备，周六见。':C.weeks[S.week-1].diary},{who:'narrator',text:`零用钱 ${S.weekend.wallet} 元。${S.year.loan>S.year.loanPaid?'阿哲尚有 '+(S.year.loan-S.year.loanPaid)+' 元借款未结。':'本周的具体安排可以到手记和周末日历里看。'}`}]});return;}
    if(S.week>4){octoberPhone();return;}
    const promise=S.promise==='yes'?(S.promiseKept?'赵程：班旗挂上去了！明天给你看。':S.week<=2?'赵程：颜料我带。你人来就行。':'赵程：没事，后来阿哲帮我弄完了。'):'赵程：班群文件里有月考安排。';
    const girlMessage=S.week>=3&&S.taste?'林遥：你上次点的菜，明天应该也有。':'林遥：笔记看完放我桌上就好。';
    const m=showModal({kicker:'手机 · 看消息不花时间',title:'屏幕亮了一下',body:`<div class="receipt">${esc(promise)}<br><br>${esc(girlMessage)}<br><br>妈妈：饭在锅里。凉了叫我。</div><p class="modal-note">看消息可以知道别人正在忙什么。兑现约定，需要在相应场景里真正留出时间。</p><div class="modal-actions"><button class="primary-button" id="phone-close">把手机倒扣回去</button></div>`});
    $('#phone-close',m).onclick=()=>closeModal();
  }
  function beginWeekend(){
    clearTimeout(toastTimer);$('#toast').hidden=true;
    W.begin(S);weekendFilter='全部';save();render();
    if(S.weekend.current.finished)diary();
  }
  function renderWeekend(){
    const c=S.weekend.current,day=c.day?'周日':'周六';
    const mood=S.week>=7?C.weeks[S.week-1].diary:['刚认得几个名字，周末可以先从一句招呼开始。','班旗要交了，答应过的事还夹在本子里。','有些人记住了你的口味，有些路开始走得熟了。','月考就在眼前，复习和休息都要占真实的时间。','换过座位，也可以在放学以后重新找一条同行的路。','运动会快到了，准备工作和今天的生活要分开安排。'][S.week-1];
    $('#date-label').textContent=day+' · '+(c.remaining===2?'还有一整天':c.remaining===1?'还剩一段空闲':'天慢慢暗下来');
    const events=W.catalog(S).filter(e=>e.day===null||e.day===c.day),tags=['全部',...new Set(events.map(e=>e.tag))];
    if(!tags.includes(weekendFilter))weekendFilter='全部';
    const visible=events.filter(e=>weekendFilter==='全部'||e.tag===weekendFilter).sort((a,b)=>Number(Boolean(W.availability(S,a)))-Number(Boolean(W.availability(S,b))));
    const panel=$('#weekend-screen');panel.innerHTML=`<header class="weekend-heading"><div><span class="weekend-kicker">工作日之外 · 第 ${S.week} 周</span><h2>${day}，把日子过具体一点</h2><p>${esc(mood)}<br>周六 ${c.day?'已经过去':'正在这里'} · 周日 ${c.day?'正在这里':'还没到'}</p></div><div class="weekend-stats"><span>空闲 ${c.remaining} / 2 段</span><span>精力 ${S.energy} / 100</span><span>零用钱 ${S.weekend.wallet} 元</span></div></header><nav class="weekend-tabs" aria-label="周末活动类别">${tags.map(tag=>`<button data-weekend-filter="${esc(tag)}" class="${weekendFilter===tag?'selected':''}" aria-pressed="${weekendFilter===tag}">${esc(tag)}</button>`).join('')}<small>一件或两件就够了 · 全天安排占两段 · 同项每周一次</small></nav><div class="weekend-events">${visible.map(e=>{const reason=W.availability(S,e),done=c.days.flat().includes(e.id);return `<button class="weekend-card ${done?'done':''}" data-weekend-act="${e.id}" ${reason?'disabled':''}><small>${e.tag} · ${e.cost===2?'完整一天':'一段空闲'}${e.mini?' · 投篮互动':''}</small><strong>${esc(e.title)}</strong><p>${esc(e.desc)}</p><em>${reason?esc(reason):`精力 ${e.energy>=0?'+':''}${e.energy}${e.money?' · 零用钱 '+(e.money>0?'+':'')+e.money+' 元':''}`}</em></button>`;}).join('')}</div><footer class="weekend-footer"><div><button class="secondary-button" id="weekend-pocket">口袋里的东西 ${S.weekend.unlocks.length?'· '+S.weekend.unlocks.length:''}</button><button class="secondary-button" id="weekend-overview">看看这两天</button>${S.weekend.unlocks.includes('firstPay')?'<button class="secondary-button" id="weekend-wallet">零钱小账</button>':''}</div><button class="primary-button" id="weekend-end-day">${c.remaining===2?'今天不再出门，留白也可以':c.remaining===1?'只做这一件，留点空白':`收好${day}的安排`} ${c.day?'→ 写这一周':'→ 到周日'}</button></footer>`;
    $$('[data-weekend-filter]',panel).forEach(b=>b.onclick=()=>{weekendFilter=b.dataset.weekendFilter;renderWeekend();$(`[data-weekend-filter="${weekendFilter}"]`,panel)?.focus();});
    $$('[data-weekend-act]',panel).forEach(b=>b.onclick=()=>weekendActivity(b.dataset.weekendAct));
    $('#weekend-end-day',panel).onclick=finishWeekendDay;$('#weekend-pocket',panel).onclick=weekendPocket;$('#weekend-overview',panel).onclick=weekendOverview;
    if($('#weekend-wallet',panel))$('#weekend-wallet',panel).onclick=weekendWallet;
  }
  function weekendActivity(id){
    if(screens.length||E.busy||!W.active(S))return;
    const event=W.catalog(S).find(x=>x.id===id);if(!event)return;const reason=W.availability(S,event);if(reason){toast(reason);return;}
    E.dialogue({title:event.title,scene:event.scene,lines:event.lines,choices:[...event.choices.map(o=>({id:'weekend-choice-'+o.key,text:o.text,note:o.note||`${event.cost} 段时间 · 精力 ${event.energy>=0?'+':''}${event.energy}${event.money?' · 零用钱 '+(event.money>0?'+':'')+event.money+' 元':''}`,value:o.key})),{id:'weekend-cancel',text:'今天先不安排这件事',note:'返回周末，不消耗时间、精力或钱',value:'leave'}]},key=>{
      if(key==='leave')return;
      const finish=result=>{
        if(event.mini&&result===null){toast('球还放在场边。时间和精力都没有扣。');return;}
        const outcome=W.commit(S,id,key,result);if(!outcome.ok){toast(outcome.reason);return;}
        save();render();weekendOutcome();
      };
      if(event.mini)E.basketball({assist:S.weekend.unlocks.includes('courtSignal')},finish);else finish(null);
    });
  }
  function weekendOutcome(){
    const pending=S.weekend.current.pending;if(!pending||E.busy)return;
    E.dialogue(pending,()=>{S.weekend.current.pending=null;save();render();if(pending.newUnlocks?.length)toast('口袋里，多了一件能随时翻看的东西。');if(pending.cg)playCG(pending.cg);});
  }
  function finishWeekendDay(){
    if(screens.length||E.busy||!W.active(S))return;
    const c=S.weekend.current,day=c.day?'周日':'周六',events=W.catalog(S),names=c.days[c.day].map(id=>events.find(e=>e.id===id)?.title||id);
    const m=showModal({kicker:day+' · 暮色慢慢落下',title:names.length?'今天就先做到这里？':'今天留给自己，也可以',body:`<p class="modal-lead">${names.length?esc(names.join('，'))+'。':'今天没有约人出门。'}</p><p class="modal-note">${c.remaining?`剩下 ${c.remaining} 段留白，恢复 ${c.remaining*3} 精力。`: '今天两段时间已经用完。'}${c.day?'接下来写周记。翻到下周一时，正常睡眠再恢复最多 6 精力。':'一晚正常睡眠还会恢复最多 6 精力。周日会有另一批安排，周六的事不再重来。'}</p><div class="modal-actions"><button class="secondary-button" id="weekend-stay">再看看今天</button><button class="primary-button" id="weekend-day-confirm">${c.day?'收好周日，写下这一周':'收好周六，迎接周日'}</button></div>`});
    $('#weekend-stay',m).onclick=()=>closeModal();$('#weekend-day-confirm',m).onclick=()=>{if(!W.finishDay(S))return;closeModal(true);weekendFilter='全部';save();render();if(S.weekend.current.finished)diary();};
  }
  function weekendOverview(){
    const c=S.weekend.current,events=W.catalog(S);
    const m=showModal({kicker:'周末 · 两页日历',title:'不必每一格都填满',body:`${['周六','周日'].map((day,i)=>`<h3>${day}${i===c.day?' · 现在':''}</h3><p class="weekend-history">${c.days[i].length?c.days[i].map(id=>esc(events.find(e=>e.id===id)?.title||id)).join('<br>'):i>c.day?'还没有到，不用急着决定。':'还没有安排事情。'}</p>`).join('')}<p class="modal-note">每天最多两段，全天事件占两段。未选的事件也会照常发生；不会因为别的路线想做，就让今天重新来一次。</p><button class="primary-button" id="weekend-close">合上日历</button>`});
    $('#weekend-close',m).onclick=()=>closeModal();
  }
  function weekendWallet(){
    const w=S.weekend,m=showModal({kicker:'零用钱 · 有来处，也有去处',title:`还攒着 ${w.wallet} 元`,body:`<div class="weekend-ledger">${w.ledger.length?w.ledger.map(x=>`<p><span>第 ${x.week} 周 · ${esc(x.text)}</span><strong>${x.amount>=0?'+':''}${x.amount} 元</strong></p>`).join(''):'<p>还没有收支。没有钱，也能陪人打球、吃饭、一起走。</p>'}</div><p class="modal-note">零用钱不能换来别人必须喜欢你，也不能买回已经过去的周末。</p>`});
  }
  function weekendPocket(){
    const labels={courtSignal:['接球暗号','以后打球，可以点一次暗号，让这一球的落点区放宽。'],littleBird:['夹页里的小鸟','一起走回家以后，你把那张纸放到了随时能翻开的地方。'],firstPay:['第一笔零用钱','能重新打开零钱小账，看看每笔钱的来处。'],futureLetter:['写给自己的信','今天的字不用等到毕业，想看时也可以再读一遍。'],photoMargin:['照片边上的留白','给总在镜头后面的人，也留下一点位置。']};
    const m=showModal({kicker:'口袋里的东西 · 看一眼不花时间',title:'不是奖杯，是用过的日子',body:`<div class="weekend-keepsakes">${S.weekend.unlocks.length?S.weekend.unlocks.map(id=>`<button class="weekend-keepsake" data-keepsake="${id}"><strong>${labels[id][0]}</strong><small>${labels[id][1]}</small></button>`).join(''):'<p class="modal-lead">现在还没有特别收好的东西。去过日子就好，不必为了凑齐而选择。</p>'}</div>`});
    $$('[data-keepsake]',m).forEach(b=>b.onclick=()=>{
      const id=b.dataset.keepsake;
      if(id==='firstPay'){weekendWallet();return;}
      if(id==='littleBird'){E.cg({scene:'drawing-margin-cg',title:'夹页里的小鸟',text:'饭勺一样的小鸟，还画在纸角。\n你知道是谁笑着把它递给你的。',period:'十月',duration:3});return;}
      const text=id==='futureLetter'?(S.weekend.letters?.at(-1)?.text||'你给自己留过一封信。那时，承认疲惫也不是一件容易的事。'):id==='courtSignal'?'赵程抬手时，先看他是不是已经站稳。你们打过不止一场球，开始知道对方什么时候在等。':'你在照片背面留了一块空白，给赵程写日期。他说别把星期几也写错了。';
      E.dialogue({title:labels[id][0],lines:[W.line('pocket.'+id,'narrator',text)]});
    });
  }
  function weekIntro(){
    const w=C.weeks[S.week-1];
    const m=showModal({kicker:w.date,title:w.name,closable:false,body:`<p class="modal-lead">${esc(w.intro)}</p><div class="receipt">${esc(G.calendar(S).title)} · 本周 ${G.total(S)} 段自由安排。${G.ensure(S).reports.at(-1)?.week===S.week-1?'刚发下的成绩单：班级第 '+G.ensure(S).reports.at(-1).rank+' 名。可在成长手册查看全班六科成绩。':''}</div><div class="modal-actions"><button class="primary-button" id="week-start">翻开这一周</button></div>`});
    $('#week-start',m).onclick=()=>{closeModal(true);openPlan(true);};
  }
  function examMoment(){
    const g=G.ensure(S);const m=showModal({title:'试卷发下来之前',kicker:'阶段考试 · 考前十分钟',closable:false,body:'<p>教室比平时安静。有人还在翻书，有人已经把笔排好。你想怎样用最后这十分钟？</p><div class="school-answers"><button data-exam="calm">收好书，呼吸放缓 · 压力 −8</button><button data-exam="review">只看最不熟的一处 · 当前科目掌握 +2，压力 +3</button><button data-exam="plan">先规划答题顺序 · 压力 −3，理解力 +0.3</button></div><p class="modal-note">属于考试本身，不占课余时间。只结算一次，最终分数仍由整个阶段的积累决定。</p>'});
    $$('[data-exam]',m).forEach(b=>b.onclick=()=>{const v=b.dataset.exam;if(!G.schoolCommit(S,'examPrep',v==='calm'?{stress:-8}:v==='review'?{mastery:2,stress:3}:{stress:-3,aptitude:.3}))return;memory('考前十分钟，你选择了'+({calm:'让呼吸慢下来。',review:'只复习一处不熟的知识点。',plan:'规划答题顺序。'})[v],'考试');save();closeModal(true);finishWeek();});
  }
  function finishWeek(){
    if(screens.length||E.busy)return;
    if(G.examWeek(S.week)&&!G.ensure(S).schoolDone.includes('examPrep')){examMoment();return;}
    if(W.active(S)){finishWeekendDay();return;}
    if(S.weekend.current.finished){diary();return;}
    activeSpeaker=null;if(S.remaining>0){
      const m=showModal({kicker:'还没到周末',title:`还有 ${S.remaining} 段时间，留空吗？`,body:'<p class="modal-lead">你可以去别的地方看看。\n也可以什么都不安排，让这几天安静地过去。</p><div class="modal-actions"><button class="secondary-button" id="keep-week">回去看看</button><button class="primary-button" id="skip-time">留空，开始过周末</button></div>'});
      $('#keep-week',m).onclick=()=>closeModal();$('#skip-time',m).onclick=()=>{closeModal();B.leaveWeekdays(S);S.energy=Math.min(100,S.energy+S.remaining*3);S.remaining=0;save();render();beginWeekend();};
    }else beginWeekend();
  }
  function diary(){
    const entries=S.memories.filter(x=>x.week===S.week),w=C.weeks[S.week-1];
    const text=entries.length?entries.slice(-4).map(x=>x.text).join('\n'):'这周没安排什么特别的事。日子也照样过去了。';
    const m=showModal({kicker:`${w.date}这一周 · 周日晚上`,title:'这一页，先写到这里',closable:false,body:`<p class="handwritten">${esc(text)}</p><div class="receipt">${esc(w.diary)}</div><p class="recovery-note">收好手记，经过一晚正常睡眠，到下周一再恢复最多 6 精力。不需要额外选择休息。</p><div class="modal-actions"><button class="primary-button" id="next-week">${S.week===4?'收起手记，去考试':S.week===20?'收好高一的最后一页':'翻到下一周'}</button></div>`});
    $('#next-week',m).onclick=()=>{
      const previousWeek=S.week,notes=Y1.settle(S);G.settle(S);notes.forEach(x=>memory(x,'学年回响'));
      B.sleep(S,'sun-mon',1);S.diaries=S.diaries.filter(x=>x.week!==S.week);S.diaries.push({week:S.week,text});closeModal(true);
      if(S.week===4||S.week===20||S.week===C.weeks.length){if(S.week===4)S.october.exam={rank:rank(),oldSeat:S.seat,energy:S.energy};S.ended=true;save();render();showEnding();return;}
      S.week++;S.weekend.current=W.fresh(S.week);S.remaining=3;S.plan=null;S.done=[];S.place='classroom';save();render();
      if(previousWeek===10){const exam=S.year.exams.find(x=>x.week===10);E.dialogue({title:'期末之后 · 寒假慢慢过去',lines:[{who:'teacher',text:`这次期末班级第 ${exam.rank}/44。卷子发回去，先看自己真正会了什么，不用替别人排三年的座位。`},{who:'narrator',text:'你们收好意向表。学校还会再次确认，今天交的不是不可更改的判决。'},{who:'mother',text:'假期别光等开学。鞋合不合脚，出去走走就知道。'},{who:'narrator',text:'普通教学周和大半个假期翻过去。再打开这一页，已经是寒假尾声。'}]},weekIntro);return;}
      if(previousWeek===19&&notes.length){E.dialogue({title:'校内交流 · 准备之后的结果',lines:notes.map(text=>({who:'teacher',text}))},weekIntro);return;}
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

  function enterOctober(){
    if(S.week!==4||!S.ended)return;
    B.sleep(S,'sun-mon',1);
    S.october.exam={rank:rank(),oldSeat:S.seat,energy:S.energy};
    S.october.introPending=true;S.seat=S.october.exam.rank-1;
    S.week=5;S.weekend.current=W.fresh(5);S.remaining=3;S.plan=null;S.done=[];S.ended=false;S.place='classroom';
    memory('月考后，你把书搬到新的座位。九月经历过的事没有清空。','新座位');
    clearModals();save();render();octoberArrival();
  }
  function octoberArrival(){
    E.dialogue({title:'月考之后 · 重新找座位',lines:O.arrival(S)},()=>{S.october.introPending=false;save();weekIntro();});
  }
  function octoberScene(id,flags,entry,lines,cg=null){
    return spend(id,'friend',id==='girl'?{warm:3,energy:0}:{friend:3,energy:0},entry,'','',
      '留下这一段时间 · 精力 −12',()=>{
        const show=()=>E.dialogue({title:id==='girl'?'十月 · 林遥':'十月 · 运动会之前',lines});
        if(cg)playCG(cg,show);else show();
      },flags);
  }
  function octoberGirl(){
    if(S.week===5){
      E.dialogue({title:'十月 · 隔着过道',lines:O.seat(S),choices:[
        {id:'oct-closer',text:'坐一会儿。想和她再熟一点',note:'1 段时间 · 精力 −12 · 向她靠近，还没有确认恋爱',value:'closer'},
        {id:'oct-friends',text:'坐下对课表，和她当朋友',note:'1 段时间 · 精力 −12 · 保留普通朋友的相处',value:'friends'},
        {id:'oct-leave',text:'这次先回去整理书',note:'不消耗时间或精力，以后还能来',value:'leave'}
      ]},mode=>{
        if(mode==='leave'){E.dialogue({title:'先把书放好',lines:[{who:'linyao',text:'嗯，快上课了。下课再说。'}]});return;}
        octoberScene('girl',{mode,seatBreak:true},mode==='closer'?'林遥把书包抱起来。你说以后下课还想过来坐，她笑着说看见你就拿开。':'你和林遥坐在一块儿，对了一遍新的课表。',O.seatAfter(mode),'savedSeat');
      });return;
    }
    const work=()=>E.dialogue({title:'十月 · 海报的边角',lines:O.poster(S),choices:[
      {id:'oct-poster-yes',text:'帮她按住纸角，把这点画完',note:'1 段时间 · 精力 −12 · 原本想做的事要往后排',value:true},
      {id:'oct-poster-no',text:'先说清楚：这段时间我已经有安排了',note:'不消耗时间，不算失约',value:false}
    ]},yes=>{
      if(!yes){E.dialogue({title:'她换了个压纸的方法',lines:[{who:'linyao',text:'好，那我先拿本书压着。你去忙吧。'}]});return;}
      octoberScene('girl',{poster:true},S.october.mode==='closer'?'你帮林遥按住海报纸角。那只像饭勺的小鸟，她折好留给了你。':'你帮林遥补完海报边线，一起笑了那只没画好的小鸟。',O.posterAfter(S),'drawingMargin');
    });
    if(S.october.mode!=='undecided'){work();return;}
    E.dialogue({title:'十月 · 想怎样慢慢认识',lines:[{who:'narrator',text:'这几周你们各忙各的。今天经过林遥桌边，她正为一张翘角的纸发愁。'}],choices:[
      {id:'oct-closer',text:'想多了解她一点，再过去问问',note:'只是你的靠近意愿，不代表双方已经交往',value:'closer'},
      {id:'oct-friends',text:'以朋友的身份，过去看看',note:'普通朋友也有完整的相处片段',value:'friends'},
      {id:'oct-leave',text:'先去做自己的事',note:'离开，不消耗时间',value:'leave'}
    ]},mode=>{if(mode==='leave')return;S.october.mode=mode;save();work();});
  }
  function octoberFriend(){
    const w=S.week;
    E.dialogue({title:w===5?'十月 · 先问清时间':'十月 · 认识阿哲',lines:O.friend(S),choices:w===5?[
      {id:'oct-friend-yes',text:'坐下来听听他的拍摄打算',note:'1 段时间 · 精力 −12 · 尚不承诺下周摄影',value:'listen'},
      {id:'oct-friend-no',text:'今天先不聊，等通知出来',note:'不消耗时间',value:'leave'}
    ]:[
      {id:'oct-photo-yes',text:'一起试机位，并接下下周摄影',note:'本周 1 段 / 精力 −12 · 下周还需完整 1 段',value:'photo'},
      {id:'oct-photo-chat',text:'一起试机位，但先不接下周的工作',note:'本周 1 段 / 精力 −12 · 不把含糊的话当成约定',value:'chat'},
      {id:'oct-friend-no',text:'先回去，今天有别的安排',note:'不消耗时间，也没有答应摄影',value:'leave'}
    ]},choice=>{
      if(choice==='leave')return;
      octoberScene('friend',w===6?{metAzhe:true,sportsPhoto:choice==='photo'}:{},w===5?'你和赵程聊了运动会的拍摄安排，约好等报名表出来再决定。':choice==='photo'?'你认识了阿哲，也接下了下一周一整段的摄影工作。':'你和赵程、阿哲试了拍摄机位。这次明确说了不承诺下周摄影。',[
        {who:'zhaocheng',mood:'smile',text:w===5?'那我不先给你报。等看完时间表再说。':choice==='photo'?'好，我把你名字写上。下周先到看台这边找我。':'明白，那我再问问别人。试架子还是谢谢你了。'},
        {who:'narrator',text:w===5?'你们把草稿翻过来，画了两张看台位置图。赵程画的人比相机还矮。':'阿哲把卡扣拧紧，把剩下的胶带递给你。你记住了他的名字，也记住了怎么把架子收回去。'}
      ]);
    });
  }
  function octoberLunch(selected){
    const previous=S.taste;
    const lines=O.lunch(S,previous);
    S.taste=selected.taste;
    spend('lunch','friend',{friend:1,warm:1,energy:8},`你在食堂点了${selected.name}，和林遥坐在窗边吃午饭。`,'','',
      '这一顿饭已使用 1 段时间，恢复 8 精力。接不接牛奶，不额外改变关系。',()=>{
        E.dialogue({title:'十月 · 午饭还有一点温',lines,choices:[
          {id:'oct-milk-yes',text:'接过来，谢谢她',note:'没有额外消耗 · 下次有空再轮到你带',value:true},
          {id:'oct-milk-no',text:'今天不喝，一起坐会儿就好',note:'不降低关系，不会算作失约',value:false}
        ]},yes=>{
          if(yes){S.october.milk=true;memory(S.october.mode==='closer'?'林遥留了一盒温牛奶。她说下次先到的人，可以占两个位置。':'林遥递了一盒温牛奶。你说下次也给赵程带一个。','午间');save();}
          const after=()=>E.dialogue({title:'十月 · 窗边的午饭',lines:O.milkAfter(S,yes)});
          if(yes)playCG('warmCarton',after);else after();
        });
      },{tasteShared:true});
  }
  function octoberPhone(){
    const z=S.week===5?'赵程：名单出来再决定，我没先替你报名。':S.october.sportsPhoto?'赵程：下周摄影写你了。完整那一段，别忘。':'赵程：摄影我再问问别人。你要来玩也可以。';
    const l=S.october.mode==='closer'&&S.october.poster?'林遥：刚才那张小鸟，真的别给赵程看。':S.october.seatBreak?'林遥：周四交英语，不是周三。我刚又看了一遍。':'班群：运动会报名时间在后门的通知上。';
    const m=showModal({kicker:'十月 · 看消息不花时间',title:'屏幕亮了一下',body:`<div class="receipt">${esc(z)}<br><br>${esc(l)}<br><br>妈妈：放学回来先吃饭，书包别放门口。</div><div class="modal-actions"><button class="primary-button" id="phone-close">把手机收好</button></div>`});
    $('#phone-close',m).onclick=()=>closeModal();
  }
  function showOctoberEnding(){
    const sweet=S.october.mode==='closer';
    const items=[['savedSeat',S.october.seatBreak],['drawingMargin',S.october.poster],['warmCarton',S.october.milk]].filter(([,seen])=>seen);
    const moments=items.length?items.map(([id])=>`<div class="polaroid"><img src="assets/${CGS[id].scene}.jpg" alt="${esc(CGS[id].title)}"><p>${esc(CGS[id].title)}</p></div>`).join(''):'<p class="modal-note">这两周的时间留给了别的生活。它们一样记在手记里。</p>';
    const m=showModal({kicker:'第二章 · 运动会前的旧存档',title:sweet&&items.length?'下课以后，可以再坐一会儿':'十月，也慢慢有了熟悉的日常',wide:true,closable:false,body:`<div class="photo-strip">${moments}</div><p class="modal-lead">${sweet&&S.october.poster?'书包里那张小鸟没有名字。你还是知道该还给谁。':S.october.seatBreak?'你走到过道那边，已经不用先想一句开场白。':'这一周结束，你合上练习册，准备回家。'}</p><div class="receipt">${S.october.sportsPhoto?'已接下下周运动会摄影，后续需要真正留出一整段时间。':'没有接下运动会摄影工作。之后可以继续选择自己的安排。'}</div><p class="modal-note">高一后续已经开放，可以继续到第二十个关键周。你和林遥${sweet?'正在慢慢靠近，还没有确认恋爱':'仍是同学或朋友'}。运动会当天将接回已答应的摄影工作，之后有期末、寒假和整个高一下学期。</p><div class="modal-actions">${!S.weekend.current.started?'<button class="primary-button" id="oct-weekend">补完这个周末 · 保留六周进度</button>':'<button class="primary-button" id="year-continue">继续高一 · 从运动会当天开始 →</button>'}<button class="secondary-button" id="oct-journal">看看这段时间的手记</button><button class="secondary-button" id="oct-gallery">重看新 CG</button><button class="secondary-button" id="oct-export">导出进度</button><button class="primary-button" id="oct-title">先把书包放好</button></div>`});
    if($('#year-continue',m))$('#year-continue',m).onclick=enterYear;
    if($('#oct-weekend',m))$('#oct-weekend',m).onclick=()=>{try{localStorage.setItem(KEY+'-before-weekend-v11',JSON.stringify(S));}catch{}clearModals();S.ended=false;beginWeekend();};
    addReportButton(m);$('.modal',m).classList.add('ending');$('#oct-journal',m).onclick=journal;$('#oct-gallery',m).onclick=cgGallery;$('#oct-export',m).onclick=exportSave;
    $('#oct-title',m).onclick=returnTitle;
  }

  function yearStory(id){
    const raw=['girl','girl-canteen'].includes(id)&&G.guarded(S)?slowGirl(id):CF.isCanteen(id)?CF.scene(S,id):id==='pursuer'?Y1.bonus(S):Y1.weekday(S,id),event=CF.isCanteen(id)?raw:CF.decorate(S,raw);if(!event)return;
    if(S.energy<event.cost){result('先留一点余力',`这一段需要 ${event.cost} 点精力。可以吃饭、休息，或换一个安排。`);return;}
    if(id==='girl'&&!G.guarded(S)&&S.october.mode==='undecided')event.choices.push({key:'closer-v16',text:'告诉她：想慢慢多了解你，先继续相处',effects:{},flags:{},route:'closer',after:[['linyao','我也想再了解你一点。但我们慢慢来，好吗？'],['narrator','你们没有马上给关系下结论。下一次见面，仍需要先问时间。']]});
    const choices=event.choices.map(c=>({id:'year-choice-'+c.key,text:c.text,note:Y1.available(S,event,c)||`一段工作日时间 · 精力 ${event.cost?'−'+event.cost:'+10'}${c.money?' · 零用钱 '+c.money+' 元':''}${c.repay?' · 原额还款 +'+c.repay+' 元':''}`,value:c.key}));
    choices.push({id:'year-leave',text:'先不安排，回去看看',note:'不消耗时间、精力和钱',value:'leave'});
    const scene=S.week>=21&&S.place==='classroom'?'year-newclass-v15':CF.isCanteen(id)?'canteen':id==='mom'?'home':id==='pursuer'?'year-visitor':S.week===7||id==='girl'&&[10,14,20].includes(S.week)?'track':S.place;
    E.dialogue({title:event.title,scene,lines:Y1.lines(event,event.lines),choices},key=>{
      if(key==='leave')return;const option=event.choices.find(x=>x.key===key);if(!option)return;
      const reason=Y1.available(S,event,option);if(reason){result('先看看自己能承担多少',reason,null,'没有消耗时间或精力，可重新打开对话选择其他回应。');return;}
      if(S.done.includes(id)||S.remaining<=0||S.energy<event.cost)return;
      Y1.apply(S,event,option);
      const effects={...(event.effects||(id==='girl'?(Y1.sweet(S)?{warm:3}:{friend:2}):{friend:3})),...option.effects};
      effects.energy=(effects.energy||0)-event.cost;
      const entry=option.entry||`你在「${event.title}」选择了：${option.text}。${option.after.at(-1)?.[1]||''}`;
      // The chapter's cost is authoritative; family talk recovers energy instead.
      const previous=COST[id];COST[id]=event.cost;
      const committed=spend(id,event.category,effects,entry,'',event.title,'',()=>{
        const show=()=>E.dialogue({title:event.title,scene,lines:Y1.lines({...event,id:event.id+'.'+option.key},option.after),detail:`使用一段时间 · 当前精力 ${S.energy} / 100`});
        if(option.cg)playCG(option.cg,show);else show();
      });
      if(previous===undefined)delete COST[id];else COST[id]=previous;
      if(committed)save();
    });
  }
  function enterYear(){
    if(S.week!==6||!S.ended)return;
    try{if(!localStorage.getItem(KEY+'-before-year-v13'))localStorage.setItem(KEY+'-before-year-v13',JSON.stringify(S));}catch{}
    clearModals();B.sleep(S,'sun-mon',1);S.week=7;S.remaining=3;S.done=[];S.plan=null;S.ended=false;S.place='classroom';S.weekend.current=W.fresh(7);S.year=Y1.normalize(S.year,S);save();render();weekIntro();
  }
  function showYearEnding(){
    const rows=Y1.recap(S),exams=S.year.exams;
    const m=showModal({kicker:'高一 · 二十个关键周之后',title:'下一间教室见',wide:true,closable:false,body:`<div class="photo-strip"><div class="polaroid"><img src="assets/year-summer.jpg" alt="高一最后一天的空教室"><p>把高一收进书包</p></div></div><div class="year-recap">${rows.map(x=>`<p>${esc(x)}</p>`).join('')}</div><div class="receipt">${exams.map(x=>`${x.week===10?'高一上':'高一下'}期末：第 ${x.rank}/44`).join(' · ')}<br>排名按对应学段的学习积累和精力记录。它影响座位，不替你决定三年的价值。</div><p class="handwritten">分班名单还没贴出来。<br>暑假有消息，可以自己先发一句。</p><p class="modal-note">可以接着进入高二开篇 W21—W23。保留现有存档、借款、约定和关系边界；林遥搬家、关系确认与之后的人生结局尚未制作。</p><div class="modal-actions"><button class="primary-button" id="second-year-continue">继续高二 · 看分班名单</button><button class="secondary-button" id="year-journal">翻看这一年的手记</button><button class="secondary-button" id="year-gallery">重看走过的画面</button><button class="secondary-button" id="year-export">导出高一进度</button><button class="secondary-button" id="year-title">回到主界面</button></div>`});
    addReportButton(m);$('#second-year-continue',m).onclick=enterSecondYear;$('#year-journal',m).onclick=journal;$('#year-gallery',m).onclick=cgGallery;$('#year-export',m).onclick=exportSave;$('#year-title',m).onclick=returnTitle;
  }
  function rank(){if(G.ensure(S).reports.some(x=>x.week===S.week))return G.ensure(S).reports.find(x=>x.week===S.week).rank;return S.week===4&&S.ended&&S.october.exam?S.october.exam.rank:B.rank(S.study,S.energy);}
  function enterSecondYear(){
    if(S.week!==20||!S.ended)return;
    try{if(!localStorage.getItem(KEY+'-before-year-v15'))localStorage.setItem(KEY+'-before-year-v15',JSON.stringify(S));}catch{}
    clearModals();B.sleep(S,'sun-mon',1);S.week=21;S.remaining=3;S.done=[];S.plan=null;S.ended=false;S.place='classroom';S.weekend.current=W.fresh(21);
    const exam=S.year.exams.find(x=>x.week===20);if(exam)S.seat=exam.rank-1;
    save();render();playCG('newClass',weekIntro);
  }
  function showSecondYearEnding(){
    const f=S.year.flags;
    const m=showModal({kicker:'高二开篇 · W21—W23',title:'电话挂断以后',closable:false,body:`<p class="handwritten">${f.fatherCall23?(f.callTopic23==='school'?'挂电话前，父亲又问了一遍你没讲完的那道题。你说，下回把本子拿近一点。':'你把刚记下的站名放在电话旁。下次问路，不用再从头拼那个字。'):'父亲发来晚饭的照片。没接通的那段话，留到下次再问时间。'}</p><div class="year-recap"><p>${f.zhouMet?'你认识了新同桌周砚。方法可以不同，本子要按时归还。':'新同桌仍有自己的学习安排。还没聊过的，不补成共同经历。'}</p><p>${f.dinner22?'那顿晚饭按实际需要准备了份数。':'妈妈继续按排班工作，没安排过的晚饭不记成已经做过。'}</p><p>林遥仍是${Y1.sweet(S)?'正在靠近的朋友，双方尚未确认恋爱':'同学或朋友'}。旧同学在隔壁班，见面要重新对时间。</p></div><p class="modal-note">本版可玩到 W23。W24 告知搬家、W25 搬走、W26 双方确认关系和三年结局尚未制作。存档已保留，后续从这里继续。</p><div class="modal-actions"><button class="primary-button" id="second-journal">翻看手记</button><button class="secondary-button" id="second-export">导出进度</button><button class="secondary-button" id="second-title">回到主界面</button></div>`});
    addReportButton(m);$('#second-journal',m).onclick=journal;$('#second-export',m).onclick=exportSave;$('#second-title',m).onclick=returnTitle;
  }
  function showEnding(){
    if(S.week>=21){showSecondYearEnding();return;}
    if(S.week===20){showYearEnding();return;}
    if(S.week>4){showOctoberEnding();return;}
    const r=rank(),row=Math.ceil(r/6),oldRow=Math.floor(S.seat/6)+1;
    let title='九月，你开始有了自己的生活',line='你还没有和谁特别熟。可是下次走进教室，已经知道该往哪里看。';
    if(S.promiseKept){title='有人把空位留给了你';line='换座位那天，赵程隔着两排桌子晃了晃手里的颜料盒。你知道他在叫你。';}
    else if(S.study>=10){title='你的名字，往前挪了几格';line='卷子发下来，你先看了一眼自己订正过的那道题。这回，你没有写错。';}
    else if(S.family>=6){title='回家以后，也有人等着听';line='妈妈已经能叫出赵程的名字。吃饭的时候，她问你：后来那张班旗呢？';}
    else if(S.warm>=7){title='她记得你坐在哪里';line='教室重新排了座位。林遥还笔记的时候，绕了半间教室，还是走到了你桌边。';}
    const cost=S.study<5?'这一个月，你给学习留的时间不多。卷子上还有几处不会。':S.friend<3?'你把不少时间留给了题目。赵程说的几个笑话，你后来才听别人讲。':S.family<3?'你在学校里认识了更多人。回家之后，却没怎么坐下来讲给妈妈听。':'你给几件在意的事留了时间，也还是有没做完的题。';
    const m=showModal({kicker:'第一章试玩 · 九月的最后一天',title,wide:true,closable:false,body:`<div class="photo-strip"><div class="polaroid"><img src="assets/classroom.jpg" alt="九月的教室"><p>${S.promiseKept?'一起留下的放学后':'你坐过的教室'}</p></div><div class="polaroid"><img src="assets/canteen.jpg" alt="食堂里的餐盘"><p>${S.taste?`记得你${esc(S.taste)}`:'午间的食堂'}</p></div><div class="polaroid"><img src="assets/home.jpg" alt="家里的灯"><p>${S.family>0?'门外那碗热饭':'台灯亮着的晚上'}</p></div></div><p class="modal-lead">${esc(line)}</p><div class="stat-line"><span>第一次月考 · 班级排名</span><strong class="exam-number">${r}<small>/ 44</small></strong></div><p class="modal-note">原来坐在第 ${oldRow} 排，月考后按成绩安排在第 ${row} 排。${S.energy<35?'这次精力不足，也影响了发挥。':'卷子上，有你这一个月留下的痕迹。'}</p><div class="receipt">${esc(cost)}</div><p class="handwritten">窗外的树还绿着。\n十月快到了。</p><p class="modal-note">九月先写到这里。现在可以接着进入十月，原来的约定、口味和月考结果都会保留。</p><div class="modal-actions"><button class="secondary-button" id="end-journal">翻看这一个月的手记</button><button class="secondary-button" id="end-seat">看看新座位</button><button class="secondary-button" id="end-export">导出进度</button><button class="secondary-button" id="end-title">回到标题</button><button class="primary-button" id="end-october">接着过十月 →</button></div>`});
    addReportButton(m);$('.modal',m).classList.add('ending');$('#end-october',m).onclick=enterOctober;$('#end-seat',m).onclick=seatAfterExam;$('#end-journal',m).onclick=journal;$('#end-export',m).onclick=exportSave;$('#end-title',m).onclick=returnTitle;
  }
  function seatAfterExam(){
    const position=rank()-1;
    const m=showModal({kicker:'月考之后 · 重新排座',title:'你把书搬到了这里',wide:true,body:`<p class="modal-note">你原来坐在第 ${Math.floor(S.seat/6)+1} 排，新的座位在第 ${Math.floor(position/6)+1} 排。新座位按本次排名逐行排列。</p><div class="blackboard">黑 板</div><div class="seat-grid">${Array.from({length:44},(_,i)=>`<button class="seat ${i===position?'selected':'occupied'}" disabled>${i===position?'你':i===S.seat?'原座位':'同学'}</button>`).join('')}</div><p class="modal-lead">${position%6<2?'窗户还在左边。阳光照到桌角的时候，你想起了报到那天。':'你坐下来，抬头重新看了一眼黑板。下次递笔记，要多走几步了。'}</p><div class="modal-actions"><button class="primary-button" id="new-seat-close">把书放好</button></div>`});
    $('#new-seat-close',m).onclick=()=>closeModal();
  }
  function journal(){
    const warm=S.warm>=6?'会特地绕过来找你':S.warm>=3?'能自然地说上几句话':'还在慢慢认识';
    const f=S.friend>=6?'会给你留一个空位':S.friend>=3?'开始找你一起做事':'见面会打招呼';
    const m=showModal({kicker:'你的本子 · 九月',title:'有些事，写下来才发现过了很久',wide:true,body:`<p class="identity-note">${esc(S.profile.name==='你'?'你的手记':S.profile.name+'的手记')} · ${S.profile.gender==='female'?'女生':'男生'} · 高一（六）班</p><div class="journal-pages"><div class="journal-section"><h3>这几天</h3>${S.memories.length?S.memories.slice(-12).map(x=>`<div class="journal-entry"><small>第 ${x.week} 周 · ${esc(x.tag)}</small>${esc(x.text)}</div>`).join(''):'<p class="modal-note">还没有写下什么。先去教室里看看。</p>'}</div><div class="journal-section"><h3>还放在心上的</h3><div class="stat-line"><span>功课 · ${S.study} 点积累</span><span>${S.study>=9?'能把错题自己讲明白':S.study>=4?'有几页认真订正过':'还有些地方没弄懂'}</span></div><div class="stat-line"><span>赵程</span><span>${f}</span></div><div class="stat-line"><span>林遥</span><span>${warm}</span></div><div class="stat-line"><span>操场</span><span>完成 ${S.fitness} 圈 · 手机被发现 ${S.caught} 次</span></div><div class="stat-line"><span>精力</span><span>${S.energy} / 100</span></div><div class="stat-line"><span>自己</span><span>${S.energy>=65?'还能精神地过明天':S.energy>=40?'有点累，需要缓一缓':'安排有点满，需要额外休整'}</span></div>${S.promise==='yes'?`<p class="receipt">和赵程的班旗：${S.promiseKept?'一起画完了。':S.week<=2?'还记着，要去。':'那天没去。后来他找了阿哲。'}</p>`:''}${S.taste?`<span class="memory-label">${esc(S.taste)}</span>`:''}${S.promiseKept?'<span class="memory-label">一张班旗合照</span>':''}<p class="modal-note">这里记录你和别人相处的样子。没有一张表能告诉你，这个月过得值不值。</p></div></div><div class="modal-actions"><button class="primary-button" id="journal-close">合上手记</button></div>`});
    $('#journal-close',m).onclick=()=>closeModal();
  }
  function exportSave(){
    const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`campus-three-years-week-${S.week}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出进度文件。这个文件也能作为你这局的选择记录。');
  }
  function menu(){
    if(!S||screens.length||E.busy)return;
    const m=showModal({kicker:'课间 · 暂停一下',title:'书包先放在这里',narrow:true,body:'<div class="choices"><button class="choice" id="menu-actors">人物小册 · 表情与短动画</button><button class="choice" data-music-toggle id="menu-music">背景音乐</button><button class="choice" id="menu-sfx">点击音效</button><button class="choice" id="menu-motion">人物动态</button><button class="choice" id="menu-resume">继续这一周</button><button class="choice" id="menu-help">看看怎么玩</button><button class="choice" id="menu-cg">记忆放映室 · 重看短 CG</button><button class="choice" id="menu-export">导出进度记录</button><button class="choice" id="menu-title">回到标题</button></div><p class="keyboard-tip">Tab 选中 · Enter 确认 · Esc 返回<br>场景中 1 / 2 / 3 / 4 切换地点，J 打开手记，P 查看安排。</p>'});
    window.CampusMusic.sync();$('#menu-music',m).onclick=toggleSound;
    const sfxButton=$('#menu-sfx',m),sfxLabel=()=>sfxButton.textContent='点击音效：'+(window.CampusSfx.enabled?'开':'关');sfxLabel();sfxButton.onclick=()=>{window.CampusSfx.set(!window.CampusSfx.enabled);sfxLabel();};
    const motionButton=$('#menu-motion',m);const motionLabel=()=>motionButton.textContent='人物动态：'+(E.motionEnabled?'开启':'关闭');motionLabel();motionButton.onclick=()=>{E.setMotion(!E.motionEnabled);motionLabel();};$('#menu-actors',m).onclick=characterAlbum;
    $('#menu-cg',m).onclick=cgGallery;$('#menu-resume',m).onclick=()=>closeModal();$('#menu-help',m).onclick=help;$('#menu-export',m).onclick=exportSave;$('#menu-title',m).onclick=()=>{save();returnTitle();};
  }
  function energyGuide(){
    showModal({kicker:'精力与日常作息',title:'正常睡觉，不需要占一个选项',body:`<div class="balance-rules"><p>每天都会正常睡觉，<strong>每晚自动恢复 6 精力</strong>，上限 100。周一到周三、周三到周五各经过两晚，分别恢复 12；进入周六、周日和下周一，各恢复 6。一整周共 42 点基础恢复。</p><p>只在日期真正推进时结算一次。看说明、换地点、刷新、重开游戏都不额外恢复；现实里等多久也不会刷出精力。</p><p>早点睡额外恢复 36，吃饭、散步和留白也保留额外恢复。它们是在正常作息之外，给自己多留一点余力。</p><p><strong>稳步订正：18 精力，正确积累 +3；集中攻坚：28 精力，正确 +5。</strong>认真看完讲解也分别有 +2、+3，符合学习计划再 +1。同周重复学习不降低收益。</p><p>从 64 精力开始，工作日三次稳步订正后剩 34；周末留白加正常睡眠，下周一为 64。若周末也安排很多高消耗活动，或连续集中攻坚，就需要额外休整。时间仍然不能同时留给所有人。</p></div>${S?.rhythm?.last?`<p class="receipt">最近一次：${esc(S.rhythm.last.label)}，实际恢复 +${S.rhythm.last.amount}。达到上限时不会继续累加。</p>`:''}`});
  }
  function morePlay(){
    const m=showModal({kicker:'更多玩法',title:'先试一试，再走进那三年',wide:true,body:'<p class="modal-lead">这里可以单独练习小游戏。不会用掉剧情里的时间、精力或钱，也不会改变约定和解锁物。</p><div class="extras-list"><button class="extras-item" id="practice-running"><small>节奏与呼吸</small><strong>操场跑一圈</strong><span>光点进到落脚区时按空格，也可以直接点击。</span></button><button class="extras-item" id="practice-basketball"><small>三次机会</small><strong>半场投篮</strong><span>试试出手时机。没有倒计时，投歪了也能再来。</span></button><button class="extras-item" id="practice-phone"><small>留意老师的视野</small><strong>晚自习的手机</strong><span>在拿出与收起之间选择，看完消息再离开。</span></button></div><div class="extras-settings"><button class="secondary-button" id="extras-rules">精力与学习规则</button><button class="secondary-button" id="extras-help">操作说明</button><button class="secondary-button" data-music-toggle id="extras-music">背景音乐</button><button class="secondary-button" id="extras-sfx">点击音效</button><button class="secondary-button" id="extras-motion">人物动态</button><button class="primary-button" id="extras-back">返回主界面</button></div>'});
    window.CampusMusic.sync();$('#extras-music',m).onclick=toggleSound;
    const sfx=$('#extras-sfx',m),motion=$('#extras-motion',m),labels=()=>{sfx.textContent='点击音效：'+(window.CampusSfx.enabled?'开':'关');motion.textContent='人物动态：'+(E.motionEnabled?'开':'关');};labels();
    sfx.onclick=()=>{window.CampusSfx.set(!window.CampusSfx.enabled);labels();};motion.onclick=()=>{E.setMotion(!E.motionEnabled);labels();};
    $('#extras-rules',m).onclick=energyGuide;$('#extras-help',m).onclick=help;$('#extras-back',m).onclick=()=>closeModal();
    for(const kind of ['running','basketball','phone'])$('#practice-'+kind,m).onclick=()=>practice(kind);
  }
  function practice(kind){
    if(E.busy)return;
    const names={running:'操场跑一圈',basketball:'半场投篮',phone:'晚自习的手机'};
    const finish=out=>{if(!out)return;const text=kind==='basketball'?`三次出手，命中 ${out.hits} 球。`:kind==='running'?`稳稳落脚 ${out.hits} 次，跑过 ${out.distance} 米。${out.won?'这一圈跑完了。':'下次试着放稳节奏。'}`:`读到 ${out.read} / 3 条消息。${out.caught?'这次被老师发现了。':'消息看完就把手机收好。'}`;
      const m=showModal({kicker:'练习结束',title:names[kind],body:`<p class="modal-lead">${esc(text)}</p><p class="modal-note">这是独立练习，剧情进度没有改变。</p><div class="modal-actions"><button class="secondary-button" id="practice-done">回到更多玩法</button><button class="primary-button" id="practice-again">再试一次</button></div>`});$('#practice-done',m).onclick=()=>closeModal();$('#practice-again',m).onclick=()=>{closeModal();practice(kind);};};
    if(kind==='basketball')E.basketball({},finish);else E[kind](finish,{practice:true});
  }
  function help(){
    const m=showModal({kicker:'给刚走进教室的你',title:'把时间留给想做的事',body:'<p class="modal-lead">工作日周一、周三、周五各一段；周六、周日每天两段。同一个人，教室与食堂每周各能聊一次：分别花一段，内容不同。食堂聊天精力 −8，教室通常 −12，来回换地点不重复解锁。同一个人在操场与教室共用原课后次数。</p><div class="receipt">每天都会正常睡觉，每晚自动恢复 6 精力；按日期推进结算，一周共 42。早点睡、吃饭和散步额外恢复，不用为了获得基础睡眠而放弃一天。<br><br>稳步订正 −18，正确积累 +3；集中攻坚 −28，正确 +5；看完讲解也分别 +2、+3，按学习计划另 +1。同周多学不再削减收益。周末图书馆是较轻的复习，不等于工作日集中学习。<br><br>聊天 −12，跑步 −14，看手机 −8；早点休息额外 +36，陪家人吃饭 +10。周末全天活动占两段，同项每周一次。靠近林遥后才开放同行，仍不自动确认恋爱。<br><br>对话点正文、空格或 Enter 继续；短 CG 可以跳过。场景中 1 / 2 / 3 / 4 换地点，J 看手记，P 看安排，Esc 暂停；换地点和查看消息不花时间。<br><br>主界面的“更多玩法”能单独练习三个小游戏，练习不影响剧情存档。</div><p class="modal-note">进度自动保存在当前浏览器。点击音、人物动态可在“更多玩法”或暂停菜单设置；右上角“声”控制环境风声。</p><div class="modal-actions"><button class="secondary-button" id="help-energy">查看精力规则与例子</button><button class="primary-button" id="help-close">知道了</button></div>'});
    $('#help-close',m).onclick=()=>closeModal();$('#help-energy',m).onclick=energyGuide;
  }
  function toggleSound(){window.CampusMusic.toggle();toast(window.CampusMusic.enabled?'背景音乐已轻轻打开。':'背景音乐已关闭。');}

  $('#new-game').onclick=()=>{
    if(saved){const m=showModal({kicker:'重新报到',title:'从九月的第一天重来？',body:'<p class="modal-lead">确认主角后会替换当前进度，并在本浏览器保留上一局备份。\n还没选好主角时，可以返回主界面继续原来的生活。</p><div class="modal-actions"><button class="secondary-button" id="cancel-new">再想想</button><button class="primary-button" id="confirm-new">重新走进教室</button></div>'});$('#cancel-new',m).onclick=()=>closeModal();$('#confirm-new',m).onclick=startNew;}else startNew();
  };
  updateTitle();$('#continue-game').onclick=continueGame;$('#more-play').onclick=morePlay;$('#title-help').onclick=help;
  $$('[data-place]').forEach(b=>b.onclick=()=>move(b.dataset.place));
  $('#profile-button').onclick=identityCard;
  const energyPanel=$('#energy-budget');energyPanel.tabIndex=0;energyPanel.setAttribute('role','button');energyPanel.setAttribute('aria-label','查看精力恢复与学习规则');const explainEnergy=()=>{if(S&&!screens.length&&!E.busy)energyGuide();};energyPanel.onclick=explainEnergy;energyPanel.onkeydown=e=>{if(e.key==='Enter'||e.code==='Space'){e.preventDefault();explainEnergy();}};
  $('#finish-week').onclick=finishWeek;$('#plan-button').onclick=()=>{if(!screens.length&&!E.busy)openPlan();};$('#journal-button').onclick=()=>{if(!screens.length&&!E.busy)journal();};$('#menu-button').onclick=menu;$('#sound-button').onclick=toggleSound;
  document.addEventListener('keydown',event=>{
    if(E.busy)return;const top=screens.at(-1);
    if(top){
      if(event.key==='Escape'){event.preventDefault();closeModal();return;}
      if(event.key==='Tab'){
        const items=$$('button:not(:disabled),select,input:not(:disabled),a[href]',top.backdrop).filter(x=>x.getClientRects().length),first=items[0],last=items.at(-1);
        if(!first)return;if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }return;
    }
    if(!S||$('#play-screen').hidden)return;
    if(event.key==='Escape'){menu();return;}
    if(['1','2','3','4'].includes(event.key))move(['classroom','canteen','track','home'][Number(event.key)-1]);
    if(event.key.toLowerCase()==='j')journal();if(event.key.toLowerCase()==='p')openPlan();
  });
  window.addEventListener('beforeunload',()=>{if(S?.profile.gender)save();});
})();
