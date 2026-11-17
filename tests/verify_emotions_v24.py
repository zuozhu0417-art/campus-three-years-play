"""Real portrait decoding, emotion/relationship precedence and read-only gallery paths."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
from PIL import Image
import json,sys

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'screenshots-emotions-v24';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def handle(self):
  try:super().handle()
  except (BrokenPipeError,ConnectionResetError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=(sys.argv[1].split('?')[0].rstrip('/')+'/' if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/')
KEY='campus-three-years-portraits-v3';errors=[];missing=[]
def state(p):return p.evaluate('k=>localStorage.getItem(k)',KEY)
def shot(p,name):p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=90,full_page=True)

with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 p=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 p.goto(URL+'expressions-preview.html?v=24-emotions',wait_until='domcontentloaded')
 p.evaluate('k=>localStorage.setItem(k,"read-only-gallery-canary")',KEY);before=state(p)
 entries=p.evaluate('CampusEmotions');assert len(entries)==14
 assert len({e['src'] for e in entries})==14
 for e in entries:
  p.locator('[data-emotion='+e['id']+']').click()
  p.locator('#emotion-full').evaluate('i=>i.decode()')
  p.locator('[data-emotion='+e['id']+'] img').evaluate('i=>i.decode()')
  assert p.locator('#emotion-name').inner_text()==e['label']
  assert e['src'] in p.locator('#emotion-full').get_attribute('src')
  assert p.locator('#emotion-full').evaluate('i=>i.naturalHeight>i.naturalWidth')
 assert state(p)==before
 p.locator('[data-emotion=angry]').click();p.locator('#emotion-full').evaluate('i=>i.decode()');shot(p,'01-gallery-angry')
 p.locator('[data-emotion=disgusted]').click();p.locator('#emotion-full').evaluate('i=>i.decode()');shot(p,'02-gallery-averse')
 for width,height in [(1366,768),(390,844),(844,390),(320,568)]:
  p.set_viewport_size({'width':width,'height':height});p.locator('[data-emotion=crying]').click()
  p.locator('#emotion-full').evaluate('i=>i.decode()');assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  shot(p,'gallery-'+str(width))
 p.set_viewport_size({'width':1366,'height':900})
 # Reach the new title path with a real schema8 school save.
 p.goto(URL+'?v=24-emotions',wait_until='domcontentloaded')
 p.evaluate("""k=>{localStorage.setItem('campus-opening-film-v10-seen','yes');const growth=CampusGrowth.fresh();growth.week=6;growth.slots=4;growth.contactWeeks=[1,2,3];const s={version:8,profile:{gender:'female',name:'小禾'},growth,year:CampusYearOne.fresh(),rhythm:CampusBalance.fresh(),weekend:CampusWeekend.initial(6),week:6,place:'classroom',remaining:4,seat:12,plan:Array(4).fill('friend'),done:[],study:15,friend:10,warm:2,family:5,energy:80,memories:[],diaries:[],ended:false,october:{mode:'undecided',introPending:false,exam:{rank:13,oldSeat:14,energy:80}},fitness:0,caught:0,cgSeen:[]};localStorage.setItem(k,JSON.stringify(s));}""",KEY)
 p.reload(wait_until='domcontentloaded');before=state(p)
 p.locator('#more-play').click();p.locator('#practice-emotions').click()
 assert p.locator('[data-emotion]').count()==14
 p.locator('[data-emotion=disgusted]').click();assert p.locator('.character-still').get_attribute('data-expression')=='disgusted'
 p.locator('.character-still').evaluate('i=>i.decode()');p.locator('#dialogue-next').click();assert state(p)==before
 p.keyboard.press('Escape');p.keyboard.press('Escape');p.locator('#continue-game').click()
 before=state(p);p.locator('#menu-button').click();p.locator('#menu-actors').click();p.locator('#emotion-album').click()
 p.evaluate('CampusExperience.setMotion(true)')
 # All fourteen real in-game portraits retain their intended expression, even with motion enabled.
 for e in entries:
  p.locator('[data-emotion='+e['id']+']').click();img=p.locator('.character-still');img.evaluate('i=>i.decode()')
  assert img.get_attribute('data-expression')==e['id'];assert e['label'] in img.get_attribute('alt')
  assert p.locator('.motion-video').is_hidden()
  if e['id'] in ['grieving','crying','angry','disgusted','delighted']:
   shot(p,'in-game-'+e['id'])
  p.locator('#dialogue-next').click()
 assert state(p)==before
 # Explicit story emotion must survive every relationship stage; default politeness still survives.
 matrix=p.evaluate("""()=>{const s=JSON.parse(localStorage.getItem('campus-three-years-portraits-v3'));let checked=0;
 for(const [week,n,mode,status] of [[1,0,'undecided',null],[8,4,'undecided',null],[12,8,'closer',null],[22,17,'closer',null],[22,17,'friends',null],[22,17,'closer','broken']]){
  const r=structuredClone(s);r.week=week;r.growth.contactWeeks=Array(n).fill(1);r.october.mode=mode;r.relationship={status};CampusCharacters.setRelationship(r);
  for(const e of CampusEmotions)for(const how of ['mood','emotion']){const l=CampusCharacters.enrich({who:'linyao',text:'谢谢，今天一起走吧。',[how]:e.id});if(l.mood!==e.id||l.motion!==false)throw Error(JSON.stringify(l));checked++;}
  if(week===1&&CampusCharacters.enrich({who:'linyao',text:'谢谢。',mood:'smile'}).mood!=='cold')throw Error('lost polite reserve');
 }return checked;}""")
 assert matrix==168
 assert not errors,errors
 assert not missing,missing
 b.close()

report={'passed':True,'portraits':14,'emotion_route_cases':matrix,'checks':['Every full portrait and thumbnail decodes, fourteen actual game previews','Title and character booklet entry paths; no save mutation or relationship unlock','Explicit emotion and mood survive six relationship contexts; no mismatched warm videos','Polite first-stage reserve remains the default; no random aversion from low affinity','Standalone gallery has no save access and works in four viewport sizes'],'errors':errors,'missing':missing}
(ROOT/'verification-emotions-v24.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));server.shutdown()
