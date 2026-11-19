/* Contained narrative experiment: no original game scripts or browser storage. */
(()=>{'use strict';
const $=s=>document.querySelector(s),state={minute:25,place:'classroom',book:'bag',warned:false,math:null,played:false,ended:false};
let talking=false,selected=null,returnFocus=null;
const line=(who,text)=>({who,text});
function scene(name){$('#scene').style.backgroundImage=`url('../../assets/${name}.jpg')`;}
function clock(){const total=17*60+state.minute;$('#clock').textContent=Math.floor(total/60).toString().padStart(2,'0')+':'+(total%60).toString().padStart(2,'0');}
function talk(lines,choices=[],done=()=>{}){
 if(talking)return;talking=true;returnFocus=document.activeElement;$('#world').inert=true;$('#reading').hidden=false;let i=0,choosing=false,finished=false;
 const finish=v=>{if(finished)return;finished=true;talking=false;$('#reading').hidden=true;$('#world').inert=false;render();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});done(v);};
 function paint(){const a=lines[i];$('#who').textContent=a.who;$('.talk').classList.toggle('speech',a.who!=='');$('#words').textContent=a.text;$('#replies').replaceChildren();$('#next').hidden=false;$('#next').textContent=i<lines.length-1?'继续':choices.length?'回应':'收好';}
 function next(){if(choosing)return;if(i<lines.length-1){i++;paint();return;}if(!choices.length){finish();return;}choosing=true;$('#next').hidden=true;for(const c of choices){const b=document.createElement('button');b.textContent=c.text;b.dataset.reply=c.id;b.onclick=()=>finish(c.id);$('#replies').append(b);}$('#replies button').focus();}
 $('#words').onclick=$('#next').onclick=next;paint();$('#words').focus({preventScroll:true});
}
function object(id,text,x,y,fn){const b=document.createElement('button');b.id=id;b.textContent=text;b.style.left=x+'%';b.style.top=y+'%';b.onclick=fn;$('#objects').append(b);}
function render(){clock();if(state.ended)return;scene(state.place);$('#place').textContent=state.place==='classroom'?'高一（六）班':'操场边';$('#world').setAttribute('aria-label',$('#place').textContent);$('#objects').replaceChildren();
 for(const id of ['classroom','track']){if(state.place===id)$('#'+id).setAttribute('aria-current','page');else $('#'+id).removeAttribute('aria-current');}
 if(state.place==='classroom'){
  $('#room-note').textContent=state.minute<32?'前门的锁没扣上，风一吹就撞一下。':state.minute<40?'窗边没人了。走廊里有人在试着锁门。':'楼道灯灭了一半。校车大概已经开走了。';
  object('exam',state.math?'压在课本下的卷子':'你的数学卷子',35,74,worksheet);
  object('linyao',state.book!=='bag'?'已经还回的练习册':state.minute<32?'窗边的林遥':'林遥的空桌',16,43,returnBook);
  object('door',state.played?'刚才那一局':state.minute<35?'楼下的拍球声':'楼下安静了',64,68,()=>talk([line('赵程',state.played?'刚才那个球真不算出界。下周再来。':state.minute<35?'来不来？就十分钟。老许他们缺一个。':'')].filter(a=>a.text).concat(state.minute>=35&&!state.played?[line('','赵程已经走了。地上有半个没擦掉的球印。')]:[])));
 }else{
  $('#room-note').textContent=state.minute<35?'篮球砸在篮圈上，弹进了跑道。赵程正追过去。':'场上的人收了球，正在捡地上的水瓶。';
  object('ball',state.played?'刚才那一局':state.minute<35?'他们还缺一个人':'球场散了',35,55,playBall);
 }
}
function move(place){if(talking||state.ended||place===state.place)return;state.minute++;state.place=place;render();}
function returnBook(){
 if(state.book!=='bag'){talk([line('',state.book==='hand'?'练习册已经还给林遥了。':'练习册压在她的水杯下面。')]);return;}
 if(state.minute<32)talk([line('','林遥把椅子推进桌下，拉了一下书包拉链。'),line('林遥','你还有事吗？我赶车。')],[{id:'hand',text:'“你的练习册。差点忘了。”'},{id:'later',text:'“没事，你先走。”'}],v=>{if(v==='later')return;state.book='hand';state.warned=true;state.minute+=3;talk([line('林遥','谢谢。对了，配方那题我写反了一个号。第二行，后面的加一。'),line('','她翻开指给你看，又合上本子，往门外走。'),line('林遥','我先走了。')]);});
 else talk([line('','她的水杯还在，书包已经拿走了。桌上压着一张值日表。')],[{id:'desk',text:'把练习册压在水杯下面'},{id:'keep',text:'周一再当面还'}],v=>{if(v==='desk'){state.book='desk';state.minute++;render();}});
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
function commitMath(method){if(state.math)return;state.math=method;state.minute+=['self','wrong'].includes(method)?7:3;closePaper();talk([line('',method==='self'?'你在等号后面补了一行：加一减一，最后还剩减一。卷子边上蹭了一小块橡皮屑。':method==='hint'?'第二行的加一被你改成减一。刚才她说得很快，你还没来得及问为什么。':method==='copy'?'你照着练习册抄了第二行，把卷子折回原来的大小。':'你改了圈出来的那一行。看了两遍，把卷子夹回书里。')]);}
function playBall(){if(state.played){talk([line('','球已经还给赵程了。刚才跑得急，校服后背还贴在身上。')]);return;}if(state.minute>=35){talk([line('','人已经散了。赵程的校服外套也不在篮架下面。')]);return;}
 talk([line('赵程','你防老许。我一传球你就跑，别站那儿看。')],[{id:'play',text:'把书包放到篮架下面，打十分钟'},{id:'watch',text:'“我赶车。今天就看这一球。”'}],v=>{if(v==='watch'){state.minute++;render();return;}state.played=true;state.minute+=10;talk([line('','最后一球投短了。赵程伸手够了一下，球还是落在界外。'),line('赵程','你刚才跑得也太快了，我球还没拿稳。'),line('','他把校服从地上捡起来，抖了两下。你这才想起看表。')]);});}
function bag(){if(talking||state.ended)return;talk([line('','书包里有饭卡、校车月票和'+(state.book==='bag'?'林遥的练习册。':'一包压扁的纸巾。')),line('',state.book==='bag'?'练习册封面写着她的名字，后面几页还夹着便签。':'练习册已经还了。'),line('','月票背面印着：周五末班 17:40。教室走到车站约两分钟。')]);}
function depart(){if(talking||state.ended)return;talk([line('','楼梯口还有几个没走的人。下去就是车站。')],[{id:'go',text:'现在走，去车站要两分钟'},{id:'stay',text:'再回教室看看'}],v=>{if(v!=='go')return;state.minute+=2;state.ended=true;clock();ending();});}
function ending(){scene('home');$('#place').textContent='星期五晚上';const bus=state.minute<=40;
 const lines=[line('',bus?'车门还开着。你踩上最后一级台阶，司机低头看了一眼表。':'车站只剩下隔壁班的两个人。有人说，刚开走。你们最后一起往公交站走。'),line('妈妈',bus?'洗手吃饭。今天有你爱吃的。':'怎么才回来？饭在锅里，自己盛。我先去洗澡了。'),line('','周一，早读前。')];
 talk(lines,[],()=>{scene('classroom');$('#place').textContent='周一早读前';const after=[];
  if(!state.math)after.push(line('韩老师','你的订正呢？课间拿来。'),line('','早读刚开始，你把那张卷子从书包底翻出来。'));
  else if(['copy','wrong'].includes(state.math))after.push(line('韩老师','顶点还是不对。你看，加一再减一，最后该留下哪一个？'),line('','老师把卷子推回给你，没有往下收。'));
  else if(state.math==='hint')after.push(line('韩老师','这次对了。为什么是减一？'),line('','你看着自己改过的那个符号，想了一会儿。'));
  else after.push(line('韩老师','嗯，放这儿。'),line('','他把你的卷子压到那一摞上面，接着收下一个人的。'));
  if(state.book==='bag')after.push(line('林遥','练习册带了吗？我第一节要用。'));
  else if(state.book==='desk')after.push(line('林遥','本子看到了。你放桌上了啊，我还以为落在哪儿了。'));
  else after.push(line('','林遥翻着练习册，给自己写错的那道题补了一行。'));
  after.push(line('赵程',state.played?'下次你站近一点，我传不了那么远。':'周五后来跟老许他们打了。输了，别提。'));
  talk(after,[{id:'again',text:'重新过一次这个下午'},{id:'original',text:'回到原版游戏'}],v=>{if(v==='again')location.reload();else location.href='../../index.html';});
 });}
$('#begin').onclick=()=>{$('#intro').hidden=true;render();talk([line('赵程','我先下去了啊。你要来就快点，过一会儿他们就散了。'),line('','林遥还在收东西。桌上那张没改的数学卷子，被风掀起了一个角。')]);};
$('#classroom').onclick=()=>move('classroom');$('#track').onclick=()=>move('track');$('#bag').onclick=bag;$('#depart').onclick=depart;
document.addEventListener('keydown',e=>{const modal=!$('#intro').hidden?$('#intro'):!$('#paper').hidden?$('#paper'):!$('#reading').hidden?$('#reading'):null;if(e.key==='Escape'&&!$('#paper').hidden){e.preventDefault();closePaper();return;}if(modal&&e.key==='Tab'){const items=[...modal.querySelectorAll('button:not(:disabled),a')].filter(x=>x.getClientRects().length);const i=items.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===items.length-1)){e.preventDefault();items[0]?.focus();}}if(talking&&!e.repeat&&[' ','Enter'].includes(e.key)&&document.activeElement===$('#words')){e.preventDefault();$('#words').click();}});
$('#world').inert=true;$('#begin').focus();
})();
