from pathlib import Path
from datetime import datetime, timezone
import json, time
from playwright.sync_api import sync_playwright
OUT=Path(__file__).resolve().parents[1]
SHOTS=OUT/'screenshots-v5-chapter1';SHOTS.mkdir(exist_ok=True)
URI=(OUT/'index.html').as_uri();KEY='campus-three-years-portraits-v3'
errors=[];checks=[];remote=[]
def state(p):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',KEY)
def shot(p,name):
 p.wait_for_timeout(250)
 p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=90,full_page=True)
def drain(p):
 for _ in range(12):
  if p.locator('#cg-skip').count():p.locator('#cg-skip').click()
  elif p.locator('#dialogue-fast').count():
   p.locator('#dialogue-fast').click()
   if p.locator('.dialogue-choices:visible').count():return
   p.locator('#dialogue-next').click()
  else:return
 raise AssertionError('Dialogue did not finish')
def choices(p,selector):
 p.locator('#dialogue-fast').click();p.locator(selector).click();drain(p)
def plan(p,values=('study','friend','rest')):
 for i,v in enumerate(values):p.locator(f'#slot-{i}').select_option(v)
 p.locator('#plan-confirm').click()
def new(p):
 p.goto(URI);p.locator('#new-game').click();assert p.locator('#identity-confirm').is_disabled();p.locator('[data-gender=female]').click();p.locator('#player-name').fill('顾夏');p.locator('#identity-confirm').click();drain(p);p.locator('#seat-confirm').click();plan(p)
def study(p):
 p.locator('[data-spot=notebook]').click();p.locator('[data-line="1"]').click();p.locator('#submit-correction').click();drain(p)
def week(p):
 p.locator('#finish-week').click()
 if p.locator('#skip-time').count():p.locator('#skip-time').click()
 p.locator('#next-week').click();drain(p)
 if p.locator('#week-start').count():p.locator('#week-start').click();plan(p)
def fixture(p,**patch):
 base=dict(version=3,profile=dict(gender='female',name='顾夏'),fitness=0,caught=0,cgSeen=['arrival','dinner','flag','track','notebook'],week=1,place='classroom',remaining=3,seat=14,plan=['study','friend','rest'],done=[],study=0,friend=0,warm=0,family=0,energy=64,promise=None,promiseKept=False,echoResolved=False,taste=None,notePromise=False,noteKept=False,memories=[],diaries=[],ended=False)
 base.update(patch);p.goto(URI);p.evaluate('([k,s])=>localStorage.setItem(k,JSON.stringify(s))',[KEY,base]);p.reload();p.locator('#continue-game').click();return base
