/* Weekend content and state. Original narrative, MIT. No external services. */
window.CampusWeekend=(()=>{
  'use strict';
  const line=(id,who,text)=>({id,who,text,mood:who==='narrator'?'neutral':'smile'});
  const fresh=week=>({week,started:false,finished:false,day:0,remaining:2,days:[[],[]],pending:null});
  const initial=week=>({wallet:0,ledger:[],letters:[],counts:{},unlocks:[],current:fresh(week)});
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function normalize(value,week){
    const w=initial(week);if(!value||typeof value!=='object')return w;
    w.wallet=Number.isFinite(value.wallet)?clamp(Math.floor(value.wallet),0,9999):0;
    w.ledger=Array.isArray(value.ledger)?value.ledger.filter(x=>x&&Number.isInteger(x.week)&&Number.isFinite(x.amount)&&typeof x.text==='string').slice(-100):[];
    w.letters=Array.isArray(value.letters)?value.letters.filter(x=>x&&Number.isInteger(x.week)&&typeof x.text==='string').map(x=>({week:x.week,text:x.text.slice(0,1200)})).slice(-60):[];
    for(const [id,n] of Object.entries(value.counts||{}))if(Number.isInteger(n)&&n>=0&&n<=60)w.counts[id]=n;
    w.unlocks=Array.isArray(value.unlocks)?[...new Set(value.unlocks.filter(x=>['courtSignal','littleBird','firstPay','futureLetter','photoMargin'].includes(x)))]:[];
    const c=value.current;
    if(c&&c.week===week&&[0,1].includes(c.day)&&Number.isInteger(c.remaining)&&c.remaining>=0&&c.remaining<=2&&Array.isArray(c.days)&&c.days.length===2&&c.days.every(a=>Array.isArray(a)&&a.length<=2&&a.every(x=>typeof x==='string'))){
      w.current={week,started:c.started===true,finished:c.finished===true,day:c.day,remaining:c.remaining,days:c.days.map(a=>[...a]),pending:c.pending&&typeof c.pending.title==='string'&&Array.isArray(c.pending.lines)?c.pending:null};
    }
    return w;
  }
  const active=S=>S.weekend.current.week===S.week&&S.weekend.current.started&&!S.weekend.current.finished;
  const choice=(key,text,after,effects={},entry='',note='')=>({key,text,after,effects,entry,note});
  function catalog(S){
    const n=S.week,closer=S.october.mode==='closer',known=S.october.mode!=='undecided',count=S.weekend.counts;
    const events=[
      {id:'basketball',title:'陪赵程打半场球',tag:'同学',day:0,cost:1,energy:-16,scene:'track',mini:'basketball',effects:{friend:1,fitness:1},desc:'三次投篮，输赢都有人接球。',
       lines:[['zhaocheng',count.basketball?'上回那个篮板的位置，今天还站不站？':'三缺一，你来不来？不会投没事，先给我传球。'],['you','说好，就半场。打完还得去做别的。'],['narrator',n===2&&S.promiseKept?'赵程把晒干的班旗挂到栏杆上，拿它临时挡住了旁边的积水。':'球砸在水泥地上，弹回来时，赵程已经退到了篮下。']],
       choices:[choice('pass','先和他打传接配合',['zhaocheng','球到了就传，别紧张。我在篮下。'],{friend:1},'你和赵程打了半场球。你记住了他抬手要球的样子。','关系靠默契，不只靠投进几球。'),choice('shoot','试试自己找投篮节奏',['zhaocheng','你先投，我给你捡。投歪了也算我的热身。'],{fitness:1},'你在赵程面前投了几次篮。他捡完球，又传回给你。')]},
      {id:'breakfast',title:'陪妈妈吃一顿不赶的早饭',tag:'生活',day:0,cost:1,energy:14,effects:{family:1},scene:'home',desc:'不用边穿鞋边咽下最后一口。',
       lines:[['mother','今天不用赶校车？粥还热着。'],['you','不赶。碗先放这儿，我坐会儿。'],['narrator','妈妈把旁边的小凳子往里挪，给你的膝盖让出一点地方。']],
       choices:[choice('school','讲讲最近学校里的一件事',['mother','哦，是那位同学啊。你慢点讲，我听着。'],{},'你陪妈妈吃完早饭，讲了一件学校里的小事。'),choice('listen','先问问她这周过得怎么样',['mother','也没什么大事。昨天买菜，倒是碰见你小学老师了。'],{family:1},'这顿早饭，你没有急着讲自己，先听妈妈说了她这一周。')]},
      {id:'library',title:'去图书馆坐一会儿',tag:'自己',cost:1,energy:-12,effects:{study:1},scene:'classroom',desc:'一张安静的桌子，和一页真正看懂的书。',
       lines:[['narrator','阅览室只剩窗边一把椅子。你把手机调成静音，翻开带来的本子。'],['you',n===4?'先把这个月一直绕开的题看完。':'不赶页数，先看懂这一页。']],
       choices:[choice('notes','把思路写成能讲给别人听的几行',['narrator','你删掉了两个照抄的步骤，补上了自己原来没懂的地方。'],{},'图书馆的这段时间，你终于把一页问题写明白了。'),choice('browse','题做完后，留几分钟看看别的书',['narrator','书里夹着一张旧借书条。你没有带走，只记下了下一本想看的书名。'],{energy:4},'你在图书馆订正了一页题，也给一本想看的书留了名字。')]},
      {id:'park',title:'沿河走一段，不赶着见谁',tag:'自己',cost:1,energy:18,effects:{},scene:'track',desc:'恢复精力，也承认今天不能什么都做。',
       lines:[['narrator','你把耳机收进袋子。河边的风比教室里大，塑料袋从鞋边滚过去。'],['you','先走到那棵树，再决定要不要回去。']],
       choices:[choice('walk','走到桥边，把空瓶带回来',['narrator','回来的时候，你的肩膀不再一直绷着。'],{},'你沿河走了一段。那一会儿，没有谁需要你立刻回答。'),choice('sit','找张长椅，坐到心里安静一点',['narrator','一辆自行车从面前过去。你没有看时间，等呼吸慢下来才起身。'],{},'你在河边坐了一会儿，把这一段时间完整留给了自己。')]},
      {id:'market',title:'陪家里去买一周的菜',tag:'生活',day:0,cost:1,energy:-8,effects:{family:1},scene:'canteen',desc:'记住的不是价格，是家里最近想吃什么。',
       lines:[['mother','帮我提这个袋子，别把豆腐压在下面。'],['you','这回知道了。晚上想吃什么？']],
       choices:[choice('pick','认真挑一份她爱吃的菜',['mother','还记得啊？那今天就做这个。'],{family:1},'买菜回来，你记住了家里最近想吃的东西。'),choice('carry','帮忙提东西，听她和摊主聊天',['narrator','你第一次发现，妈妈和这里的人已经认识了好多年。'],{},'你帮家里提了一路菜，也听见了平时没留意的闲话。')]},
      {id:'cook',title:'一起把晚饭做完',tag:'生活',day:1,cost:1,energy:10,effects:{family:2},scene:'home',desc:'从洗菜到端上桌，真正帮完一件事。',
       lines:[['mother','要帮忙就先把这盆菜洗了，别只在门口问。'],['you','洗完还有什么？今天我不急着回屋。']],
       choices:[choice('learn','学一道下次自己也能做的菜',['mother','先关小火。别一着急，就把东西全倒进去。'],{},'你学着做完一道家常菜，记住了什么时候该关小火。'),choice('table','把碗筷摆好，留下来一起吃',['narrator','锅里的声音停下来以后，桌边还有你的位置。'],{},'你没有端着饭回房间，而是和家里坐着吃完了晚饭。')]},
      {id:'jog',title:'慢跑后认真拉伸',tag:'自己',day:1,cost:1,energy:-10,effects:{fitness:1},scene:'track',desc:'不是每次到操场都必须比输赢。',
       lines:[['narrator','跑道边没有比赛。你把第一圈跑得很慢，跑完还留了时间拉伸。']],
       choices:[choice('steady','照自己的节奏跑完',['narrator','你没有追前面那个人，最后一圈反而没有乱掉呼吸。'],{},'你在周日慢跑，学着照顾自己的节奏。'),choice('stretch','少跑一点，把拉伸做完整',['narrator','收好鞋带时，小腿没有像上次那样绷得发疼。'],{energy:4},'这次你没有硬加一圈，给身体留出了恢复的余地。')]},
      {id:'review',title:'参加同学的小组讲题',tag:'同学',day:1,cost:1,energy:-18,effects:{study:1,friend:1},scene:'classroom',desc:n===4?'月考前最后一次，只讲真正不懂的地方。':'轮到你讲一题，也允许说自己不会。',
       lines:[['zhaocheng','这个答案我有，过程就是看不懂。你能讲人话吗？'],['you','能试试。讲错了你也得提醒我。']],
       choices:[choice('teach','把会的那题讲给他听',['zhaocheng','等一下。你刚才说的这一步，我这次懂了。'],{},'你和同学互相讲了一题，发现看懂和讲清楚是两回事。'),choice('ask','先把自己卡住的地方说清楚',['narrator','你们对着同一页争了几分钟，最后发现都漏看了一个条件。'],{},'你在小组里承认了一次不会，也把问题问清楚了。')]},
      {id:'letter',title:'写一封暂时不寄的信',tag:'自己',day:1,cost:1,energy:6,effects:{},scene:'home',desc:'封好留着，以后的你还能回来打开。',
       lines:[['narrator',count.letter?'你又拿出一张纸。上一封还夹在本子最后，没有因为新的一周就消失。':'你把收信人写成自己的名字，日期留在最上面。']],
       choices:[choice('remember','写下今天舍不得忘的一件小事',['narrator','没有写永远，也没有给未来定一个必须做到的目标。你把纸折好。'],{},'你给以后的自己留了一封信，写着今天不想忘掉的小事。'),choice('honest','把最近说不出口的疲惫写下来',['narrator','写完以后，事情并没有立刻变好，但这一次你没有假装不累。'],{},'你在给自己的信里，认真承认了最近有点累。')]}
    ];
    if(n>=2)events.push(
      {id:'bookshop',title:'去书店做一次周末短工',tag:'生活',day:0,cost:2,energy:-24,effects:{},money:40,scene:'classroom',desc:'整天整理书架，挣 40 元零用钱，也会错过球局。',
       lines:[['narrator','你提前和家里说好，来熟人的书店帮忙整理书架。店主把清单递给你，先说明今天的时长和报酬。'],['you','四十元，做完这两排再核对一次，对吧？'],['narrator','窗外有人抱着球经过。你手里的书，还剩一小车。']],
       choices:[choice('labels','先核对标签，再按顺序上架',['narrator','你找出了两本放错位置的书。结束时，店主把说好的报酬交给你。'],{},'你用完整的周六做了书店短工，收到 40 元零用钱。'),choice('list','按清单逐本清点，遇到缺项先问',['narrator','少的那册原来在柜台。你把它划掉，没有为了赶时间装作没看见。'],{},'你完成书店清点，学会不把不确定的事当成已经核对过。')]},
      {id:'photo',title:'和赵程去拍普通的街景',tag:'同学',day:0,cost:1,energy:-10,effects:{friend:2},scene:'track',desc:'把镜头留给愿意被拍的人。',
       lines:[['zhaocheng',n===6?'下周运动会那套还没开拍。今天先练找光，不算提前交摄影工作。':'今天不拍大场面。谁先找到一处好看的光？'],['narrator',S.promiseKept?'他把相机带递给你，像画班旗那天递画笔一样自然。':'他把相机给你之前，先提醒你怎么扣住手腕上的带子。']],
       choices:[choice('friend','先问他，要不要留一张自己的照片',['zhaocheng','我啊？行，别又拍闭眼。'],{},'你给总拿着相机的赵程拍了一张照片。拍之前，先问了他。'),choice('street','找一处不打扰别人的街角',['narrator','你们等那辆车开走，才拍下墙根的光。没有谁因为赶时间被拽进镜头。'],{},'你和赵程拍了一处街角，没有为了画面催别人让路。')]},
      {id:'usedbooks',title:'逛旧书摊，挑一本带走',tag:'自己',day:1,cost:1,energy:-6,effects:{},money:-8,scene:'classroom',desc:'8 元，一本可以留下自己批注的书。',
       lines:[['narrator','摊主让你慢慢翻。你看中的那本有卷角，标价八元。']],
       choices:[choice('margin','挑一本想反复读的旧书',['narrator','你把自己的名字写在空白页上，没擦掉上一位读者留下的铅笔线。'],{},'你用零用钱买下一本旧书，空白页上多了自己的名字。'),choice('practical','挑一本现在就能用上的参考书',['narrator','你先核对了缺页，才把钱递过去。下一次复习，有了一本自己的书。'],{study:1},'你挑到一本没有缺页的旧参考书，没有只看漂亮的封面。')]},
      {id:'film',title:'和同学看一场社区放映',tag:'同学',day:1,cost:1,energy:-6,effects:{friend:1},scene:'track',desc:'散场以后，聊聊各自记住的那一幕。',
       lines:[['zhaocheng','前面没位置了。坐后面？字幕应该也看得见。'],['narrator','银幕被风吹得轻轻鼓起来。你们把声音放低，等电影开场。']],
       choices:[choice('talk','散场后交换各自喜欢的一幕',['zhaocheng','你喜欢那里啊？我刚才一直在看旁边那个人。'],{friend:1},'散场以后，你发现和赵程看的同一部电影，记住的却不是同一幕。'),choice('company','不急着评价，陪他慢慢走回去',['narrator','有一段路你们都没说话，也没有谁急着拿出手机填满。'],{},'你和同学看完电影，又一起走了一段没有急着说话的路。')]},
      {id:'lamp',title:'试着修好家里的旧台灯',tag:'生活',day:0,cost:1,energy:-8,effects:{family:1},money:-6,scene:'home',desc:'6 元换灯泡，把自己力所能及的事做完。',
       lines:[['mother','先拔掉插头。不会弄的地方别硬拆，换个灯泡试试就好。'],['you','知道，先把这一个拧下来。']],
       choices:[choice('careful','断电后换灯泡，把旧的收好',['narrator','灯亮起来的时候，你没有把拆下来的东西随手留在桌边。'],{},'你帮家里换好了台灯灯泡，做完以后把桌面收干净了。'),choice('ask','不确定规格，先带旧灯泡去问',['mother','这样就对了。问清楚，比买错了再跑一趟省事。'],{},'你拿着旧灯泡先问清规格，才买回合适的那一个。')]},
      {id:'volunteer',title:'参加社区旧书整理',tag:'生活',day:1,cost:2,energy:-20,effects:{friend:1},scene:'classroom',desc:'占完整一天，帮不认识的人找到合适的书。',
       lines:[['narrator','登记表上没有熟悉的名字。你和另外两个人一组，把捐来的书摊到桌上。'],['you','破了的先放这边，不把看不了的那几本混进去。']],
       choices:[choice('sort','按适合的读者整理，再做一次复查',['narrator','贴完最后一张标签，你发现自己的手指沾了不同颜色的胶。'],{},'你用一个周日整理社区旧书，复查完才把纸箱封好。'),choice('help','先帮第一次参加的人熟悉流程',['narrator','结束时，对方把最后一卷胶带递给你。这次已经不用再问要贴哪里。'],{friend:1},'你在旧书整理现场带着一个新伙伴，把不熟悉的流程一起做完了。')]}
    );
    if(n>=5)events.push(
      {id:'walk',title:'和林遥一起走回家',tag:'靠近',day:1,cost:1,energy:-8,effects:{warm:2},scene:'track',gate:closer?'':'先在十月明确选择“想和她再熟一点”',desc:'周末返校整理完东西，顺路走到岔路口。还不是约会承诺。',
       lines:[['linyao',count.walk?'今天还走上回那条路吗？':'你也往这边走？那……走到路口再分开吧。'],['you','好。今天不用一路赶着跑。'],['narrator',S.october.poster?'她把画本放进包里。那张留给你的纸角，还夹在你自己的本子中间。':'她把松开的鞋带重新系紧，站起来时，往旁边给你让了半步。']],
       choices:[choice('listen','听她说画室里发生的小事',['linyao','有个人把颜料当成洗笔水放了。我差一点也用错。'],{},'你和林遥一起走到岔路口，听她讲了画室里的一件小事。'),choice('share','把自己今天最想讲的事告诉她',['linyao','所以你刚才一路都在想这个？现在想好了？'],{},'这次一起走回家的路上，你也把自己的日常讲给了林遥。')]},
      {id:'drawing',title:'和林遥在窗边画速写',tag:'同学',cost:1,energy:-10,effects:closer?{warm:1}:{friend:1},scene:'classroom',gate:known?'':'先在十月坐下来，明确怎样认识她',desc:'普通朋友也能一起画，不把帮助自动写成恋爱。',
       lines:[['linyao','先别擦。你那条线，歪得还挺有意思。'],['you',S.october.poster?'那这只鸟还要不要添一条腿？':'我本来想画树枝。现在看着像一只鸟。'],['linyao',S.october.poster?'你怎么还记得这个。':'那就先当鸟留着。你再看看窗外，它站在哪儿？']],
       choices:[choice('keep','留着不太完美的第一张',['narrator','她没有替你重画，只在背面写了今天的日期。'],{},'你和林遥留下了一张不太完美的速写，背面有今天的日期。'),choice('learn','问她怎么观察窗边的光',['linyao','先别画窗户，看看影子停在哪里。'],{},'林遥没有替你画完，而是教你先看影子停在哪里。')]},
      {id:'paperstore',title:'一起去挑海报用的纸',tag:'同学',day:1,cost:2,energy:-18,effects:closer?{warm:2}:{friend:2},scene:'classroom',gate:known?'':'先在十月和林遥明确相处方式',desc:'完整一天的纸店之行，会错过走读和小组讲题。',
       lines:[['linyao','去那家远一点的店，来回得留够时间。你今天别的事排好了吗？'],['you','嗯，今天就给这件事留着。']],
       choices:[choice('texture','陪她比较纸纹，把意见说具体',['linyao','你说的有道理。这张看起来亮，画出来反而会抢颜色。'],{},'你和林遥一起比较了纸纹，花掉了完整的一天。'),choice('budget','一起算好需要多少，不多买',['narrator','你们把多拿的一卷放回去。需要的东西，并不比想拿的多。'],{},'你和林遥把海报用纸算清楚，没有因为来一趟不容易就多买。')]}
    );
    const echoes={breakfast:['mother','你上回坐下吃完了早饭，今天我也没急着把另一把椅子收进去。'],library:['narrator','你已经知道阅览室哪一排比较安静。今天带来的是另一页还没弄懂的问题。'],park:['narrator','还是那条河。风从熟悉的方向吹来，你已经知道哪边有台阶。'],market:['mother','豆腐放上面，你上回记住了吧？'],cook:['mother','上回那道菜还记得吗？今天换你先看着火。'],jog:['narrator','你记得上回收操时小腿的感觉，今天没有省掉拉伸。'],review:['zhaocheng','上回那步我后来自己做出来了。这次换一个地方卡住。'],letter:['narrator','旧信还放在原来的位置。新的一周，不需要把以前写过的话作废。'],bookshop:['narrator','你先看了今天的新清单，没有把上回数过的册数直接照抄下来。'],usedbooks:['narrator','上一回买的书还在包里。你先想了想自己读到了哪里，才蹲下翻新的那摞。'],film:['zhaocheng','这次还坐后面？上次那个位置看字幕其实挺清楚的。'],lamp:['narrator','上回换好的灯还亮着。今天你把备用灯泡的型号记到盒子上，不再凭印象找。'],volunteer:['narrator','这回你已经知道破损的书该放哪一边，也会先等新来的人看清流程。'],drawing:['linyao','上回那张留着没？今天别急着把第一笔擦掉。'],paperstore:['linyao','上次剩的那卷还能用。我们先记好缺多少，再出门。']};
    if(n>=7){events.push(...window.CampusYearOne.weekend(S));for(let i=events.length-1;i>=0;i--)if(events[i].id==='paperstore')events.splice(i,1);}
    return events.map(e=>({...e,day:e.day??null,money:e.money||0,lines:[...(count[e.id]&&echoes[e.id]?[echoes[e.id]]:[]),...e.lines].map((row,i)=>Array.isArray(row)?line(`we.${n}.${e.id}.${i}`,row[0],row[1]):row)}));
  }
  function availability(S,e){
    const c=S.weekend.current;
    if(!active(S))return '还没到周末';if(c.pending)return '先把刚才的事说完';
    if(c.days.flat().includes(e.id))return '这周已经做过了';
    if(e.day!==null&&e.day!==c.day)return e.day===0?'只在周六，今天赶不上了':'周日才有这个安排';
    if(e.gate)return e.gate;if(e.cost>c.remaining)return '今天剩下的时间不够';
    if(e.id==='lamp'&&S.weekend.counts.lamp)return '台灯已经修好，不需要重复修理';
    if(S.energy+e.energy<0)return '精力不够，先休息或吃饭';
    if(S.weekend.wallet+e.money<0)return `零用钱不够，需要 ${-e.money} 元`;
    return '';
  }
  function begin(S){const w=S.weekend;if(w.current.week!==S.week)w.current=fresh(S.week);if(!w.current.started&&!w.current.finished)window.CampusBalance.sleep(S,'fri-sat',1);if(!w.current.finished)w.current.started=true;}
  function commit(S,id,key,mini=null){
    const e=catalog(S).find(x=>x.id===id),option=e?.choices.find(x=>x.key===key);
    if(!e||!option)return {ok:false,reason:'这个安排已经变化，请重新打开。'};
    const reason=availability(S,e)||window.CampusYearOne?.available(S,e,option);if(reason)return {ok:false,reason};
    if(e.mini&&(!mini||!Number.isInteger(mini.hits)||mini.hits<0||mini.hits>3))return {ok:false,reason:'先完成球局，再收好这一段。'};
    const w=S.weekend,c=w.current,oldUnlocks=[...w.unlocks],beforeEnergy=S.energy;
    const previousMemory=S.memories.at(-1)?.text||'我还在记班里每一个人的名字。';
    c.remaining-=e.cost;c.days[c.day].push(id);
    for(const [k,v] of Object.entries({...e.effects,energy:e.energy}))if(Number.isFinite(S[k]))S[k]+=v;
    for(const [k,v] of Object.entries(option.effects))if(Number.isFinite(S[k]))S[k]+=v;
    S.energy=clamp(S.energy,0,100);w.wallet+=e.money;w.counts[id]=(w.counts[id]||0)+1;
    if(e.money)w.ledger.push({week:S.week,amount:e.money,text:e.title});
    if(id==='basketball'&&w.counts.basketball>=2&&!w.unlocks.includes('courtSignal'))w.unlocks.push('courtSignal');
    if(id==='walk'&&S.october.poster&&!w.unlocks.includes('littleBird'))w.unlocks.push('littleBird');
    if(id==='bookshop'&&!w.unlocks.includes('firstPay'))w.unlocks.push('firstPay');
    if(id==='letter'&&!w.unlocks.includes('futureLetter'))w.unlocks.push('futureLetter');
    if(id==='letter')w.letters.push({week:S.week,text:key==='remember'?`第 ${S.week} 周。${previousMemory}\n我把它写在这里，怕过很久以后，只记得那时候忙。`: `第 ${S.week} 周。最近有点累，我没有把每一段空闲都拿来证明自己能撑住。\n写到这里，先放下笔，明天再接着过。`});
    if(id==='photo'&&w.counts.photo>=2&&!w.unlocks.includes('photoMargin'))w.unlocks.push('photoMargin');
    const newUnlocks=w.unlocks.filter(x=>!oldUnlocks.includes(x));
    if(S.week>=7&&e.tag==='本周故事')window.CampusYearOne.apply(S,e,option);
    const entry=option.entry;S.memories.push({week:S.week,tag:c.day?'周日':'周六',text:entry});
    const rows=Array.isArray(option.after[0])?option.after:[option.after],lines=rows.map(([who,text],i)=>line(`we.${S.week}.${id}.after.${i}`,who,text));
    if(mini)lines.push(line(`we.${S.week}.${id}.score`,'zhaocheng',mini.hits>=2?'可以啊！最后那个我都没准备好给你捡。':'没事，今天投丢的球，下回我还给你捡。'));
    const hints={courtSignal:'赵程抬了抬手：以后我做这个手势，你就知道该传了。球局里多了“接球暗号”。',littleBird:'你把纸角夹到本子前面。周末的“口袋里的东西”里，现在可以随时翻开它。',firstPay:'第一笔零用钱收好了。“零钱小账”里会一直记着它的来处。',futureLetter:'信已封好，放进“口袋里的东西”。下次再看，今天的字还会在。',photoMargin:'两次拿着相机走过同一条街。赵程把一张有留白的照片放进了你的口袋。'};
    for(const unlock of newUnlocks)lines.push(line(`we.unlock.${unlock}`,'narrator',hints[unlock]));
    const energyChange=S.energy-beforeEnergy;
    c.pending={title:e.title,scene:e.scene,lines,cg:option.cg||null,detail:`${c.day?'周日':'周六'} · 使用 ${e.cost} 段 · 精力 ${energyChange>=0?'+':''}${energyChange}${e.money?' · 零用钱 '+(e.money>0?'+':'')+e.money+' 元':''}`,newUnlocks};
    return {ok:true,pending:c.pending};
  }
  function finishDay(S){
    const c=S.weekend.current;if(!active(S)||c.pending)return false;
    S.energy=clamp(S.energy+c.remaining*3,0,100);
    if(c.remaining)S.memories.push({week:S.week,tag:c.day?'周日':'周六',text:'你没有再塞进一个安排，把剩下的时间留了空白。'});
    if(c.day===0){window.CampusBalance.sleep(S,'sat-sun',1);c.day=1;c.remaining=2;}else c.finished=true;
    return true;
  }
  return {initial,normalize,fresh,active,catalog,availability,begin,commit,finishDay,line};
})();
