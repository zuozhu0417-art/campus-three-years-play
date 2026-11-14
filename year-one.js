/* First-year story graph. Original writing; key weeks skip ordinary calendar weeks. */
window.CampusYearOne = (() => {
  'use strict';
  const L=(who,text)=>[who,text];
  const N=text=>L('narrator',text), Z=text=>L('zhaocheng',text), Y=text=>L('linyao',text), U=text=>L('you',text), M=text=>L('mother',text), A=text=>L('azhe',text);
  const opt=(key,text,after,flags={},extra={})=>({key,text,after,flags,effects:{},...extra});
  const scene=(id,title,lines,choices,extra={})=>({id,title,lines,choices,cost:12,category:'friend',...extra});
  const weeks=[
    ['10 月 21 日','第七周 · 镜头外也有风','运动会开两天。摄影、训练和看台上的座位，都在同一张安排表上。','接了摄影，就得真的留出一段。不是拿到名次，才算来过。','track'],
    ['11 月 4 日','第八周 · 没撕完的那张画','校服外套拉到了最上面。运动会的照片还在选，林遥的废纸篓却先满了。','有些画没有画好，有些话也没能一次说准。','classroom'],
    ['11 月 25 日','第九周 · 后门有人找','值日表换了一张。教室后门，一个不太熟悉的人叫出了你的名字。','有人来得很热闹。要不要回应，仍由你自己决定。','classroom'],
    ['1 月 6 日','第十周 · 把意向写在铅笔旁边','十二月的普通教学周过去了。寒假前，老师发下分科意向表和期末安排。','填的是现在的想法。学校会再确认，不用在今天替十八岁的自己签字。','classroom'],
    ['2 月 10 日','第十一周 · 寒假最后一班车','假期尾声，班群开始问返校时间。阿哲私信里打了一句，又撤回。','钱借了多少、怎么还，可以说清楚；没借，也能继续做朋友。','home'],
    ['2 月 24 日','第十二周 · 成片只有三分钟','开学报到那天，赵程带来第一段成片。三分钟，导出时却用了一整晚。','愿意一起做和愿意一直做，是两种不同的答应。','classroom'],
    ['3 月 10 日','第十三周 · 午睡前拆一包饼干','午休铃还有五分钟。饼干包装响得像全班都听得见。','熟悉以后，也可以什么大事都不发生。','canteen'],
    ['3 月 24 日','第十四周 · 说好四点半','林遥说放学后有事想请你帮忙。校门的影子慢慢移过了两条砖缝。','谁让人等了，谁就把原因说清楚。喜欢不等于不能不高兴。','classroom'],
    ['4 月 7 日','第十五周 · 两个下午落在同一天','学习小组试讲和远郊纸店都排在周日。来回的车程算进去，两个安排不能都去。','没有去的地方照常发生。提前说明，仍然会少一段共同经历。','classroom'],
    ['4 月 21 日','第十六周 · 先问你这次有没有空','上周的人各自带着见闻回来。林遥把下一次可用的时间写在纸条上，没有直接替你圈。','改约要再留一次时间，不能靠一句“下次”就算做完。','classroom'],
    ['5 月 5 日','第十七周 · 冰箱上的电话号码','冰箱门上多了一张便签，写着外地宿舍的地址和一个联系人。','先问吃住、路费和休息日。大事也是由这些小事组成的。','home'],
    ['5 月 19 日','第十八周 · 饭桌多放了一张纸','父亲把岗位说明带回来。妈妈把饭盛好，让他别边吃边念。','说出舍不得，不等于要别人替你取消生活。','home'],
    ['6 月 9 日','第十九周 · 报名表还有一格','校内学习展示开始报名。讲题、资料和场地，都要有人真正做。','投入会改变准备的扎实程度，结果也有不完全如愿的时候。','classroom'],
    ['6 月 30 日','第二十周 · 把桌子搬到门外','期末结束，旧教室要腾出来。暑假买的新外套袖子稍长，父亲的箱子还没合上。','高一收好了。分班只是换间教室吗，现在谁都没把握。','classroom']
  ];
  const cg={
    sports:{scene:'year-sports',title:'镜头交到你手里',text:'先把相机拿稳。\n这一段，你确实在场。',duration:5.5},
    winter:{scene:'year-winter',title:'围巾挡住一点风',text:'公交站没有暖气。\n她往背风的一侧挪了半步。',duration:5},
    visitor:{scene:'year-visitor',title:'走廊突然热闹起来',text:'有人叫住你。\n这次，你可以慢慢回答。',duration:4.5},
    spring:{scene:'year-spring',title:'来得及走慢一点',text:'纸袋换到外侧。\n她把空着的那只手伸进了袖口。',duration:6},
    dinnerYear:{scene:'year-dinner',title:'把纸先放到一边',text:'饭有一点凉了。\n妈妈起身去盛第二碗汤。',duration:5},
    summer:{scene:'year-summer',title:'下一间教室见',text:'最后一张桌子搬走以后，\n风从空教室里穿了过去。',duration:6}
  };
  const fresh=()=>({flags:{},history:[],exams:[],loan:0,loanPaid:0,pursuit:'unmet',baseline:null,termStart:null,settled:[]});
  function normalize(v,S){
    const y=fresh();if(v&&typeof v==='object'){
      if(v.flags&&typeof v.flags==='object')for(const [k,x] of Object.entries(v.flags))if(typeof x==='boolean'||typeof x==='string')y.flags[k]=x;
      y.history=Array.isArray(v.history)?v.history.filter(x=>x&&Number.isInteger(x.week)&&typeof x.id==='string'&&typeof x.key==='string').slice(-300):[];
      y.exams=Array.isArray(v.exams)?v.exams.filter(x=>x&&[10,20].includes(x.week)&&Number.isInteger(x.rank)&&x.rank>=1&&x.rank<=44&&Number.isFinite(x.study)):[];
      for(const k of ['loan','loanPaid'])y[k]=[0,20,50].includes(v[k])?v[k]:0;
      y.loanPaid=Math.min(y.loan,y.loanPaid);
      y.pursuit=['unmet','welcome','friends','stop'].includes(v.pursuit)?v.pursuit:'unmet';
      for(const k of ['baseline','termStart'])y[k]=Number.isFinite(v[k])?v[k]:null;
      y.settled=Array.isArray(v.settled)?[...new Set(v.settled.filter(x=>Number.isInteger(x)&&x>=7&&x<=20))]:[];
    }
    if(S.week>=7&&y.baseline===null)y.baseline=S.study;
    return y;
  }
  const sweet=S=>S.october.mode==='closer';
  const visitor=S=>S.profile.gender==='female'?{who:'chenyu',name:'陈聿',pronoun:'他'}:{who:'qiaosui',name:'乔穗',pronoun:'她'};
  const lines=(s,rows)=>rows.map(([who,text,mood],i)=>({mood,id:`y1.${s.id}.${Array.from(s.title||'').reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,0).toString(36)}.${i}`,who,text}));
  function extend(C){
    for(const [date,name,intro,diary,bg] of weeks){
      C.weeks.push({date,name,intro,diary,quiet:intro,background:bg});
      for(const [p,v] of Object.entries(C.places))v.observation.push(({classroom:'桌上的东西一周一周地换，座位旁已经有了熟悉的脚步声。',canteen:'餐盘沿着窗口向前挪。吃饭的这段时间，仍由你自己安排。',track:'操场照常有人跑步。过去热闹过的看台，现在空了几排。',home:'书包放在椅子上。家里的日子，也跟着这一页慢慢往前走。'})[p]);
      C.familyLines.push('妈妈把碗往你这边推了一点。\n「坐下吃，今天想说什么？」');
    }
    const exercises=[
      ['集合的边界','A={1,2,3}, B={2,3,4}，求 A∩B',['共有的元素是 2 和 3','A∩B={1,2,3,4}','这是两个集合的交集'],1,'交集只取共有元素，所以 A∩B={2,3}。'],
      ['函数不是随便代','f(x)=1/(x−2)，求定义域',['分母不能为零','x 可以取所有实数','因此不必排除任何数'],1,'x−2≠0，因此 x≠2，定义域为实数集去掉 2。'],
      ['偶函数的检验','检验 f(x)=x² 是否为偶函数',['f(−x)=(−x)²','f(−x)=−x²','因此不是偶函数'],1,'(−x)²=x²=f(x)，且定义域关于原点对称，所以它是偶函数。'],
      ['负指数','计算 2⁻³',['2⁻³=1/2³','1/2³=−8','所以结果为 −8'],1,'负指数表示倒数，2⁻³=1/8。'],
      ['年后重新看对数','求 log₂8',['设 2ˣ=8','2ˣ=2⁴','所以 x=4'],1,'8=2³，所以 log₂8=3。'],
      ['三角函数的符号','求 sin(−30°)',['sin(−α)=−sin α','sin(−30°)=sin 30°','结果为 1/2'],1,'正弦是奇函数，因此 sin(−30°)=−1/2。'],
      ['别把单位圆忘了','求 cos 60°',['60° 在第一象限','cos 60°=√3/2','所以答案是 √3/2'],1,'cos 60°=1/2；√3/2 是 sin 60°。'],
      ['斜率的顺序','过 (1,2)、(3,6) 的直线斜率是多少',['斜率=(6−2)/(3−1)','斜率=2/4','因此斜率为 1/2'],1,'纵坐标差除以横坐标差，为 4/2=2。'],
      ['向量也有方向','a=(1,2), b=(3,−1)，求 a+b',['按对应分量相加','a+b=(1+3,2−(−1))','因此 a+b=(4,3)'],1,'第二个分量是 2+(−1)=1，因此 a+b=(4,1)。'],
      ['长度的平方','求向量 (3,4) 的模',['模为 √(3²+4²)','√(3²+4²)=3+4','所以模为 7'],1,'模为 √25=5，根号不能这样拆开。'],
      ['概率的补集','事件 A 的概率为 0.3，求 A 不发生的概率',['不发生的概率=1−P(A)','1−0.3=0.3','所以概率为 0.3'],1,'1−0.3=0.7。A 与它的补事件概率之和为 1。'],
      ['平均数要看总人数','两人分数为 60、80，求平均数',['总分为 140','平均数为 140/3','所以约为 46.7'],1,'只有两个人，平均数为 140/2=70。'],
      ['平方不等式','解 x²<4',['x²<4','因此 x<2 就够了','解集是 (−∞,2)'],1,'必须同时满足 −2<x<2。−3 虽然小于 2，平方却大于 4。'],
      ['最后一页仍要检查','解 2(x−1)=6',['x−1=3','x=3−1','所以 x=2'],1,'x−1=3 两边加 1，得 x=4。']
    ];
    for(const [title,question,steps,wrong,solution] of exercises)C.exercises.push({title,question,steps,wrong,solution,hint:'圈出推导中最先出错的一行。学习内容会随学期往前走。'});
  }
  function weekday(S,id){
    const f=S.year.flags,cl=sweet(S),w=S.week;
    if(id==='friend'){
      const d={
        7:scene(id,'运动会 · 相机不是一张邀请函',[Z(S.october.sportsPhoto?'给你留了相机。说好的这一段，从热身拍到终点，行吗？':'摄影阿哲顶上了。你想来拍一段，也得留完整一段，别光过来按一下。'),A('卡扣我扣好了。别把腕带只挂在一根手指上。'),U('这一段要拍什么？'),Z('人也拍，摔掉的号码布也拍。就是别在别人摔倒的时候凑过去。')],[opt('camera','留完整一段，拍到散场',[N('你给赵程留了终点旁的位置，自己沿着护栏慢慢往前走。'),Z('跑得快的那几个我也拍到了。你镜头里那些等人的，我想一起留。')],{cameraKept:true},{cg:'sports'}),opt('decline','说明这次不能留下，不拿相机',[U('这段给不了。我现在说，别等你开始了才发现少人。'),Z('行。我叫阿哲继续。你自己的安排也别赶。')],{cameraDeclined:true})]),
        8:scene(id,'选片 · 不好看的那一张',[Z(f.cameraKept?'这几张是你拍的。终点那张有点糊，我还没舍得删。':f.cameraDeclined?'你提前说了不能来，我们重新分了工。今天选片，愿意帮忙就留下。':f.cameraMissed?'那天没等到你，后来是阿哲接着拍的。今天选片，你愿意帮忙就留下。':'这是我和阿哲拍的。你没在镜头后，也可以说说哪张适合放进班册。'),N('有张照片里，跑完的人扶着栏杆，旁边只拍到一只递水的手。'),U('这张没有正脸。'),Z('但我记得是谁。')],[opt('consent','先问照片里的人愿不愿意公开',[Z('对。自己留着和贴出去，是两回事。'),N('你们把要询问的名字列在背面，没有直接交给宣传栏。')],{photoConsent:true}),opt('private','只帮他整理私人相册',[Z('那我建个不公开的文件夹。你挑，别把模糊的全删了。')],{privateAlbum:true})]),
        9:scene(id,'值日 · 桌腿总差一点',[Z('左边高一点。不是你那边，是我这边……算了，先放下。'),N('桌子落地时，粉笔盒正好震开。阿哲伸脚挡住滚过去的橡皮。'),A('这桌子是不是每天长一点？'),U('也可能是你每天站歪一点。'),Z('笑完过来帮忙，我还抬着呢。')],[opt('finish','一起把最后两排摆齐',[N('你们挪好桌子，才发现给垃圾桶忘了留位置。三个人又蹲下来笑了一会儿。')],{desks:true}),opt('notes','收好工具，留下一张摆放示意图',[A('下周照着这个摆。谁要再说桌子长了，就让他看图。')],{deskMap:true})]),
        10:scene(id,'期末前 · 分科意向',[Z('我想选的方向和家里说的不一样。你那张填了吗？'),U('老师说现在只是收意向。'),Z('我知道。可空着又像自己什么都没想。')],[opt('interest','陪他把想学的课程列具体',[U('先写你愿意学什么，再看每门课要做什么。'),Z('那我把剪片子这件事也写下来。不是只写“我喜欢”。')],{subject:'interest'}),opt('trial','约好先找老师了解课程，再填表',[Z('行。问完还不确定，也能先写暂定。')],{subject:'trial'})]),
        11:loanScene(S),
        12:scene(id,'第一段成片 · 多长的答应',[N('视频播完了，最后一个镜头的声音比画面晚了一点。'),Z(f.cameraKept?'你拍的终点我用了一秒，名字在最后。你先看看要不要改。':'里面是我和阿哲拍的。你没参加的工作，我没把你写进署名。'),U('之后还要拍？'),Z('想拍。可我得先问你能做多少。')],[opt('one','只接一次补录，周末再留整段',[Z('那就只算这次。周六两段，去操场补环境声，行的话到时候再确认。')],{filmDuty:'one'}),opt('long','愿意持续帮忙，但逐次确认时间',[U('每次先问。考试周我不一定能来。'),Z('明白。答应的是合作，不是随叫随到。')],{filmDuty:'long'}),opt('audience','只当观众，把反馈说具体',[Z('也好。你刚才说声音晚了，给我标一下在哪儿。')],{filmDuty:'audience'})]),
        13:scene(id,'午休 · 饼干包装',[A(S.year.loan>S.year.loanPaid?'车费我记着，周十六把约好的钱还你。要是时间有变我先说。':'这包是葱味的。你先闻，别吃了以后怪我。'),Z('别敲桌子了，后面已经有人睡了。'),N('阿哲捏住袋口，越想轻一点，响声越大。'),U('给我。我试试。'),N('你刚接过去，袋子“啪”地开了。三个人同时看向后排。')],[opt('share','分完，把碎屑一起收掉',[Z('下次换个包装安静的。'),A('我看是换个拆的人比较实际。')],{snack:true}),opt('quiet','把没吃完的收好，留到放学',[N('阿哲拿一只夹子封住袋口。后排的人翻了个身，谁也没被叫醒。')],{snackQuiet:true})]),
        14:scene(id,'耳机 · 一边有声音',[A('新的也不是必须现在买。先确认到底是线还是插头。'),N('他把自己的耳机递过来，只让你比较声音，没有拆任何电器。'),Z('这首歌左右声道本来就不一样，你先换一首。'),A('……有道理。')],[opt('compare','换音源比较，再决定怎么处理',[A('还好没直接扔。先收起来，等放学问维修店。')],{headphone:true}),opt('budget','陪他列一下维修与换新的花费',[U('超过这个价，就别硬修。'),A('行。我自己决定，先把价问明白。')],{repairBudget:true})]),
        15:scene(id,'周日 · 先把安排说清楚',[Z('老师要找人做小组试讲，周日得从准备做到结束。林遥说你们也在看纸店时间？'),U('两件事都要一整天。'),Z('那就只答应一个。我周六补片子，不挤在那天。')],[opt('calendar','把两项安排记进周末日历',[N('你在两个周日事项之间画了条线。不是顺序，是只能选一边。')],{readConflict:true}),opt('tell','先告诉他们，周日决定后再回复',[Z('没定就先不算你。确定了再说，我好找别人。')],{readConflict:true})]),
        16:repayScene(S),
        17:scene(id,'收音 · 全是风',[Z('戴上听一下。我明明站在墙后面。'),N('耳机里先是一阵风，接着是赵程很认真地说：“这次肯定没风。”'),A('这一句比你要录的好听。'),U('能不能单独留着？')],[opt('keep','经他同意留一份花絮',[Z('行，但别偷偷放正片。我要自己决定哪天丢这个脸。')],{wind:true}),opt('redo','陪他写下次补录的检查表',[U('挡风、试听、再录。别录完才第一次听。'),Z('写粗一点，贴我机子上。')],{soundChecklist:true})]),
        18:scene(id,'给父亲的问题 · 同学的经验',[Z('我爸以前也外出过。别只问“好不好”，他可能每次都说好。'),A('问附近哪家饭好吃。他会说多一点。'),U('那我得先记住地名。')],[opt('questions','把想问的日常记下来',[N('你写下宿舍、公交和晚饭。还留一格，准备让父亲自己补。')],{fatherQuestions:true}),opt('listen','听赵程讲自己的经历，不套成答案',[Z('我家那会儿也不全是难受。我后来去过一次，才知道他那间屋多小。')],{fatherStory:true})]),
        19:scene(id,'报名 · 先知道自己负责什么',[L('teacher','小组展示不是抢一个讲台。资料、讲解和核查，谁做哪项先写清。'),Z(f.trialTalk?'你上次试讲过。这回还想上台，还是换个位置？':'你想讲还是想做资料？没试过也能先报名。'),U('准备时间呢？'),L('teacher','周六要留一整天。周日给大家自己安排。')],[opt('apply','报名，周末再实际完成准备',[L('teacher','先登记。没有准备也会留下记录，不是按下报名就有结果。')],{applied:true}),opt('observe','先旁听，承担一小份资料核查',[L('teacher','可以。弄清自己做了什么，比全写参与更有用。')],{observer:true})]),
        20:scene(id,'空教室 · 最后两排桌子',[Z(f.desks?'上回你抬的那边高，这次换我。':'这次要抬到门外，先把过道腾开。'),A('桌肚里还有谁的卷子？最后问一遍。'),N('你们把落下的卷子按名字叠好，没人翻看分数。'),U('新的班里还借不借相机？'),Z('借。先问我那天用不用。')],[opt('move','留到最后，把桌子搬完',[N('最后一张桌子落下，你们才想起忘了拍合照。赵程说，空教室也拍一张吧。')],{movedDesks:true},{cg:'summer'}),opt('sort','整理遗失物，按名字交回去',[A('这一摞我送隔壁。你先把自己的书也找齐。')],{lostFound:true})])
      };return d[w];
    }
    if(id==='girl'){
      const common={
        7:['看台边 · 把帽檐压好',[Y('我画的海报被风掀掉一角。刚贴回去，现在手上全是胶。'),U('那你别碰头发。'),Y('已经碰了。你看看，沾上没？'),N('她背过身，低下头让你看。发带上粘着一点白纸。')],opt('paper','提醒她，把纸屑递到她手里',[Y('就这么一点？我还以为整张海报都粘上了。'),N(cl?'她拿着纸屑不扔，折成一只很小的纸帽，放到你掌心。':'你们把胶带收好，一起回看台交还工具。')],{paperHat:true})],
        8:['画没画好，先不撕',[N('林遥把一张画对折，却没有马上撕开。'),Y('老师说构图太满。我改了三遍，现在自己都看不出哪里满。'),U('可以给我看看吗？'),Y('可以。你别只说好看。')],opt('specific','说自己看不清的地方，陪她重新留白',[U('我先看到了杯子，窗外那个人反而看不见。'),Y('对，我其实想画外面的人。那这个杯子就不该占这么大。'),N('她把纸展开了。折痕还在，她没有要你假装它不存在。')],{keptDrawing:true})],
        9:['值日 · 调色盘洗不干净',[Y('不是脏，是这层颜色干了。你别再拿袖子擦。'),N('水龙头下，蓝色颜料沾到你的指节。她递过来一小块肥皂。'),U('你洗得掉，为什么我越洗越蓝？'),Y('因为你一直在摸盘子背面。')],opt('wash','一起把盘子洗完，再晾起来',[Y(cl?'手伸过来。你自己看不见这里。':'这边也冲一下。等干了，直接交给赵程。'),N(cl?'她指了一下你手腕上的蓝点，没忍住笑。':'你们冲好水，洗手池边只剩下一点泡沫。')],{palette:true})],
        10:['公交站 · 冬天来得很具体',[Y('我意向表还没填完。画室老师建议的课程，和我想学的不完全一样。'),U('那你准备先问谁？'),Y('先问学过的人。光听名字，我哪门都觉得可以。'),N('一辆不属于你们线路的公交开过去，带起一阵冷风。')],opt('stand','在背风处陪她等这一班车',[Y(cl?'你围巾怎么总松？算了，先站里面一点。':'站里面一点，车快来了。'),N(cl?'她把自己围巾的尾端往你肩旁挪了一点，还是不够长，两个人先笑了。':'车到时，她向你挥了挥手，没有替你安排假期。')],{winterBus:true},{cg:'winter'})],
        11:['寒假 · 草稿背面的小菜谱',[Y('我妈让我记买菜的东西，结果我在背面画了一路。现在土豆后面跟着一只猫。'),U('那还能买对吗？'),Y('能。我刚才差点把“两个”当成猫耳朵。')],opt('list','陪她把清单和小画分开',[Y(cl?'这张旧的给你。你上次那只鸟还在的话，它们能凑一页了。':'我留着旧的。下次买菜拿新的，免得我妈也认错。')],{catList:true})],
        12:['开学 · 椅子上的书包',[Y(cl?'你先坐，我挪。':'这儿有位置，我把书包拿开。'),U('你刚才在画什么？'),Y('公交车上那个总掉下来的吊环。不是花。'),N('你还没开口，她已经把本子转了个方向。')],opt('look','先看完那页，再讲自己的假期',[Y('这样看是不是就像了？'),U('像。刚才像是我拿反了。'),N(cl?'她笑着拿本子轻轻挡住嘴，椅子却又往你这边转了一点。':'你们轮流讲了假期，预备铃响后各自回座位。')],{newTermTalk:true})],
        13:['午休 · 用橡皮当镇纸',[Y('嘘。别拿走，底下有东西。'),N('橡皮下面压着一张很小的便签，写的是下午换教室。'),U('你直接放进书里不就好了。'),Y('放进书里，我就会连书一起忘。')],opt('remind','约好出发时互相提醒，不替她包办',[Y(cl?'那你也别先走。我还不知道往哪边拐。':'好，谁先收好书就叫另一个。')],{classroomReminder:true})],
        14:['四点半过后 · 等到的人',[N('你按约到校门，四点四十、四点五十。林遥跑来时，额前头发有一点湿。'),Y('对不起。画室临时让我们收材料，我应该先给你发消息，手机却放在包里。'),U('我不知道你来不来，也不知道要等多久。'),Y('是我没说。你生气也可以。我不能要你一直站着。')],opt('reset','说明不高兴，约好下次先确认时间',[U('今天先不赶纸店。要再约，提前说能不能来。'),Y('好。我回去把有空的时间发给你，你再选。')],{reschedule:true,waited:true})],
        15:['纸店之前 · 不替你留两个位置',[Y('周日车程要一个多小时，下午还得试纸。我知道老师那边也是全天。'),U('我在想选哪边。'),Y('你想好了告诉我。不能来，我就和画室同学去，不让你欠着。')],opt('honest','说明周日只能留给一件事',[Y('嗯。你不是为了拒绝谁才选另一边。')],{paperDiscussed:true})],
        16:['回来的周一 · 你不在的地方',[Y(f.paperTrip?'上次你挑的纸我试了，颜色没有浮起来。':f.trialTalk?'听说你试讲完了？我那天和画室同学去的纸店，回来差点坐过站。':'纸店我已经去过。你那天没来，我没替你买，不知道你需要哪种。'),U(f.paperTrip?'那还剩多少？':'你后来买到了吗？'),Y(f.paperTrip?'还能用一阵。不用因为去过就每周再去。':'买到了。下一次有空，可以再做别的。')],opt('listen','听她讲完，也说自己的那一天',[N('你们交换了两段不一样的周日。谁也没有把没去过的地方说成一起的回忆。')],{sharedDifferentDay:true})],
        17:['画本 · 不急着给你看',[Y('这页先别翻。不是画坏了，是我还没想好要不要给人看。'),U('那我看别的。'),Y('嗯。这张可以。')],opt('respect','停在她愿意分享的那一页',[Y(cl?'你坐这儿。我想画旁边的窗影，别动两分钟就好。':'谢谢。这张是公交站，你可能认得。')],{drawingPrivacy:true})],
        18:['晚饭前 · 一张不用回复的纸条',[Y('你家最近是不是有事？如果不想讲也没关系。'),U('我爸在看外地的工作。还在谈。'),Y('那你今天早点回去。这个给你，路上别边走边看。'),N('是一张小画。没有劝人开心的句子，只画了今天窗边那只歪头的鸟。')],opt('take','收下，说明自己之后再慢慢说',[Y(cl?'好。我明天还在这儿。':'好，需要人听的时候再叫我。')],{birdNote:true})],
        19:['考前 · 你来问，我也会卡住',[Y('我昨天给人讲题，讲到一半自己不会了。'),U('后来呢？'),Y('一起去问老师。比我硬讲个错的好。')],opt('question','互相核对一道题，把不会的留下来问',[U('这一步我也不确定。先圈着。'),Y('下课一起问。谁也别偷偷把红圈擦了。')],{askedTogether:true})],
        20:['新外套 · 袖口长了半截',[Y('我妈说再长高点就合适。可我现在就得穿。'),N('她把袖口折起来，折了两层，两边还是不一样长。'),U('右边多折了一点。'),Y('那你告诉我，哪儿算一样。')],opt('summer','一起走到放假后仍会经过的路口',[Y(cl?'暑假想叫你出来，要先问哪天有空，对吧？':'暑假有空可以把新画发群里。你也发点自己的。'),U(cl?'对。你问，我会认真回。':'好，不只等开学才说话。')],{summerContact:true},{cg:'spring'})]
      };
      const [title,ls,first]=common[w];
      let second=opt('leave','说明今天要忙，先把自己的事情做完',[U('今天我不能留这么久，先走了。'),Y('好。下次有空再说。')],{}, {effects:{friend:1},entry:'你说明今天无法留下，没有把普通告别写成失约。'});
      if(w===8)second=opt('pause','问她要不要先放下，陪她收好画具',[Y('好。我现在再画也只会擦。等明天早上再看。')],{drawingPause:true});
      if(w===14)second=opt('space','今天先回去，暂时不再约纸店',[U('我现在想先走。以后有事先发消息，别让我猜。'),Y('好。对不起，我记住了。')],{waited:true,reschedule:false});
      const e=scene(id,title,ls,[first,second],{effects:cl?{warm:3}:{friend:2}});
      if(S.october.mode==='undecided')e.choices=[opt('closer','想和她再熟一点，留下来认真聊',[Y('好。那先从今天说起，不用一下把以后都约好。'),...first.after],first.flags,{...first, key:'closer',text:'想和她再熟一点，留下来认真聊',route:'closer',effects:{warm:3}}),opt('friends','作为朋友留下，听她讲完',[Y('好，坐。你也说说你今天的事。')],first.flags,{route:'friends',effects:{friend:3}}),second];
      return e;
    }
    if(id==='mom'){
      const rows={
        7:[M('运动会结束，嗓子还好吧？别光给别人喊，自己的水也记得喝。'),U(f.cameraKept?'我帮他们拍了照。':'我有自己的安排，摄影是他们做的。'),M('那饭先吃，照片不急着现在找。')],
        8:[M('外套放椅背上。我明天要早走，早饭在锅里。'),U('你去哪儿？'),M('以前的同事找人替半天班。我先去看看。')],
        9:[M('你这袖子怎么蓝了一点？'),U(f.palette?'洗调色盘沾的。':'学校的颜料，不知道在哪儿蹭的。'),M('先泡着。别拿热水烫，越着急越洗不掉。')],
        10:[M('意向表你自己想过了吗？'),U('想过一部分，还有些要问。'),M('那就问。你爸那边我也会说，不用你一个人把所有问题答完。')],
        11:[M('假期最后几天，不要光顾着收作业。鞋穿着还挤不挤？'),N('你把脚往前伸了伸，鞋头碰到了桌腿。'),M('开学前去试一双。先看合不合脚。')],
        12:[M('开学又坐原来的地方吗？'),U('现在还没换。'),M('那我不替你把去年那张座位小图扔了，放抽屉里。')],
        13:[M('冰箱上那盒饭是我明天带的，别热错了。'),U('你开始固定上班了？'),M('先排三天。我也得习惯，不是明天一下全顺了。')],
        14:[M('今天回来比平时晚。'),U(f.waited?'我等了同学一会儿，后来把时间说清楚了。':'路上绕了一段，没赶着回来。'),M('吃饭吧。要不要讲，吃完再说。')],
        15:[M('周日你要出门？先告诉我几点回来，我好算饭。'),U('还要在两件事里选一件。'),M('定了再讲。选完也不用惦记另一顿饭有没有多好吃。')],
        16:[M('你这周把什么事做完了？'),U('有些做完，有些又得往后排。'),M('那先吃。今天我也有件没做完的事，饭后再忙。')],
        17:[N('冰箱门上的便签写着另一个城市的地址。父亲把联系电话抄进手机，又核了一遍。'),L('father','还没定。先问清楚宿舍和工时，不能只看工资那一行。'),M('你有想问的也问。我们不是已经瞒着你决定了。')],
        18:[L('father','岗位基本谈好了。暑假走，回来的车次还要看排班。'),M('钱多一些，来回也要花。今晚一起把清单看完。'),U('我舍不得，也想知道你在那边怎么住。'),L('father','舍不得我听见了。住处我问清了再拍给你，不只说一句挺好。')],
        19:[M('我周六有班。要是你去学校，晚上各自回来再一起吃。'),U('那谁买菜？'),M('我下班路过。你回得早，就把米淘上，不用把我所有事都接走。')],
        20:[N('父亲把行李箱摊开，两件衣服拿出又放回。'),L('father','外套先给你买。我那件旧的还能穿。'),M('你也要带换洗的。别又说自己什么都不用。'),U('我帮你把充电器放侧袋，你到了告诉我们。')]
      };
      return scene(id,w>=17?'家里 · 把话放到饭桌上':'晚饭 · 不只讲学校',rows[w],[opt('talk','坐下来，听完也讲自己的近况',[M('汤在锅里。你接着讲，我再盛一点。')],{['family'+w]:true},{cg:w===18?'dinnerYear':null}),opt('help','边帮忙收拾，边把具体安排说好',[N('你收碗，妈妈擦桌子。没说完的事，洗碗的时候又接上了。')],{['family'+w]:true})],{cost:0,effects:{family:3,energy:10}});
    }
    if(id==='pursuer')return pursuitScene(S);
    return null;
  }
  function loanScene(S){
    return scene('friend','寒假消息 · 五十块的车费',[A('返程的钱差五十。家里要明天才能转来，你能借我一下吗？'),U('是借，到时候还，对吗？'),A('对。不是让你请客。返校后我和你确认日期。')],[opt('fifty','借五十，记清用途和归还安排',[A('收到了。周十六前还你，要是提前到了我先说。')],{}, {money:-50,loan:50}),opt('twenty','只借自己能承担的二十',[U('我只能借二十，剩下的你再想办法。'),A('好，我去问能不能改一班便宜的车。二十我也记着。')],{}, {money:-20,loan:20}),opt('no','说明不能借，帮他查返程选择',[U('我这边不能借。能不能先问问车站改签，或者再联系家里？'),A('嗯，我再联系一下。你不用为了帮我把自己掏空。')],{loanRefused:true})]);
  }
  function repayScene(S){
    const due=S.year.loan-S.year.loanPaid;
    return due?scene('friend','借过的钱 · 把记录对上',[A(`上次借的 ${due} 块，我今天带来了。你看看数。`),U('你回来那天后来顺利吗？'),A('赶上了。只是一路都在找充电口。')],[opt('receive','收回借款，对清账，不另算奖励',[U('收到了。我把记录改掉。'),A('好。下次一起吃饭另算，不拿请客抵借款。')],{loanSettled:true},{repay:due}),opt('later','这次没带收款方式，再约下一次',[U('我没带手机，先别把现金夹书里。暑假前再对一下。'),A('行，钱还算我欠着。')],{loanDeferred:true})]):scene('friend','返程以后 · 普通同学的闲话',[A(S.year.flags.loanRefused?'上次没借也没事，我后来联系上家里了。今天不是来再借。':'我回程在车上睡过站，差一点跟着司机进停车场。'),U('你怎么醒的？'),A('司机拍我肩膀，说同学你再睡就要跟我上班了。')],[opt('laugh','听他讲完，自己也讲一件糗事',[N('你们各说了一件不太想让全班知道的事，谁也没拿出手机录。')],{azheTalk:true}),opt('repair','聊起他想做的东西，不替他定方向',[A('还没想好。先试着做，坏了就知道自己缺哪一步。')],{azheInterest:true})]);
  }
  function pursuitScene(S){
    const v=visitor(S),P=t=>L(v.who,t),status=S.year.pursuit;
    if(status==='stop')return null;
    if(status==='unmet')return scene('pursuer','后门 · 今天第三次路过',[N(`后门响了两下。${v.name}抱着广播站的选曲本，探头看向你。`),P('我叫'+v.name+'，隔壁班的。说是路过有点假——我已经路过三次了。'),U('找我有事？'),P('想认识你。听起来太直接了吗？这个周末广播站试节目，你想来的话，我给你留把椅子。'),N('赵程没起哄，只把门边那把椅子挪开，让你们说话。')],[opt('welcome','愿意认识，但先不答应暧昧',[U('可以认识。先说好，我不一定会接受你想的那种关系。'),P('好。我先把邀请发你，来不来你自己定。')],{}, {pursuit:'welcome',cg:'visitor'}),opt('friends','明确只当普通同学',[U('当同学可以。我不想让你误会。'),P('好，那我以后叫你名字，不再把邀请说成约会。')],{}, {pursuit:'friends',cg:'visitor'}),opt('stop','礼貌而明确地拒绝，别再追我',[U('谢谢你直接说。我不想发展，也不希望一直被等着。'),P('明白。那我不再来门口找你。你不用再想办法拒绝一遍。')],{}, {pursuit:'stop',cg:'visitor'})]);
    const visits={
      10:status==='friends'?[P('我来收班级点歌。一班两首，认识我也不能插队。'),U('那我还以为自己能多投一首。'),P('想得美。普通同学也是这个待遇。')]:[N(`${v.name}从本子里拿出一张排得很满的纸，刚递过来又收回去。`),P('我本来列了八种邀请你的说法。现在觉得，给你看了你可能更想跑。'),U('八种？'),P('最后只剩一种了：有空一起听节目吗？没有也直接说。'),U('还有，不用每次都带糖。'),P('好。我自己吃，真的挺甜的。')],
      13:status==='friends'?[P('你推荐的那首歌没排上，时长不够。不是因为我们认识我就能多留三分钟。'),U('那下次再投。'),P('行。节目单贴出来你自己看，我不会在班里喊你。')]:[P('我录了四遍开场白。第一遍太快，第二遍把名字念错，第三遍忘开麦。'),U('第四遍呢？'),P('第四遍终于只是很普通。你要不要听？只听，不用给我别的答复。'),N('耳机里只有节目，没有突然插进来的一段公开告白。')],
      16:status==='friends'?[P('广播站在招下一组。我想报正式主持，不只是替人放音乐。'),U('要准备什么？'),P('先交一段两分钟的录音。你上回说的停顿，我这次真练了。')]:[P('今天我得先走，主持选拔要交录音。'),U('你也会有赶时间的时候。'),P('当然。我挺想见你，也挺想把自己的事做好。'),N('这次没有礼物，也没有邀请。对方把录音本抱好，跑去楼梯那边。')],
      20:status==='friends'?[P('暑假节目停播，我终于不用每天卡着预备铃跑了。'),U('开学还做？'),P('做。到时候你们新班有好听的歌，照常投。认识也不插队。')]:[P('我暑假去练主持。没法老在你们后门出现了。'),U('你可以发消息，先问有没有空。'),P('好。认识你很高兴，但我不把你的每一句回复都当成答应。'),N('这段热闹没有替你决定和谁恋爱。对方也有自己想去的地方。')]
    };
    return scene('pursuer',status==='friends'?'走廊 · 正常的一声招呼':'广播站 · 热闹也先问一声',visits[S.week]||visits[10],[opt('same',status==='friends'?'作为同学聊完，各自去忙':'保持之前说清的边界，认真回应近况',[P('好，收到。我不会把这个当作别的答应。')],{['visitorWeek'+S.week]:true}),opt('stop',status==='friends'?'以后只在集体活动打招呼':'说明现在不想继续被追求',[P('我知道了。以后不再单独邀请，你不需要哄我。')],{}, {pursuit:'stop'})],{effects:{friend:2}});
  }
  function bonus(S){
    if(S.week<9||S.year.pursuit==='stop')return null;
    if(S.year.pursuit==='unmet'&&S.week<=12)return pursuitScene(S);
    return [10,13,16,20].includes(S.week)?pursuitScene(S):null;
  }
  function weekend(S){
    const w=S.week,f=S.year.flags,v=visitor(S),P=t=>L(v.who,t),cl=sweet(S);
    const make=(id,title,ls,choices,extra={})=>scene(id,title,ls,choices,{cost:1,energy:-10,day:0,tag:'本周故事',effects:{friend:1},scene:'classroom',desc:'这一周的独立经历；选完会留下后续回应。',...extra});
    const all={
      7:[make('headphone7','阿哲：先听出哪里不对',[A('耳机一边没声，先别急着拆。你用自己的播放器试一试。'),U('也可能是这首歌本来就这样。'),A('那就换一首再说。')],[opt('compare','比较两个音源，不碰危险电路',[A('换了就好了。省下一次乱买东西。')],{headphone:true})]),make('stands7','林遥：看台散场以后',[Y('胶带放左边，剪刀套上盖。我们最后再走。'),U('你是不是又摸到头发了？'),Y('……这次你先别笑。')],[opt('tidy','一起把散场的工具收好',[Y(cl?'下回我先叫你来。不是只叫你来收东西。':'谢谢。下回你忙就提前说，我再找人。')],{standsTogether:true})],{day:1,effects:cl?{warm:2}:{friend:2}})],
      8:[make('album8','赵程：把私人相册排完',[Z('每张只写发生了什么，不给别人乱编心里话。')],[opt('sort','核对日期和在场的人',[N('你们删掉两句想当然的说明。照片里没发生的，没有写进去。')],{album:true})],{cost:2,energy:-18}),make('dry8','妈妈：晒一下午的被子',[M('太阳一会儿就转过去。你帮我把里面那条也拿出来。')],[opt('sun','帮忙晒好，再给自己留一段空白',[N('你坐在阳台边，闻到被套晒热的味道。手机没响，你也没急着去看。')],{sunBlanket:true})],{day:1,scene:'home',energy:14,effects:{family:2}})],
      9:[make('radio9','走廊来客：广播站的空椅子',[P(S.year.pursuit==='friends'?'节目试播。你当普通听众来，我也欢迎。':'椅子真的留了。我先试一次，尴尬的话你可以笑。')],[opt('listen','听完节目，把反馈说具体',[P('原来第二句太快。好，我再试。谢谢你没只说“挺好”。')],{radioVisit:true})],{gate:S.year.pursuit==='unmet'?'先回应教室后门的邀请':S.year.pursuit==='stop'?'已明确拒绝，不再出现私人邀请':''}),make('stairs9','林遥：楼梯口的雨声',[Y('雨还没小。你赶时间的话先去借伞，我把调色盘带回去。')],[opt('wait','留一段等雨，聊点不急的事',[Y(cl?'你站近一点，鞋别踩在外面。上回淋湿那双干了好久。':'靠里面站，别把刚洗好的盘子又淋脏。')],{stairsRain:true})],{day:1,energy:4,effects:cl?{warm:2}:{friend:2}})],
      10:[make('exam10','期末之前：自己解释一道错题',[L('teacher','会选答案以后，试着把为什么说清楚。')],[opt('explain','完整做一次模拟讲解',[N('讲到第三步，你发现自己原来只是记住了写法。重新查完以后，这一步才成了自己的。')],{examPractice:true})],{cost:2,energy:-22,effects:{study:4}}),make('winter10','放假前：一起等最后一班公交',[Y('假期画室换了时间。我到家再发你，别把整天都空着等。')],[opt('bus','留一段听她讲假期安排',[Y(cl?'我也想见你。就是先把能来的日子说清楚。':'有空可以一起去图书馆，大家先对时间。')],{holidayPlan:true},{cg:'winter'})],{day:1,effects:cl?{warm:2}:{friend:2}})],
      11:[make('family11','年后：把家里的旧相片装好',[M('这张背面有日期，别贴住。你爸年轻那会儿头发也乱。')],[opt('album','听妈妈把照片里的人讲清楚',[N('你发现有个人并不是自己以为的亲戚。妈妈讲完，又把那张递回你手里。')],{familyAlbum:true})],{scene:'home',energy:8,effects:{family:2}}),make('plans11','寒假最后：给自己排一次返校清单',[N('作业、车次、校服，纸上没有谁的好感进度。')],[opt('pack','先收实际要带的东西，再留空白',[N('你把多带的两本书拿出来。书包轻了，开学也没有因此少一种可能。')],{packed:true})],{day:1,scene:'home',energy:12,effects:{study:1}})],
      12:[make('record12','赵程：补录不是点一下开始',[Z(f.filmDuty==='audience'?'你说只当观众，今天来帮一次也可以，不自动变成长期。':'周六留两段，去找安静的位置录完，再回来试听。')],[opt('record','实际留一整天，把收音补完',[Z('这次名字写录音协助。你先核一下，别把不是你做的也算上。')],{recorded:true})],{cost:2,energy:-20}),make('queue12','林遥：排队买新本子',[Y('不买封面最好看的，先看看纸会不会洇。')],[opt('test','陪她试纸，也给自己选一页',[Y(cl?'你这本要不要也画只鸟？我保证这次不画成饭勺。':'这支笔先给你试。别只听我说。')],{notebookTrip:true})],{day:1,effects:cl?{warm:2}:{friend:2}})],
      13:[make('radio13','广播站：今天是一群人的节目',[P(S.year.pursuit==='friends'?'你推荐的歌不一定能排上，我们一起看时长。':'我把私下那段话删了。节目给全校听，你不用替我承受起哄。')],[opt('group','和大家一起排节目，不当公开表白',[N('最后留下的是大家选的两首歌，没有拿谁的名字当噱头。')],{radioGroup:true})],{gate:['friends','welcome'].includes(S.year.pursuit)?'':'没有接受节目邀请'}),make('meal13','妈妈上班后：自己安排一顿饭',[M('剩菜在冰箱，吃之前热透。不会弄就等我回来一起做。')],[opt('cook','和妈妈核清步骤，自己把饭安排好',[M('这样就行。你能照顾自己，我也不用下班一路催着走。')],{ownMeal:true})],{day:1,scene:'home',energy:12,effects:{family:2}})],
      14:[make('retake14','阿哲：帮他拍一张合适的证件照',[A('不用把我修成另一个人。衣领歪了你提醒一下。')],[opt('photo','确认他满意，再把文件交给他',[A('这张行。文件给我，不要替我传群里。')],{azhePhoto:true})]),make('river14','一个人的河边：不急着回复',[N('消息还在手机里。你把屏幕按灭，先听了一会儿水声。')],[opt('pause','把不高兴写清，等平静后再说',[N('纸上没有谁应该永远理解谁。你先写自己等了多久，又希望以后怎样说。')],{namedFeelings:true})],{day:1,energy:20,effects:{}})],
      15:[make('retake15','赵程：周六补一个空镜头',[Z('我自己的时间也排好了，今天只补这个，不临时拉你再做半部片子。')],[opt('shot','留一段补完，按约收工',[N('拍好之后，你们真的收了机子，没有把“都来了”当成继续占时间的理由。')],{retake:true})]),make('trial15','周日 A：参加学习小组试讲',[L('teacher','从准备到讲完都在今天。不赶下一场，就慢慢把问题说清楚。')],[opt('teach','留整天，试着讲给别人听',[N('第一遍有人没懂。你换了一个例子，才看见对方抬头。')],{trialTalk:true})],{day:1,cost:2,energy:-24,effects:{study:5},desc:'和纸店同在周日；全天两段，只能选其一。'}),make('paper15','周日 B：和林遥去远郊纸店',[Y('回程的车我查过了。你真能留一整天，我们才出发。')],[opt('paper','留整天，试纸、吃饭、坐车回来',[Y(cl?'你今天没有一路看表。这样挺好的。':'你看，这种纸比学校旁边那家薄，带回去得垫硬板。'),N(cl?'回程时，她把纸袋换到外侧，肩膀轻轻碰到你，又没有急着让开。':'你们把纸角垫好，轮流拎了一路。')],{paperTrip:true},{cg:'spring'})],{day:1,cost:2,energy:-18,effects:cl?{warm:4}:{friend:3},gate:S.october.mode==='undecided'?'先和林遥明确是朋友还是想继续靠近':'',desc:'和试讲同在周日；全天两段，只能选其一。'})],
      16:[make('makeup16','林遥：这次先确认能不能来',[Y('我确认过画室时间了。周六留一段去近一点的画材店，行吗？不行我们再约。')],[opt('meet','实际赴约，不把一句原谅当完成',[Y('我今天提前到了。不是要你夸，是不想再让你站着猜。'),U('那走吧，这次不用赶。')],{makeupKept:true},{cg:'spring'})],{gate:f.reschedule?'':'没有约定过这次补约',effects:cl?{warm:3}:{friend:2}}),make('budget16','自己的零钱：分开借款和花销',[N('兼职收入、借款、买书的花销各有一行。')],[opt('check','把零钱账核对一次，再定下次花销',[N('你没有把没收回来的钱当成已经在手里。想买的东西，先写到另一页。')],{budget:true})],{day:1,energy:8,effects:{}})],
      17:[make('route17','父亲：查一次外地通勤',[L('father','宿舍到厂门要坐两站。你帮我看看末班车，别光看白天。')],[opt('bus','一起查清通勤，记下备用联系方式',[L('father','这条我没想到。到了以后我自己再走一遍，和图上不一样就告诉你。')],{fatherRoute:true})],{scene:'home',energy:0,effects:{family:2}}),make('window17','林遥：两分钟不乱动的模特',[Y('不是画你的脸，画校服肩上的光。你可以看窗外。')],[opt('pose','留一段让她画完，也收下不完美的试稿',[Y(cl?'下次我还想画。要问你有没有空的那种。':'谢谢。你也可以试着画，别一开始就和我比。')],{windowPose:true})],{day:1,effects:cl?{warm:3}:{friend:2}})],
      18:[make('dinner18','家里：把岗位清单看完',[M('吃住和收入分开算，不要只看最后那个大数字。')],[opt('list','留一段问清具体条件，也说舍不得',[L('father','我听见了。不是说走了就不用管家里的日子。'),N('你们在清单上添了探亲和通话时间，没有写成谁替谁作出的决定。')],{jobTalk:true},{cg:'dinnerYear'})],{scene:'home',energy:8,effects:{family:3}}),make('sound18','赵程：先问别人愿不愿意入镜',[Z('上次有人说不想被拍。我把那段移走，你帮我找还有哪里露了脸。')],[opt('privacy','逐段核对，移除未同意的画面',[N('片子短了十几秒。你们没把这当成别人欠作品的。')],{privacyCut:true})],{day:1,cost:2,energy:-18})],
      19:[make('prepare19','学习展示：真实的一整天准备',[L('teacher','报名表上有你。今天准备完，再决定最终上台的分工。')],[opt('prepare','准备、试讲、互问，各做一遍',[N('你们没有只对着答案分角色。有人卡住时，先把那一步留在白板上。')],{prepared:true})],{cost:2,energy:-26,effects:{study:5},gate:f.applied?'':'还没有在本周报名'}),make('feedback19','林遥：把没被选上的画拿回来',[Y('这张没选上。不是别人故意看不见我，是我自己也知道没处理好光。')],[opt('listen','听她说不甘心，不替她否认结果',[U('难受就先难受。我能陪你把它拿回去。'),Y('好。明天我再看怎么改，今天先不改。')],{unselectedDrawing:true})],{day:1,effects:cl?{warm:2}:{friend:2}})],
      20:[make('repay20','阿哲：暑假前把借款对清',[A('放假前再问你一次，钱这次怎么给方便？')],[opt('receive','收回剩余借款，原额入账',[N('你们把那笔旧记录划清，之后吃饭各付自己的。')],{loanSettled:true},{repay:S.year.loan-S.year.loanPaid})],{gate:S.year.loan>S.year.loanPaid?'':'没有未结清的借款',energy:0}),make('summer20','放假后：提前约一次，不先占整夏天',[Y('暑假我还要上画室。想出来的时候，我们先对时间。')],[opt('contact','留下联系方式和真实可用的时段',[Y(cl?'我会找你的。你也别每次都等我先问。':'好。有新画我发你，也听你讲自己的事。')],{summerMeetPlan:true},{cg:'summer'})],{day:1,effects:cl?{warm:3}:{friend:2}})]
    };
    return (all[w]||[]).map(e=>({...e,lines:lines(e,e.lines),choices:e.choices.map(c=>({...c,after:c.after,entry:c.entry||`你完成了「${e.title}」。${c.after.at(-1)?.[1]||''}`}))}));
  }
  function available(S,e,c=null){
    if(e.gate)return e.gate;
    if(c?.money<0&&S.weekend.wallet < -c.money)return `零用钱不足 ${-c.money} 元，可选择其他回应`;
    return '';
  }
  function apply(S,e,c){
    const y=S.year;if(y.history.some(x=>x.week===S.week&&x.id===e.id))return false;
    y.history.push({week:S.week,id:e.id,key:c.key});Object.assign(y.flags,c.flags||{});
    if(c.pursuit)y.pursuit=c.pursuit;if(c.route)S.october.mode=c.route;
    if(c.loan)y.loan=c.loan;
    const cash=(c.money||0)+(c.repay||0);
    if(cash){S.weekend.wallet+=cash;S.weekend.ledger.push({week:S.week,amount:cash,text:c.repay?'阿哲归还借款':'借给阿哲的返程车费'});}
    if(c.repay)y.loanPaid=Math.min(y.loan,y.loanPaid+c.repay);
    return true;
  }
  function settle(S){
    if(S.week<7||S.year.settled.includes(S.week))return [];
    const y=S.year,f=y.flags,notes=[];y.settled.push(S.week);
    if(S.week===7&&S.october.sportsPhoto&&!f.cameraKept){if(f.cameraDeclined){f.cameraCancelled=true;notes.push('你提前说明无法负责摄影，赵程和阿哲重新分工；当天摄影没有你的署名，之后仍可重新合作。');}else{f.cameraMissed=true;notes.push('运动会摄影约定没有兑现。赵程和阿哲完成了工作，之后会按这件事重新确认你的时间。');}}
    if(S.week===15&&!f.trialTalk&&!f.paperTrip)notes.push('你没有参加那两个周日安排。他们各自完成了当天的事，你把时间留给了别的生活。');
    if(S.week===19&&f.applied){f.showcaseResult=f.prepared?'selected':'reserve';notes.push(f.prepared?'展示试讲后，小组进入校内交流环节。名额属于完成准备的小组，后面还有工作要做。':'登记之后没有完成准备，最终没进这次交流。韩老师把下次可参加的旁听时间发给了你。');}
    if(S.week===10||S.week===20){
      const base=S.week===10?y.baseline:y.termStart,span=S.week===10?4:10,delta=Math.max(0,S.study-(base??S.study));
      const r=window.CampusBalance.rank(delta*4/span,S.energy);
      if(!y.exams.some(x=>x.week===S.week))y.exams.push({week:S.week,rank:r,study:S.study,delta,energy:S.energy});
      S.seat=r-1;notes.push(`${S.week===10?'高一上':'高一下'}期末：班级第 ${r}/44。按本学段投入和临场精力独立记录；之前的月考不被改写。`);
      if(S.week===10)y.termStart=S.study;
    }
    return notes;
  }
  function recap(S){
    const f=S.year.flags,rows=[];
    rows.push(f.cameraKept?'运动会镜头里，有你真正留下的那一段。':f.cameraCancelled?'你提前说明不能负责摄影，他们重新分了工。你没有那天的署名，也没有被当作突然失踪的人。':f.cameraMissed?'运动会没有等到你。后来你们仍能合作，但那天的署名没有你。':'运动会的相机由别的同学拿着，你有自己的生活。');
    rows.push(f.paperTrip?'纸店那天，你们真的坐了来回两趟车。学习试讲由别的小组完成。':f.trialTalk?'你试着把一道题讲给别人听。林遥去了纸店，回来把见闻讲给你。':'那个有两场安排的周日，你留给了其他事情。');
    if(f.waited)rows.push(f.makeupKept?'等人的不愉快没有被一句道歉盖过。后来那次约，她提前确认，也真的先到了。':'校门口那次等待，你把自己的不高兴说了出来。没有赴过的改约，不写成共同回忆。');
    rows.push(S.year.loan>S.year.loanPaid?`阿哲还有 ${S.year.loan-S.year.loanPaid} 元借款未结，账仍保留。`:S.year.loan?'借出的返程车费已经原额归还，没有变成友情奖励。':'你没有借出车费。阿哲仍有自己的办法，你们仍能当同学。');
    rows.push(S.year.pursuit==='stop'?`${visitor(S).name}接受了拒绝，没有继续在门口等你。`:S.year.pursuit==='friends'?`和${visitor(S).name}说清了同学边界，热闹也能留在普通友情里。`:S.year.pursuit==='welcome'?`${visitor(S).name}曾很热情地靠近；认识并不等于答应恋爱。`:'走廊上还有没认识的人。这一局没看见的故事，没有被补成已经发生。');
    rows.push(f.family18||f.jobTalk?'父亲暑假要去外地。饭桌上，你们谈过吃住和以后怎样联系。':'父亲的外地岗位已经确定。你听到的是家里后来讲给你的消息，没参与的商议不冒充亲历。');
    if(sweet(S))rows.push('你和林遥已经有了一些靠近。正式表白仍留在高二，不把相处舒服直接判成恋爱成功。');
    else rows.push('林遥仍是同学或朋友。高一结束，没有替你安排一段从未开始的恋爱。');
    return rows;
  }
  return {weeks,cg,fresh,normalize,extend,weekday,weekend,bonus,visitor,sweet,lines,available,apply,settle,recap};
})();
window.CampusYearOne.extend(window.CAMPUS_CONTENT);
