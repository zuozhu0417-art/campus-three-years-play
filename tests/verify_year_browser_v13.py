"""Actual browser journeys through all new weeks, old-save migration, and alternative branches."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-year-v13';SHOTS.mkdir(exist_ok=True)
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
        if p.locator('#cg-skip').count():p.locator('#cg-skip').click()
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
def action(p,id,key):
    if id=='mom':p.locator('[data-place=home]').click()
    else:p.locator('[data-place=classroom]').click()
    p.locator('[data-spot='+id+']').first.click();drain(p,'year-choice-'+key)
def end_day(p):p.locator('#weekend-end-day').click();p.locator('#weekend-day-confirm').click()
def start_weekend(p):
    p.locator('#finish-week').click()
    if p.locator('#skip-time').count():p.locator('#skip-time').click()
def event(p,id,key):
    p.locator('[data-weekend-act='+id+']').click();drain(p,'weekend-choice-'+key)
def next_week(p):end_day(p);p.locator('#next-week').click();drain(p)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
    def page(w=1366,h=768):
        p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:bad.append(r.url) if r.status>=400 and '/assets/' in r.url else None);return p
    p=page();old=fixture(p);assert p.locator('#year-continue').is_visible();assert p.evaluate('(k)=>JSON.parse(localStorage.getItem(k+"-before-year-v13")).version',KEY)==6
    p.locator('#year-continue').click();plan(p);assert state(p)['week']==7 and state(p)['version']==7;assert p.evaluate('(k)=>JSON.parse(localStorage.getItem(k+"-before-year-v13")).version',KEY)==6
    energies=[]
    for week in range(7,21):
        assert state(p)['week']==week
        if week>7:plan(p)
        if week==9:
            p.locator('[data-spot=pursuer]').click();drain(p);shot(p,'02-visitor-choices');assert p.locator('.character-still').get_attribute('src').endswith('qiaosui-v13.webp');p.locator('#year-choice-friends').click();drain(p)
        else:
            key={7:'camera',8:'consent',10:'interest',11:'fifty',12:'one',13:'share',14:'compare',15:'calendar',16:'receive',17:'keep',18:'questions',19:'apply',20:'move'}[week]
            action(p,'friend',key)
        if week==7:assert state(p)['year']['flags']['cameraKept'];shot(p,'01-sports-week')
        girlkey={7:'paper',8:'specific',9:'wash',10:'stand',11:'list',12:'look',13:'remind',14:'reset',15:'honest',16:'listen',17:'respect',18:'take',19:'question',20:'summer'}[week]
        action(p,'girl',girlkey)
        action(p,'mom','talk')
        energies.append(state(p)['energy']);assert 0<=state(p)['energy']<=100
        start_weekend(p)
        if week==12:event(p,'record12','record')
        if week==16:event(p,'makeup16','meet');assert state(p)['year']['flags']['makeupKept']
        if week==19:event(p,'prepare19','prepare')
        end_day(p)
        if week==15:
            assert p.locator('[data-weekend-act=trial15]').is_enabled();assert p.locator('[data-weekend-act=paper15]').is_enabled();shot(p,'03-exclusive-sunday');event(p,'paper15','paper');assert p.locator('[data-weekend-act=trial15]').is_disabled();assert state(p)['year']['flags']['paperTrip']
        if week==18:event(p,'sound18','privacy')
        if week==20:event(p,'summer20','contact')
        if week in [11,16]:
            before=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==before
        next_week(p)
    d=state(p);assert d['ended'] and d['week']==20;assert p.locator('#year-journal').is_visible();assert len(d['year']['exams'])==2;assert d['year']['loan']==d['year']['loanPaid']==50;assert d['weekend']['wallet']==100;assert d['october']['mode']=='closer';assert all(k in d['cgSeen'] for k in ['sports','winter','spring','dinnerYear','summer']);shot(p,'04-year-ending')
    checks.append('Actual old W06 save -> W07–W20 complete year: photography, 50-yuan loan/repayment, drawing, wait/apology/makeup, paper-store exclusive Sunday, recording/privacy, family job discussion, preparation result and two frozen exams; week 11/16 reload byte-equivalent')
    p.locator('#year-gallery').click();assert p.locator('[data-cg=sports]').is_enabled();p.keyboard.press('Escape');p.locator('#year-title').click();assert p.locator('#continue-game').is_enabled();p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert p.locator('#year-export').is_visible();assert state(p)['year']==d['year'];checks.append('Year-ending resume, gallery and title preserve complete-year progress')
    # Full second run: female protagonist, purely platonic Lin Yao, explicit refusal, academic Sunday.
    q=page(390,844);fixture(q,gender='female',mode='friends');q.locator('#year-continue').click()
    for week in range(7,21):
        plan(q)
        if week==9:
            q.locator('[data-spot=pursuer]').click();drain(q);assert q.locator('.character-still').get_attribute('src').endswith('chenyu-v13.webp');q.locator('#year-choice-stop').click();drain(q);assert state(q)['year']['pursuit']=='stop';shot(q,'05-mobile-refusal')
        if week>=10:assert q.locator('[data-spot=pursuer]').count()==0
        if week==14:action(q,'girl','space')
        if week==19:action(q,'friend','apply')
        # Meaningful learning uses the actual question UI and cost path.
        q.locator('[data-place=classroom]').click();q.locator('[data-spot=notebook]').click();q.locator('[data-line="1"]').click();q.locator('#submit-correction').click();drain(q)
        q.locator('[data-place=home]').click();q.locator('[data-spot=rest]').click();q.locator('#rest-yes').click();drain(q)
        start_weekend(q)
        if week==16:assert q.locator('[data-weekend-act=makeup16]').is_disabled()
        end_day(q)
        if week==15:event(q,'trial15','teach');assert q.locator('[data-weekend-act=paper15]').is_disabled()
        next_week(q)
    e=state(q);assert e['october']['mode']=='friends';assert e['year']['flags']['trialTalk'] and not e['year']['flags'].get('paperTrip');assert e['year']['flags']['cameraMissed'];assert e['year']['flags']['showcaseResult']=='reserve';assert '陈聿接受了拒绝' in q.locator('.year-recap').inner_text();shot(q,'06-mobile-year-ending')
    checks.append('Second complete W07–W20 run on 390x844: female identity, male newcomer, refusal stays respected through year end, friendship remains platonic, missed photography retained, academic Sunday excludes paper trip, no automatic makeup, unprepared application has reserve result')
    # Play both original October weeks into the new year module without an ended-W06 fixture.
    bridge=page();fixture(bridge,week=5,ended=False,remaining=3,done=[],plan=None,mode='undecided',weekend={'wallet':0});plan(bridge)
    bridge.locator('[data-spot=girl]').first.click();drain(bridge,'oct-closer');bridge.locator('[data-spot=friend]').first.click();drain(bridge,'oct-friend-yes');start_weekend(bridge);end_day(bridge);next_week(bridge);assert state(bridge)['week']==6;plan(bridge)
    bridge.locator('[data-spot=girl]').first.click();drain(bridge,'oct-poster-yes');bridge.locator('[data-spot=friend]').first.click();drain(bridge,'oct-photo-yes');start_weekend(bridge);end_day(bridge);next_week(bridge);assert state(bridge)['week']==7 and not state(bridge)['ended'];plan(bridge);action(bridge,'friend','camera');assert state(bridge)['year']['flags']['cameraKept']
    checks.append('Actual W05 seat/relationship -> W06 poster/photography promise -> ordinary weekend -> W07 fulfillment, without an artificial chapter stop')
    # Insufficient loan funds never mutate state.
    r=page();fixture(r,week=11,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':0});before=state(r);action(r,'friend','fifty');assert state(r)==before;drain(r);action(r,'friend','no');assert state(r)['year']['flags']['loanRefused'];assert state(r)['weekend']['wallet']==0
    checks.append('Insufficient 50-yuan loan returns an explanation without spending; alternate refusal remains playable')
    # All introduced portraits and CG files decode; gallery placement and visitor entry stay reachable.
    for asset in ['year-sports.jpg','year-winter.jpg','year-spring.jpg','year-dinner.jpg','year-summer.jpg','year-visitor.jpg','azhe-v13.webp','father-v13.webp','qiaosui-v13.webp','chenyu-v13.webp']:
        assert p.evaluate('u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth>0);i.onerror=()=>r(false);i.src=u;})',URL+'assets/'+asset),asset
    for w,h in [(390,844),(844,390),(320,568)]:
        v=page(w,h);fixture(v,week=9,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':20});assert v.locator('[data-spot=pursuer]').is_visible();box=v.locator('[data-spot=pursuer]').bounding_box();assert 0<=box['x'] and box['x']+box['width']<=w+1 and box['y']+box['height']<=h+1;assert v.evaluate('document.documentElement.scrollWidth<=innerWidth')
        for control in ['finish-week','plan-button']:
            box=v.locator('#'+control).bounding_box();assert box and box['y']>=0 and box['y']+box['height']<=h+1,(w,h,control,box)
        shot(v,f'07-visitor-{w}');v.locator('[data-spot=pursuer]').click();drain(v,'year-choice-stop');assert state(v)['year']['pursuit']=='stop';start_weekend(v);assert v.locator('#weekend-end-day').is_visible();v.close()
    assert not errors,errors;assert not bad,bad
    checks.append('All ten generated assets decode; mobile portrait/landscape/small-phone visitor controls fit; no page exceptions or missing assets')
    b.close()
report=dict(passed=True,url=URL,checks=checks,route_one_energies=energies,errors=errors,missing_assets=bad)
(ROOT/'verification-year-browser-v13.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
