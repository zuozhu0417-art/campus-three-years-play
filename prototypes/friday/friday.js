/* Contained narrative experiment: no original game scripts or browser storage. */
(()=>{'use strict';
const $=s=>document.querySelector(s),F=window.FridayScript,state={minute:25,place:'classroom',book:'bag',warned:false,math:null,played:false,ended:false,girlLeft:false,argued:false};
let talking=false,selected=null,returnFocus=null;
const line=(who,text)=>({who,text});
function scene(name){$('#scene').style.backgroundImage=name==='classroom'?`url('assets/classroom-v29.png')`:`url('../../assets/${name}.jpg')`;}
function clock(){const total=17*60+state.minute;$('#clock').textContent=Math.floor(total/60).toString().padStart(2,'0')+':'+(total%60).toString().padStart(2,'0');}
function talk(lines,choices=[],done=()=>{}){
 if(talking)return;talking=true;returnFocus=document.activeElement;$('#world').inert=true;$('#reading').hidden=false;let i=0,choosing=false,finished=false;
 const finish=v=>{if(finished)return;finished=true;talking=false;$('#reading').hidden=true;$('#world').inert=false;render();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});done(v);};
 function paint(){const a=lines[i];$('#who').textContent=a.who;$('.talk').classList.toggle('speech',a.who!=='');$('#words').textContent=a.text;$('#replies').replaceChildren();$('#next').hidden=false;$('#next').textContent=i<lines.length-1?'继续':choices.length?'回应':'收好';}
 function next(){if(choosing)return;if(i<lines.length-1){i++;paint();return;}if(!choices.length){finish();return;}choosing=true;$('#next').hidden=true;for(const c of choices){const b=document.createElement('button');b.textContent=c.text;b.dataset.reply=c.id;b.onclick=()=>finish(c.id);$('#replies').append(b);}$('#replies button').focus();}
 $('#words').onclick=$('#next').onclick=next;paint();$('#words').focus({preventScroll:true});
}
function object(id,text,x,y,fn){const b=document.createElement('button');b.id=id;b.textContent=text;b.style.left=x+'%';b.style.top=y+'%';b.onclick=fn;$('#objects').append(b);}
function render(){if(state.ended)return;clock();scene(state.place);$('#place').textContent=state.place==='classroom'?'高一（六）班':'操场边';$('#world').setAttribute('aria-label',$('#place').textContent);$('#objects').replaceChildren();
 for(const id of ['classroom','track']){if(state.place===id)$('#'+id).setAttribute('aria-current','page');else $('#'+id).removeAttribute('aria-current');}
 if(state.place==='classroom'){
  $('#room-note').textContent=state.minute<32&&!state.girlLeft?'门外有拉书包拉链的声音。':'走廊灯灭了，教室还亮着。';
  object('exam',state.math?'压在课本下的卷子':'你的数学卷子',35,74,worksheet);
  object('linyao',state.book!=='bag'?'已经还回的练习册':state.minute<32&&!state.girlLeft?'门外的林遥':'林遥的空桌',16,43,returnBook);
  object('door',state.played?'刚才那一局':state.minute<35?'楼下的拍球声':'楼下安静了',64,68,()=>talk([line('赵程',state.played?'老许根本没碰到，出什么界。':state.minute<35?'来不来？就十分钟。老许他们缺一个。':'')].filter(a=>a.text).concat(state.minute>=35&&!state.played?[line('','赵程已经走了。地上有半个没擦掉的球印。')]:[])));
 }else{
  $('#room-note').textContent=state.minute<35?'篮球砸在篮圈上，弹进了跑道。赵程正追过去。':'场上的人收了球，正在捡地上的水瓶。';
  object('ball',state.played?'刚才那一局':state.minute<35?'他们还缺一个人':'球场散了',35,55,playBall);
 }
}
function move(place){if(talking||state.ended||place===state.place)return;state.minute++;state.place=place;render();}
function returnBook(){
 if(state.book!=='bag'){talk([line('',state.book==='hand'?'练习册已经还给林遥了。':'练习册压在她的水杯下面。')]);return;}
 if(state.minute<32&&!state.girlLeft)talk([line('','林遥站在门外，袋子的拉链卡住了。'),line('林遥','本子用完了吗？')],[{id:'hand',text:'“在这儿。”递给她'},{id:'later',text:'“还差一点，你先走。”'}],v=>{if(v==='later'){state.girlLeft=true;render();return;}state.book='hand';state.warned=true;state.girlLeft=true;state.minute+=3;talk([line('林遥','你抄了没？'),line('','她翻到配方那题，用指甲在第二行划了一下。'),line('林遥','这儿我瞎写的。别跟我一样。')]);});
 else talk([line('','水杯底下一圈水。值日表有一角泡得发透。')],[{id:'desk',text:'挪一下水杯，把练习册压住'},{id:'keep',text:'先塞回包里'}],v=>{if(v==='desk'){state.book='desk';state.minute++;render();}});
}
function closePaper(){ $('#paper').hidden=true;$('#world').inert=false;render();$('#exam')?.focus();}
function worksheet(){if(talking||state.ended)return;returnFocus=document.activeElement;$('#world').inert=true;$('#paper').hidden=false;selected=null;
 $('#paper').innerHTML='<p class="stamp">周五小测 / 订正后周一交</p><h2 id="paper-title">把 f(x) = x² − 2x 配方</h2><p>红笔只在答案旁边打了一个叉。<br>圈出最先算错的一行，再把卷子改完。</p><div class="work"><button data-step="0">x² − 2x = x² − 2x + 1 − 1</button><button data-step="1">= (x − 1)² + 1</button><button data-step="2">所以顶点是 (1, 1)</button></div><div class="paper-actions"><button id="correct" disabled>自己重新算一遍，约七分钟</button></div><button class="close" id="paper-close">先夹回书里</button>';
 if(state.math){$('#paper').innerHTML='<p class="stamp">你的卷子</p><h2 id="paper-title">'+(state.math==='self'?'订正留在了空白处':'已经写上了订正')+'</h2><p>周一早读之前，要放到讲台上。</p><button id="paper-close" class="close">收起来</button>';if(state.warned&&['copy','wrong'].includes(state.math)){const fix=document.createElement('button');fix.id='repair';fix.textContent='按她刚才说的，把加一改成减一，约两分钟';fix.onclick=()=>{state.math='hint';state.minute+=2;closePaper();};$('#paper').insertBefore(fix,$('#paper-close'));}}
 else{
  const copy=document.createElement('button');copy.id='copy';copy.textContent=state.warned?'按林遥刚才提醒的改，约三分钟':'照借来的练习册改，约三分钟';if(state.book==='bag'||state.warned){$('.paper-actions').append(copy);copy.onclick=()=>commitMath(state.warned?'hint':'copy');}
  document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.step);document.querySelectorAll('[data-step]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#correct').disabled=false;});
  $('#correct').onclick=()=>commitMath(selected===1?'self':'wrong');
 }
 $('#paper-close').onclick=closePaper;$('#paper button').focus();
}
function commitMath(method){if(state.math)return;state.math=method;state.minute+=['self','wrong'].includes(method)?7:3;closePaper();talk([line('',method==='self'?'你在等号后面补了一行：加一减一，最后还剩减一。卷子边上蹭了一小块橡皮屑。':method==='hint'?'你把加号涂成减号，纸上蹭出一个小洞。':method==='copy'?'你照着练习册抄了第二行，把卷子折回原来的大小。':'你改了圈出来的那一行。看了两遍，把卷子夹回书里。')]);}
function playBall(){if(state.played){talk([line('','球已经还给赵程了。刚才跑得急，校服后背还贴在身上。')]);return;}if(state.minute>=35){talk([line('','人已经散了。赵程的校服外套也不在篮架下面。')]);return;}
 talk([line('赵程','你防老许。我一传球你就跑，别站那儿看。')],[{id:'play',text:'把书包放到篮架下面，打十分钟'},{id:'watch',text:'“我赶车。今天就看这一球。”'}],v=>{if(v==='watch'){state.minute++;render();return;}state.played=true;state.minute+=10;talk([line('','最后一球投短了。赵程伸手够了一下，球还是落在界外。'),line('赵程','你刚才跑得也太快了，我球还没拿稳。'),line('','老许把球踢进了草丛。赵程骂了一句，没人去捡。')]);});}
