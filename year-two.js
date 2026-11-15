/* Second-year opening. Additive graph: preserve the completed first year. */
(() => {
  'use strict';
  const C=window.CAMPUS_CONTENT,Y=window.CampusYearOne,F=window.CampusCanteen;
  const row=(who,text,mood)=>[who,text,mood],N=t=>row('narrator',t),U=t=>row('you',t),Q=t=>row('zhouyan',t),M=t=>row('mother',t),D=t=>row('father',t),Z=t=>row('zhaocheng',t),L=t=>row('linyao',t);
  const choice=(key,text,after,flags={},effects={})=>({key,text,after,flags,effects});
  const event=(id,title,lines,choices,extra={})=>({id,title,lines,choices,cost:12,category:'friend',...extra});
  const weeks=[
    ['9 月 2 日','第二十一周 · 名单贴在另一扇门上','暑假过去了。新班名单旁挤着人，林遥和赵程在隔壁班。你的新同桌把书往里挪了一点。','旧朋友在另一间教室。午饭与放学见面，先问过时间。','classroom'],
    ['9 月 16 日','第二十二周 · 门口少一双鞋','父亲已在外地上班。妈妈的排班贴在冰箱上，有两天晚饭得自己安排。','饭留几份、几点回家，说具体一些就够了。','home'],
    ['9 月 30 日','第二十三周 · 电话那头的锅盖声','父亲说这周能好好打个电话。放学铃响时，他那边还没下班，可以另约时间。','电话挂断后，刚记下的公交站名还在纸上。','home']
  ];
  for(const [date,name,intro,diary,background] of weeks){
    C.weeks.push({date,name,intro,quiet:intro,diary,background});
    for(const [p,v] of Object.entries(C.places))v.observation.push(({classroom:'新同桌的本子摆得很齐。下课铃响，隔壁班的门也开了。',canteen:'约见面的人要先对时间。餐桌不属于固定的哪一个班。',track:'跑道还是那条跑道，集合的队伍换了位置。',home:'冰箱上的排班表旁，留着一支铅笔。'})[p]);
    C.familyLines.push('妈妈把排班表往旁边挪了挪。今天的晚饭，先说清谁几点回来。');
  }
  for(const [title,question,steps,solution] of [
    ['等差数列的第一步','a₁=3，公差 d=2，求 a₅',['a₅=a₁+4d','a₅=3+5×2','所以 a₅=13'],'从第一项到第五项只有四个间隔，a₅=3+4×2=11。'],
    ['数列求和','首项 2、末项 10，共 5 项的等差数列，求和',['S₅=(2+10)×5/2','S₅=12×5','所以 S₅=60'],'首末配对后要除以 2，S₅=30。'],
    ['独立事件','两次独立抛公平硬币，两次均正面的概率',['每次正面概率为 1/2','两次均正面概率为 1/2+1/2','因此概率为 1'],'独立事件同时发生用乘法，1/2×1/2=1/4。']
  ])C.exercises.push({title,question,steps,wrong:1,solution,hint:'找最先出错的一行。可以先看讲解，再按自己的方法整理。'});
  function weekday(S,id){
    const w=S.week,f=S.year.flags,cl=Y.sweet(S);
    if(id==='zhouyan'){
      const entries={
        21:['新同桌 · 少写的那一步',[Q('周砚。砚台的砚。这边是你的，书要放多少自己挪。'),U('刚才那道数列题，你怎么一下就写到最后了？'),Q('看出公差就代进去。中间不用全抄吧？'),U('我省掉以后，下一题就不知道从哪儿开始。')],[choice('steps','请他把省略的一步写出来，再用自己的方法重做',[Q('……我以为这个一眼就能看出来。那我写全，你别照着我的速度赶。'),N('你把五个数排出来。周砚看过，把漏写的项数圈在旁边。')],{zhouMet:true,zhouMethod:'steps'},{study:2}),choice('own','先保留自己的步骤，说明暂时不交换本子',[Q('行。我的也不一定适合你。尺子要用就拿，别把本子一起抽走。')],{zhouMet:true,zhouMethod:'own'})]],
        22:['解题 · 快办法也会绕远',[Q(f.zhouMet?'上次那题我又看了一遍。':'我是周砚，坐你旁边。上次那道题，我回去又看了一遍。'),Q('我那个通式写得快，换个问法就不好用。你按项列的那一页还在吗？'),U('先列两项，再决定要不要代公式。')],[choice('compare','一起比较两个办法，标清各自适用的题',[Q('这题你那样确实更清楚。我把前面那个“直接套”划了。')],{zhouMet:true,zhouCompared:true},{study:2}),choice('later','今天先自己订正，约好有空再比较',[Q('好。不用现在把本子给我，我也还没写完。')],{zhouMet:true})]],
        23:['课间 · 本子不能一直借着',[Q(f.zhouCompared?'你上次圈的那一步，我补进去了。':'这页我把跳过的步骤补齐了，要看吗？'),Q('不过本子今天得还我，晚上我要自己复习。')],[choice('copy','只抄自己要用的一题，当面还本子',[U('这一题够了。剩下的我自己推。'),Q('好。有不同的结果明天再看。')],{zhouMet:true,zhouReturned:true},{study:2}),choice('no','这次不借，讲讲自己卡在哪里',[Q('你先说。我听不懂的地方也会问，别默认我都知道。')],{zhouMet:true,zhouAsked:true})]]
      };const [title,lines,choices]=entries[w];return event(id,title,lines,choices,{category:'study',effects:{}});
    }
    if(id==='friend'){
      const entries={21:['隔壁班 · 先敲一下门',[Z('以后找我先在门口叫一声。别冲进去坐别人椅子，我这边也换同桌了。'),U('那球场还照旧？'),Z('地方照旧，时间得再问。')]],22:['放学 · 拍摄表换了颜色',[Z('两个班课表不一样。我把能用相机的日子涂了颜色。'),U('我家这周也得看排班。'),Z('那先别报一整月。周末能来一次就算一次。')]],23:['片子 · 今天只看一小段',[Z(f.recorded?'上次你补录那段还在，我没换署名。':'这段是我和阿哲补的。你先看声音会不会太响。'),U('阿哲呢？'),Z('去还工具了。一会儿他自己来拿机子。')]]};
      const [title,lines]=entries[w];return event(id,title,lines,[choice('talk','说清本周有空的时间，听他的新安排',[Z('记下了。真有事再确认，不算你已经接了拍摄。')],{['friend'+w]:true}),choice('listen','今天只听近况，不接新任务',[Z('行。下次见面也不用非得有事。')],{['friendListen'+w]:true})]);
    }
    if(id==='girl'){
      const entries={21:['楼梯口 · 没认错教室',[L('刚才走到旧教室门口，差点又进去。你呢？'),U('我看了两次门牌。'),L(cl?'以后找我，先发一句。我也会来找你的。':'午饭想一起吃的话，群里先问一声。')]],22:['画本 · 新班的窗户',[L('这边的窗户朝另一面，下午光全落在桌角。我画了三遍，三遍都不像。'),U('这回没撕？'),L('没撕。先让它难看几天。')]],23:['放假前 · 她也有自己的安排',[L('这次假期我要先去画室，周日才有半天空。'),U('那不直接把你算进全天安排。'),L(cl?'嗯。想见你也得把自己的事情做完。':'对。我们把时间说准一点就好。')]]};
      const [title,lines]=entries[w];return event(id,title,lines,[choice('ask','也说自己的安排，不替她填满空闲',[L(cl?'那等都空下来，再一起走一段。':'好，下次碰面讲讲新班的事。')],{['girl'+w]:true}),choice('share','讲一件自己新班里的小事',[L('等一下，你先说那个桌腿怎么回事？'),N('你把事情从头讲了一遍，她听到一半笑出了声。')],{['girlShare'+w]:true})]);
    }
    if(id==='mom'){
      const entries={21:['开学晚饭 · 先看一眼排班表',[M('你爸已经到那边了，刚发来宿舍照片。我这周有两天晚班。'),U('哪两天要自己吃？'),M('周三和周五。我把钱和能热的菜放哪儿，给你写一下。')]],22:['晚饭 · 冰箱里不是每天都有现成的',[N('门边少了父亲的鞋。冰箱里有半盒米饭，排班表上今天写着晚班。'),M('菜我没来得及做。可以买一份，也能做简单的，别空着肚子等我。'),U('你回来吃不吃？'),M('回来吃一点，别为了等我把自己的饭拖凉。')]],23:['电话 · 先问他什么时候方便',[M('你爸这会儿还在回宿舍路上，车上吵。要不晚点？'),U('我也有话想讲。'),M('那留个时间，别两边拿着手机干等。')]]};
      const [title,lines]=entries[w];return event(id,title,lines,[choice('talk',w===23?'约周六一段完整通话，先把时间说清':'一起对清吃饭和回家的安排',[M(w===23?'我问过了，周六吃完午饭那一段行。到时候你们慢慢说。':'好。要改就提前说，别谁都以为另一个人已经吃了。')],{['family'+w]:true}),choice('own','先安排自己的事，有变化再告诉家里',[M('行。需要帮忙就说，我也会告诉你我哪天忙不过来。')],{['familyOwn'+w]:true})],{cost:0,category:'rest',effects:{family:2,energy:10}});
    }
    return null;
  }
  Y.cg.newClass={scene:'year-newclass-v15',title:'名单贴在另一扇门上',text:'先看清门牌。\n新同桌把书往里挪了一点。',duration:5};
  const oldWeekday=Y.weekday;Y.weekday=(S,id)=>S.week>=21?weekday(S,id):oldWeekday(S,id);
  const oldScene=F.scene;F.scene=(S,id)=>{
    if(S.week<21||id==='pursuer-canteen')return oldScene(S,id);
    const girl=id==='girl-canteen',who=girl?'linyao':'zhaocheng';
    const rows=girl?{
      21:['从两个门口走来','我刚下课。你们那边是不是拖了一会儿？','先吃，别等汤凉了才开始。'],22:['新班的名字','新班有个人名字和我只差一个字。今天又替人答了到。','你别笑，下次可能就轮到你。'],23:['假期前的饭','画室让我带一张没画好的去。书包快塞不下了。','那我就带这张，不临时重画一幅装作没问题。']
    }:{21:['餐桌不用按班坐','分了班也能坐这儿。我刚才还给自己找新班牌子。','行，下次谁先到先问人齐没齐。'],22:['打包袋先收好','我妈让我顺路带个包子回去。别让我吃着吃着忘了。','谢谢，袋子放书包外面，不压在镜头上。'],23:['今天不拍吃饭','阿哲刚把机子拿走了。今天我们不用护着它吃饭。','对，汤碗终于能往中间放了。']} ;
    const [title,text,after]=rows[S.week];return event(id,'食堂 · '+title,[row(who,text),U(girl?'那你先把餐盘放稳。':'先吃两口再讲。')],[choice('talk',girl?'听她说完，也讲自己的近况':'接着聊这顿饭里的小事',[row(who,after)],{[id+S.week]:true}),choice('quiet','先安静吃一会儿，再各自回班',[row(who,'好，我也正饿着。下次见。')],{[id+'Quiet'+S.week]:true})],{cost:8,effects:girl&&Y.sweet(S)?{warm:2}:{friend:2}});
  };
  const oldWeekend=Y.weekend;Y.weekend=S=>{
    if(S.week<21)return oldWeekend(S);
    const w=S.week,f=S.year.flags;
    const make=(id,title,lines,choices,extra={})=>({id,title,lines:Y.lines({id,title},lines),choices:choices.map(c=>({...c,entry:`你完成了「${title}」。${c.after.at(-1)[1]}`})),tag:'本周故事',day:0,cost:1,energy:-12,money:0,effects:{family:2},scene:'home',desc:'占用真实周末时段；可以留给别的安排。',...extra});
    if(w===21)return [make('map21','新同桌：交换一页错题',[Q(f.zhouMet?'这次只看各自真正不会的那一题。':'我是周砚。上课来不及说完的题，要不要一起看看？')],[choice('compare','留一段，一人讲一道题再收回本子',[Q('你的这道我也算错了。先别翻答案，我们重来。')],{zhouMet:true,zhouWeekend:true})],{scene:'classroom',effects:{study:3}}),make('meet21','旧同学：先问过时间的一次碰面',[Z('周日早上我和阿哲去球场。林遥说她下午画画，来不了。')],[choice('meet','去见有空的朋友，不替缺席者补经历',[N('阿哲迟到了几分钟，手里提着三瓶水。你们没拍集体照，先分了水。')],{oldFriends21:true})],{day:1,scene:'track',effects:{friend:3}})];
    if(w===22)return [make('dinner22','自己安排晚饭：也留出妈妈那一份',[N('你先看米饭够不够，再问妈妈今天几点回来。她回了一条语音，说别多留，自己在单位已经吃过。')],[choice('cook','只做需要的份数，把自己的饭吃好',[M('我到家了。碗先放那儿，明早谁先起谁洗。'),N('你在排班表边记了一笔：下次先问，不用猜。')],{dinner22:true})],{effects:{family:3},energy:6}),make('walk22','林遥：只走一段回家路',[L('我周日下午去买纸，回程这段路有空。要不要走到路口？')],[choice('walk','按说好的时间同行，到路口各自回家',[L(Y.sweet(S)?'到家给我说一声。今天没有聊完的，下次再讲。':'我往这边了。下次带新画给你看。')],{walk22:true})],{day:1,scene:'track',effects:Y.sweet(S)?{warm:3}:{friend:3}})];
    return [make('call23','父亲：这次不用赶着挂电话',[D(f.family23?'说好的这个点。吃完了，听得清。':'我刚吃完，现在能讲一会儿。你那边方便吗？'),U('方便。你那边锅盖怎么一直响？'),D('室友洗锅呢。我们轮着做饭，他今天多放了半勺盐。')],[choice('daily','问宿舍、公交和晚饭，也讲自己的新班',[D('公交倒不难坐，下车还得走一段。附近那家面馆我试过了。'),U(f.zhouCompared?'我和新同桌比较过解法，有些题我的办法也挺好用。':'新班有些名字我还没记全，课间走错过一次门。'),D('那挺好。我这边先把路认熟。你下次也讲讲学校之外的。')],{fatherCall23:true,callTopic23:'daily'}),choice('school','讲自己的学习和不适应，请他听完',[U('不是要你现在帮我解决。我想把这几天的事讲完。'),D('你讲。我把门关上，刚才没听清那句，你再说一遍。')],{fatherCall23:true,callTopic23:'school'})]),make('reschedule23','周日通话：留出另一段时间',[D('这周还没好好说过话。今天这段行不行？我把手机充好了。')],[choice('call','按改约的时间接通，聊一会儿各自的日常',[D('行，今天不赶。我先给你说那家面馆在哪儿。')],{fatherCall23:true,callTopic23:'rescheduled'})],{day:1,gate:f.fatherCall23?'本周已经完整通话，可把这一段留给别的事':''})];
  };
  const oldNormalize=Y.normalize;Y.normalize=(v,S)=>{const y=oldNormalize(v,S);y.settled=Array.isArray(v?.settled)?[...new Set(v.settled.filter(x=>Number.isInteger(x)&&x>=7&&x<=23))]:[];return y;};
  const oldSettle=Y.settle;Y.settle=S=>{
    if(S.week<21)return oldSettle(S);
    if(S.year.settled.includes(S.week))return [];
    S.year.settled.push(S.week);
    if(S.week===23)return [S.year.flags.fatherCall23?'你们实际接通了那次电话。父亲的工作没有因此结束，下次联系也需要再问时间。':'这周没有完成那段通话。父亲发来一张晚饭照片，没接通的话没有写成已经聊过。'];
    return [];
  };
})();
