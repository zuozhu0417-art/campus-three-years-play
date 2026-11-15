from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
url=sys.argv[1] if len(sys.argv)>1 else f'http://127.0.0.1:{server.server_port}/'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True,args=['--autoplay-policy=no-user-gesture-required'])
 p=b.new_page(reduced_motion='reduce');errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.add_init_script("""const Native=window.AudioContext;window.AudioContext=function(){const c=new Native();window.testContext=c;const original=c.createGain.bind(c);c.createGain=()=>{const g=original(),connect=g.connect.bind(g);g.connect=(target,...rest)=>{if(target===c.destination){const a=c.createAnalyser();(window.testAnalysers ||= []).push(a);connect(a);a.connect(target);return target;}return connect(target,...rest);};return g;};return c;};""")
 p.goto(url,wait_until='networkidle')
 assert p.evaluate('CampusMusic.status.context')=='locked'
 p.locator('#more-play').click();p.wait_for_timeout(2800)
 assert p.evaluate('CampusMusic.status.context')=='running'
 rms=p.evaluate("""()=>{return Math.max(...testAnalysers.map(n=>{const a=new Float32Array(n.fftSize);n.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,v)=>s+v*v,0)/a.length);}));}""")
 assert 0.00001<rms<0.08,rms
 p.locator('#extras-music').click();p.wait_for_timeout(5500)
 assert not p.evaluate('CampusMusic.enabled')
 assert p.evaluate('CampusMusic.status.volume')<0.001
 p.reload(wait_until='networkidle');assert not p.evaluate('CampusMusic.enabled')
 p.locator('#more-play').click();assert p.locator('#extras-music').inner_text()=='背景音乐：关'
 p.locator('#extras-music').click();p.wait_for_timeout(600);assert p.evaluate('CampusMusic.enabled')
 p.evaluate("""()=>{const v=document.createElement('video');v.id='test-video';Object.defineProperties(v,{paused:{value:false},ended:{value:false}});document.body.append(v);v.dispatchEvent(new Event('play'));}""")
 p.wait_for_timeout(5500);assert p.evaluate('CampusMusic.status.blocked');assert p.evaluate('CampusMusic.status.volume')<0.001
 p.evaluate("document.querySelector('#test-video').remove();document.dispatchEvent(new Event('ended'))")
 p.wait_for_timeout(2500);assert p.evaluate('CampusMusic.status.volume')>0.09
 p.set_viewport_size({'width':390,'height':844});assert p.locator('#extras-music').is_visible()
 assert not errors,errors
 print(json.dumps({'passed':True,'actual_output_rms':rms,'checks':['gesture unlock','audio signal and low level','fade off','setting survives reload','video duck and restore','mobile setting'],'errors':errors}))
 b.close()
server.shutdown()

