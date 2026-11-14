"""Real browser paths for daily recovery, study tradeoffs, menu and practice isolation."""
from pathlib import Path
import json,sys
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-rhythm-regression-v14';SHOTS.mkdir(exist_ok=True)
if len(sys.argv)>1:URL=sys.argv[1]
else:
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
        def handle(self):
            try:super().handle()
            except (ConnectionResetError,BrokenPipeError):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
    Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/'
KEY='campus-three-years-portraits-v3';errors=[];checks=[]
def raw(p):return p.evaluate('(k)=>localStorage.getItem(k)',KEY)
def state(p):return json.loads(raw(p))
def shot(p,name):p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=91)
def drain(p):
    for _ in range(20):
        if p.locator('#cg-skip').count():p.locator('#cg-skip').click()
        elif p.locator('#dialogue-fast').count():
            p.locator('#dialogue-fast').click()
            if p.locator('.novel-choice:visible').count():return
            p.locator('#dialogue-next').click()
        else:return
    raise AssertionError('Dialogue did not finish')
def plan(p):
    if p.locator('#week-start').count():p.locator('#week-start').click()
    for i in range(3):p.locator('#slot-'+str(i)).select_option('study')
    p.locator('#plan-confirm').click()
def study(p,mode='steady',correct=True):
    p.locator('[data-spot=notebook]').click();p.locator('[data-study-mode='+mode+']').click();p.locator('[data-line="'+('1' if correct else '0')+'"]').click();p.locator('#submit-correction').click();drain(p)
def end_day(p):p.locator('#weekend-end-day').click();p.locator('#weekend-day-confirm').click()
def quiet_weekend(p):
    p.locator('#finish-week').click()
    if p.locator('#skip-time').count():p.locator('#skip-time').click()
    end_day(p);end_day(p);p.locator('#next-week').click();drain(p)
