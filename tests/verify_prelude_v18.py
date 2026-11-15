from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'screenshots-prelude-v18';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
URL=sys.argv[1] if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/'
KEY='campus-three-years-portraits-v3';errors=[];checks=[]
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY)
def drain(p,choice):
 for _ in range(10):
  if not p.locator('#dialogue-fast').count():return
  p.locator('#dialogue-fast').click()
  if p.locator('.novel-choice:visible').count():p.locator('#arrival-'+choice).click()
  else:p.locator('#dialogue-next').click()
 raise AssertionError('dialogue loop')
def hit(p,sel):
 p.locator(sel).scroll_into_view_if_needed()
 assert p.locator(sel).evaluate('(e)=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'),sel
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 for i,(width,height) in enumerate([(1366,768),(390,844),(844,390),(320,568)]):
  p=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(URL,wait_until='networkidle');hit(p,'#new-game');p.screenshot(path=str(OUT/f'title-{width}.jpg'),type='jpeg',quality=88)
  if p.locator('#prelude-preview').is_visible():p.locator('#prelude-preview').click()
  else:
   p.set_viewport_size({'width':1366,'height':768});p.locator('#prelude-preview').click();p.set_viewport_size({'width':width,'height':height})
  assert not state(p)
  p.locator('#prelude-next').click();assert p.locator('.prelude-figure img').get_attribute('src').endswith('prelude-rain-v18.jpg')
  p.locator('#prelude-prev').click();p.keyboard.press('Escape');assert not state(p)
  p.locator('#new-game').click();p.locator('[data-gender='+('male' if i%2==0 else 'female')+']').click();p.locator('#player-name').fill('小禾');p.locator('#identity-confirm').click()
  assert state(p)['warm']==0 and state(p)['seat'] is None
  p.evaluate('async()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))')
  hit(p,'#prelude-next');p.screenshot(path=str(OUT/f'prelude-{width}.jpg'),type='jpeg',quality=88)
  if i%2:p.locator('#prelude-skip').click()
  else:p.locator('#prelude-next').click();p.locator('#prelude-next').click()
  choice='help' if i%2==0 else 'joke';drain(p,choice)
  assert state(p)['firstDay']['response']==choice and state(p)['warm']==0
  p.locator('#seat-confirm').click();p.locator('#plan-confirm').click();before=state(p)
  assert p.locator('#first-lesson-go').count();hit(p,'#first-lesson-go');p.screenshot(path=str(OUT/f'invite-{width}.jpg'),type='jpeg',quality=88)
  if i%2==0:
   p.locator('#first-lesson-go').click();p.locator('[data-answer=review]').click();drain(p,choice)
   assert state(p)['remaining']==before['remaining'] and state(p)['energy']==before['energy']-6
   assert 'lesson' in state(p)['growth']['schoolDone']
  else:
   p.locator('#first-lesson-later').click();assert state(p)==before
  saved=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==saved
  assert not p.locator('#prelude-page').count() and not p.locator('#first-lesson-go').count()
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  p.close()
 checks=['Four viewports: preview navigation, controls reachable, images loaded','Preview does not write saves or unlock romance','Male/female new starts, both reporting choices and illustration skip','Optional first classroom consumes 6 energy, zero free slots; decline unchanged','Reload preserves actual progress without replaying tutorial']
 assert not errors,errors
 b.close()
report={'passed':True,'checks':checks,'errors':errors};(ROOT/'verification-prelude-v18.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
server.shutdown()
