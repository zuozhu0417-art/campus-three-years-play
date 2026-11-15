"""Actual browser journeys through all new weeks, old-save migration, and alternative branches."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];SHOTS=ROOT/'screenshots-second-year-v15';SHOTS.mkdir(exist_ok=True)
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
        p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('response',lambda r:bad.append(r.url) if r.status>=400 and '/assets/' in r.url else None)
        return p
    for gender,mode in [('male','closer'),('female','friends')]:
        p=page(390,844) if gender=='female' else page()
        fixture(p,week=20,version=7,gender=gender,mode=mode,year={'flags':{'cameraKept':True},'exams':[{'week':20,'rank':17,'study':30}],'loan':50,'loanPaid':20,'pursuit':'stop','settled':[20]})
        old=state(p);assert p.locator('#second-year-continue').is_visible()
        p.locator('#second-year-continue').click();drain(p);plan(p)
        d=state(p);assert d['week']==21 and d['seat']==16 and d['year']['loanPaid']==20
        assert p.evaluate('k=>JSON.parse(localStorage.getItem(k+"-before-year-v15")).week',KEY)==20
        for week in range(21,24):
            assert state(p)['week']==week
            if week>21:plan(p)
            action(p,'zhouyan',{21:'steps',22:'compare',23:'copy'}[week])
            assert state(p)['remaining']==2
            if week==21:
                assert state(p)['year']['flags']['zhouMet'];shot(p,gender+'-zhouyan')
                before=state(p);p.locator('[data-spot=zhouyan]').click();assert state(p)==before
            action(p,'girl','ask');action(p,'mom','talk')
            before=state(p);p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==before
            start_weekend(p)
            if week==21:event(p,'map21','compare')
            if week==22:event(p,'dinner22','cook')
            if week==23:
                p.locator('[data-weekend-act=call23]').click();shot(p,gender+'-father-scene');drain(p,'weekend-choice-'+('daily' if gender=='male' else 'school'));assert state(p)['year']['flags']['fatherCall23'];shot(p,gender+'-father-call')
            end_day(p)
            if week==23:assert p.locator('[data-weekend-act=reschedule23]').is_disabled()
            next_week(p)
        d=state(p);assert d['ended'] and d['week']==23 and d['october']['mode']==mode
        assert d['year']['loan']==50 and d['year']['loanPaid']==20 and d['year']['pursuit']=='stop'
        assert len(d['year']['exams'])==1 and d['year']['exams'][0]['rank']==17
        assert all(x in d['year']['settled'] for x in [20,21,22,23]);shot(p,gender+'-ending')
        p.reload(wait_until='networkidle');p.locator('#continue-game').click();assert state(p)==d
        assert p.locator('#second-export').is_visible();assert '尚未制作' in p.locator('.modal-note').inner_text()
        checks.append(gender+' actual W20 -> W21–W23 journey; old loan, exam, refusal, route and ending preserved; reload equality')
        p.close()
    # All new conversations, both two-location orders, real choices and no duplicate transactions.
    for week in range(21,24):
        for who in ['girl','friend']:
            for order in [[who,who+'-canteen'],[who+'-canteen',who]]:
                p=page();fixture(p,week=week,version=7,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':40})
                for id in order:
                    p.locator('[data-place='+('canteen' if '-canteen' in id else 'classroom')+']').click()
                    p.locator('[data-spot='+id+']').first.click();drain(p,'year-choice-talk' if '-canteen' in id or who=='friend' else 'year-choice-ask')
                assert state(p)['remaining']==1
                assert all(id in state(p)['done'] for id in order)
                p.close()
    checks.append('12 actual two-location order combinations W21–23; classroom/track shared ID and canteen independent')
    # Leaving and low energy never spends resources; ordinary ending cannot invent a call.
    p=page();fixture(p,week=21,version=7,ended=False,remaining=3,done=[],plan=['study']*3,energy=60,weekend={'wallet':0})
    before=state(p);action(p,'zhouyan','own');assert state(p)['year']['flags']['zhouMethod']=='own'
    fixture(p,week=22,version=7,ended=False,remaining=3,done=[],plan=['study']*3,energy=60,weekend={'wallet':0});before=state(p)
    p.locator('[data-spot=zhouyan]').click();drain(p,'year-leave');assert state(p)==before
    fixture(p,week=23,version=7,ended=False,remaining=3,done=[],plan=['study']*3,energy=1,weekend={'wallet':0});before=state(p)
    p.locator('[data-spot=zhouyan]').click();assert state(p)==before;drain(p)
    start_weekend(p);end_day(p);next_week(p);assert not state(p)['year']['flags'].get('fatherCall23');assert '没接通' in p.locator('.handwritten').inner_text()
    fixture(p,week=23,version=7,ended=False,remaining=3,done=[],plan=['rest']*3,weekend={'wallet':0})
    start_weekend(p);end_day(p);event(p,'reschedule23','call');assert state(p)['year']['flags']['callTopic23']=='rescheduled'
    checks.append('Own-method choice, no-cost leave, low energy, missed call and actual Sunday reschedule')
    p.close()
    for width,height in [(1366,768),(390,844),(844,390),(320,568)]:
        p=page(width,height);fixture(p,week=21,version=7,ended=False,remaining=3,done=[],plan=['friend']*3,weekend={'wallet':0})
        button=p.locator('[data-spot=zhouyan]');box=button.bounding_box();assert box and 0<=box['x'] and 0<=box['y'] and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1
        assert button.evaluate('(e)=>{let b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}')
        button.click();assert p.locator('.character-still').get_attribute('src').endswith('zhouyan-v15.webp');shot(p,'sprite-'+str(width));drain(p)
        shot(p,'layout-'+str(width));p.locator('#year-choice-steps').click();drain(p)
        assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');p.close()
    assert not errors,errors;assert not bad,bad
    checks.append('Desktop and 3 mobile viewports: new entry center hit, actual sprite, dialogue and choice; no JS errors or missing assets')
    b.close()
report=dict(passed=True,url=URL,checks=checks,errors=errors,missing_assets=bad)
(ROOT/'verification-second-year-v15.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))