def fixture(p,**patch):
    d=dict(version=6,rhythm={'settled':[],'last':None,'legacyCredit':0},profile={'gender':'female','name':'顾夏'},week=1,place='classroom',remaining=3,seat=14,plan=['study']*3,done=[],study=0,friend=2,warm=2,family=0,energy=64,promise='no',promiseKept=False,echoResolved=True,taste=None,notePromise=False,noteKept=False,memories=[],diaries=[],ended=False,fitness=0,caught=0,cgSeen=['arrival'],october={'mode':'undecided','exam':None})
    d.update(patch);p.goto(URL,wait_until='networkidle');p.evaluate('([k,d])=>{localStorage.clear();localStorage.setItem(k,JSON.stringify(d));}',[KEY,d]);p.reload(wait_until='networkidle');p.locator('#continue-game').click();return d
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
    def page(w=1366,h=768):
        p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)));return p
    p=page();p.goto(URL,wait_until='networkidle');assert p.locator('#continue-game').is_disabled();assert p.locator('#more-play').is_visible();shot(p,'01-main-menu')
    p.locator('#new-game').click();p.locator('#identity-back').click();assert raw(p) is None
    p.locator('#new-game').click();p.locator('[data-gender=female]').click();p.locator('#player-name').fill('顾夏');p.locator('#identity-confirm').click();drain(p);p.locator('#seat-confirm').click();plan(p)
    assert state(p)['energy']==64 and state(p)['version']==7
    energies=[]
    for i in range(3):
        if i==0:
            p.locator('[data-spot=notebook]').click();shot(p,'02-study-choices');p.locator('#leave-book').click()
        study(p);energies.append(state(p)['energy']);assert state(p)['study']==(i+1)*4
        before=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==before
    assert energies==[58,52,34];assert '周五' in p.locator('#date-label').inner_text();shot(p,'03-friday-after-three-studies')
    p.locator('#finish-week').click();assert state(p)['energy']==40;end_day(p);assert state(p)['energy']==52;end_day(p);assert state(p)['energy']==58;p.locator('#next-week').click();drain(p);assert state(p)['week']==2 and state(p)['energy']==64;plan(p)
    for week in [2,3,4]:
        for _ in range(3):study(p)
        quiet_weekend(p);assert state(p)['energy']==64
        if week<4:plan(p)
    assert p.locator('#end-october').is_visible();assert state(p)['study']==48 and state(p)['october']['exam']['rank']==3;exam=state(p)['october']['exam'];shot(p,'04-study-route-exam')
    p.locator('#end-october').click();drain(p);assert state(p)['week']==5 and state(p)['october']['exam']==exam and state(p)['energy']==64
    checks.append('Actual four-week study route: 64 -> 58 -> 52 -> 34, full week returns to 64 with quiet weekend; repeated gains 4 each; exam rank 3 and unchanged October handoff')
    q=page();fixture(q);study(q,'focus');assert state(q)['energy']==48 and state(q)['study']==6;study(q,'focus');study(q,'focus');assert state(q)['energy']==4 and state(q)['study']==18;quiet_weekend(q);assert state(q)['energy']==34;plan(q)
    r=page();fixture(r,energy=20);r.locator('[data-spot=notebook]').click();assert r.locator('[data-study-mode=focus]').is_disabled();r.locator('#leave-book').click();assert state(r)['energy']==20;study(r,correct=False);assert state(r)['energy']==14 and state(r)['study']==3
    checks.append('Focus is a real higher-cost/higher-gain choice; insufficient energy disables it, cancel is free and explained mistakes retain learning value')
    low=page();fixture(low,energy=5);before=state(low);low.locator('[data-spot=notebook]').click();drain(low);assert state(low)==before;low.locator('[data-place=home]').click();low.locator('[data-spot=rest]').click();low.locator('#rest-yes').click();drain(low);assert state(low)['energy']==53
    checks.append('Depleted players are not charged for unavailable study; extra early sleep stacks with normal nights')
    old=page();legacy=fixture(old,version=5,week=2,energy=0,notePromise=True);assert state(old)['energy']==18;assert old.evaluate('(k)=>JSON.parse(localStorage.getItem(k+"-before-balance-v12")).energy',KEY)==0
    old.reload(wait_until='networkidle');old.locator('#continue-game').click();assert state(old)['energy']==18 and state(old)['notePromise'];study(old);assert state(old)['energy']==12 and state(old)['noteKept']
    done=page();fixture(done,version=5,week=4,ended=True,study=9,energy=20);assert state(done)['energy']==20 and state(done)['october']['exam']['rank']==23;assert done.locator('.exam-number').inner_text().startswith('23')
    checks.append('Legacy ongoing save gets one 18-point credit and original backup; reload grants nothing more; promised notes and already-finalized legacy exam remain valid')
    # Independent practice must never change even the serialized gameplay bytes.
    old.locator('#menu-button').click();old.locator('#menu-title').click();before=raw(old);old.locator('#new-game').click();old.locator('#cancel-new').click();assert raw(old)==before
    old.locator('#new-game').click();old.locator('#confirm-new').click();old.locator('#identity-back').click();assert raw(old)==before;old.reload(wait_until='networkidle');assert raw(old)==before
    old.locator('#more-play').click();shot(old,'05-more-play')
    for kind in ['running','phone']:
        old.locator('#practice-'+kind).click();assert '独立练习' in old.locator('.mini-instructions').inner_text();old.locator('#mini-start').click();old.locator('#mini-pause').click();old.locator('#mini-abandon').click();assert raw(old)==before
    old.locator('#practice-basketball').click();old.locator('#ball-start').click()
    for _ in range(3):
        old.wait_for_function('(()=>{const b=document.querySelector("#ball-shoot");return b&&!b.disabled})()');old.locator('#ball-shoot').click()
    old.locator('#practice-again').wait_for();assert raw(old)==before;old.locator('#practice-again').click();old.locator('#ball-abandon').click();assert raw(old)==before
    old.locator('#extras-rules').click();assert '42' in old.locator('.balance-rules').inner_text();old.keyboard.press('Escape');old.locator('#extras-sfx').click();assert not old.evaluate('CampusSfx.enabled');old.locator('#extras-back').click();old.locator('#continue-game').click();assert raw(old)==before
    checks.append('New-game confirmation and identity cancel preserve old save; all three practice entries work, basketball completes/retries, no practice changes save bytes; settings and rules work from title')
    # Existing clock API runs every animation frame; it does not fake the outcome.
    no_save=page();no_save.clock.install();no_save.goto(URL,wait_until='networkidle');no_save.locator('#more-play').click()
    for kind,seconds in [('running',23),('phone',19)]:
        no_save.locator('#practice-'+kind).click();no_save.locator('#mini-start').click();no_save.clock.run_for(seconds*1000);no_save.locator('#practice-done').wait_for();assert raw(no_save) is None;no_save.locator('#practice-done').click()
    checks.append('Running and phone practice complete through their real frame loops under a controlled browser clock, without creating a game save')
    for w,h,name in [(1366,768,'desktop'),(390,844,'phone'),(844,390,'landscape'),(320,568,'small-phone')]:
        m=page(w,h);m.goto(URL,wait_until='networkidle');shot(m,'06-'+name+'-menu')
        assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
        for id in ['new-game','continue-game','more-play','opening-replay']:
            box=m.locator('#'+id).bounding_box();assert box and box['x']>=0 and box['y']>=0 and box['x']+box['width']<=w+1 and box['y']+box['height']<=h+1,(name,id,box)
        m.locator('#more-play').click();shot(m,'07-'+name+'-extras');m.locator('#practice-basketball').click();m.locator('#ball-start').click();assert m.locator('#ball-pause').bounding_box()['y']>=0;m.locator('#ball-pause').click();m.locator('#ball-abandon').click();m.keyboard.press('Escape');m.close()
    checks.append('Desktop, 390x844, 844x390, 320x568 menu controls remain visible; more-play list scrolls and practice pause stays on screen')
    assert not errors,errors
    report={'status':'passed','checks':checks,'javascript_errors':errors,'weekday_steady_energies':energies,'weekly_base_recovery':42,'save_version':7,'actual_phone_hardware':False}
    (ROOT/'verification-rhythm-regression-v14.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=True),flush=True);b.close()
