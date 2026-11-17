"""Isolated browser: real holiday boundaries, accounting, resumability and expression rules."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json, sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
SHOTS=ROOT/'screenshots-holiday-v23'; SHOTS.mkdir(exist_ok=True)
KEY='campus-three-years-portraits-v3'; errors=[]; missing=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def handle(self):
  try:super().handle()
  except (BrokenPipeError,ConnectionResetError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=sys.argv[1] if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/'
def state(p):return p.evaluate('k=>JSON.parse(localStorage.getItem(k))',KEY)
def drain(p):
 for _ in range(20):
  if p.locator('#reader-continue').count():p.locator('#reader-continue').click()
  elif p.locator('#cg-skip').count():p.locator('#cg-skip').click()
  elif p.locator('#dialogue-fast').count():
   p.locator('#dialogue-fast').click();p.locator('#dialogue-next').click()
  else:return
 raise AssertionError('dialogue did not finish')
def fixture(p,week=10,kind=None,wallet=0,energy=90,n=8,mode='closer',ended=False):
 p.goto(URL,wait_until='domcontentloaded')
 p.evaluate("""([k,w,kind,wallet,energy,n,mode,ended])=>{
 localStorage.clear();localStorage.setItem('campus-motion-v3','off');localStorage.setItem('campus-opening-film-v10-seen','yes');
 const growth=CampusGrowth.fresh();growth.week=w;growth.slots=4;growth.contactWeeks=Array.from({length:n},(_,i)=>i+1);
 const s={version:8,profile:{gender:'male',name:'小禾'},week:w,place:'home',remaining:0,seat:12,plan:Array(4).fill('friend'),done:[],study:20,friend:10,warm:10,family:5,energy,memories:[],diaries:[],ended,fitness:0,caught:0,cgSeen:[],growth,year:CampusYearOne.fresh(),rhythm:CampusBalance.fresh(),october:{mode,introPending:false,exam:{rank:13,oldSeat:14,energy:80}},weekend:CampusWeekend.initial(w)};
 s.weekend.wallet=wallet;s.weekend.current.started=true;s.weekend.current.finished=true;
 if(kind)CampusHoliday.begin(s,kind);localStorage.setItem(k,JSON.stringify(s));}
 """,[KEY,week,kind,wallet,energy,n,mode,ended])
 p.reload(wait_until='domcontentloaded');p.locator('#continue-game').click()
def shot(p,name):
 p.evaluate('async()=>Promise.all([...document.querySelectorAll(".holiday-screen img")].map(i=>i.decode()))')
 p.screenshot(path=str(SHOTS/(name+'.jpg')),type='jpeg',quality=88)
def choose(p,id):
 p.locator('[data-holiday-action='+id+']').click()
 if id=='ball':
  p.locator('#ball-start').click()
  for _ in range(3):p.locator('#ball-shoot').click()
  p.locator('#dialogue-fast').wait_for()
 drain(p)

with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 p=b.new_page(viewport={'width':1366,'height':900},reduced_motion='reduce')
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 # Reach winter break through the real W10 diary settlement, including final exam.
 fixture(p);p.locator('#next-week').click()
 assert state(p)['holiday']['phase']=='intro' and state(p)['week']==10
 assert len(state(p)['growth']['reports'])==1
 assert p.locator('#play-screen').evaluate('e=>getComputedStyle(e).visibility')=='hidden'
 before=state(p);p.keyboard.press('1');p.keyboard.press('j');p.keyboard.press('Escape');assert state(p)==before
 assert not p.locator('.modal-backdrop').count()
 shot(p,'01-winter-intro');p.locator('#holiday-film-next').click()
 assert p.locator('[data-holiday-action=tuition]').is_disabled()
 # Abandoning basketball is free. Completing three shots commits exactly one half-day.
 before=state(p);p.locator('[data-holiday-action=ball]').click();p.locator('#ball-abandon').click();assert state(p)==before
 choose(p,'ball');assert state(p)['holiday']['pos']==1
 assert state(p)['friend']==before['friend']+1
 assert 'holiday-court-v23.jpg' in state(p)['holiday']['records'][0]['photo']
 choose(p,'work');after=state(p);assert after['holiday']['pos']==2 and after['weekend']['wallet']==45
 assert after['energy']==min(100,before['energy']-18-22+22)
 p.reload(wait_until='domcontentloaded');p.locator('#continue-game').click();assert state(p)==after
 # Daily work restriction, paid lesson vs free self-study, and six-subject choice.
 choose(p,'work');assert p.locator('[data-holiday-action=work]').is_disabled()
 p.locator('#holiday-subject').select_option('2');mastery=state(p)['growth']['mastery'][2]
 choose(p,'tuition');assert state(p)['weekend']['wallet']==55
 assert state(p)['growth']['mastery'][2]==min(100,mastery+4)
 choose(p,'study');assert state(p)['growth']['mastery'][2]==min(100,mastery+7)
 choose(p,'girl');assert len(state(p)['growth']['contactWeeks'])==8
 choose(p,'rest');choose(p,'game');shot(p,'02-winter-days')
 # Leaving and continuing retains the holiday, not a school schedule or duplicate payout.
 before=state(p);p.locator('#holiday-title').click();assert '寒假' in p.locator('#title-save-summary').inner_text()
 p.locator('#continue-game').click();assert state(p)==before
 while state(p)['holiday']['phase']=='days':choose(p,'rest')
 assert len(state(p)['holiday']['records'])==14
 assert p.locator('.holiday-photo-wall figure').count()>=3
 shot(p,'03-winter-recap');p.locator('#holiday-film-next').click();assert state(p)['holiday']['phase']=='complete'
 p.reload(wait_until='domcontentloaded');p.locator('#continue-game').click();assert p.locator('#holiday-resume').count()
 p.locator('#holiday-resume').click();drain(p);assert state(p)['week']==11 and not state(p)['holiday']['active']
 assert len(state(p)['holidayArchive']['winter']['records'])==14
 # Summer starts from the actual high-one ending button and can reach existing W21.
 fixture(p,week=20,ended=True,wallet=0);p.locator('#second-year-continue').click();p.locator('#holiday-film-next').click()
 choose(p,'work');assert state(p)['holiday']['records'][0]['photo']=='holiday-bookshop-summer-v23.jpg'
 while state(p)['holiday']['phase']=='days':choose(p,'rest')
 assert state(p)['holiday']['pos']==20
 assert '你没有主动约她' in p.locator('.holiday-film-copy').inner_text()
 assert not p.locator('.holiday-photo-wall img[src*=court]').count()
 p.locator('#holiday-school-next').click();drain(p);assert state(p)['week']==21
 # Budget boundaries and no repeat recovery when reloading a new holiday day.
 fixture(p,kind='winter',energy=0);p.locator('#holiday-film-next').click()
 assert p.locator('[data-holiday-action=study]').is_disabled()
 choose(p,'rest');assert state(p)['energy']==26
 choose(p,'rest');assert state(p)['energy']==74
 before=state(p);p.reload(wait_until='domcontentloaded');p.locator('#continue-game').click();assert state(p)==before
 # Relationship stages do not use affection points alone or turn friendship into romance.
 matrix=p.evaluate("""()=>{
 const s=JSON.parse(localStorage.getItem('campus-three-years-portraits-v3')),out=[];
 for(const [w,n,mode,status,mood,expected] of [[1,0,'undecided',null,'smile','cold'],[8,4,'undecided',null,'neutral','neutral'],[12,8,'closer',null,'smile','shy'],[22,17,'closer',null,'smile','tender'],[22,17,'friends',null,'shy','neutral'],[22,1,'closer',null,'smile','cold'],[22,17,'closer','broken','sad','sad'],[22,17,'closer','broken','smile','withdrawn'],[22,17,'closer',null,'sad','sad']]){
 s.week=w;s.growth.contactWeeks=Array(n).fill(1);s.october.mode=mode;s.relationship={status};CampusCharacters.setRelationship(s);
 const l=CampusCharacters.enrich({who:'linyao',text:'今天一起走吧。',mood});if(l.mood!==expected)throw Error(JSON.stringify([w,n,mode,status,l]));out.push(l.mood);}
 return out;}""")
 assert len(matrix)==9
 # Test actual rendered pose and future preview without modifying a real relationship.
 fixture(p,kind='winter',n=0,mode='undecided');p.locator('#holiday-film-next').click();p.locator('[data-holiday-action=girl]').click()
 # v25: the holiday message uses home clothes; school reserve is tested in the matrix above.
 assert p.locator('.character-still').get_attribute('data-expression')=='situation-home'
 assert '抱歉' in p.locator('#dialogue-text').inner_text();drain(p)
 assert not state(p)['holiday']['records'][0]['met']
 assert p.locator('[data-holiday-action=girl]').is_disabled()
 fixture(p,week=12,n=8,mode='closer',ended=False)
 # A normal school save must still open its diary; close it by returning to a playing week fixture.
 p.goto(URL,wait_until='domcontentloaded')
 p.evaluate("""k=>{const s=JSON.parse(localStorage.getItem(k));s.weekend.current.started=false;s.weekend.current.finished=false;s.remaining=4;localStorage.setItem(k,JSON.stringify(s));}""",KEY)
 p.reload(wait_until='domcontentloaded');p.locator('#continue-game').click()
 p.locator('#menu-button').click();p.locator('#menu-actors').click();p.locator('#relationship-preview').click()
 before=state(p)
 for i,expected in enumerate(['cold','neutral','shy','tender','sad','withdrawn']):
  assert p.locator('.character-still').get_attribute('data-expression')==expected
  p.locator('.character-still').evaluate('i=>i.decode()')
  assert p.locator('.motion-video').is_hidden()
  if expected=='cold' and i==0:p.screenshot(path=str(SHOTS/'04-cold-expression.jpg'),type='jpeg',quality=88)
  p.locator('#dialogue-next').click()
 assert state(p)==before
 # Exercise the user motion preference without an OS reduced-motion override.
 p.emulate_media(reduced_motion='no-preference');fixture(p,kind='winter')
 p.locator('#holiday-motion').click()
 assert p.locator('.holiday-photo-wall figure').first.evaluate('e=>getComputedStyle(e).animationName')=='holiday-photo'
 p.locator('#holiday-motion').click()
 assert p.locator('.holiday-photo-wall figure').first.evaluate('e=>getComputedStyle(e).animationName')=='none'
 p.emulate_media(reduced_motion='reduce')
 p.locator('#holiday-film-title').click();before=state(p)
 p.locator('#more-play').click();p.locator('#practice-holiday').click()
 assert p.locator('.holiday-screen[data-preview=true]').count()
 p.locator('#holiday-film-next').click();choose(p,'work');choose(p,'game')
 p.keyboard.press('j');assert not p.locator('.modal-backdrop').count()
 p.locator('#holiday-title').click();assert state(p)==before
 for width,height in [(1366,768),(390,844),(844,390),(320,568)]:
  p.set_viewport_size({'width':width,'height':height});fixture(p,kind='winter')
  assert p.locator('.holiday-photo-wall figure').first.evaluate('e=>getComputedStyle(e).animationName')=='none'
  p.locator('#holiday-film-next').click();p.locator('[data-holiday-action=rest]').scroll_into_view_if_needed()
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert p.locator('.holiday-screen').evaluate('e=>e.scrollWidth<=e.clientWidth')
  choose(p,'rest');shot(p,f'layout-{width}')
 assert not errors,errors
 assert not missing,missing
 b.close()
report={'passed':True,'checks':['Real W10 settlement to winter and W20 ending to summer; return to W11/W21','14 winter / 20 summer half-days, full activity set and playable basketball','Money, nightly energy, one job per day, six subjects, low-energy and low-money boundaries','Midday refresh, save/title/resume and holiday-end stop without duplicate rewards','Actual-only photo recap, no school HUD, reduced motion and four viewports','Nine relationship cases and six rendered portrait previews including polite reserve and breakup','Independent holiday tryout preserves existing game save; user photo motion preference toggles'],'errors':errors,'missing':missing}
(ROOT/'verification-holiday-v23.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));server.shutdown()
