"""Actual browser journeys through all new weeks, old-save migration, and alternative branches."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-canteen-smoke-v14';SHOTS.mkdir(exist_ok=True)
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
    p=b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:bad.append(r.url) if r.status>=400 and '/assets/' in r.url else None)
    for reverse in [False,True]:
        fixture(p,week=7,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':50})
        assert '双场景版' in p.locator('.edition').inner_text()
        for id,place in ([('girl-canteen','canteen'),('girl','classroom')] if reverse else [('girl','classroom'),('girl-canteen','canteen')]):
            p.locator('[data-place='+place+']').click();p.locator('[data-spot='+id+']').click();drain(p);p.locator('.novel-choice').first.click();drain(p)
        d=state(p);assert d['remaining']==1 and len(d['done'])==2;p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==d
    checks.append('Mobile: actual classroom/meal transactions in both orders spend exactly two slots and survive reload')
    # Follow album buttons, render every new pose, and check avatar/portrait asset equality.
    year=state(p)['year'];year['pursuit']='friends';fixture(p,week=10,ended=False,remaining=3,done=[],plan=['friend']*3,year=year,weekend={'wallet':50})
    p.locator('#menu-button').click();p.locator('#menu-actors').click();assert p.locator('[data-actor=chenyu]').count()==0
    for who,expected in [('linyao',{'laugh','thoughtful','shy'}),('qiaosui',{'wave','pause'})]:
        p.locator('[data-actor='+who+']').click();seen=set()
        for _ in range(12):
            if not p.locator('#dialogue-next').count():break
            mood=p.locator('.character-still').get_attribute('data-expression');seen.add(mood)
            if mood in expected:
                assert p.locator('.speaker-avatar img').get_attribute('src')==p.locator('.character-still').get_attribute('src')
                assert p.locator('.character-still').evaluate('(i)=>i.complete&&i.naturalWidth>0')
                shot(p,'album-'+who+'-'+mood)
            p.locator('#dialogue-next').click()
        assert expected<=seen,(who,seen)
    checks.append('Mobile album actually renders all five added girl poses with correct matching avatars and no opposite-gender newcomer')
    # New CG is unlocked from actual story choice.
    fixture(p,week=4,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':50});p.locator('[data-place=canteen]').click();p.locator('[data-spot=girl-canteen]').click();drain(p);p.locator('#year-choice-orange').click();assert p.locator('#cg-skip').is_visible();shot(p,'orange-cg-mobile');drain(p);assert 'lunchOrange' in state(p)['cgSeen']
    checks.append('New orange CG plays from its real story choice and records the unlocked memory')
    assert not errors,errors;assert not bad,bad;b.close()
report=dict(passed=True,url=URL,checks=checks,errors=errors,missing_assets=bad)
(ROOT/'verification-canteen-smoke-v14.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
