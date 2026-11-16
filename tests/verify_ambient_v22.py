from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots-ambient-v22';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def handle(self):
  try:super().handle()
  except (BrokenPipeError,ConnectionResetError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/';KEY='campus-three-years-portraits-v3';errors=[]
def playing(p,scene):
 p.wait_for_function("s=>{const v=document.querySelector('.ambient-film');return v?.dataset.scene===s&&!v.paused&&v.videoWidth>0&&v.classList.contains('is-playing')}",arg=scene,timeout=6000)
 t=p.locator('.ambient-film').evaluate('(v)=>v.currentTime');p.wait_for_timeout(180)
 assert p.locator('.ambient-film').evaluate('(v)=>v.currentTime')!=t
def fixture(p,w=2):
 p.goto(URL,wait_until='domcontentloaded');p.wait_for_function('window.CampusGrowth&&window.CampusAmbient')
 p.evaluate("""([key,w])=>{localStorage.setItem('campus-opening-film-v10-seen','yes');localStorage.setItem('campus-motion-v3','on');localStorage.setItem(key,JSON.stringify({version:8,profile:{gender:'female',name:'小禾'},growth:CampusGrowth.fresh(),week:w,place:'classroom',remaining:5,seat:12,plan:Array(5).fill('friend'),done:[],study:20,friend:10,warm:0,family:5,energy:90,memories:[],diaries:[],ended:false,year:CampusYearOne.fresh(),rhythm:CampusBalance.fresh(),fitness:0,caught:0,cgSeen:[],october:{mode:'undecided',introPending:false,exam:{rank:13,oldSeat:14,energy:80}},weekend:{wallet:80}}))}""",[KEY,w])
 p.reload(wait_until='domcontentloaded');p.wait_for_function('window.CampusAmbient');p.locator('#continue-game').click()
 if p.locator('#reader-continue').count():p.locator('#reader-continue').click()
 if p.locator('#week-start').count():p.locator('#week-start').click();p.locator('#plan-confirm').click()
 if p.locator('.close-button').count():p.locator('.close-button').last.click()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 p=b.new_page(viewport={'width':1366,'height':768});p.add_init_script("localStorage.setItem('campus-opening-film-v10-seen','yes')");p.on('pageerror',lambda e:errors.append(str(e)))
 fixture(p);playing(p,'classroom');before=p.evaluate('k=>localStorage.getItem(k)',KEY)
 p.locator('#school-open').click();p.locator('#lesson-open').click();playing(p,'lesson')
 p.screenshot(path=str(OUT/'lesson.jpg'));p.locator('.close-button').click();playing(p,'classroom')
 assert p.evaluate('k=>localStorage.getItem(k)',KEY)==before
 p.locator('[data-place=canteen]').click();playing(p,'canteen');p.screenshot(path=str(OUT/'canteen.jpg'))
 p.locator('[data-spot=girl-canteen]').click();playing(p,'canteen')
 assert p.locator('.novel>.ambient-film').count()==1
 p.locator('#dialogue-motion').click();p.wait_for_timeout(100)
 assert p.locator('.ambient-film').evaluate('(v)=>v.paused&&!v.classList.contains("is-playing")')
 p.locator('#dialogue-motion').click();playing(p,'canteen')
 p.reload(wait_until='domcontentloaded');p.wait_for_function('window.CampusAmbient');p.locator('#continue-game').click();playing(p,'canteen')
 p.locator('[data-place=home]').click();p.wait_for_timeout(100)
 assert p.locator('.ambient-film').evaluate('(v)=>v.paused&&!v.classList.contains("is-playing")')
 for width,height in [(390,844),(844,390),(320,568)]:
  p.set_viewport_size({'width':width,'height':height});p.locator('[data-place=classroom]').click();playing(p,'classroom')
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert p.locator('.ambient-film').evaluate('(v)=>getComputedStyle(v).pointerEvents')=='none'
  p.screenshot(path=str(OUT/f'classroom-{width}.jpg'))
 fixture(p,21);p.wait_for_timeout(100)
 assert p.locator('.ambient-film').count()==0 or p.locator('.ambient-film').evaluate('(v)=>v.paused&&!v.classList.contains("is-playing")')
 assert 'year-newclass' in p.locator('#world').get_attribute('style')
 # Failed media loads fall back to the original illustration.
 q=b.new_page();q.route('**/assets/ambient/*.mp4',lambda r:r.abort());fixture(q)
 q.wait_for_timeout(300);assert q.locator('.ambient-film').evaluate('(v)=>!v.classList.contains("is-playing")')
 assert 'classroom.jpg' in q.locator('#world').evaluate('(e)=>getComputedStyle(e).backgroundImage')
 # Reduced motion needs no video download until the player explicitly enables it.
 r=b.new_page(reduced_motion='reduce');requests=[];r.on('request',lambda req:requests.append(req.url))
 r.goto(URL,wait_until='networkidle');assert not any('/assets/ambient/' in u for u in requests)
 assert not errors,errors
 b.close()
 (ROOT/'verification-ambient-v22.json').write_text(json.dumps({'passed':True,'errors':errors,'checks':['actual video playback','classroom lesson variant','dialogue video','motion toggle','static fallback','reduced motion no download','home pause','year-two layout preserved','three mobile viewports','save unchanged by lesson preview']},ensure_ascii=False,indent=2),encoding='utf-8')
server.shutdown();print('Ambient v22 checks passed')
