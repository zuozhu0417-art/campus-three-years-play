"""Isolated browser: contextual poses, holiday wardrobe, old emotion replacements and saves."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'screenshots-situations-v25';OUT.mkdir(exist_ok=True)
KEY='campus-three-years-portraits-v3';errors=[];missing=[]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def handle(self):
  try:super().handle()
  except (BrokenPipeError,ConnectionResetError):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
URL=sys.argv[1].split('?')[0].rstrip('/')+'/' if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/'
def shot(p,name):p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=90,full_page=True)
def saved(p):return p.evaluate('k=>localStorage.getItem(k)',KEY)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 p=b.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('response',lambda r:missing.append(r.url) if r.status>=400 else None)
 p.goto(URL+'situations-preview.html?v=25-situations',wait_until='networkidle')
 p.evaluate('k=>localStorage.setItem(k,"read-only-preview")',KEY);before=saved(p)
 entries=p.evaluate('CampusSituations');assert len(entries)==8
 for e in entries:
  p.locator('[data-emotion='+e['id']+']').click();p.locator('#emotion-full').evaluate('i=>i.decode()')
  p.locator('[data-emotion='+e['id']+'] img').evaluate('i=>i.decode()')
  assert p.locator('#emotion-full').get_attribute('src')==e['src']
 assert saved(p)==before
 p.locator('[data-emotion=outing]').click();p.locator('#emotion-full').evaluate('i=>i.decode()');shot(p,'01-outing-corrected')
 p.locator('[data-emotion=argument]').click();p.locator('#emotion-full').evaluate('i=>i.decode()');shot(p,'02-empty-handed-argument')
 for w,h in [(1366,768),(390,844),(844,390),(320,568)]:
  p.set_viewport_size({'width':w,'height':h});p.locator('[data-emotion=winter]').click();p.locator('#emotion-full').evaluate('i=>i.decode()')
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');shot(p,'gallery-'+str(w))
 p.set_viewport_size({'width':1366,'height':900});p.goto(URL+'?v=25-situations',wait_until='networkidle')
 p.locator('#more-play').click();p.locator('#practice-situations').click();before=saved(p)
 assert p.locator('[data-situation]').count()==8
 p.evaluate('CampusExperience.setMotion(true)')
 for e in entries:
  p.locator('[data-situation='+e['id']+']').click();img=p.locator('.character-still');img.evaluate('i=>i.decode()')
  assert img.get_attribute('data-expression')==e['pose'];assert e['src'] in img.get_attribute('src')
  assert p.locator('.motion-video').is_hidden()
  if e['id'] in ['outing','argument','tears']:shot(p,'in-game-'+e['id'])
  p.locator('#dialogue-next').click()
 assert saved(p)==before
 p.keyboard.press('Escape');p.keyboard.press('Escape')
 # Real holiday action handler, on disposable in-memory state. No actual game save is touched.
 cases=[('winter',7,'closer','winter',True),('summer',7,'closer','date',True),('summer',4,'friends','outing',True),('summer',3,'closer','home',False)]
 for kind,n,mode,pose,met in cases:
  p.evaluate("""([kind,n,mode])=>{
   const week=kind==='winter'?10:20,growth=CampusGrowth.fresh();growth.contactWeeks=Array.from({length:n},(_,i)=>i+1);
   window.poseFixture={version:8,week,profile:{gender:'male',name:'小禾'},growth,october:{mode},energy:80,study:10,friend:4,warm:3,family:5,remaining:0,weekend:CampusWeekend.initial(week)};
   CampusCharacters.setRelationship(poseFixture);const h=CampusHoliday.begin(poseFixture,kind);h.phase='days';
   CampusHoliday.mount(poseFixture,{save(){},exit(){},finish(){},dialogue:CampusExperience.dialogue});
  }""",[kind,n,mode])
  p.locator('[data-holiday-action=girl]').click();img=p.locator('.character-still');img.evaluate('i=>i.decode()')
  assert img.get_attribute('data-expression')=='situation-'+pose
  assert p.locator('.motion-video').is_hidden()
  result=p.evaluate('({met:poseFixture.holiday.records[0].met,energy:poseFixture.energy,pos:poseFixture.holiday.pos,warm:poseFixture.warm})')
  assert result=={'met':met,'energy':72,'pos':1,'warm':4 if met and mode=='closer' else 3},result
  shot(p,'holiday-'+kind+'-'+pose);p.locator('#dialogue-fast').click();p.locator('#dialogue-next').click();p.evaluate('CampusHoliday.unmount()')
 assert saved(p)==before
 # Negative mood keys now use the new empty-hand school sprites; other emotions stay distinct.
 poses=p.evaluate("""()=>({angry:CampusCharacters.actors.linyao.poses.angry,disgusted:CampusCharacters.actors.linyao.poses.disgusted})""")
 assert poses['angry'].endswith('situations-v25/linyao-argument.webp')
 assert poses['disgusted'].endswith('poses-v26/linyao-aversion.webp')
 assert not errors,errors
 assert not missing,missing
 b.close()
report={'passed':True,'portraits':8,'checks':['Eight full sprites and thumbs decode; all actual game previews; motion cannot replace clothing or pose','Four viewport sizes without horizontal overflow','Actual holiday action: winter meeting, summer closer meeting, summer friendly meeting, declined meeting','Holiday energy, time and warmth accounting unchanged; previews never mutate game save','Angry and disgusted emotion keys now point to empty-hand sprites'],'errors':errors,'missing':missing}
(ROOT/'verification-situations-v25.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2));server.shutdown()
