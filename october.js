/* Two small continuation weeks. Original narrative, MIT. */
window.CampusOctober = (() => {
  const line=(id,who,text,mood='neutral')=>({id,who,text,mood});
  const initial=()=>({mode:'undecided',introPending:false,seatBreak:false,poster:false,milk:false,sportsPhoto:false,metAzhe:false,tasteShared:false,exam:null});
  const cg={
    savedSeat:{scene:'saved-seat-cg',title:'书包放到另一边',period:'十月',text:'她把书包抱起来。\n空出的椅子，朝你这边转了半圈。',duration:5},
    drawingMargin:{scene:'drawing-margin-cg',title:'画在边角的小鸟',period:'十月',text:'你按着翘起的纸角。\n她把刚才没画好的那一笔，慢慢补上。',duration:5.5},
    warmCarton:{scene:'warm-carton-cg',title:'还有一点温',period:'十月',text:'纸盒沿着桌面，被推到了你手边。\n她自己那盒，也还没打开。',duration:4.5}
  };
  const extend=C=>{
    C.weeks.push(
      {date:'10 月 7 日',name:'第五周 · 隔着过道也能说话',intro:'月考后的座位表已经贴好。\n你抱着书，重新找了一遍自己的名字。',quiet:'下课时，过道里总有人来回走。',diary:'新位置还不习惯。但去找一个人，可以自己走过去。'},
      {date:'10 月 14 日',name:'第六周 · 在纸角多画一点',intro:'运动会通知贴到了后门。\n课桌上多了报名表、海报草稿和一卷没拆封的胶带。',quiet:'有人练起跑，有人借剪刀。窗外还是上课时那片天。',diary:'这一周没发生大事。几张纸、一次午饭，都有了具体的样子。'}
    );
    const observations={classroom:['赵程坐远了一点。喊你时，他会先敲两下桌面。','林遥把运动会海报铺在桌角，橡皮压着翘起的一边。'],canteen:['排队的时候，你又看见了那只熟悉的饭盒。','窗边那张桌子还没坐满。林遥把汤碗往里面挪了挪。'],track:['运动会还没到，跑道边已经有人练起跑。','赵程在研究拍摄位置，阿哲蹲在旁边试三脚架的卡扣。'],home:['你把新座位画在手记里。旧位置的小方格还留着。','书包侧袋里多了一张海报草稿的边角纸。也可能只是今天的收据。']};
    for(const [place,items] of Object.entries(observations))C.places[place].observation.push(...items);
    C.exercises.push(
      {title:'月考以后，再看那个负号',question:'化简：5 − 2(x − 1)',steps:['5 − 2x − 2','3 − 2x','3 − 2x'],wrong:0,solution:'−2 乘上 −1 应该是 +2，所以结果为 7 − 2x。',hint:'换了座位，错题也可以重新看。'},
      {title:'先算哪一步',question:'计算：2 + 3 × 4',steps:['(2 + 3) × 4','5 × 4','20'],wrong:0,solution:'先乘后加，3 × 4 = 12，再加 2，结果为 14。',hint:'海报还在等你。先把眼前这一小步写清楚。'}
    );
    C.familyLines.push('妈妈把洗好的校服递给你。\n「换座位了？新地方能看清黑板吗？」','「运动会哪天？」\n妈妈把保温杯放在桌边。「那天早上早点叫你？」');
  };
  function arrival(S){
    return [line('oct.arrive.1','narrator',`你原来坐在第 ${Math.floor(S.october.exam.oldSeat/6)+1} 排。现在抱着书，站到了第 ${Math.floor(S.seat/6)+1} 排旁边。`),
      line('oct.arrive.2','zhaocheng',S.promiseKept?'班旗那张合照还在吧？别夹卷子里一块儿交了。':S.promise==='yes'?'这次班旗我收好了。运动会还要拿出来。':'运动会又有活了。不过先不急，等你放好书再说。'),
      line('oct.arrive.3','narrator',S.warm>0?'你把书摞到桌角。林遥从过道另一边走来，拿着那本你见过的课堂笔记。':'你把书摞到桌角。林遥从过道另一边走来，把一张新课表放在桌上。'),
      line('oct.arrive.4','linyao',S.noteKept?'上次那份笔记我夹在里面了。这里不懂的话，下课再问。':S.warm>0?'这个月的课表在最后一页。调座位时别把书落下。':'老师让我发的。你看看，周四那节课换了。'),
      line('oct.arrive.5','you','找到了。先坐下来，等会儿再过去。')];
  }
  function seat(S){
    return [line('oct.seat.1','narrator','下课铃响了。林遥桌边的椅子上，放着她的帆布书包。'),
      line('oct.seat.2','linyao','这张椅子没人。你要坐一会儿吗？'),
      line('oct.seat.3','narrator','她把书包抱到腿上，椅子往外转了一点。'),
      line('oct.seat.4','you',S.noteKept?'这回不用抄两份笔记了吧？':'换了位置，还真不太习惯。'),
      line('oct.seat.5','linyao',S.noteKept?'先别急着高兴。画室的课还没排出来。':'我刚才也回原来的座位拿了一次水杯。','smile')];
  }
  function seatAfter(mode){
    return mode==='closer'?[
      line('oct.seat.c1','you','那以后下课，我能过来坐这儿吗？'),
      line('oct.seat.c2','linyao','能啊。你先叫我一声，我把书包拿开。','smile'),
      line('oct.seat.c3','you','每次都要叫？','smile'),
      line('oct.seat.c4','linyao','……看见你过来就拿。','smile'),
      line('oct.seat.c5','narrator','你还没坐稳，上课预备铃就响了。她笑着催你回去，却没把书包马上放回那张椅子。')
    ]:[line('oct.seat.f1','you','这个位置看黑板比我那儿斜。'),line('oct.seat.f2','linyao','那你帮我看看，左下角那行是不是周四交？'),line('oct.seat.f3','narrator','你们对了一遍课表。预备铃响时，她把水杯递给你，让你帮忙放回原位。')];
  }
  function poster(S){
    return [line('oct.poster.1','narrator','林遥试了两次，海报的纸角还是翘起来。'),line('oct.poster.2','linyao','帮我按一会儿这边？不是整张画，就剩这条线了。'),line('oct.poster.3','you','这只是什么？'),line('oct.poster.4','linyao','鸟。看不出来吗？'),line('oct.poster.5','you','有点像被风吹翻的饭勺。','smile'),line('oct.poster.6','linyao','那你先别动，饭勺还有一条腿没画。','smile'),line('oct.poster.7','narrator','她低头添了两笔，自己先笑出了声。你按住的纸角，在她抬头时轻轻动了一下。')];
  }
  function posterAfter(S){
    return S.october.mode==='closer'?[
      line('oct.poster.c1','linyao','好了，可以松手了。','smile'),line('oct.poster.c2','you','下回还画这个吗？'),line('oct.poster.c3','linyao','你不是说像饭勺吗，还想看？','smile'),line('oct.poster.c4','narrator','她把画着第一版小鸟的边角纸撕下来，折好递给你。'),line('oct.poster.c5','linyao','这个给你。别给赵程看，他会笑一星期。'),line('oct.poster.c6','you','那我先收着。','smile')
    ]:[line('oct.poster.f1','linyao','谢了。等颜料干了，再让赵程拿去贴。','smile'),line('oct.poster.f2','you','那只鸟留着吧，挺精神的。'),line('oct.poster.f3','narrator','她在草稿背面写下要补的颜色。你帮忙收了胶带，各自去做下一个安排。')];
  }
  function lunch(S,previousTaste){
    return [line('oct.lunch.1','narrator','你把餐盘放下。林遥把汤碗挪开，给你空出一块地方。'),
      line('oct.lunch.2','linyao',S.october.tasteShared&&previousTaste?previousTaste==='不吃香菜'?'这碗没放香菜。刚才我问过了。':previousTaste==='爱吃香菜'?'香菜在那个小碟子里，刚添的。':'今天土豆炖得挺软。你上回点过这个。':'这儿还没人。汤有点烫，先放一放。'),
      line('oct.lunch.3','linyao','小卖部刚买的，还是温的。你喝牛奶吗？'),
      line('oct.lunch.4','narrator','她从袋子里拿出两小盒牛奶，留了一盒在自己手边。')];
  }
  function milkAfter(S,yes){
    if(!yes)return [line('oct.milk.no1','you','今天不喝。一起坐会儿就好。'),line('oct.milk.no2','linyao','好，我放包里，下午喝。','smile'),line('oct.milk.no3','narrator','她把牛奶收起来。你们接着说起刚才打饭时，谁的汤勺掉进了锅里。')];
    return S.october.mode==='closer'?[
      line('oct.milk.c1','you','多少钱？我把这盒的转给你。'),line('oct.milk.c2','linyao','不用。下次你买。'),line('oct.milk.c3','you','那下次也坐这儿？'),line('oct.milk.c4','linyao','嗯。我先来就占两个位置。','smile'),line('oct.milk.c5','narrator','你把吸管扎进去，没扎准。她忍了一下，还是笑了。'),line('oct.milk.c6','you','这个不算。你别记。','smile'),line('oct.milk.c7','linyao','已经记住了。','smile')
    ]:[line('oct.milk.f1','you','谢谢，下次我带。'),line('oct.milk.f2','linyao','好。记得给赵程也带一个，他刚去还相机了。','smile'),line('oct.milk.f3','narrator','你们喝完牛奶，轮流去还餐盘。下节课快开始了。')];
  }
  function friend(S){
    if(S.week===5)return [line('oct.friend5.1','zhaocheng',S.promiseKept?'班旗那张合照我又洗了一份。运动会想接着拍，你来不来？':S.promise==='yes'?'运动会想找人拍照。上回你没来，这回先看看时间，别急着答应。':'运动会我想拍一点班里的片子。你要是感兴趣，等报名表出来一起看看。'),line('oct.friend5.2','you','先把时间说清楚。我还没想好要报什么。'),line('oct.friend5.3','zhaocheng','行，下周看表再定。海报也在等人，先别什么都接。')];
    return [line('oct.friend6.1','narrator','赵程把拍摄安排摊开。阿哲蹲在旁边，正在把三脚架松动的卡扣扣紧。'),line('oct.friend6.2','zhaocheng','这是阿哲。你们开学见过吧？他比我会弄这个。'),line('oct.friend6.3','narrator','你蹲下帮忙扶住架子，和阿哲互相说了名字。他把试好的架子往地上一放，让你也按了一下。'),line('oct.friend6.4','zhaocheng','下周运动会，摄影得从热身跟到比赛。真接的话，就给它留完整一段，别两边跑。')];
  }
  return {initial,cg,extend,arrival,seat,seatAfter,poster,posterAfter,lunch,milkAfter,friend};
})();
window.CampusOctober.extend(window.CAMPUS_CONTENT);
