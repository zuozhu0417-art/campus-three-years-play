const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const name of ['content.js','october.js','year-one.js','canteen.js','year-two.js','emotions.js','characters.js','balance.js','weekend.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
const {CAMPUS_CONTENT:C,CampusYearOne:Y,CampusCanteen:F,CampusBalance:B,CampusWeekend:W,CampusCharacters:A}=ctx.window;
assert.equal(C.weeks.length,23);assert.equal(C.exercises.length,23);
function state(week,gender,mode){return {week,done:[],remaining:3,profile:{gender,name:'小禾'},october:{mode},energy:80,study:20,friend:10,warm:10,family:5,memories:[],rhythm:B.fresh(),year:Y.fresh(),weekend:W.initial(week)};}
let scenes=0,choices=0,weekends=0;
for(const gender of ['male','female'])for(const mode of ['closer','friends','undecided'])for(let week=21;week<=23;week++){
 const S=state(week,gender,mode);S.year.loan=50;S.year.loanPaid=20;S.year.pursuit='stop';
 for(const id of ['zhouyan','girl','friend','mom','girl-canteen','friend-canteen']){
  const e=id.includes('canteen')?F.scene(S,id):Y.weekday(S,id);scenes++;assert(e&&e.lines.length&&e.choices.length);
  for(const c of e.choices){const t=structuredClone(S);choices++;assert(c.after.length);assert(Y.apply(t,e,c));assert(!Y.apply(t,e,c));assert.equal(t.year.loan,50);assert.equal(t.year.loanPaid,20);assert.equal(t.october.mode,mode);assert.equal(t.year.pursuit,'stop');assert(!t.year.flags.cameraKept);assert(!t.year.flags.makeupKept);assert(!t.year.flags.paperTrip);}
  for(const l of Y.lines(e,e.lines)){assert(l.id);if(l.who!=='narrator')assert(A.get(l.who)||l.who==='you',l.who);}
 }
 for(const e of Y.weekend(S)){
  weekends++;assert(e.lines.every(l=>l.id));
  for(const c of e.choices){const t=structuredClone(S);t.weekend.current.started=true;t.weekend.current.day=e.day;
   const result=W.commit(t,e.id,c.key);assert(result.ok,result.reason);assert.equal(t.weekend.current.remaining,2-e.cost);const snapshot=JSON.stringify(t);assert(!W.commit(t,e.id,c.key).ok);assert.equal(JSON.stringify(t),snapshot);
  }
 }
 const normalized=Y.normalize({...S.year,settled:[20,21,22,23,24]},S);assert.equal(normalized.settled.join(','),'20,21,22,23');
 assert(!F.visitorAvailable(S));Y.settle(S);assert.equal(Y.settle(S).length,0);
}
for(const asset of [A.actors.zhouyan.base,'assets/year-newclass-v15.jpg'])assert(fs.existsSync(path.join(root,asset)));
const report={passed:true,scenes,choices,weekends,checks:['Both genders / three relationship modes / all W21–23 weekday and canteen choices terminate with stable IDs','Duplicate story/weekend transactions cannot award resources; actual weekend cost, gate and day respected','Loan balance, original promises, friendship boundary and refusal unchanged','W21–23 settlement persists normalization and cannot repeat; W24 excluded']};
fs.writeFileSync(path.join(root,'verification-second-year-domain-v15.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
