from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'screenshots-lunch-v21';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
URL=sys.argv[1] if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/'
KEY='campus-three-years-portraits-v3';errors=[]
def state(p):return p.evaluate('k=>JSON.parse(localStorage.getItem(k))',KEY)
def fixture(p,w,n,mode='undecided'):
 p.goto(URL,wait_until='networkidle')
 p.evaluate("""([k,w,n,mode])=>{localStorage.clear();const growth=CampusGrowth.fresh();growth.week=w;growth.slots=5;growth.contactWeeks=Array.from({length:n},(_,i)=>i+1);localStorage.setItem(k,JSON.stringify({version:8,profile:{gender:'female',name:'小禾'},growth,week:w,place:'canteen',remaining:5,seat:12,plan:Array(5).fill('friend'),done:[],study:20,friend:10,warm:0,family:5,energy:90,memories:[],diaries:[],ended:false,year:CampusYearOne.fresh(),rhythm:CampusBalance.fresh(),fitness:0,caught:0,cgSeen:[],october:{mode,introPending:false,exam:{rank:13,oldSeat:14,energy:80}},weekend:{wallet:80}}))}""",[KEY,w,n,mode]);p.reload(wait_until='networkidle');p.locator('#continue-game').click()
def drain(p):
 for _ in range(10):
  if not p.locator('#dialogue-fast').count():return
  p.locator('#dialogue-fast').click()
  if p.locator('.novel-choice:visible').count():return
  p.locator('#dialogue-next').click()
 raise AssertionError('dialogue loop')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 p=b.new_page(reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
 cases=[(2,1,'undecided','distant'),(7,4,'undecided','familiar'),(12,7,'friends','friends'),(12,7,'undecided','uncertain'),(12,7,'closer','shy'),(16,11,'closer','testing'),(22,17,'closer','tender'),(23,1,'closer','distant')]
 for i,(week,n,mode,phase) in enumerate(cases):
  fixture(p,week,n,mode);assert p.evaluate('(s)=>CampusLunch.phase(s)',state(p))==phase
  before=state(p);p.locator('[data-spot=girl-canteen]').click()
  assert '借一把尺子' not in p.locator('.novel-caption').inner_text()
  assert 'canteen.jpg' in p.locator('.experience').get_attribute('style')
  drain(p);assert p.locator('#year-choice-meal').count();assert state(p)==before
  if phase in ['shy','testing','tender']:
   p.evaluate('async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');p.screenshot(path=str(OUT/(phase+'.jpg')),type='jpeg',quality=88)
  p.locator('#year-leave').click();assert state(p)==before
  p.locator('[data-spot=girl-canteen]').click();drain(p);p.locator('#year-choice-'+('quiet' if i%2 else 'meal')).click();drain(p)
  after=state(p);assert after['remaining']==before['remaining']-1;assert 'girl-canteen' in after['done'] and 'girl' not in after['done'];assert after['october']['mode']==mode
  assert len(after['growth']['contactWeeks'])<=len(before['growth']['contactWeeks'])+1
  p.locator('[data-place=classroom]').click();p.locator('[data-spot=girl]').click()
  if phase=='distant':assert not p.locator('.novel-caption').inner_text().startswith('食堂')
  before_reload=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==before_reload
 # Both location orders spend two real slots but count this contact week only once.
 for order in [('girl','girl-canteen'),('girl-canteen','girl')]:
  fixture(p,2,1);before=state(p)
  for id in order:
   p.locator('[data-place='+('canteen' if id.endswith('canteen') else 'classroom')+']').click();p.locator('[data-spot='+id+']').click();drain(p)
   p.locator('#year-choice-'+('meal' if id.endswith('canteen') else 'respect')).click();drain(p)
  after=state(p);assert after['remaining']==before['remaining']-2;assert set(['girl','girl-canteen']).issubset(after['done']);assert len(after['growth']['contactWeeks'])==2
 # Domain traversal: every week and route yields independent food scenes, two complete choices.
 result=p.evaluate("""()=>{let count=0;for(let w=1;w<=23;w++)for(const mode of ['undecided','friends','closer'])for(const n of [0,2,6,10,14,20]){let s=JSON.parse(localStorage.getItem('campus-three-years-portraits-v3'));s.week=w;s.october.mode=mode;s.growth.contactWeeks=Array.from({length:n},(_,i)=>i+1);const e=CampusCanteen.scene(s,'girl-canteen');if(e.scene!=='canteen'||e.cost!==8||e.choices.length!==2)throw Error('bad lunch');if(e.lines.concat(...e.choices.map(c=>c.after)).some(l=>/尺子|笔袋|等号|粉笔/.test(l[1])))throw Error('classroom leak');if(mode==='friends'&&['shy','testing','tender'].includes(CampusLunch.phase(s)))throw Error('forced romance');count++;}return count;}""");assert result==414
 for width,height in [(1366,768),(390,844),(844,390),(320,568)]:
  p.set_viewport_size({'width':width,'height':height});fixture(p,2,1);p.locator('[data-spot=girl-canteen]').click();p.locator('#dialogue-fast').click();p.evaluate('async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))');p.screenshot(path=str(OUT/f'cold-{width}.jpg'),type='jpeg',quality=88)
  drain(p);p.locator('#year-choice-meal').click();drain(p)
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors;b.close()
report={'passed':True,'cases':result,'checks':['Actual screenshot reproduction: early lunch never uses classroom lines','Seven contact/route stages and low-contact late-game boundary','Leave read-only; meal/quiet consume one slot; classroom remains separate','Refresh preserves contact and meal progress; no automatic route change','414 week/route/contact combinations and four viewports'],'errors':errors};(ROOT/'verification-lunch-v21.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False));server.shutdown()
