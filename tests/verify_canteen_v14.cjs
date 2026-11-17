const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const name of ['content.js','october.js','year-one.js','canteen.js','emotions.js','characters.js','balance.js','weekend.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const {CAMPUS_CONTENT:C,CampusYearOne:Y,CampusCanteen:F,CampusCharacters:A,CampusBalance:B,CampusWeekend:W}=ctx.window;
function state(week,gender='male',mode='closer'){return {week,done:[],remaining:3,profile:{gender,name:'小禾'},october:{mode,poster:true,sportsPhoto:true},energy:80,study:20,friend:10,warm:10,family:5,memories:[],cgSeen:[],rhythm:B.fresh(),year:Y.fresh(),weekend:W.initial(week)};}
assert(C.places.classroom.spots.some(x=>x.id==='girl'));assert(C.places.classroom.spots.some(x=>x.id==='friend'));
assert(C.places.track.spots.some(x=>x.id==='friend'));assert(C.places.canteen.spots.some(x=>x.id==='girl-canteen'));assert(!C.places.canteen.spots.some(x=>['girl','friend'].includes(x.id)));
let scenes=0,choices=0;const seen={};
for(const gender of ['male','female'])for(const mode of ['closer','friends','undecided'])for(let week=1;week<=20;week++)for(const id of ['girl-canteen','friend-canteen']){
 const S=state(week,gender,mode),e=F.scene(S,id);scenes++;assert.equal(e.id,id);assert.equal(e.cost,8);assert.equal(e.scene,'canteen');assert.equal(e.choices.length,2);seen[id]??=new Set();seen[id].add(e.title);
 for(const c of e.choices){choices++;assert(c.after.length);assert(!c.cg||F.cg[c.cg]);const t=structuredClone(S);assert(Y.apply(t,e,c));assert(!Y.apply(t,e,c));assert.equal(t.year.loan,0);assert.equal(t.weekend.wallet,0);assert(!t.year.flags.cameraKept&&!t.year.flags.paperTrip&&!t.year.flags.trialTalk&&!t.year.flags.makeupKept);assert(!t.promiseKept&&!t.noteKept);assert.equal(t.october.mode,mode);}
 for(const line of Y.lines(e,e.lines)){assert(line.id);const p=A.enrich({...line,presentation:"preview"});if(['linyao'].includes(line.who)&&line.mood)assert.equal(p.mood,line.mood);}
 if(week>=7){S.done.push(id);let e2=Y.weekday(S,F.classroomId(id)),decorated=F.decorate(S,e2);assert(decorated.lines.length>e2.lines.length);assert.equal(decorated.lines[0][0],id==='girl-canteen'?'linyao':'zhaocheng');const t=structuredClone(S);Y.apply(t,e2,e2.choices.at(-1));assert(Y.apply(t,e,e.choices[0]),'Different venue must not collide in history');}
}
assert.equal(seen['girl-canteen'].size,20);assert.equal(seen['friend-canteen'].size,20);
for(const gender of ['male','female'])for(let w=9;w<=20;w++)for(const status of ['unmet','welcome','friends','stop']){
 const S=state(w,gender);S.year.pursuit=status;const e=F.scene(S,'pursuer-canteen');assert.equal(Boolean(e),['welcome','friends'].includes(status));if(!e)continue;scenes++;
 const who=gender==='female'?'chenyu':'qiaosui';assert(e.lines.some(l=>l[0]===who));assert(e.choices[0].cg===(who==='qiaosui'?'radioLunch':null));
 S.done.push('pursuer-canteen');const classroom=Y.bonus(S);if(classroom)assert.equal(F.decorate(S,classroom).lines[0][0],who);
 const stop=e.choices.find(c=>c.key==='stop');Y.apply(S,e,stop);assert.equal(F.scene(S,e.id),null);assert.equal(Y.bonus(S),null);
}
for(const key of ['laugh','thoughtful','shy']){assert(A.actors.linyao.poses[key]);assert(fs.existsSync(path.join(root,A.actors.linyao.poses[key])));}
for(const key of ['wave','pause'])assert(fs.existsSync(path.join(root,A.actors.qiaosui.poses[key])));
for(const cg of Object.values(F.cg))assert(fs.existsSync(path.join(root,'assets',cg.scene+'.jpg')));
const report={passed:true,scenes,choices,unique_weekly_scenes:40,checks:['Classroom and track share original IDs; cafeteria uses independent IDs','All 20 weeks, both genders, three relationship modes have two choices with stable line IDs and real expression assets','Cafeteria never grants photography, flag, notebook, Sunday or makeup fulfillment and never creates loan money','Different-venue events apply independently and same event cannot be applied twice','Newcomer invitation/refusal and correct gender persist in both venues','Nine generated images referenced by real portrait or CG paths']};
fs.writeFileSync(path.join(root,'verification-canteen-domain-v14.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
