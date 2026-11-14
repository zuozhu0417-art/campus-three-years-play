from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
import json,time

ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-opening-v5';SHOTS.mkdir(exist_ok=True)
KEY='campus-three-years-portraits-v3';SEEN='campus-opening-film-v1-seen';checks=[];errors=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}/'
def shot(p,name):p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=93)
def seek_visible(p,t):
 p.locator('#opening-video').evaluate('''async(v,t)=>{v.pause();await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=t});await v.play()}''',t)
 p.wait_for_function('(t)=>document.querySelector("#opening-video").currentTime>t+.14',arg=t);p.locator('#opening-video').evaluate('(v)=>v.pause()');p.wait_for_timeout(80)
 variation=p.locator('#opening-video').evaluate('''v=>{const c=document.createElement('canvas');c.width=80;c.height=45;const x=c.getContext('2d');x.drawImage(v,0,0,80,45);const d=x.getImageData(0,0,80,45).data;let a=255,b=0;for(let i=0;i<d.length;i+=4){a=Math.min(a,d[i]);b=Math.max(b,d[i]);}return b-a}''');assert variation>60,variation
def running(p):p.wait_for_function('(()=>{const v=document.querySelector("#opening-video");return v&&v.currentTime>.2&&!v.paused&&v.readyState>=2})()')
def media(p):return p.locator('#opening-video').evaluate('(v)=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,inline:v.playsInline,audioBytes:v.webkitAudioDecodedByteCount})')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 def page(w=1366,h=768,reduced=False):
  p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce' if reduced else 'no-preference');p.on('pageerror',lambda e:errors.append(str(e)));return p
 p=page();started=time.monotonic();p.goto(BASE,wait_until='networkidle');running(p);d=media(p)
 assert d['width']==1280 and d['height']==720 and abs(d['duration']-18.8)<.1 and d['muted'] and d['inline'];assert p.locator('#game').evaluate('(e)=>e.inert')
 p.wait_for_function('document.querySelector("#opening-video").currentTime>1');shot(p,'01-first-person-doorway')
 p.wait_for_function('document.querySelector("#opening-video").currentTime>5.1');shot(p,'02-backpack-on-desk')
 p.wait_for_function('document.querySelector("#opening-video").currentTime>7.4');shot(p,'03-classmate-greeting')
 p.locator('.opening-screen').wait_for(state='hidden',timeout=24000);elapsed=time.monotonic()-started
 assert 18<=elapsed<26 and p.locator('#new-game').is_visible() and not p.locator('#game').evaluate('(e)=>e.inert')
 assert p.evaluate('(k)=>localStorage.getItem(k)',SEEN)=='yes' and p.evaluate('(k)=>localStorage.getItem(k)',KEY) is None
 checks.append('First-visit muted inline H.264/AAC playback, real 18.8-second automatic completion, full moving film and safe title handoff; no gameplay save created')
 p.reload(wait_until='networkidle');assert p.locator('.opening-screen').count()==0
 p.locator('#opening-replay').click();running(p);p.locator('#opening-pause').click();t=p.locator('video').evaluate('(v)=>v.currentTime');p.wait_for_timeout(350);assert abs(p.locator('video').evaluate('(v)=>v.currentTime')-t)<.06
 p.locator('#opening-sound').click();p.wait_for_timeout(300);d=media(p);assert not d['muted'] and d['audioBytes']>0
 seek_visible(p,13);shot(p,'04-rain-scene');p.locator('#opening-skip').click();assert not p.locator('#game').evaluate('(e)=>e.inert')
 checks.append('Seen flag suppresses automatic replay; title rewatch, pause freezes time, sound gesture unmutes and actual AAC bytes decode, pointer skip restores controls')
 # Keyboard stays inside the film, and a real new game still asks for gender/name.
 p.locator('#opening-replay').click();running(p);p.keyboard.press('Tab');assert p.locator('#opening-sound').evaluate('(e)=>e===document.activeElement');p.keyboard.press('Shift+Tab');assert p.locator('#opening-skip').evaluate('(e)=>e===document.activeElement');p.keyboard.press('Escape')
 p.locator('#new-game').click();assert p.locator('#identity-confirm').is_disabled();p.locator('[data-gender=female]').click();p.locator('#player-name').fill('顾夏');p.locator('#identity-confirm').click();assert p.locator('#cg-skip').is_visible()
 checks.append('Keyboard focus trap and Escape skip; entering gameplay still uses original male/female identity selection and opening story')
 # Previously saved progress is byte-for-byte untouched by watching/skipping.
 q=page();saved=dict(version=3,profile={'gender':'male','name':'许川'},week=4,place='classroom',remaining=0,seat=14,plan=['study','friend','rest'],done=[],study=9,friend=6,warm=6,family=3,energy=64,promise='yes',promiseKept=True,echoResolved=True,taste=None,notePromise=False,noteKept=False,memories=[],diaries=[],ended=True,fitness=0,caught=0,cgSeen=[])
 q.context.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(saved,ensure_ascii=False))+');');q.goto(BASE);running(q);before=q.evaluate('(k)=>localStorage.getItem(k)',KEY);q.keyboard.press('Escape');assert q.evaluate('(k)=>localStorage.getItem(k)',KEY)==before
 q.locator('#continue-game').click();assert q.locator('#end-october').is_visible();assert q.locator('#profile-name').inner_text()=='许川'
 checks.append('Existing September save survives opening byte-for-byte and can still continue into October with chosen identity')
 # Both phone orientations actually decode video; film and controls stay on screen.
 for w,h,name in [(390,844,'05-phone-portrait'),(844,390,'06-phone-landscape')]:
  m=page(w,h);m.goto(BASE,wait_until='networkidle');running(m);seek_visible(m,7.7);shot(m,name)
  assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
  for id in ['opening-skip','opening-sound','opening-pause']:
   bounds=m.locator('#'+id).bounding_box();assert bounds and bounds['x']>=0 and bounds['y']>=0 and bounds['x']+bounds['width']<=w+1 and bounds['y']+bounds['height']<=h+1
  m.locator('#opening-skip').click();m.locator('#new-game').click();assert m.locator('[data-gender=male]').is_visible();m.close()
 checks.append('390x844 and 844x390 real browser video decoding and pointer controls, no clipped buttons or horizontal overflow; gender selection usable afterward')
 r=page(reduced=True);r.goto(BASE,wait_until='networkidle');assert r.locator('.opening-screen').count()==0 and r.evaluate('(k)=>localStorage.getItem(k)',SEEN) is None;r.locator('#opening-replay').click();running(r);r.locator('#opening-skip').click()
 checks.append('Reduced-motion preference skips automatic opening while allowing explicit replay')
 f=page();f.route('**/campus-opening-v1.mp4',lambda route:route.abort());f.goto(BASE,wait_until='networkidle');f.wait_for_function('CampusOpening.mode==="fallback"');f.wait_for_function('(()=>{const c=document.querySelector(".opening-canvas");return c&&!c.hidden&&c.getContext("2d").getImageData(640,360,1,1).data[0]>20})()');shot(f,'07-canvas-fallback');assert f.locator('#opening-sound').is_disabled();f.keyboard.press('Escape');assert f.locator('#new-game').is_visible()
 checks.append('Simulated MP4 failure uses the actual local canvas animation and keeps a working skip to gameplay')
 v=page();v.goto(BASE);running(v);v.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');assert v.locator('video').evaluate('(v)=>v.paused');v.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))');running(v);v.keyboard.press('Escape')
 # Storage-denied mode does not leave a blank screen or demand a reset.
 s=page();s.context.add_init_script('Storage.prototype.getItem=function(){throw new Error("storage denied")};Storage.prototype.setItem=function(){throw new Error("storage denied")};');s.goto(BASE);running(s);s.locator('#opening-skip').click();assert s.locator('#new-game').is_visible()
 checks.append('Background visibility pauses/resumes film; denied localStorage still permits opening and game access')
 assert not errors,errors
 report={'checks':checks,'errors':errors,'metadata':d,'automatic_handoff_wall_seconds':round(elapsed,2),'views':['1366x768','390x844','844x390'],'actual_phone_hardware':False}
 (ROOT/'verification-opening-v5.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'passed':len(checks),'errors':errors,'duration':18.8}),flush=True);b.close()
server.shutdown();server.server_close()
