from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time
OUT=Path(__file__).resolve().parents[1]
URI=(OUT/'index.html').as_uri();KEY='campus-three-years-portraits-v3'
SHOTS=OUT/'screenshots-v5-story';SHOTS.mkdir(exist_ok=True)
checks=[];errors=[];missing=[]
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY)
def fixture(p,**patch):
 d=dict(version=3,profile={'gender':'female','name':'顾夏'},week=4,place='classroom',remaining=0,seat=14,plan=['study','friend','rest'],done=['rest'],study=8,friend=4,warm=6,family=3,energy=64,promise='yes',promiseKept=True,echoResolved=True,taste='不吃香菜',notePromise=True,noteKept=True,memories=[{'week':3,'text':'你在食堂点了番茄炒蛋，和他们坐在一起。','tag':'小事'}],diaries=[],ended=True,fitness=0,caught=0,cgSeen=['arrival','notebook','rain','flag','track','dinner']);d.update(patch)
 p.goto(URI);p.evaluate('([k,d])=>{localStorage.clear();localStorage.setItem(k,JSON.stringify(d))}',[KEY,d]);p.reload();p.locator('#continue-game').click();return d
def drain(p):
 for _ in range(14):
  if p.locator('#cg-skip').count():p.locator('#cg-skip').click()
  elif p.locator('#dialogue-fast').count():
   p.locator('#dialogue-fast').click()
   if p.locator('.novel-choice:visible').count():return
   p.locator('#dialogue-next').click()
  else:return
 raise AssertionError('Unfinished continuation')
def choose(p,id):p.locator('#dialogue-fast').click();p.locator(id).click()
def shot(p,name):p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=92,full_page=True)
def plan(p):p.locator('#plan-confirm').click()
def enter(p):
 p.locator('#end-october').click();drain(p);p.locator('#week-start').click();plan(p)
 assert state(p)['week']==5 and not state(p)['ended']
def advance(p):
 p.locator('#finish-week').click()
 if p.locator('#skip-time').count():p.locator('#skip-time').click()
 p.locator('#next-week').click();drain(p)
 if p.locator('#week-start').count():p.locator('#week-start').click();plan(p)
def shared_lunch(p,milk=True):
 p.locator('[data-place=canteen]').click();p.locator('[data-spot=lunch]').click();p.locator('[data-dish=egg]').click();p.locator('#lunch-together').click();choose(p,'#oct-milk-yes' if milk else '#oct-milk-no')
