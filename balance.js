/* Date-based recovery and study choices. No clock or reload farming. MIT. */
window.CampusBalance=(()=>{
  'use strict';
  const NIGHT=6;
  const modes={steady:{name:'稳步订正',cost:18,gain:3,review:2},focus:{name:'集中攻坚',cost:28,gain:5,review:3}};
  const challenges=[
    {title:'集合：共同的元素',question:'A={1,2,3}，B={2,3,4}，求 A∩B',steps:['A∩B 取两个集合共有的元素','A∩B={1,2,3,4}','A∩B 的元素个数为 4'],wrong:1,solution:'交集只取共有元素，A∩B={2,3}。{1,2,3,4} 是并集。',hint:'先分清交集与并集。'},
    {title:'函数：配方之后少了什么',question:'求 f(x)=2x²−4x+3 的最小值',steps:['f(x)=2(x²−2x)+3','f(x)=2(x−1)²+3','最小值为 3'],wrong:1,solution:'括号内补了 1，外面必须减去 2。f(x)=2(x−1)²+1，最小值为 1。',hint:'配方时，多加的数也要减回去。'},
    {title:'定义域：两个条件都要留下',question:'求 f(x)=√(x−1)/(x−3) 的定义域',steps:['根号内要求 x−1≥0','分母要求 x−3≥0','所以定义域为 [3,+∞)'],wrong:1,solution:'分母只要求不为零，不能写成大于等于零。x≥1 且 x≠3，定义域为 [1,3)∪(3,+∞)。',hint:'根号和分母，限制不一样。'},
    {title:'指数：先把底数写成一样',question:'解方程 2^(x+1)=8',steps:['8=2³','x+1=2','x=1'],wrong:1,solution:'底数相同时比较指数，x+1=3，所以 x=2。',hint:'右边的指数是几？'},
    {title:'对数：指数与底数的位置',question:'解方程 log₂(x−1)=3',steps:['先要求 x−1>0','x−1=3²','所以 x=10'],wrong:1,solution:'log₂(x−1)=3 等价于 x−1=2³=8，所以 x=9，满足定义域。',hint:'用对数的定义，把式子改成指数形式。'},
    {title:'区间：极值不一定在端点',question:'求 f(x)=x²−2x 在 [0,3] 上的值域',steps:['f(x)=(x−1)²−1','端点值为 0、3，所以最小值为 0','值域为 [0,3]'],wrong:1,solution:'还要看区间内的顶点。x=1 时最小值为 −1，x=3 时最大值为 3，所以值域为 [−1,3]。',hint:'顶点是否在给定区间里？'}
  ];
  const challenge=(week,count)=>challenges[((week-1)*3+count)%challenges.length];
  const fresh=()=>({settled:[],last:null,legacyCredit:0});
  const clamp=n=>Math.max(0,Math.min(100,n));
  function normalize(value){
    const r=fresh();if(!value||typeof value!=='object')return r;
    r.settled=Array.isArray(value.settled)?[...new Set(value.settled.filter(x=>typeof x==='string'&&/^\d+:(mon-wed|wed-fri|fri-sat|sat-sun|sun-mon)$/.test(x)))].slice(-400):[];
    r.last=value.last&&typeof value.last.label==='string'&&Number.isFinite(value.last.amount)?{label:value.last.label.slice(0,80),amount:value.last.amount}:null;
    r.legacyCredit=value.legacyCredit===18?18:0;return r;
  }
  function sleep(S,span,nights){
    if(!S.rhythm)S.rhythm=fresh();const key=S.week+':'+span;
    if(S.rhythm.settled.includes(key))return 0;
    const before=S.energy;S.energy=clamp(S.energy+nights*NIGHT);S.rhythm.settled.push(key);
    const names={'mon-wed':'周一到周三','wed-fri':'周三到周五','fri-sat':'周五到周六','sat-sun':'周六到周日','sun-mon':'周日到下周一'};
    S.rhythm.last={label:names[span]+' · '+nights+' 晚正常睡眠',amount:S.energy-before};return S.energy-before;
  }
  function afterWeekday(S,index){const n=window.CampusGrowth?window.CampusGrowth.total(S):3;let gain=0;if(index===Math.floor((n-1)/2))gain+=sleep(S,'mon-wed',2);if(index===n-1)gain+=sleep(S,'wed-fri',2);return gain;}
  function leaveWeekdays(S){let gained=0;for(let i=(window.CampusGrowth?window.CampusGrowth.total(S):3)-S.remaining;i<(window.CampusGrowth?window.CampusGrowth.total(S):3);i++)gained+=afterWeekday(S,i);return gained;}
  function migrate(S,version){
    S.rhythm=normalize(S.rhythm);
    if(version<6&&!S.ended&&!S.rhythm.legacyCredit){const before=S.energy;S.energy=clamp(S.energy+18);S.rhythm.legacyCredit=18;S.rhythm.last={label:'旧进度补回基础睡眠 · 本次更新一次',amount:S.energy-before};}
  }
  function study(mode='steady',correct=true){const m=modes[mode]||modes.steady;return {...m,points:correct?m.gain:m.review};}
  const rank=(study,energy)=>Math.max(1,Math.min(44,Math.round(32*Math.exp(-study/20)+(energy<35?4:energy<50?2:0))));
  return {NIGHT,modes,challenge,fresh,normalize,sleep,afterWeekday,leaveWeekdays,migrate,study,rank};
})();
