from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'screenshots-reader-v20';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
URL=sys.argv[1] if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/'
KEY='campus-three-years-portraits-v3';errors=[]
def state(p):return p.evaluate('k=>JSON.parse(localStorage.getItem(k))',KEY)
def fixture(p,week,ended=False,seat=12,plan=None):
 d=dict(version=8,profile={'gender':'female','name':'小禾'},rhythm={'settled':[]},week=week,place='classroom',remaining=3,seat=seat,plan=plan,done=[],study=20,friend=10,warm=0,family=5,energy=74,promise=None,promiseKept=False,echoResolved=True,memories=[],diaries=[],ended=ended,fitness=1,caught=0,cgSeen=[],october={'mode':'undecided','introPending':False,'exam':{'rank':13,'oldSeat':14,'energy':60}},weekend={'wallet':80})
 p.goto(URL,wait_until='networkidle');p.evaluate('([k,d])=>{localStorage.clear();localStorage.setItem(k,JSON.stringify(d))}',[KEY,d]);p.reload(wait_until='networkidle');p.locator('#continue-game').click()
def progress(d):return {k:v for k,v in d.items() if k!='reader'}
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 p=b.new_page(reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
 for week,key in [(1,'start'),(5,'october'),(7,'autumn'),(11,'winter'),(15,'spring'),(21,'second-year'),(23,'pause')]:
  fixture(p,week,ended=week==23,seat=None if week==1 else 12)
  assert p.locator('#reader-continue').count(),(week,key)
  before=state(p);p.locator('.reader-page img').evaluate('(i)=>i.decode()');p.locator('#reader-continue').click();after=state(p)
  assert key in after['reader']['seen'];assert progress(before)==progress(after),(week,key)
  p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert not p.locator('#reader-continue').count(),week
 # Four viewport composition and reachable dismiss control, including long opening.
 for width,height in [(1366,768),(390,844),(844,390),(320,568)]:
  p.set_viewport_size({'width':width,'height':height});fixture(p,1,seat=None)
  p.locator('.reader-page img').evaluate('(i)=>i.decode()');p.screenshot(path=str(OUT/f'letter-{width}.jpg'),type='jpeg',quality=88)
  p.locator('#reader-continue').scroll_into_view_if_needed();assert p.locator('#reader-continue').evaluate('(e)=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}')
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');p.locator('#reader-continue').click()
 # Optional practice changes no game progress; real study controls remain independent.
 p.set_viewport_size({'width':1366,'height':768});fixture(p,3,plan=['study']*3)
 p.locator('#growth-open').click();p.locator('#study-open').click();before=state(p)
 assert not p.locator('.margin-hint').evaluate('e=>e.open')
 p.locator('.margin-hint summary').click();p.locator('[data-trial=copy]').click();a=p.locator('#hint-feedback').inner_text();p.locator('[data-trial=recall]').click();assert p.locator('#hint-feedback').inner_text()!=a
 assert state(p)==before;assert p.locator('#study-steady').is_disabled();p.keyboard.press('Escape');assert state(p)==before
 # Only actually acknowledged letters appear in archive, re-reading is read-only.
 fixture(p,15);p.locator('#reader-continue').click();p.locator('#week-start').click();p.locator('#plan-confirm').click();p.keyboard.press('Escape')
 p.locator('#menu-button').click();p.locator('#menu-letters').click();assert p.locator('[data-letter]').count()==1;before=state(p);p.locator('[data-letter=spring]').click();p.locator('#reader-continue').click();assert state(p)==before
 assert not errors,errors;b.close()
report={'passed':True,'checks':['Seven illustrated letters at six chapter entries and W23 closing','Read acknowledgement only: no energy/time/score/relationship reward','Dismissal persists across reload; old saves receive current chapter only','Four viewport long-letter layout and reachable continue','Collapsed opt-in study trial: no state changes or real plan selection','Archive only contains read letters; replay is read-only'],'errors':errors}
(ROOT/'verification-reader-v20.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False));server.shutdown()