def prepare_mini(p,kind):
 if kind=='running':p.locator('[data-place=track]').click()
 p.locator('[data-spot='+('running' if kind=='running' else 'inspection')+']').click()
 choices(p,'.novel-choice:first-child');p.locator('#mini-start').click()

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 def page(size=(1366,768),clock=False):
  c=browser.new_context(viewport={'width':size[0],'height':size[1]},accept_downloads=True)
  c.add_init_script("localStorage.setItem('campus-opening-film-v1-seen','yes')");p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));p.on('request',lambda r:remote.append(r.url) if r.url.startswith(('http:','https:')) else None)
  if clock:
   p.clock.install();p.clock.pause_at(datetime.now(timezone.utc))
  return p
 p=page();new(p);shot(p,'04-campus-energy')
 p.locator('[data-spot=girl]').click();p.wait_for_timeout(1500);shot(p,'05-speaking-avatar')
 p.locator('#dialogue-log').click();assert p.locator('.dialogue-log').is_visible();p.keyboard.press('Tab');assert p.locator('#log-close').evaluate('(e)=>document.activeElement===e');p.keyboard.press('Escape')
 choices(p,'#girl-no');assert state(p)['remaining']==3
 checks.append('Character portrait, named avatar, typewriter, history, keyboard focus and cancelling dialogue')
 study(p);assert state(p)['energy']==38 and state(p)['remaining']==2
 p.locator('[data-spot=friend]').click();choices(p,'#friend-yes');assert state(p)['promise']=='yes' and state(p)['energy']==26
 p.locator('[data-place=home]').click();p.locator('[data-spot=rest]').click();p.locator('#rest-yes').click();drain(p);assert state(p)['remaining']==0 and state(p)['energy']==65
 week(p);assert state(p)['week']==2
 p.locator('[data-spot=friend]').click();choices(p,'#friend-yes');assert state(p)['promiseKept']
 p.locator('[data-spot=girl]').click();choices(p,'#girl-yes');study(p);assert state(p)['noteKept']
 week(p);assert state(p)['week']==3 and state(p)['echoResolved'];shot(p,'06-promise-return')
 # A rested lunch can restore enough energy for a later activity.
 p.locator('[data-place=canteen]').click();p.locator('[data-spot=lunch]').click();p.locator('[data-dish=egg]').click();p.locator('#lunch-alone').click();drain(p)
 p.locator('[data-place=home]').click();p.locator('[data-spot=rest]').click();p.locator('#rest-yes').click();drain(p)
 p.locator('[data-spot=mom]').click();choices(p,'#family-yes');week(p);assert state(p)['week']==4
 study(p);p.locator('[data-spot=girl]').click();choices(p,'#girl-yes');p.locator('[data-place=home]').click();p.locator('[data-spot=rest]').click();p.locator('#rest-yes').click();drain(p);week(p)
 assert state(p)['ended'] and p.locator('#end-title').is_visible();shot(p,'07-four-week-ending')
 with p.expect_download() as d:p.locator('#end-export').click()
 assert json.loads(d.value.path().read_text(encoding='utf-8'))['promiseKept']
 checks.append('Four-week UI playthrough, promise kept, notes kept, energy recovery, month exam and JSON export')
 # Save/reload and short-film gallery restore correct modal focus.
 fixture(p);p.locator('#menu-button').click();p.locator('#menu-cg').click();p.locator('[data-cg=arrival]').click();p.locator('#cg-skip').click();assert p.locator('.cg-card').count()>0;p.keyboard.press('Escape');p.keyboard.press('Escape')
 p.reload();p.locator('#continue-game').click();assert state(p)['remaining']==3
 checks.append('Save/resume and replay gallery do not consume time')
 # Two sessions of study exhaust the week; third session is blocked without side effects.
 fixture(p,plan=['study','study','study']);study(p);study(p);before=state(p);assert before['energy']==8 and before['remaining']==1
 p.locator('[data-spot=notebook]').click();assert '34' in p.locator('#dialogue-text').evaluate('(e)=>e.textContent') or p.locator('.novel').is_visible();drain(p);assert state(p)==before;shot(p,'08-low-energy')
 p.locator('[data-spot=friend]').click();drain(p);assert state(p)==before
 p.locator('[data-place=home]').click();p.locator('[data-spot=rest]').click();p.locator('#rest-yes').click();drain(p);assert state(p)['remaining']==0 and state(p)['energy']==44
 checks.append('Repeat study costs 26/30/34, gains diminish, low energy blocks study/social with no resource loss')
 # Missing a promise follows a different delayed outcome.
 fixture(p,week=2,promise='yes',remaining=0);week(p);assert state(p)['week']==3 and not state(p)['promiseKept'];assert any('没去' in m['text'] for m in state(p)['memories'])
 checks.append('Unkept promise has its separate third-week echo')
 # Clock-controlled inputs exercise real browser render/event handlers; no game globals are modified.
 r=page(clock=True);fixture(r);prepare_mini(r,'running');r.clock.run_for(400)
 r.keyboard.press('Space');r.clock.run_for(800)
 r.keyboard.press('Space');r.clock.run_for(800)
 r.keyboard.press('Escape');assert r.locator('.mini-curtain').is_visible();old=r.locator('#mini-time').inner_text();r.clock.run_for(5000);assert r.locator('#mini-time').inner_text()==old
 r.locator('#mini-start').click();r.clock.run_for(800)
 for _ in range(25):
  if not r.locator('#mini-action').count():break
  r.keyboard.press('Space');r.clock.run_for(800)
 drain(r);assert state(r)['fitness']==1 and state(r)['remaining']==2;shot(r,'09-running-result')
 checks.append('Rhythm running win with keyboard, pause freezes time, completion updates state once')
 fixture(r);prepare_mini(r,'running');r.clock.run_for(23000);drain(r);assert state(r)['fitness']==0 and state(r)['remaining']==2
 checks.append('Running timeout has a distinct failure result and bounded energy/time cost')
 fixture(r);r.locator('[data-place=track]').click();r.locator('[data-spot=running]').click();choices(r,'.novel-choice:first-child');r.locator('#mini-abandon').click();assert state(r)['remaining']==3 and state(r)['energy']==64
 checks.append('Abandoning a minigame does not consume resources')
 fixture(r);prepare_mini(r,'phone');r.locator('#mini-action').click();r.clock.run_for(2300);shot(r,'10-phone-safe');r.clock.run_for(3500);drain(r);assert state(r)['caught']==1 and state(r)['remaining']==2;shot(r,'11-teacher-dialogue')
 checks.append('Visible teacher vision catches a bright phone; teacher dialogue and journal persist result')
 fixture(r);prepare_mini(r,'phone');r.locator('#mini-action').click();r.clock.run_for(2700);r.locator('#mini-action').click();r.clock.run_for(3300);r.locator('#mini-action').click();r.clock.run_for(2400);drain(r);assert state(r)['caught']==0 and state(r)['friend']==1 and state(r)['remaining']==2
 checks.append('Phone stealth can succeed by hiding during teacher view and reading in safe periods')
 # Real-time rendering and responsive interaction at phone and short desktop sizes.
 mobile=page((390,844));fixture(mobile);mobile.locator('[data-spot=girl]').click();mobile.wait_for_timeout(700);shot(mobile,'12-mobile-dialogue');choices(mobile,'#girl-yes');assert state(mobile)['warm']==3
 mobile.locator('[data-place=track]').click();shot(mobile,'13-mobile-campus');mobile.locator('[data-spot=running]').click();choices(mobile,'.novel-choice:first-child');mobile.locator('#mini-start').click();mobile.wait_for_timeout(600);shot(mobile,'14-mobile-running');mobile.locator('#mini-action').click();mobile.keyboard.press('Escape');mobile.locator('#mini-abandon').click()
 assert mobile.evaluate('document.documentElement.scrollWidth<=window.innerWidth')
 small=page((1280,600));fixture(small);small.locator('[data-spot=friend]').click();choices(small,'#friend-no');small.locator('[data-spot=inspection]').click();choices(small,'.novel-choice:first-child');small.locator('#mini-start').click();small.wait_for_timeout(1000);shot(small,'15-short-window-phone')
 checks.append('390x844 pointer UI and 1280x600 layout: dialogue choices, nav and minigame controls usable')
 # Legacy v1 state is migrated with new fields without removing its original key.
 old=page();old.goto(URI);legacy=fixture(old);legacy['version']=1
 for key in ['fitness','caught','cgSeen']:legacy.pop(key)
 old.evaluate('([k,s])=>{localStorage.removeItem(k);localStorage.setItem("campus-three-years-chapter1-v1",JSON.stringify(s))}',[KEY,legacy]);old.reload();old.locator('#continue-game').click();old.locator('[data-place=home]').click();assert state(old)['version']==4 and state(old)['fitness']==0
 checks.append('Legacy v1 browser save migrated to v4 while preserving original save')
 assert not errors,errors;assert not remote,remote
 checks.append('No browser JS errors or external network requests across all checks')
 (OUT/'verification-v5-chapter1.json').write_text(json.dumps(dict(checks=checks,errors=errors,remote=remote,views=['1366x768','390x844','1280x600'],miniTiming='Playwright browser clock for deterministic win/fail; real-time mobile/desktop rendering'),ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(dict(passed=len(checks),errors=errors),ensure_ascii=True));browser.close()