function bag(){if(talking||state.ended)return;talk([line('','书包里有饭卡、手机、校车月票和'+(state.book==='bag'?'林遥的练习册。':'一包压扁的纸巾。')),line('',state.book==='bag'?'练习册封面写着她的名字，后面几页还夹着便签。':'练习册已经还了。'),line('','月票背面印着：周五末班 17:40。教室走到车站约两分钟。')]);}
function depart(){if(talking||state.ended)return;talk([line('','楼梯口还有几个没走的人。下去就是车站。')],[{id:'go',text:'现在走，去车站要两分钟'},{id:'stay',text:'再回教室看看'}],v=>{if(v!=='go')return;state.minute+=2;state.ended=true;clock();ending();});}
function period(title,time){$('#place').textContent=title;$('#clock').textContent=time;$('.clock span').textContent='';}
function ending(){scene('home');period('星期五晚上',state.minute<=40?'18:26':'19:08');
 talk(F.home(state),[],()=>{scene('classroom');period('周一早读前','07:12');talk(F.math(state),[],()=>{
  talk(F.book(state),F.bookReplies(state),v=>{const after=F.bookAfter(state,v);if(v==='return')state.book='monday';
   const next=()=>talk(F.friend(state),F.friendReplies(state),r=>{state.argued=r==='pushback';talk(F.friendAfter(state,r),[],()=>{period('周三','12:15');talk(F.wednesday(state),[{id:'again',text:'重新过一次这个下午'},{id:'original',text:'回到原版游戏'}],k=>{if(k==='again')location.reload();else location.href='../../index.html';});});});
   if(after.length)talk(after,[],next);else next();
  });
 });});}
$('#begin').onclick=()=>{$('#intro').hidden=true;render();talk([line('赵程','就缺一个。你快点，别又说完了不来。'),line('','球在楼梯上砸了一下。门外，林遥还在扯袋子的拉链。')]);};
$('#classroom').onclick=()=>move('classroom');$('#track').onclick=()=>move('track');$('#bag').onclick=bag;$('#depart').onclick=depart;
document.addEventListener('keydown',e=>{const modal=!$('#intro').hidden?$('#intro'):!$('#paper').hidden?$('#paper'):!$('#reading').hidden?$('#reading'):null;if(e.key==='Escape'&&!$('#paper').hidden){e.preventDefault();closePaper();return;}if(modal&&e.key==='Tab'){const items=[...modal.querySelectorAll('button:not(:disabled),a')].filter(x=>x.getClientRects().length);const i=items.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===items.length-1)){e.preventDefault();items[0]?.focus();}}if(talking&&!e.repeat&&[' ','Enter'].includes(e.key)&&document.activeElement===$('#words')){e.preventDefault();$('#words').click();}});
$('#world').inert=true;$('#begin').focus();
})();
