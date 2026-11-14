"""Real isolated-browser checks for the voiced film and its game handoff."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json
import time
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'screenshots-opening-regression-v13';SHOTS.mkdir(exist_ok=True)
KEY='campus-three-years-portraits-v3';SEEN='campus-opening-film-v10-seen'
checks=[];errors=[]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
    def handle(self):
        try:super().handle()
        except (ConnectionResetError,BrokenPipeError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/'

def shot(p,name):p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=91)
def gone(p):p.locator('.opening-screen').wait_for(state='detached',timeout=4000)
def running(p):p.wait_for_function('document.querySelector("#opening-video")?.currentTime>.12 && !document.querySelector("#opening-video").paused')

try:
    with sync_playwright() as pw:
        b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True,
            args=['--autoplay-policy=document-user-activation-required'])
        def page(w=1366,h=768,reduced=False):
            p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce' if reduced else 'no-preference')
            p.on('pageerror',lambda e:errors.append(str(e)));return p
        p=page();p.goto(BASE,wait_until='domcontentloaded');print('First-visit gate loaded.',flush=True)
        assert p.locator('#opening-start').is_visible() and p.locator('#opening-video').evaluate('(v)=>v.paused')
        assert p.locator('#game').evaluate('(g)=>g.inert')
        shot(p,'01-start-with-sound');started=time.monotonic();p.locator('#opening-start').click();running(p)
        meta=p.locator('#opening-video').evaluate('(v)=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,muted:v.muted,inline:v.playsInline})')
        assert abs(meta['duration']-21.2)<.1 and meta['width']==1280 and meta['height']==720 and not meta['muted'] and meta['inline']
        p.wait_for_function('document.querySelector("#opening-video").currentTime>6.2');shot(p,'02-voiced-seat')
        meta['audio_decoded_bytes']=p.locator('#opening-video').evaluate('(v)=>v.webkitAudioDecodedByteCount')
        assert meta['audio_decoded_bytes']>0
        p.wait_for_function('CampusOpening.closing',timeout=25000)
        p.wait_for_timeout(360)
        fade=p.locator('.opening-screen').evaluate('(e)=>({opacity:Number(getComputedStyle(e).opacity),volume:e.querySelector("video").volume})')
        assert 0<fade['opacity']<1 and 0<fade['volume']<.9
        shot(p,'03-dissolve-to-game');gone(p);elapsed=time.monotonic()-started
        assert 21<=elapsed<27 and p.locator('#new-game').is_visible() and not p.locator('#game').evaluate('(g)=>g.inert')
        assert p.evaluate('(k)=>localStorage.getItem(k)',KEY) is None
        assert p.evaluate('(k)=>localStorage.getItem(k)',SEEN)=='yes'
        checks.append('Gesture-started audible 21.2s inline MP4 plays in real time; measured intermediate opacity and fading audio; releases to title without creating a game save')
        p.reload(wait_until='domcontentloaded');assert not p.locator('.opening-screen').count()
        p.locator('#opening-replay').click();running(p)
        p.keyboard.press('Tab');assert p.locator('#opening-skip').evaluate('(b)=>b===document.activeElement')
        p.keyboard.press('Tab');assert p.locator('#opening-sound').evaluate('(b)=>b===document.activeElement')
        p.keyboard.press('Shift+Tab');assert p.locator('#opening-skip').evaluate('(b)=>b===document.activeElement')
        p.locator('#opening-pause').click()
        at=p.locator('video').evaluate('(v)=>v.currentTime');p.wait_for_timeout(200)
        assert abs(p.locator('video').evaluate('(v)=>v.currentTime')-at)<.06
        p.locator('#opening-sound').click();assert p.locator('video').evaluate('(v)=>v.muted')
        p.locator('#opening-pause').click();running(p)
        before=p.locator('video').evaluate('(v)=>v.volume');p.locator('#opening-skip').click();p.wait_for_timeout(220)
        assert 0<float(p.locator('.opening-screen').evaluate('(e)=>getComputedStyle(e).opacity'))<1
        assert p.locator('video').evaluate('(v)=>v.volume')<before
        gone(p);assert not p.locator('#game').evaluate('(g)=>g.inert')
        checks.append('Reload suppresses already-seen opening; replay, pause, mute and skip work; skip also fades picture and sound')
        # The actual game still accepts either identity after the new transition.
        p.locator('#new-game').click();assert p.locator('#identity-confirm').is_disabled()
        p.locator('[data-gender=female]').click();p.locator('#player-name').fill('顾夏');p.locator('#identity-confirm').click()
        assert p.locator('#cg-skip').is_visible();shot(p,'04-story-entry')
        checks.append('Female identity, name and original opening story remain playable')
        for w,h,label in [(390,844,'portrait'),(844,390,'landscape'),(320,568,'small-phone')]:
            m=page(w,h);m.goto(BASE,wait_until='domcontentloaded');shot(m,'05-'+label+'-gate')
            for name in ['opening-start','opening-skip','opening-sound']:
                r=m.locator('#'+name).bounding_box()
                assert r and r['x']>=0 and r['y']>=0 and r['x']+r['width']<=w+1 and r['y']+r['height']<=h+1,(label,name,r)
            m.locator('#opening-start').click();running(m)
            assert not m.locator('video').evaluate('(v)=>v.muted')
            assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
            if label=='portrait':
                m.locator('video').evaluate('(v)=>v.currentTime=5.9');m.wait_for_function('document.querySelector("video").currentTime>6.1');shot(m,'06-phone-film')
            m.keyboard.press('Escape');gone(m);m.locator('#new-game').click();m.locator('[data-gender=male]').click();m.locator('#identity-confirm').click();assert m.locator('#cg-skip').is_visible();m.close()
        checks.append('390x844, 844x390 and 320x568 layouts; gesture audio, visible buttons, no horizontal overflow and male story entry')
        # Rewatching must not rewrite an existing gameplay save.
        saved=dict(version=3,profile={'gender':'male','name':'许川'},week=4,place='classroom',remaining=0,seat=14,plan=['study','friend','rest'],done=[],study=9,friend=6,warm=6,family=3,energy=64,promise='yes',promiseKept=True,echoResolved=True,taste=None,notePromise=False,noteKept=False,memories=[],diaries=[],ended=True,fitness=0,caught=0,cgSeen=[])
        q=page();q.context.add_init_script('localStorage.setItem('+json.dumps(KEY)+','+json.dumps(json.dumps(saved,ensure_ascii=False))+');');q.goto(BASE)
        before=q.evaluate('(k)=>localStorage.getItem(k)',KEY);q.locator('#opening-skip').click();gone(q)
        assert q.evaluate('(k)=>localStorage.getItem(k)',KEY)==before
        q.locator('#continue-game').click();assert q.locator('#end-october').is_visible() and q.locator('#profile-name').inner_text()=='许川'
        checks.append('Existing September save preserved byte-for-byte; continue opens the correct identity and October continuation')
        r=page(reduced=True);r.goto(BASE);assert not r.locator('.opening-screen').count();r.locator('#opening-replay').click();running(r);r.keyboard.press('Escape');gone(r)
        f=page();f.route('**/campus-opening-v10.mp4',lambda route:route.abort());f.goto(BASE);f.wait_for_function('CampusOpening.mode==="fallback"');f.locator('#opening-start').click();f.wait_for_function('!document.querySelector(".opening-canvas").hidden');assert f.locator('#opening-sound').is_disabled();f.keyboard.press('Escape');gone(f)
        checks.append('Reduced-motion preference skips automatic opening; MP4 failure falls back to the retained canvas film with a working exit')
        v=page();v.goto(BASE);v.locator('#opening-start').click();running(v)
        v.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');assert v.locator('video').evaluate('(v)=>v.paused')
        v.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))');running(v);v.keyboard.press('Escape');gone(v)
        s=page();s.context.add_init_script('Storage.prototype.getItem=function(){throw new Error("denied")};Storage.prototype.setItem=function(){throw new Error("denied")};');s.goto(BASE);s.locator('#opening-skip').click();gone(s);assert s.locator('#new-game').is_visible()
        checks.append('Background visibility pauses/resumes; storage denial still permits title and game access')
        assert not errors,errors
        report={'status':'passed','checks':checks,'javascript_errors':errors,'video':meta,'handoff_wall_seconds':round(elapsed,2),'mid_transition':fade,'actual_phone_hardware':False,'browser':'Microsoft Edge headless; isolated contexts'}
        (ROOT/'verification-opening-regression-v13.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps(report,ensure_ascii=True),flush=True);b.close()
finally:
    server.shutdown();server.server_close()
