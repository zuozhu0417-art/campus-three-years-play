"""Isolated Edge checks for B bubbles, click-led narration and authored scene changes."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import json, sys
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'screenshots-dialogue-v27'
OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def handle(self):
        try: super().handle()
        except (BrokenPipeError, ConnectionResetError): pass
server = None
if len(sys.argv) > 1:
    URL = sys.argv[1]
else:
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    URL = f'http://127.0.0.1:{server.server_port}/'
KEY = 'campus-three-years-portraits-v3'
errors = []
checks = []

def hit(p, selector):
    el = p.locator(selector)
    el.scroll_into_view_if_needed()
    assert el.evaluate('e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}'), selector

def shot(p, name):
    p.evaluate('async()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))')
    p.screenshot(path=str(OUT / (name + '.jpg')), type='jpeg', quality=90)

def open_story(p, spec):
    p.evaluate('spec=>{window.results=[];CampusExperience.dialogue(spec,v=>window.results.push(v===undefined?null:v))}', spec)

def scene(p): return p.locator('.novel').get_attribute('data-scene')
def next_line(p): p.locator('#dialogue-text').click()

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', headless=True)
    for width, height in [(1366,768), (390,844), (844,390), (320,568)]:
        p = browser.new_page(viewport={'width':width,'height':height}, reduced_motion='reduce')
        p.on('pageerror', lambda e: errors.append(str(e)))
        p.goto(URL, wait_until='networkidle')
        before = p.evaluate('(k)=>localStorage.getItem(k)', KEY)
        open_story(p, {'title':'报到前一晚', 'scene':'home', 'lines':[
            {'who':'narrator', 'text':'报到前一晚，书包已经收好，你还是把拉链又打开了一次。笔、空本子、录取通知书，都在。'},
            {'who':'narrator', 'text':'桌上的闹钟调早了二十分钟。你想了想，把准备写在新本子上的名字，留到了明天。'},
            {'who':'narrator', 'scene':'track', 'text':'第二天，穿过操场边的小路时，教学楼里传来试话筒的声音。新的班级在二楼，窗户都开着。'},
            {'who':'zhaocheng', 'scene':'classroom', 'motion':False, 'text':'同学，你的。差一点就让风分去隔壁班了。'},
            {'who':'narrator', 'text':'他把课程表压回书上，自己怀里的练习册却歪了。封面露出一行刚写的字：赵程，高一（六）班。'}],
            'choices':[{'id':'test-help','text':'腾出一只手，帮他托住书','note':'先从一起把书搬进去开始','value':False},
                       {'id':'test-joke','text':'“巧了，我也差一点走去隔壁。”','note':'和他一起核对门牌','value':0}]})
        assert scene(p) == 'home'
        assert p.locator('.novel').evaluate("e=>e.classList.contains('is-narration')")
        assert p.locator('.character-still').is_hidden()
        assert p.locator('.dialogue-bubble').evaluate("e=>getComputedStyle(e).backgroundColor") == 'rgba(0, 0, 0, 0)'
        hit(p, '#dialogue-text');shot(p, f'story-{width}')
        p.wait_for_timeout(250);assert p.locator('#line-counter').text_content() == '1 / 5'
        next_line(p);assert scene(p) == 'home'
        next_line(p);assert scene(p) == 'track'
        next_line(p);assert scene(p) == 'classroom'
        assert p.locator('.character-still').is_visible()
        assert not p.locator('.novel').evaluate("e=>e.classList.contains('is-narration')")
        shot(p, f'bubble-{width}')
        next_line(p);assert p.locator('.character-still').is_hidden()
        next_line(p);assert p.locator('.novel-choice').count() == 2
        assert p.locator('#dialogue-choices').evaluate("e=>!e.closest('.dialogue-box')&&e.parentElement.classList.contains('dialogue-dock')")
        for sel in ['#test-help','#test-joke','#dialogue-log','#dialogue-fast']:
            hit(p, sel)
        shot(p, f'choices-{width}')
        # A log must trap focus and leave both the bubble and the separate choices inert.
        p.locator('#dialogue-log').click()
        assert p.locator('.dialogue-dock').evaluate('e=>e.inert')
        assert p.locator('.log-lines p').count() == 5
        p.keyboard.press('Tab');assert p.evaluate("document.activeElement.id") == 'log-close'
        p.keyboard.press('Escape');assert p.evaluate("document.activeElement.id") == 'test-help'
        p.locator('#test-help').click()
        assert p.evaluate('window.results') == [False]
        assert p.evaluate('(k)=>localStorage.getItem(k)', KEY) == before
        assert not p.locator('.experience').count()
        open_story(p, {'title':'教室 · 窗边的空位', 'scene':'classroom', 'lines':[
            {'who':'linyao','motion':False,'text':'这里有人。……旁边那个位子还空着。领书表在讲台左边。'}],
            'choices':[{'text':'把书放到旁边的空位上','note':'先写好名字，再认认新同学','value':0},
                       {'text':'“谢谢，我先去填领书表。”','note':'点点头，往讲台走去'}]})
        p.locator('#dialogue-fast').click();shot(p, f'bubble-choices-{width}')
        p.locator('#dialogue-choice-0').click();assert p.evaluate('window.results') == [0]
        # Long existing prose and three choices remain reachable on a short screen.
        open_story(p, {'scene':'canteen', 'lines':[{'who':'linyao','motion':False,'text':'你坐这里吧。这边的位置没有人，桌子刚擦过，还没干。'*6}],
                       'choices':[{'text':'先把餐盘放下','note':'一起吃完这顿午饭','value':i} for i in range(3)]})
        p.locator('#dialogue-fast').click()
        for i in range(3):hit(p, f'#dialogue-choice-{i}')
        assert p.locator('.novel').get_attribute('data-ambient-place') == 'canteen'
        p.locator('#dialogue-choice-2').click();assert p.evaluate('window.results') == [2]
        assert p.evaluate('document.documentElement.scrollWidth <= innerWidth')
        p.close()
    checks += ['Four viewports: image-led narration, B actor bubble and independent mint replies',
               'Story advances only on click; scene inherited until an authored change',
               'Narration hides actors; spoken line restores correct actor',
               'Log traps focus across separate choices; Escape restores choice focus',
               'Long prose/three replies reachable on 844x390 and 320x568; no horizontal overflow',
               'False and zero values preserved; preview does not write game saves']

    # Authored opening, rather than a fixture: home -> campus -> classroom -> same choices.
    p = browser.new_page(viewport={'width':390,'height':844}, reduced_motion='reduce')
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.goto(URL, wait_until='networkidle')
    p.locator('#new-game').click();p.locator('[data-gender=male]').click()
    p.locator('#player-name').fill('小禾');p.locator('#identity-confirm').click()
    p.locator('#reader-continue').click();p.locator('#prelude-skip').click()
    assert p.locator('.novel').get_attribute('data-line') == 'arrival.night'
    assert scene(p) == 'home';shot(p, 'opening-home-390')
    next_line(p);assert scene(p) == 'home'
    next_line(p);assert scene(p) == 'track';shot(p, 'opening-campus-390')
    next_line(p);next_line(p)
    assert p.locator('#speaker-name').text_content() == '妈妈' and scene(p) == 'track'
    next_line(p);next_line(p);assert scene(p) == 'classroom'
    next_line(p);shot(p, 'opening-spoken-390')
    next_line(p);next_line(p);p.locator('#arrival-help').click()
    p.locator('#dialogue-fast').click();p.locator('#dialogue-next').click()
    p.locator('#seat-confirm').click();p.locator('#plan-confirm').click()
    saved=p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', KEY)
    assert saved['firstDay']['response'] == 'help' and saved['warm'] == 0
    p.locator('#first-lesson-later').click()
    p.reload(wait_until='networkidle');p.locator('#continue-game').click()
    assert p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', KEY) == saved
    assert not p.locator('.novel').count();p.close()
    checks += ['Actual opening: home/campus/classroom scene sequence, same branch IDs, planning and reload']

    # Normal motion: reveal-then-next behavior, fade, ambient and a single completion.
    p = browser.new_page(viewport={'width':1366,'height':768}, reduced_motion='no-preference')
    p.add_init_script("localStorage.setItem('campus-opening-film-v10-seen','yes')")
    p.on('pageerror', lambda e: errors.append(str(e)))
    p.goto(URL, wait_until='domcontentloaded');p.wait_for_function('window.CampusExperience && window.CampusAmbient')
    p.evaluate("CampusExperience.setMotion(true)")
    open_story(p, {'scene':'classroom','lines':[
        {'who':'narrator','text':'这是一段足够长的文字，用来确认第一下点击只会把当前这一句补全，不会跳到下一幅画面。'*4},
        {'who':'narrator','scene':'home','text':'灯还亮着。'},
        {'who':'narrator','scene':'../../invalid','text':'这一句继承房间的画面。'}]})
    p.wait_for_function("document.querySelector('.ambient-film.is-playing')?.dataset.scene==='classroom'")
    next_line(p);assert p.locator('#line-counter').text_content() == '1 / 3'
    next_line(p);assert scene(p) == 'home'
    assert p.locator('.novel-scene-veil').evaluate('e=>e.getAnimations().length') == 1
    p.wait_for_timeout(650)
    assert not p.locator('.ambient-film.is-playing').count()
    p.locator('#dialogue-fast').click();assert scene(p) == 'home'
    p.locator('#dialogue-next').evaluate('e=>{e.click();e.click()}')
    assert p.evaluate('window.results') == [None]
    assert not p.locator('.novel').count()
    checks += ['Normal motion: first click reveals, second advances; 550ms scene dissolve',
               'Ambient classroom video pauses on home scene; invalid scene paths ignored',
               'Double completion is guarded; timers and scene animation cleaned up']
    p.close();browser.close()

assert not errors, errors
report = {'passed':True,'checks':checks,'errors':errors}
(ROOT/'verification-dialogue-v27.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
if server: server.shutdown()
