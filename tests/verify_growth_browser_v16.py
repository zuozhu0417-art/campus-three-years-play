"""Actual browser journeys through all new weeks, old-save migration, and alternative branches."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-growth-v16';SHOTS.mkdir(exist_ok=True)
if len(sys.argv)>1:URL=sys.argv[1]
else:
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
        def handle(self):
            try:super().handle()
            except (BrokenPipeError,ConnectionResetError):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/'
KEY='campus-three-years-portraits-v3';errors=[];bad=[];checks=[]
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY)
def drain(p,choice=None):
    for _ in range(25):
        if p.locator('#reader-continue').count():p.locator('#reader-continue').click()
        elif p.locator('#cg-skip').count():p.locator('#cg-skip').click()
        elif p.locator('#dialogue-fast').count():
            p.locator('#dialogue-fast').click()
            if p.locator('.novel-choice:visible').count():
                if choice is not None:p.locator('#'+choice).click();choice=None
                else:return
            else:p.locator('#dialogue-next').click()
        else:return
    raise AssertionError('Stalled dialogue')
def shot(p,name):
    p.evaluate('async()=>{await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));}')
    p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=88)
def fixture(p,week=6,gender='male',mode='closer',**patch):
    d=dict(version=6,profile={'gender':gender,'name':'小禾'},rhythm={'settled':[]},week=week,place='classroom',remaining=0,seat=12,plan=['friend']*3,done=['friend','girl','mom'],study=20,friend=10,warm=10,family=5,energy=74,promise='yes',promiseKept=True,echoResolved=True,taste='不吃香菜',notePromise=True,noteKept=True,memories=[],diaries=[],ended=True,fitness=1,caught=0,cgSeen=['arrival','savedSeat','drawingMargin'],october={'mode':mode,'poster':True,'sportsPhoto':True,'metAzhe':True,'exam':{'rank':13,'oldSeat':14,'energy':60}},weekend={'wallet':100,'current':{'week':week,'started':True,'finished':True,'day':1,'remaining':0,'days':[['bookshop'],['walk']]}})
    d.update(patch);p.goto(URL,wait_until='networkidle');p.evaluate('([k,d])=>{localStorage.clear();localStorage.setItem(k,JSON.stringify(d));}',[KEY,d]);p.reload(wait_until='networkidle');p.locator('#continue-game').click();return d
def plan(p):
    if p.locator('#week-start').count():p.locator('#week-start').click()
    p.locator('#plan-confirm').click()
    if p.locator('#growth-open').count() and p.locator('#lesson-open').count():p.keyboard.press('Escape')
def action(p,id,key):
    if id=='mom':p.locator('[data-place=home]').click()
    else:p.locator('[data-place=classroom]').click()
    p.locator('[data-spot='+id+']').first.click();drain(p,'year-choice-'+key)
def end_day(p):p.locator('#weekend-end-day').click();p.locator('#weekend-day-confirm').click()
def start_weekend(p):
    p.locator('#finish-week').click()
    if p.locator('[data-exam=calm]').count():p.locator('[data-exam=calm]').click()
    if p.locator('#skip-time').count():p.locator('#skip-time').click()
def event(p,id,key):
    p.locator('[data-weekend-act='+id+']').click();drain(p,'weekend-choice-'+key)
def next_week(p):end_day(p);p.locator('#next-week').click();drain(p)

with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 p=b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
 # An old save keeps its remaining slots and receives a safe growth profile.
 fixture(p,week=3,version=7,ended=False,remaining=3,done=[],plan=['study']*3,weekend={'wallet':40})
 assert state(p)['version']==8 and state(p)['remaining']==3
 assert p.evaluate('k=>!!localStorage.getItem(k+"-before-growth-v16")',KEY)
 p.locator('#growth-open').click();shot(p,'01-handbook')
 p.locator('#lesson-open').click();p.locator('[data-answer="review"]').click();drain(p)
 d=state(p);assert d['remaining']==3 and 'lesson' in d['growth']['schoolDone']
 p.locator('#growth-open').click();assert p.locator('#lesson-open').is_disabled();p.locator('#study-open').click()
 p.locator('[data-order="0"]').click();p.locator('[data-order="1"]').click();shot(p,'02-study');p.locator('#study-steady').click();drain(p)
 assert state(p)['remaining']==2;assert state(p)['growth']['mastery'][0]>d['growth']['mastery'][0]
 p.locator('#growth-open').click();p.locator('#incident-open').click();drain(p);p.locator('.novel-choice').first.click();drain(p);assert state(p)['remaining']==1 and 'incident' in state(p)['growth']['schoolDone']
 p.locator('[data-spot=girl]').click();drain(p,'year-choice-respect');assert state(p)['remaining']==0;assert state(p)['growth']['contactWeeks']==[3]
 before=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==before
 start_weekend(p);end_day(p);next_week(p);plan(p)
 assert state(p)['week']==4 and state(p)['remaining']==4
 # Actual full W04 -> exam and frozen results.
 p.locator('#growth-open').click();p.locator('#lesson-open').click();p.locator('[data-answer="0"]').click();drain(p)
 start_weekend(p);end_day(p);next_week(p)
 assert state(p)['ended'];assert len(state(p)['growth']['reports'])==1
 p.locator('#ending-report').click();assert p.locator('tbody tr').count()==44;shot(p,'03-report')
 before=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==before
 p.locator('#end-october').click();drain(p);plan(p);assert state(p)['week']==5 and state(p)['remaining'] in [5,6]
 checks.append('Old save migration / backup; classroom once, self study sequence, event, slow relationship, actual W04 report, reload, variable W05 calendar')
 # Fresh growth profile and four viewports, real handbook, controls, role and training.
 for width,height in [(1366,768),(390,844),(844,390),(320,568)]:
  q=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');q.on('pageerror',lambda e:errors.append(str(e)))
  fixture(q,week=3,version=7,ended=False,remaining=3,done=[],plan=['rest']*3,weekend={'wallet':20})
  q.locator('#growth-open').click();shot(q,'handbook-'+str(width));q.locator('#role-open').click();q.keyboard.press('Escape');q.keyboard.press('Escape')
  assert q.evaluate('document.documentElement.scrollWidth<=innerWidth')
  q.locator('#growth-open').click();q.locator('#training-open').click();q.locator('#train-light').click();drain(q);assert state(q)['remaining']==2
  q.close()
 # New opening must reach seeded variable plan without a legacy migration.
 p.goto(URL,wait_until='networkidle');p.evaluate('localStorage.clear()');p.reload(wait_until='networkidle');p.locator('#new-game').click()
 p.locator('[data-gender=male]').click();p.locator('#player-name').fill('林川');p.locator('#identity-confirm').click();p.locator('#reader-continue').click();p.locator('#prelude-skip').click();drain(p,'arrival-help');p.locator('#seat-confirm').click();p.locator('#plan-confirm').click();p.locator('#first-lesson-later').click()
 assert state(p)['growth']['origin']=='new' and state(p)['remaining'] in [5,6]
 shot(p,'04-new-campus')
 # Role application and an actual duty transaction.
 p.goto(URL,wait_until='networkidle')
 p.evaluate('k=>{let s=JSON.parse(localStorage.getItem(k));s.week=3;s.growth.week=3;s.growth.body=65;s.remaining=4;s.growth.slots=5;s.plan=["friend","friend","friend","friend","friend"];s.weekend.current={week:3,started:false,finished:false,day:0,remaining:2,days:[[],[]],pending:null};localStorage.setItem(k,JSON.stringify(s));}',KEY)
 p.reload(wait_until='networkidle');p.locator('#continue-game').click();p.locator('#growth-open').click();p.locator('#role-open').click();p.locator('[data-role=体育委员]').click();p.locator('#role-duty').click();drain(p)
 assert state(p)['growth']['role']=='体育委员' and state(p)['growth']['duty']==1 and state(p)['remaining']==3
 checks.append('Fresh named male opening uses saved random stats and variable schedule; actual sports committee appointment and duty consumes one slot')
 assert not errors,errors
 b.close()
report=dict(passed=True,checks=checks,errors=errors);(ROOT/'verification-growth-v16.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
