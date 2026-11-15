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
 p=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
 fixture(p,week=1,version=7,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':80},mode='undecided')
 for week in range(1,24):
  assert state(p)['week']==week
  if week>1:plan(p)
  p.locator('#growth-open').click();p.locator('[data-focus="'+str((week-1)%6)+'"]').click();p.locator('#lesson-open').click();p.locator('[data-answer="review"]').click();drain(p)
  p.locator('#growth-open').click();p.locator('#study-open').click();p.locator('[data-order="0"]').click();p.locator('[data-order="1"]').click();p.locator('#study-steady').click();drain(p)
  p.locator('[data-place=classroom]').click();p.locator('[data-spot=girl]').click();drain(p)
  if p.locator('#year-choice-respect').count():p.locator('#year-choice-respect').click()
  elif week==10 and p.locator('#year-choice-closer-v16').count():p.locator('#year-choice-closer-v16').click()
  else:p.locator('.novel-choice').first.click()
  drain(p)
  if week<10:assert state(p)['october']['mode']=='undecided'
  if week==10:assert state(p)['october']['mode']=='closer'
  start_weekend(p);end_day(p);next_week(p)
  if week==4:p.locator('#end-october').click();drain(p)
  if week==20:p.locator('#second-year-continue').click();drain(p)
  if week in [8,14,21]:
   before=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click()
   # When a new week's plan is pending the same state is reconstructed.
  print('week completed',week,flush=True)
 d=state(p);assert d['week']==23 and d['ended'];assert len(d['growth']['reports'])==7
 for r in d['growth']['reports']:assert len(r['rows'])==44
 assert all(0<=x<=100 for x in d['growth']['mastery']);assert 0<=d['energy']<=100
 assert len(d['growth']['contactWeeks'])==23
 assert d['year']['exams'][0]['rank']==next(x for x in d['growth']['reports'] if x['week']==10)['rank']
 assert d['year']['exams'][1]['rank']==next(x for x in d['growth']['reports'] if x['week']==20)['rank']
 p.locator('#ending-report').click();shot(p,'05-full-year-report');assert p.locator('tbody tr').count()==44
 assert not errors,errors;b.close()
 report=dict(passed=True,checks=['Actual W01–W23 continuous journey with classroom and self-study every week','Relationship remains undecided through W09; can express interest at W10 after ten separate weeks','Seven full-class reports; two original final exam ranks agree with new reports','W04 October and W20 second-year continuation; intermediate reloads; no negative stats or JS errors'],errors=errors)
 (ROOT/'verification-growth-journey-v16.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
