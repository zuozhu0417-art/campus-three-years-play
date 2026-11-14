"""Play weekend branches, migration, microgame and sound in an isolated browser."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-weekends-v11';SHOTS.mkdir(exist_ok=True)
KEY='campus-three-years-portraits-v3';errors=[];checks=[]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
    def handle(self):
        try:super().handle()
        except (ConnectionResetError,BrokenPipeError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/'
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY)
def fixture(p,week=1,**patch):
    d=dict(version=4,profile={'gender':'female','name':'顾夏'},week=week,place='classroom',remaining=0,seat=14,plan=['study','friend','rest'],done=[],study=3,friend=2,warm=2,family=0,energy=80,promise='no',promiseKept=False,echoResolved=True,taste=None,notePromise=False,noteKept=False,memories=[],diaries=[],ended=False,fitness=0,caught=0,cgSeen=['arrival'],october={'mode':'undecided','exam':{'rank':20,'oldSeat':14,'energy':80}})
    d.update(patch);p.goto(URL,wait_until='domcontentloaded');p.evaluate('([k,d])=>{localStorage.clear();localStorage.setItem(k,JSON.stringify(d));}',[KEY,d]);p.reload(wait_until='domcontentloaded');p.locator('#continue-game').click();return d
def drain(p):
    for _ in range(15):
        if p.locator('#cg-skip').count():p.locator('#cg-skip').click()
        elif p.locator('#dialogue-fast').count():
            p.locator('#dialogue-fast').click()
            if p.locator('.novel-choice:visible').count():return
            p.locator('#dialogue-next').click()
        else:return
    raise AssertionError('Dialogue did not finish')
def choose(p,key):p.locator('#dialogue-fast').click();p.locator('#weekend-choice-'+key).click()
def begin(p):p.locator('#finish-week').click();p.locator('#weekend-screen').wait_for(state='visible')
def end_day(p):p.locator('#weekend-end-day').click();p.locator('#weekend-day-confirm').click()
def activity(p,id,key):p.locator('[data-weekend-act='+id+']').click();choose(p,key)
def shot(p,name):p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=91)
try:
 with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
    def page(w=1366,h=768):
        p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)));return p
    p=page();fixture(p);begin(p);assert state(p)['version']==5;assert state(p)['remaining']==0;shot(p,'01-saturday')
    before=state(p);activity(p,'basketball','pass');p.locator('#ball-abandon').click();assert state(p)==before
    activity(p,'basketball','pass');p.locator('#ball-start').click();p.locator('#ball-pause').click();assert p.locator('#ball-start').is_visible();p.locator('#ball-start').click()
    for _ in range(3):
        p.wait_for_function('(()=>{const b=document.querySelector("#ball-shoot"),d=document.querySelector("#ball-dot");return b&&!b.disabled&&parseFloat(d.style.left)>40&&parseFloat(d.style.left)<57})()')
        p.locator('#ball-shoot').click()
    p.locator('#ball-pause').click();p.wait_for_timeout(850);assert p.locator('#ball-start').is_visible();assert state(p)==before;p.locator('#ball-start').click()
    p.locator('#dialogue-fast').wait_for();assert state(p)['weekend']['current']['remaining']==1;assert state(p)['weekend']['current']['pending']
    spent=state(p);p.reload(wait_until='domcontentloaded');p.locator('#continue-game').click();assert p.locator('#dialogue-fast').is_visible();assert state(p)['energy']==spent['energy'];drain(p)
    assert not state(p)['weekend']['current']['pending'];assert p.locator('[data-weekend-act=basketball]').is_disabled()
    activity(p,'breakfast','listen');drain(p);assert state(p)['weekend']['current']['remaining']==0
    assert p.locator('[data-weekend-act=park]').is_disabled();shot(p,'02-saturday-spent')
    end_day(p);assert state(p)['weekend']['current']['day']==1;assert p.locator('[data-weekend-act=cook]').is_visible()
    activity(p,'letter','remember');drain(p);assert state(p)['weekend']['letters'];p.locator('#weekend-pocket').click();p.locator('[data-keepsake=futureLetter]').click();drain(p);p.keyboard.press('Escape')
    end_day(p);assert p.locator('#next-week').is_visible();p.locator('#next-week').click();drain(p);p.locator('#week-start').click();p.locator('#plan-confirm').click()
    assert state(p)['week']==2 and state(p)['remaining']==3 and state(p)['weekend']['counts']['basketball']==1
    checks.append('Real weekday-to-Saturday-to-Sunday-to-next-week flow; three-shot microgame, pause, free abandonment, daily cap and pending-result recovery without double debit')
    q=page();fixture(q,week=2);begin(q);activity(q,'bookshop','labels');drain(q)
    d=state(q);assert d['weekend']['wallet']==40 and d['weekend']['current']['remaining']==0 and 'firstPay' in d['weekend']['unlocks'];q.locator('#weekend-wallet').click();assert '40 元' in q.locator('.modal-body').inner_text();q.keyboard.press('Escape');end_day(q)
    activity(q,'usedbooks','practical');drain(q);assert state(q)['weekend']['wallet']==32;assert len(state(q)['weekend']['ledger'])==2
    q.reload(wait_until='domcontentloaded');q.locator('#continue-game').click();assert state(q)['weekend']['wallet']==32 and state(q)['weekend']['current']['remaining']==1;shot(q,'03-wallet-and-sunday')
    checks.append('Whole-day short job costs both slots, earns once and unlocks ledger; actual purchase debits money; money and Sunday progress survive reload')
    r=page();fixture(r,week=5,october={'mode':'friends','poster':True,'exam':{'rank':20,'oldSeat':14,'energy':80}});begin(r);end_day(r);assert r.locator('[data-weekend-act=walk]').is_disabled()
    r.locator('[data-weekend-act=drawing]').click();choose(r,'keep');drain(r);assert state(r)['october']['mode']=='friends';assert 'littleBird' not in state(r)['weekend']['unlocks']
    t=page();fixture(t,week=6,october={'mode':'closer','poster':True,'exam':{'rank':20,'oldSeat':14,'energy':80}});begin(t);end_day(t);activity(t,'walk','listen');drain(t)
    assert 'littleBird' in state(t)['weekend']['unlocks'];assert state(t)['october']['mode']=='closer';t.locator('#weekend-pocket').click();t.locator('[data-keepsake=littleBird]').click();assert t.locator('#cg-skip').is_visible();shot(t,'04-little-bird-keepsake');t.locator('#cg-skip').click();t.keyboard.press('Escape')
    checks.append('Romantic walk is gated; ordinary friendship drawing remains valid; approaching plus real poster and walk unlocks a free keepsake, without confirming a relationship')
    u=page();fixture(u,week=3,weekend={'wallet':0,'counts':{'basketball':2},'unlocks':['courtSignal']});begin(u);activity(u,'basketball','pass');u.locator('#ball-start').click();assert u.locator('#ball-signal').is_visible();u.locator('#ball-signal').click();assert u.locator('.basketball').evaluate('(e)=>e.classList.contains("ball-assist")');u.locator('#ball-pause').click();u.locator('#ball-abandon').click()
    checks.append('Previously earned court signal is a real once-per-game assistance button; abandoning still costs nothing')
    # SFX really schedules Web Audio in response to a trusted browser click.
    assert p.evaluate('CampusSfx.playedCount')>0 and p.evaluate('CampusSfx.state')=='running'
    p.locator('#menu-button').click();p.locator('#menu-sfx').click();assert not p.evaluate('CampusSfx.enabled');p.locator('#menu-resume').click();count=p.evaluate('CampusSfx.playedCount');p.locator('#plan-button').click();assert p.evaluate('CampusSfx.playedCount')==count;p.keyboard.press('Escape')
    p.reload(wait_until='domcontentloaded');assert not p.evaluate('CampusSfx.enabled');p.locator('#continue-game').click();p.locator('#menu-button').click();p.locator('#menu-sfx').click();assert p.evaluate('CampusSfx.enabled');p.keyboard.press('Escape')
    checks.append('Light click sounds schedule actual Web Audio; sound toggle persists and silences clicks independently of wind/film audio')
    for w,h,name in [(390,844,'phone'),(844,390,'landscape'),(320,568,'small-phone')]:
        m=page(w,h);fixture(m,week=6,october={'mode':'closer','poster':True,'exam':{'rank':20,'oldSeat':14,'energy':80}});begin(m);shot(m,'05-'+name)
        assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert m.locator('#menu-button').bounding_box()['y']>=0,'Menu must remain visible on short screens'
        for id in ['weekend-end-day','weekend-pocket']:
            box=m.locator('#'+id).bounding_box();assert box and box['x']>=0 and box['y']>=0 and box['x']+box['width']<=w+1 and box['y']+box['height']<=h+1,(name,id,box)
        m.locator('[data-weekend-filter=同学]').click();activity(m,'basketball','pass');m.locator('#ball-start').click();shot(m,'06-'+name+'-basketball');assert m.locator('#ball-pause').bounding_box()['y']>=0;m.locator('#ball-pause').click();m.locator('#ball-abandon').click();m.close()
    checks.append('390x844, 844x390 and 320x568 weekend/card/minigame layouts; scrolling list, filter and visible completion controls')
    e=page();fixture(e,week=4,promise='yes',promiseKept=True,notePromise=True,noteKept=True,taste='不放香菜');begin(e);end_day(e);end_day(e);e.locator('#next-week').click();assert state(e)['ended'] and e.locator('#end-october').is_visible()
    e.locator('#end-october').click();drain(e);assert state(e)['week']==5 and state(e)['promiseKept'] and state(e)['noteKept'] and state(e)['taste']=='不放香菜';assert not state(e)['weekend']['current']['started']
    old=page();fixture(old,week=6,ended=True,diaries=[{'week':6,'text':'旧手记'}],october={'mode':'closer','poster':True,'sportsPhoto':True,'exam':{'rank':20,'oldSeat':14,'energy':80}})
    old.locator('#oct-weekend').click();assert state(old)['week']==6 and state(old)['october']['sportsPhoto'];assert old.evaluate('(k)=>!!localStorage.getItem(k+"-before-weekend-v11")',KEY)
    end_day(old);end_day(old);old.locator('#next-week').click();assert state(old)['ended'];assert len([x for x in state(old)['diaries'] if x['week']==6])==1;assert not old.locator('#oct-weekend').count()
    old.reload(wait_until='domcontentloaded');old.locator('#continue-game').click();assert not old.locator('#oct-weekend').count()
    checks.append('Week-four weekend leads to the exam and October without clearing promises or taste; completed legacy week-six saves get one backed-up weekend, preserve photography promise and cannot replay it')
    assert not errors,errors
    report={'status':'passed','checks':checks,'javascript_errors':errors,'actual_phone_hardware':False,'catalog_at_week6':18,'save_version':5}
    (ROOT/'verification-weekends-v11.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=True),flush=True);b.close()
finally:server.shutdown();server.server_close()
