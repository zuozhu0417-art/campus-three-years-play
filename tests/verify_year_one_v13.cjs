/* Walk every authored branch and verify consequential state, not text snapshots. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const file of ['content.js','october.js','year-one.js','balance.js','weekend.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const {CAMPUS_CONTENT:C,CampusYearOne:Y,CampusBalance:B,CampusWeekend:W}=ctx.window;
function state(week=7,gender='male',mode='closer') {return {week,profile:{gender,name:'小禾'},october:{mode,sportsPhoto:true,poster:true},energy:90,study:20,friend:10,warm:10,family:5,fitness:0,cgSeen:[],memories:[],rhythm:B.fresh(),year:Y.fresh(),weekend:W.initial(week)};}
const checks=[];let branches=0,scenes=0;
assert.equal(C.weeks.length,20);assert.equal(C.exercises.length,20);assert.equal(C.familyLines.length,20);
for(const p of Object.values(C.places))assert.equal(p.observation.length,20);
for(const e of C.exercises){assert.equal(e.steps.length,3);assert(e.wrong>=0&&e.wrong<3);}
for(const gender of ['male','female'])for(const mode of ['closer','friends','undecided'])for(let week=7;week<=20;week++){
  let S=state(week,gender,mode);S.year=Y.normalize(S.year,S);S.weekend.wallet=100;
  const pool=['friend','girl','mom'].map(id=>Y.weekday(S,id)).concat(Y.bonus(S)||[],Y.weekend(S));
  for(const e of pool){scenes++;assert(e.title);assert(e.lines.length);assert(e.choices.length>=1);const keys=new Set();
    for(const c of e.choices){branches++;assert(!keys.has(c.key));keys.add(c.key);assert(c.after.length&&c.after.every(x=>x.length===2&&typeof x[1]==='string'));assert(c.effects&&typeof c.effects==='object');assert(!c.cg||Y.cg[c.cg]);
      const copy=structuredClone(S);assert.equal(Y.apply(copy,e,c),true);const history=copy.year.history.length,cash=copy.weekend.wallet;assert.equal(Y.apply(copy,e,c),false);assert.equal(copy.year.history.length,history);assert.equal(copy.weekend.wallet,cash);
    }
  }
}
checks.push(`All 20 weeks have content/exercises/observations; ${scenes} gender/route scene instances and ${branches} choices terminate, use valid CGs, and apply once`);
let S=state(9);let e=Y.bonus(S),c=e.choices.find(x=>x.key==='stop');Y.apply(S,e,c);for(const week of [9,10,11,12,13,16,20]){S.week=week;assert.equal(Y.bonus(S),null);for(const event of Y.weekend(S))if(event.id.startsWith('radio'))assert(event.gate);}
checks.push('Explicit refusal suppresses future doorway pursuit and disables private radio invitations');
for(const gender of ['male','female']){S=state(9,gender);assert.equal(Y.visitor(S).who,gender==='female'?'chenyu':'qiaosui');e=Y.bonus(S);Y.apply(S,e,e.choices.find(c=>c.key==='friends'));assert.equal(S.year.pursuit,'friends');assert.equal(S.october.mode,'closer');}
checks.push('Opposite-sex newcomers respect both identities; friendship never changes primary romance mode');
S=state(11);e=Y.weekday(S,'friend');assert(Y.available(S,e,e.choices[0]));S.weekend.wallet=50;Y.apply(S,e,e.choices[0]);assert.equal(S.weekend.wallet,0);assert.equal(S.year.loan,50);S.week=16;e=Y.weekday(S,'friend');Y.apply(S,e,e.choices[0]);assert.equal(S.weekend.wallet,50);assert.equal(S.year.loanPaid,50);Y.apply(S,e,e.choices[0]);assert.equal(S.weekend.wallet,50);
checks.push('Loans require real funds, record debt, and return original cash exactly once');
S=state(15);W.begin(S);W.finishDay(S);const a=W.catalog(S).find(e=>e.id==='trial15'),b=W.catalog(S).find(e=>e.id==='paper15');assert.equal(W.availability(S,a),'');assert(W.commit(S,a.id,'teach').ok);S.weekend.current.pending=null;assert(W.availability(S,b));assert(S.year.flags.trialTalk&&!S.year.flags.paperTrip);
checks.push('Full Sunday teaching and paper-store branches are genuinely exclusive and persist distinct memories');
S=state(7);Y.settle(S);assert(S.year.flags.cameraMissed);assert.equal(Y.settle(S).length,0);S=state(7);e=Y.weekday(S,'friend');Y.apply(S,e,e.choices[0]);Y.settle(S);assert(!S.year.flags.cameraMissed);
S=state(16);assert(Y.weekend(S).find(x=>x.id==='makeup16').gate);S.year.flags.reschedule=true;assert(!Y.weekend(S).find(x=>x.id==='makeup16').gate);assert(!S.year.flags.makeupKept);
checks.push('Photography promise is settled only after actual attendance; makeup memory requires actual rescheduled activity');
S=state(7);e=Y.weekday(S,'friend');Y.apply(S,e,e.choices.find(x=>x.key==='decline'));Y.settle(S);assert(S.year.flags.cameraCancelled&&!S.year.flags.cameraMissed);checks.push('Explicitly renegotiated photography is distinguished from silently missing a promise');
S=state(10);S.year.baseline=10;S.study=26;Y.settle(S);assert.equal(S.year.exams.length,1);const exam=JSON.stringify(S.year.exams[0]);Y.settle(S);assert.equal(S.year.exams.length,1);S.week=20;S.study=66;Y.settle(S);assert.equal(S.year.exams.length,2);assert.equal(JSON.stringify(S.year.exams[0]),exam);
checks.push('Semester exams use period-specific learning and freeze snapshots; year-end settling is idempotent');
let transactions=0;
for(let week=7;week<=20;week++){let sample=state(week);sample.year.pursuit='welcome';sample.year.flags={applied:true,reschedule:true};sample.year.loan=20;
  for(const event of Y.weekend(sample))for(const choice of event.choices){const t=structuredClone(sample);W.begin(t);if(event.day===1)W.finishDay(t);const before=t.weekend.current.remaining;const out=W.commit(t,event.id,choice.key);assert(out.ok,`${week}:${event.id}:${out.reason}`);assert.equal(t.weekend.current.remaining,before-event.cost);assert(t.weekend.current.pending.lines.length);assert(!W.commit(t,event.id,choice.key).ok);transactions++;}
}
checks.push(`${transactions} new weekend transactions execute through real shared cost/pending/result logic and reject double charges`);
const report={passed:true,scenes,branches,transactions,checks};fs.writeFileSync(path.join(root,'verification-year-domain-v13.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
