"""Render the original canvas animation to a real H.264/AAC opening MP4.

Requires Python, Playwright, imageio-ffmpeg and local Microsoft Edge.
All illustration assets are generated separately; this script only animates,
composites and encodes them. Sound design below is original program synthesis.
"""
from pathlib import Path
import base64,json,subprocess,wave,math,time,random,sys
from array import array
import imageio_ffmpeg
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread

ROOT=Path(__file__).resolve().parents[1];WORK=ROOT/'work/opening-export';WORK.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'assets/opening';OUT.mkdir(parents=True,exist_ok=True)
FPS=30;DURATION=18.8;FRAMES=round(FPS*DURATION);SR=44100
rng=random.Random(20261114);N=round(SR*DURATION);left=array('d',[0])*N;right=array('d',[0])*N
def add(start,signal,gain=1,pan=0):
 start=round(start*SR);l=gain*math.sqrt((1-pan)/2);r=gain*math.sqrt((1+pan)/2)
 for i,v in enumerate(signal):
  if start+i>=N:break
  left[start+i]+=v*l;right[start+i]+=v*r
def bell(start,pitch=784,gain=.16):
 def sig():
  for i in range(round(SR*1.8)):
   t=i/SR;yield sum(math.sin(2*math.pi*pitch*ratio*t)*math.exp(-t*decay)*amp for ratio,decay,amp in [(1,2.8,1),(2.756,4.8,.27),(4.12,7,.1)])*min(1,t/.009)
 add(start,sig(),gain)
for start,pitch in [(.12,784),(.43,988),(.76,784)]:bell(start,pitch)
for start in [.85,1.54,2.21]:
 add(start,((math.sin(2*math.pi*98*i/SR)*.5+rng.gauss(0,.2))*math.exp(-i/SR*30) for i in range(round(SR*.16))),.14,-.25)
# Fabric/desk contact, chair scrape and page rustle.
for start,length,gain in [(4.67,.18,.24),(5.08,.32,.032),(6.58,.28,.055)]:
 def fabric():
  last=0
  for i in range(round(SR*length)):
   last=last*.68+rng.gauss(0,1)*.32;yield last*math.sin(math.pi*min(1,i/SR/length))**1.7
 add(start,fabric(),gain,.2)
add(4.67,(math.sin(2*math.pi*72*i/SR)*math.exp(-i/SR*24) for i in range(round(SR*.2))),.2,.2)
# A few original, quiet piano-like notes bridge the cuts, with no sampled song.
for start,pitch in [(3.15,293.665),(6.17,440),(9.05,587.33),(14.55,369.994),(16.2,440)]:
 def note():
  for i in range(round(SR*2.1)):
   t=i/SR;yield (math.sin(2*math.pi*pitch*t)+.3*math.sin(2*math.pi*pitch*2*t)+.1*math.sin(2*math.pi*pitch*3*t))*math.exp(-t*2.1)*min(1,t/.012)
 add(start,note(),.035)
# Rain is filtered noise with a slow envelope, rather than a loud white-noise bed.
def rain():
 last=0
 for i in range(round(SR*3.7)):
  t=i/SR;last=last*.55+rng.gauss(0,1)*.45;yield last*min(1,t/.55)*min(1,(3.7-t)/.7)
add(11.1,rain(),.045,-.1)
bell(14.8,988,.045)
for i in range(N):
 fade=min(1,i/SR/.08)*min(1,(N-1-i)/SR/.6);left[i]*=fade;right[i]*=fade
peak=max(max(map(abs,left)),max(map(abs,right)));scale=min(1,.72/max(peak,.001));pcm=array('h')
for l,r in zip(left,right):pcm.extend([round(l*scale*32767),round(r*scale*32767)])
if sys.byteorder!='little':pcm.byteswap()
audio=WORK/'opening-sound.wav'
with wave.open(str(audio),'wb') as wav:
 wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(SR);wav.writeframes(pcm.tobytes())
target=OUT/'campus-opening-v1.mp4';log=WORK/'encode.log'
cmd=[imageio_ffmpeg.get_ffmpeg_exe(),'-y','-hide_banner','-loglevel','warning','-f','image2pipe','-framerate',str(FPS),'-i','pipe:0','-i',str(audio),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-r',str(FPS),'-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',str(target)]
started=time.monotonic()
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
with log.open('wb') as err, sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1)
 page.goto(f'http://127.0.0.1:{server.server_port}/tools/render_opening.html');page.evaluate('filmReady')
 process=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=err)
 for frame in range(FRAMES):
  encoded=page.evaluate('''t=>{CampusOpeningFilm.draw(document.getElementById('film').getContext('2d'),t);return document.getElementById('film').toDataURL('image/png').split(',')[1]}''',frame/FPS)
  data=base64.b64decode(encoded);process.stdin.write(data)
  if frame in [45,150,228,310,390,490,545]:(WORK/f'frame-{frame:03d}.png').write_bytes(data)
  if frame%90==0:print(f'Opening frame {frame}/{FRAMES}',flush=True)
 # Poster uses the actual composed ending, rather than unrelated promotional art.
 encoded=page.evaluate("()=>{CampusOpeningFilm.draw(document.getElementById('film').getContext('2d'),18.2);return document.getElementById('film').toDataURL('image/jpeg',.93).split(',')[1]}")
 (OUT/'poster.jpg').write_bytes(base64.b64decode(encoded));browser.close();process.stdin.close();assert process.wait()==0,log.read_text(errors='replace')
server.shutdown();server.server_close()
report={'duration':DURATION,'fps':FPS,'frames':FRAMES,'size':[1280,720],'codec':'H.264 yuv420p + AAC stereo','method':'Original 2.5D canvas animation from generated illustrations and expression frames; not continuous AI image-to-video','audio':'Original synthesized school bell, footsteps, fabric/paper/desk sounds, sparse notes, rain','audio_peak':round(peak*scale,4),'audio_rms':round(math.sqrt((sum(x*x for x in left)+sum(x*x for x in right))/(N*2))*scale,4),'bytes':target.stat().st_size,'render_seconds':round(time.monotonic()-started,1)}
(OUT/'MANIFEST.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report),flush=True)
