from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import sys,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots-friday-v28';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=sys.argv[1] if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/prototypes/friday/'
errors=[];endings=[]
def drain(p):
 for _ in range(25):
  if p.locator('#reading').is_hidden() or p.locator('#replies button').count():return
  p.locator('#words').click()
 raise AssertionError('story loop')
def reply(p,id):
 drain(p);p.locator('[data-reply='+id+']').click();drain(p)
def begin(p):
 p.goto(URL,wait_until='networkidle');p.locator('#begin').click();drain(p)
def end(p):
 p.locator('#depart').click();drain(p);p.locator('[data-reply=go]').click()
 text=[]
 for _ in range(35):
  if p.locator('#replies button').count():break
  text.append(p.locator('#words').inner_text());p.locator('#words').click()
 assert p.locator('[data-reply=again]').count();return '\n'.join(text)
def hit(p,sel):
 p.locator(sel).scroll_into_view_if_needed()
 assert p.locator(sel).evaluate('e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}'),sel
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 for w,h in [(1366,768),(390,844),(844,390),(320,568)]:
  p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)))
  begin(p);p.screenshot(path=str(OUT/f'room-{w}.jpg'),type='jpeg')
  for sel in ['#exam','#linyao','#door','#classroom','#track','#bag','#depart']:hit(p,sel)
  # Return first -> actual clue -> self correction -> bus. Everything but ball fits.
  p.locator('#linyao').click();reply(p,'hand');assert p.locator('#clock').inner_text()=='17:28'
  p.locator('#exam').click();hit(p,'[data-step="1"]');p.locator('[data-step="1"]').click();hit(p,'#correct')
  p.screenshot(path=str(OUT/f'paper-{w}.jpg'),type='jpeg');p.locator('#correct').click();drain(p)
  text=end(p);assert '车门还开着' in text and '嗯，放这儿' in text and '下次你站近一点' not in text
  endings.append({'viewport':[w,h],'path':'return/self/bus','verified':True})
  assert p.evaluate('Object.keys(localStorage).length')==0
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  hit(p,'[data-reply=again]');p.locator('[data-reply=again]').click();assert p.locator('#begin').is_visible()
  p.close()
 p=b.new_page(viewport={'width':1366,'height':768});p.on('pageerror',lambda e:errors.append(str(e)))
 begin(p);p.locator('#track').click();p.locator('#ball').click();reply(p,'play');assert p.locator('#clock').inner_text()=='17:36'
 p.locator('#classroom').click();assert p.locator('#linyao').inner_text()=='林遥的空桌'
 p.locator('#linyao').click();reply(p,'desk');p.locator('#exam').click();assert not p.locator('#copy').count()
 p.locator('[data-step="1"]').click();p.locator('#correct').click();drain(p)
 text=end(p);assert '刚开走' in text and '本子看到了' in text and '下次你站近一点' in text
 endings.append({'path':'ball/absent/desk/self/miss','verified':True})
 # Copying is not automatically correct. Later information permits fixing it.
 begin(p);p.locator('#exam').click();p.locator('#copy').click();drain(p)
 p.locator('#linyao').click();reply(p,'hand');p.locator('#exam').click();p.locator('#repair').click()
 assert p.locator('#clock').inner_text()=='17:33'
 text=end(p);assert '为什么是减一' in text and '车门还开着' in text
 endings.append({'path':'copy/clue/repair/bus','verified':True})
 begin(p);p.locator('#exam').click();p.locator('#copy').click();drain(p);text=end(p)
 assert '顶点还是不对' in text and '练习册带了吗' in text
 endings.append({'path':'copy/keep/bus/wrong-work','verified':True})
 begin(p);p.locator('#linyao').click();reply(p,'hand');p.locator('#exam').click();p.locator('#copy').click();drain(p)
 p.locator('#track').click();p.locator('#ball').click();reply(p,'play');text=end(p)
 assert '刚开走' in text and '为什么是减一' in text and '下次你站近一点' in text
 endings.append({'path':'clue/hint/ball/all-three/miss','verified':True})
 # No spending on inspection; modal traps focus; no real-time countdown.
 begin(p);p.locator('#bag').click();p.wait_for_timeout(350);assert p.locator('#clock').inner_text()=='17:25';drain(p)
 p.locator('#exam').click();p.keyboard.press('Escape');assert p.locator('#paper').is_hidden()
 assert p.evaluate('Object.keys(localStorage).length')==0
 p.evaluate("localStorage.setItem('campus-three-years-portraits-v3','original-save-sentinel')")
 p.locator('#bag').click();drain(p);p.reload(wait_until='networkidle')
 assert p.evaluate("localStorage.getItem('campus-three-years-portraits-v3')")=='original-save-sentinel'
 b.close()
assert not errors,errors
report={'passed':True,'paths':endings,'errors':errors,'scope':'Standalone prototype only; original game files and saves not used'}
(ROOT/'verification-friday-v28.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=True));server.shutdown()
