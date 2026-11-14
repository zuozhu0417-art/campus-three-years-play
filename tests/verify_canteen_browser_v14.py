"""Actual browser journeys through all new weeks, old-save migration, and alternative branches."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-canteen-v14';SHOTS.mkdir(exist_ok=True)
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
def fresh(p,week=7,**patch):
    return fixture(p,week=week,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':100},**patch)

def food(p,id='girl-canteen',key=None):
    p.locator('[data-place=canteen]').click();p.locator('[data-spot='+id+']').click();drain(p)
    if key is None:key=p.locator('.novel-choice').first.get_attribute('id')
    p.locator('#'+key).click();drain(p)

def classroom(p,id='girl',key=None):
    p.locator('[data-place=classroom]').click();p.locator('[data-spot='+id+']').first.click();drain(p)
    if key is None:key=p.locator('.novel-choice').first.get_attribute('id')
    p.locator('#'+key).click();drain(p)

with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
    def page(w=1366,h=768):
        p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:bad.append(r.url) if r.status>=400 and '/assets/' in r.url else None);return p
    p=page()
    # Actual weekday transactions: both orders, every regular character, and original weeks.
    for week in [1,5,7,16,20]:
        for who in ['girl','friend']:
            for reverse in [False,True]:
                fresh(p,week);start=state(p)
                if reverse:food(p,who+'-canteen');classroom(p,who)
                else:classroom(p,who);food(p,who+'-canteen')
                d=state(p);assert d['remaining']==1 and all(id in d['done'] for id in [who,who+'-canteen']);assert len(d['done'])==2
                # 12 classroom + 8 meal, two scheduled sleep gains of 12 each.
                assert d['energy']==min(100,start['energy']-12+12)-8+12 if not reverse else d['energy']==min(100,start['energy']-8+12)-12+12
                p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==d
                p.locator('[data-place=canteen]').click();d=state(p);p.locator('[data-spot='+who+'-canteen]').click();assert state(p)==d and not p.locator('#dialogue-fast').count()
                if who=='friend':
                    p.locator('[data-place=track]').click();d=state(p);p.locator('[data-spot=friend]').click();assert state(p)==d and not p.locator('#dialogue-fast').count()
    checks.append('20 actual two-venue journeys: W01/W05/W07/W16/W20, Lin Yao/Zhao Cheng, both visit orders, precise 12+8 costs and scheduled sleep, reload and duplicate rejection; track cannot give a third Zhao Cheng interaction')
    # Each weekly cafeteria scene is actually playable and uses a distinct title.
    titles={id:set() for id in ['girl-canteen','friend-canteen']};newcg=set()
    for week in range(1,21):
        fresh(p,week)
        for id in titles:
            p.locator('[data-place=canteen]').click();p.locator('[data-spot='+id+']').click();titles[id].add(p.locator('.novel-caption').inner_text());drain(p);p.locator('.novel-choice').first.click();drain(p)
        assert state(p)['remaining']==1
        newcg.update(state(p)['cgSeen'])
    assert all(len(v)==20 for v in titles.values());assert all(x in newcg for x in ['lunchOrange','receiptBird','soupSteam'])
    checks.append('All 40 W01–W20 cafeteria scenes completed through live choices; three Lin Yao CGs unlocked by their actual choices')
    # Old save used the original shared ID; do not reset it or award another classroom visit.
    fixture(p,week=7,ended=False,remaining=2,done=['girl'],plan=['friend']*3,weekend={'wallet':20});food(p);assert state(p)['remaining']==1 and 'girl' in state(p)['done']
    # Lack of energy/time and cancel are all non-mutating.
    for energy,remaining in [(7,3),(80,0)]:
        fixture(p,week=7,ended=False,remaining=remaining,done=[],plan=['friend']*3,energy=energy,weekend={'wallet':20});before=state(p);p.locator('[data-place=canteen]').click();before=state(p);p.locator('[data-spot=girl-canteen]').click();drain(p);assert state(p)==before
    fresh(p);p.locator('[data-place=canteen]').click();before=state(p);p.locator('[data-spot=girl-canteen]').click();drain(p,'year-leave');assert state(p)==before
    # Food-only events do not fulfill original obligations.
    for week in [2,6,7,15,16]:
        fresh(p,week);original=state(p);food(p);food(p,'friend-canteen');d=state(p);assert d['promiseKept']==original['promiseKept'] and d['noteKept']==original['noteKept']
        for flag in ['cameraKept','paperTrip','trialTalk','makeupKept']:assert not d['year']['flags'].get(flag)
    checks.append('Old shared-ID saves keep progress and gain only the new meal visit; insufficient energy/time and cancellation never spend; cafeteria chat does not fulfill original obligations')
    # Newcomer must be met first, both venues remain separate, stop hides every future invitation.
    for gender in ['male','female']:
        fresh(p,9,gender=gender);p.locator('[data-place=canteen]').click();assert p.locator('[data-spot=pursuer-canteen]').count()==0
        classroom(p,'pursuer','year-choice-friends');food(p,'pursuer-canteen');d=state(p);assert d['remaining']==1 and all(x in d['done'] for x in ['pursuer','pursuer-canteen'])
        assert ('radioLunch' in d['cgSeen'])==(gender=='male')
        year=d['year'];year['pursuit']='friends';fresh(p,10,gender=gender,year=year);p.locator('[data-place=canteen]').click();p.locator('[data-spot=pursuer-canteen]').click()
        src=p.locator('.character-still').get_attribute('src');assert ('qiaosui-wave-v14.webp' in src) if gender=='male' else ('chenyu-v13.webp' in src)
        drain(p);src=p.locator('.character-still').get_attribute('src');assert ('qiaosui-pause-v14.webp' in src) if gender=='male' else ('chenyu-v13.webp' in src)
        p.locator('#year-choice-stop').click();drain(p);assert state(p)['year']['pursuit']=='stop' and p.locator('[data-spot=pursuer-canteen]').count()==0
        p.locator('[data-place=classroom]').click();assert p.locator('[data-spot=pursuer]').count()==0
    checks.append('Correct-gender newcomer requires prior meeting, can be visited in both venues, only Qiao Sui gets the female CG; explicit stop removes invitations in both places')
    # Inspect real expression and matching avatar in the dialogue renderer, not only URL existence.
    seen=set();fresh(p,4);p.locator('[data-place=canteen]').click();p.locator('[data-spot=girl-canteen]').click()
    for _ in range(4):
        p.locator('.character-still').evaluate('async i=>{if(!i.hidden)await i.decode();}')
        if p.locator('.character-still').is_visible():
            mood=p.locator('.character-still').get_attribute('data-expression')
            if mood in ['shy','laugh']:
                seen.add(mood);assert p.locator('.speaker-avatar img').get_attribute('src')==p.locator('.character-still').get_attribute('src');shot(p,'01-linyao-'+mood)
        p.locator('#dialogue-next').click()
    assert seen=={'shy','laugh'};drain(p,'year-choice-orange')
    fresh(p,8);p.locator('[data-spot=girl]').click();p.locator('#dialogue-next').click();assert p.locator('.character-still').get_attribute('data-expression')=='thoughtful';shot(p,'02-classroom-thoughtful');drain(p,'year-leave')
    # Runtime source image decoding.
    assets=json.loads((ROOT/'assets/GENERATION-CANTEEN-V14.json').read_text(encoding='utf-8'))
    for a in assets:assert p.evaluate('u=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth>0);i.onerror=()=>r(false);i.src=u;})',URL+a['file']),a['file']
    checks.append('New Lin Yao laugh/shy/thoughtful poses actually render with matching speaker avatars; all nine generated assets decode in the browser')
    # Third character on mobile food scene must not cover another interactive target.
    year=state(p)['year'];year['pursuit']='friends'
    for w,h in [(1366,768),(390,844),(844,390),(320,568)]:
        v=page(w,h);fresh(v,10,year=year);v.locator('[data-place=canteen]').click();boxes=[]
        for id in ['girl-canteen','friend-canteen','pursuer-canteen','lunch']:
            el=v.locator('[data-spot='+id+']');box=el.bounding_box();assert box and 0<=box['x'] and box['x']+box['width']<=w+1 and 0<=box['y'] and box['y']+box['height']<=h+1,(w,h,id,box)
            assert el.evaluate('(e)=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'),(w,id,'covered')
            boxes.append((id,box))
        for i,(id,a) in enumerate(boxes):
            for other,c in boxes[i+1:]:assert not (a['x']<c['x']+c['width'] and c['x']<a['x']+a['width'] and a['y']<c['y']+c['height'] and c['y']<a['y']+a['height']),(w,id,other,'overlap')
        assert v.evaluate('document.documentElement.scrollWidth<=innerWidth');shot(v,'03-canteen-'+str(w));food(v,'pursuer-canteen','year-choice-stop');v.close()
    checks.append('Four cafeteria targets fit and remain separately clickable at 390x844, 844x390 and 320x568; no horizontal overflow')
    assert not errors,errors;assert not bad,bad;b.close()
report=dict(passed=True,url=URL,checks=checks,errors=errors,missing_assets=bad)
(ROOT/'verification-canteen-browser-v14.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