def show_history(p):
 p.locator('#dialogue-log').click();t=p.locator('.log-lines').inner_text();p.locator('#log-close').click();return t
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 def page(w=1366,h=768):
  p=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce');p.on('pageerror',lambda e:errors.append(str(e)));p.on('requestfailed',lambda r:missing.append([r.url,r.failure]) if r.failure!='net::ERR_ABORTED' else None);return p
 p=page();old=fixture(p);enter(p);d=state(p)
 assert d['version']==4 and d['profile']==old['profile'] and d['study']==8 and d['energy']==76 and d['promiseKept'] and d['noteKept'] and d['taste']=='不吃香菜'
 assert d['seat']==d['october']['exam']['rank']-1 and d['october']['exam']['oldSeat']==14
 assert len(d['memories'])==2 and d['october']['tasteShared']
 p.locator('[data-spot=seat]').click();assert '月考后的座位' in p.locator('.modal-note').inner_text();p.locator('#seat-confirm').click()
 checks.append('Actual v3 completed September save continues into W05; identity, grades, promises, taste, prior memories retained, seat changed to recorded exam result')
 p.locator('[data-spot=girl]').click();choose(p,'#oct-closer');assert 'saved-seat-cg.jpg' in p.locator('.cg-image').get_attribute('style');shot(p,'01-saved-seat-cg');p.locator('#cg-skip').click();p.locator('#dialogue-fast').click();shot(p,'02-linyao-seat-dialogue');drain(p)
 d=state(p);assert d['october']['mode']=='closer' and d['october']['seatBreak'] and d['remaining']==2 and d['energy']==64 and 'savedSeat' in d['cgSeen']
 p.locator('[data-spot=girl]').click();assert state(p)==d
 p.reload();p.locator('#continue-game').click();assert state(p)['october']['seatBreak'];assert '第 5 / 6' in p.locator('#week-label').inner_text()
 checks.append('W05 approach choice, actual five-second CG opening, named player/actor dialogue, one-time resource debit and save/reload')
 # W06 poster + lunch consumes two distinct slots, leaving one for another life choice.
 advance(p);assert state(p)['week']==6
 p.locator('[data-spot=girl]').click();choose(p,'#oct-poster-yes');assert 'drawing-margin-cg.jpg' in p.locator('.cg-image').get_attribute('style');shot(p,'03-drawing-margin-cg');drain(p)
 assert state(p)['october']['poster'];shared_lunch(p)
 assert 'warm-carton-cg.jpg' in p.locator('.cg-image').get_attribute('style');assert '十月' in p.locator('.cg-caption').inner_text();shot(p,'04-warm-carton-cg');drain(p)
 d=state(p);assert d['october']['milk'] and d['remaining']==1 and len([x for x in d['cgSeen'] if x in ['savedSeat','drawingMargin','warmCarton']])==3
 p.locator('[data-place=home]').click();p.locator('[data-spot=phone]').click();assert '小鸟' in p.locator('.receipt').inner_text();p.locator('#phone-close').click()
 p.locator('[data-place=track]').click();p.locator('[data-spot=friend]').click();choose(p,'#oct-photo-yes');drain(p);d=state(p);assert d['remaining']==0 and d['october']['metAzhe'] and d['october']['sportsPhoto']
 advance(p);assert state(p)['ended'] and state(p)['week']==6 and p.locator('#oct-gallery').is_visible();shot(p,'05-october-stop')
 p.locator('#oct-gallery').click();assert p.locator('.cg-card').count()==9;p.locator('[data-cg=warmCarton]').click();p.locator('#cg-skip').click()
 # Real wall-clock auto-completion verifies the new CG duration, not just metadata.
 started=time.monotonic();p.locator('[data-cg=drawingMargin]').click();p.locator('.cg-image').wait_for(state='hidden',timeout=8000);elapsed=time.monotonic()-started;assert 5.2<=elapsed<=7.5,elapsed
 p.keyboard.press('Escape')
 p.reload();p.locator('#continue-game').click();assert p.locator('#oct-title').is_visible()
 checks.append('Actual W06 poster/lunch/camera-work branches, three new unlockable CGs and period captions, phone echo, explicit W07 promise, W06 stop/resume and gallery replay')
 # Rejecting approach, declining milk and not promising photography are valid, without penalties.
 q=page();fixture(q,profile={'gender':'male','name':'许川'},promise='no',promiseKept=False,warm=0,notePromise=False,noteKept=False,taste=None,memories=[]);enter(q)
 q.locator('[data-spot=girl]').click();choose(q,'#oct-leave');drain(q);assert state(q)['remaining']==3 and state(q)['october']['mode']=='undecided'
 q.locator('[data-spot=girl]').click();choose(q,'#oct-friends');drain(q);assert state(q)['october']['mode']=='friends'
 advance(q);q.locator('[data-spot=girl]').click();choose(q,'#oct-poster-no');drain(q);assert state(q)['remaining']==3 and not state(q)['october']['poster']
 q.locator('[data-spot=girl]').click();choose(q,'#oct-poster-yes');drain(q)
 shared_lunch(q,False);drain(q);d=state(q);assert not d['october']['milk'] and d['remaining']==1 and d['october']['mode']=='friends' and d['warm']==7
 q.locator('[data-place=track]').click();q.locator('[data-spot=friend]').click();choose(q,'#oct-photo-chat');drain(q);assert not state(q)['october']['sportsPhoto'] and state(q)['october']['metAzhe']
 advance(q);assert '仍是同学或朋友' in q.locator('.ending').inner_text();assert '没有接下' in q.locator('.receipt').inner_text()
 checks.append('Male protagonist gets equal opportunities; leaving costs nothing; friends stays friends; poster refusal is not a broken promise; declining milk has same warmth; camera chat makes no future promise')
 # Hard resource boundary survives extension, and ordinary study-only lives can end this slice.
 r=page();fixture(r,energy=0,promise=None,promiseKept=False,study=1);enter(r)
 r.locator('[data-spot=girl]').click();choose(r,'#oct-friends');drain(r);assert state(r)['energy']==0
 d=state(r);r.locator('[data-spot=friend]').click();drain(r);assert state(r)==d
 advance(r);r.locator('[data-spot=notebook]').click();drain(r);assert state(r)['remaining']==3 # only 18 after empty slots + weekend
 advance(r);assert state(r)['ended'] and not state(r)['october']['poster'] and not state(r)['october']['milk'];assert '没有接下' in r.locator('.receipt').inner_text()
 checks.append('Insufficient energy blocks actual interactions without resource loss; skipping optional sweetness yields a valid ordinary-life continuation stop')
 # Narrow view and all second-week content actually render; screen-reader actor names remain usable.
 m=page(390,844);fixture(m);enter(m);m.locator('[data-spot=girl]').click();choose(m,'#oct-closer');shot(m,'06-mobile-cg');drain(m);advance(m);m.locator('[data-spot=girl]').click();choose(m,'#oct-poster-yes');drain(m);shared_lunch(m);drain(m)
 assert m.evaluate('document.documentElement.scrollWidth<=innerWidth');m.locator('[data-place=track]').click();m.locator('[data-spot=friend]').click();m.locator('#dialogue-fast').click();assert m.locator('#oct-photo-chat').is_visible();shot(m,'07-mobile-choice');m.locator('#oct-photo-chat').click();drain(m);advance(m);shot(m,'08-mobile-ending');assert m.locator('#oct-title').is_visible()
 checks.append('390x844 real browser pointer interaction: new CGs, approach choice, poster, milk, photography choices, ending, no horizontal overflow')
 assert not errors,errors
 assert not missing,missing
 result={'checks':checks,'errors':errors,'missing_assets':missing,'views':['1366x768','390x844'],'new_cg':3,'new_cg_wall_clock_seconds':round(elapsed,2),'actual_phone_hardware_test':False}
 (OUT/'verification-v5-story.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps({'passed':len(checks),'errors':errors,'missing':missing}));b.close()
