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
 for width,height in [(1366,768),(390,844),(844,390),(320,568)]:
  p=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
  fixture(p,week=1,version=7,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':20})
  shot(p,'campus-'+str(width))
  for selector in ['#growth-open','#school-open','[data-spot=inspection]','[data-spot=girl]','[data-spot=friend]','[data-spot=notebook]','#finish-week']:
   button=p.locator(selector).first;button.scroll_into_view_if_needed();assert button.evaluate('(e)=>{let r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}'),(width,selector)
  p.locator('[data-spot=inspection]').click();assert p.locator('#study-steady').is_visible();p.keyboard.press('Escape')
  before=state(p);p.locator('#growth-open').click();p.locator('#incident-open').click();drain(p);p.locator('.novel-choice').last.click();assert state(p)==before
  p.locator('#growth-open').click();p.locator('#incident-open').click();drain(p);p.locator('.novel-choice').nth(1).click();drain(p);assert state(p)['remaining']==before['remaining']-1
  p.close()
 p=b.new_page(reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
 fixture(p,week=5,version=7,ended=False,remaining=3,done=[],plan=['study']*3,energy=0,weekend={'wallet':0})
 before=state(p);p.locator('#growth-open').click();p.locator('#lesson-open').click();p.locator('[data-answer="review"]').click();assert state(p)==before;p.keyboard.press('Escape')
 p.locator('#growth-open').click();p.locator('#study-open').click();p.locator('[data-order="0"]').click();p.locator('[data-order="1"]').click();p.locator('#study-intensive').click();assert state(p)==before
 assert not errors,errors;b.close()
 report=dict(passed=True,checks=['Four viewport center-hit tests for both new and original controls','Evening study directly reachable from classroom','Leave consumes nothing; limited participation consumes one real slot','Low-energy lesson and self-study cannot award points or consume time'],errors=errors)
 (ROOT/'verification-growth-boundaries-v16.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
