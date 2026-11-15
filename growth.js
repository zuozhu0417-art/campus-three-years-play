/* Campus growth simulation. All random outcomes derive from the saved seed. */
window.CampusGrowth=(()=>{
 const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
 const hash=(seed,key)=>{let n=seed>>>0;for(const c of String(key))n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;n=Math.imul(n^(n>>>16),0x85ebca6b)>>>0;n=Math.imul(n^(n>>>13),0xc2b2ae35)>>>0;n=(n^(n>>>16))>>>0;return n/4294967296;};
 const subjects=['语文','数学','英语','物理','化学','生物'];
 const names=['林遥','赵程','阿哲','许知夏','宋嘉宁','陆星河','陈语桐','沈一鸣','叶清和','顾子安','方思雨','吴越','何明远','姜可欣','苏晚晴','孟远','程子墨','唐佳琪','邱泽','梁书宁','罗晓辰','夏禾','姚安然','丁嘉树','徐知意','谢云舟','韩小满','袁嘉言','蒋思齐','郑南','杜若','冯一诺','白景行','邓可心','陶予宁','彭清越','江雨辰','高望舒','秦以宁','周明轩','李舒然','王嘉木','刘予安'];
 const terms={lesson:'随堂课',study:'晚自习',duty:'班级事务',sport:'体育活动'};
 const fresh=(seed=Math.floor(Math.random()*4294967295))=>({seed,aptitude:52+Math.floor(hash(seed,'a')*23),body:48+Math.floor(hash(seed,'b')*27),social:42+Math.floor(hash(seed,'s')*29),stress:18,mastery:subjects.map((_,i)=>30+Math.floor(hash(seed,'m'+i)*16)),week:0,slots:3,schoolDone:[],records:[],reports:[],contactWeeks:[],role:'普通同学',duty:0,reliable:0,origin:'new',focus:0});
 function ensure(S){if(!S.growth){S.growth=fresh(16384+S.week*713+Math.round(S.study)*17);S.growth.origin='legacy';S.growth.mastery=S.growth.mastery.map(x=>clamp(x+S.study*.35,0,85));S.growth.week=S.week;S.growth.slots=3;}return S.growth;}
 const examWeek=w=>[4,8,10,14,18,20,23].includes(w);
 const calendar=(S)=>{const g=ensure(S),w=S.week;return examWeek(w)?{title:'考试周',note:'留出复习，也给睡眠留位置。',slots:w>=21?3:4}:hash(g.seed,'weather'+w)<.35?{title:'社团开放周',note:'操场和广播室都在招人，课后比平时宽裕。',slots:w>=21?4:6}:{title:'普通教学周',note:'课上有新的问题，课后也有自己的生活。',slots:w>=21?4:5};};
 function enter(S){const g=ensure(S);if(g.week===S.week)return;g.week=S.week;g.slots=calendar(S).slots;g.schoolDone=[];S.remaining=g.slots;S.plan=null;g.stress=clamp(g.stress-7);}
 const total=S=>ensure(S).slots;
 const stage=S=>S.week<10?'还不熟悉':ensure(S).contactWeeks.length<6?'慢慢熟悉':S.october.mode==='closer'?'正在靠近':'熟悉的同学';
 const guarded=S=>S.week<10||ensure(S).contactWeeks.length<6;
 function afterAction(S,id,category){const g=ensure(S);if(category==='study'){g.mastery[g.focus]=clamp(g.mastery[g.focus]+2);g.stress=clamp(g.stress+3);g.aptitude=clamp(g.aptitude+.15);}if(category==='rest'){g.stress=clamp(g.stress-5);if(id==='running')g.body=clamp(g.body+2);}if(category==='friend')g.social=clamp(g.social+.4);if(['girl','girl-canteen'].includes(id)&&!g.contactWeeks.includes(S.week))g.contactWeeks.push(S.week);}
 function schoolCommit(S,id,data){const g=ensure(S);if(g.schoolDone.includes(id))return false;g.schoolDone.push(id);for(const [k,v] of Object.entries(data))if(k==='mastery')g.mastery[g.focus]=clamp(g.mastery[g.focus]+v);else if(typeof g[k]==='number')g[k]=clamp(g[k]+v);g.records.push({week:S.week,id,subject:g.focus,...data});return true;}
 function report(S){const g=ensure(S),old=g.reports.find(x=>x.week===S.week);if(old)return old;
 const score=(m,i)=>Math.round(clamp(28+m*.58+g.aptitude*.10+(S.energy-50)*.06-g.stress*.09+(hash(g.seed,'exam'+S.week+i)-.5)*7,20,100)*1.5);
 const rows=names.map((name,j)=>{const scores=subjects.map((_,i)=>Math.round(clamp(48+hash(g.seed,'student'+j+i)*40+Math.sin((j+1)*(S.week+1)) * 5+S.week*.12,25,98)*1.5));return {id:'npc'+j,name:S.week>=21?({0:'宋予笙',1:'郑原',3:'周砚'}[j]||name):name,scores,total:scores.reduce((a,b)=>a+b,0)};});
 const scores=g.mastery.map(score);rows.push({id:'player',name:S.profile.name==='你'?'你':S.profile.name,scores,total:scores.reduce((a,b)=>a+b,0)});rows.sort((a,b)=>b.total-a.total||a.id.localeCompare(b.id));let rank=1;rows.forEach((x,i)=>{if(i&&x.total!==rows[i-1].total)rank=i+1;x.rank=rank;});
 const r={week:S.week,title:S.week===10||S.week===20?'学期期末考试':'阶段学情检测',rows,rank:rows.find(x=>x.id==='player').rank};g.reports.push(r);return r;}
 function settle(S){const g=ensure(S);if(g.records.some(x=>x.week===S.week&&x.id==='settled'))return;const attended=g.schoolDone.includes('lesson');g.mastery=g.mastery.map(x=>clamp(x+(attended?1.5:.5)));g.records.push({week:S.week,id:'settled'});if(examWeek(S.week)){const r=report(S);const e=S.year.exams.find(x=>x.week===S.week);if(e)e.rank=r.rank;S.seat=r.rank-1;}}
 return {fresh,ensure,enter,total,calendar,stage,guarded,afterAction,schoolCommit,report,settle,examWeek,subjects,hash,clamp,terms};
})();
