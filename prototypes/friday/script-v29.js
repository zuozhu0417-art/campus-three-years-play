/* Spoken words and observable acts. No narrator supplies motives or reconciliations. */
window.FridayScript=(()=>{
 const l=(who,text)=>({who,text});
 const math=s=>!s.math?[l('韩老师','订正空着你交什么？拿回去。'),l('','他在你的名字后面打了一个点。')]:['copy','wrong'].includes(s.math)?[l('韩老师','还是错的。上面打个叉，下面照抄一遍，这叫订正？'),l('','后面有人笑了一声。老师已经伸手收下一张了。')]:s.math==='hint'?[l('韩老师','减一怎么来的？'),l('','你刚张嘴，他敲了一下桌子。'),l('韩老师','行了，午休来办公室。下一个。')]:[l('','韩老师在订正旁打了一个勾，把卷子扣在那一摞上。')];
 const home=s=>[l('',s.minute<=40?'司机敲了两下方向盘。你上车时，座位已经满了。':'车站空了。下一班公交六点十分，票价四块。'),l('妈妈',s.minute<=40?'碗在台面上。别拿蓝的，裂了。':'打你三个电话，手机当摆设啊？'),l('',s.minute<=40?'灶上的汤起了一层皮。':'你把饭扒到碗里。电饭锅底已经结了壳。')];
 const book=s=>s.book==='desk'?[l('','林遥用指甲剥开粘在一起的两页纸。'),l('林遥','这怎么湿了？'),l('你','我周五放桌上了。'),l('林遥','我知道放桌上了。我问怎么湿的。')]:s.book==='bag'?[l('林遥','练习册呢？他们收作业了。')]:[l('','林遥从你的桌边过去，把椅背上挂着的校服推开。')];
 const bookReplies=s=>s.book==='desk'?[{id:'admit',text:'“可能碰到水杯了。我放的时候没看。”'},{id:'deny',text:'“我放的时候就是干的。”'}]:s.book==='bag'?[{id:'return',text:'从书包里抽出来，递给她'},{id:'lie',text:'“落家里了。”'}]:[];
 const bookAfter=(s,v)=>v==='admit'?[l('林遥','算了，放着。'),l('','她把你伸过去的手挡开了。')]:v==='deny'?[l('林遥','那是我自己弄的？'),l('','她没有接你递过去的纸巾。')]:v==='return'?[l('','她接过去，直接走向课代表。'),l('林遥','以后别拿我的了。')]:v==='lie'?[l('林遥','……我今天要交。'),l('','她站了一会儿。课代表从后门喊她名字。')]:[];
 const friend=s=>s.played?[l('赵程','老许说那球就是你没接住。你跑那么快干吗？')]:[l('赵程','周五等你半天。早说不来啊。')];
 const friendReplies=s=>s.played?[{id:'pushback',text:'“你往我背后传，我拿什么接？”'},{id:'quiet',text:'不接话，把卷子折起来'}]:[{id:'pushback',text:'“我什么时候答应你了？”'},{id:'quiet',text:'“哦。”'}];
 const friendAfter=(s,v)=>v==='pushback'?[l('赵程',s.played?'我传给你，你还怪我了？':'行，你没答应。'),l('','他把桌子往后拖了一点，椅脚刮出一声响。')]:[l('','赵程踢了一下你的椅腿，转身去找老许。')];
 const wednesday=s=>s.book==='desk'?[l('','周三，数学课前。林遥把练习册放进抽屉。'),l('你','昨天讲的那题——'),l('林遥','问老师。')]:s.book==='bag'?[l('','周三早读，你在书包底摸到了那本练习册。封皮折进去一角。'),l('','林遥的桌子是空的，书包也没放。')]:s.argued?[l('','周三体育课，老许从你旁边跑过去。'),l('赵程','这边人够了。')]:[l('','周三，赵程在后排问谁去打球。你把书包从桌上拿下来。'),l('赵程','老许，快点。')];
 return {math,home,book,bookReplies,bookAfter,friend,friendReplies,friendAfter,wednesday};
})();
