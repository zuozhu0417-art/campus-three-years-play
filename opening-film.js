/* Original deterministic 2.5D opening compositor, shared by export and fallback. MIT. */
window.CampusOpeningFilm=(()=>{
  const duration=18.8;
  const shots=[
    {start:0,end:3.3,id:'door',label:'九月 · 报到日',caption:''},
    {start:3.3,end:6.4,id:'desk',label:'高一（六）班',caption:''},
    {start:6.4,end:9.2,id:'hello',label:'一个还不熟悉的声音',caption:'“新来的？这边有位置。”'},
    {start:9.2,end:11.5,id:'track',label:'放学以后',caption:''},
    {start:11.5,end:14.5,id:'rain',label:'也会有下雨的时候',caption:'“等雨小一点，再走。”'},
    {start:14.5,end:18.8,id:'seat',label:'下课铃响了',caption:'“这儿没人，坐吧。”'}
  ];
  const sources={door:'opening/doorway.jpg',desk:'opening/desk.jpg',bag:'opening/backpack.png',classroom:'classroom.jpg',boy:'zhaocheng.png',smile:'expressions/zhaocheng-smile.png',blink:'expressions/zhaocheng-blink.png',track:'track.jpg',rain:'rain-cg.jpg',seat:'saved-seat-cg.jpg'};
  const imgs={};let loading=null;
  function load(base='assets/'){
    if(!loading)loading=Promise.all(Object.entries(sources).map(([key,path])=>new Promise((resolve,reject)=>{
      const im=new Image();im.onload=()=>{imgs[key]=im;resolve();};im.onerror=()=>reject(Error('Opening art unavailable: '+key));im.src=new URL(path,new URL(base,document.baseURI)).href;
    })));
    return loading;
  }
  const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  function cover(ctx,image,zoom=1,x=0,y=0){
    const scale=Math.max(1280/image.width,720/image.height)*zoom,w=image.width*scale,h=image.height*scale;
    ctx.drawImage(image,(1280-w)/2+x,(720-h)/2+y,w,h);
  }
  function dust(ctx,t,amount=24){
    ctx.save();
    for(let i=0;i<amount;i++){
      const x=(i*131.73+t*(9+i%4*3))%1370-45,y=(i*79.3-t*(5+i%3)+800)%800-40;
      ctx.globalAlpha=.12+.15*Math.sin(i*2.4+t*.6)**2;ctx.fillStyle='#fff2d5';ctx.beginPath();ctx.ellipse(x,y,1+i%3*.6,1+i%3*.6,0,0,Math.PI*2);ctx.fill();
    }ctx.restore();
  }
  function light(ctx,t){
    const g=ctx.createLinearGradient(100+Math.sin(t*.5)*20,0,850,720);g.addColorStop(0,'#fff1cf28');g.addColorStop(.4,'#fff1cf00');g.addColorStop(1,'#fff1cf08');ctx.fillStyle=g;ctx.fillRect(0,0,1280,720);
  }
  function paintedCurtain(ctx,t){
    // A narrow strip of the painted window drifts independently of the camera.
    const im=imgs.classroom;ctx.save();ctx.beginPath();ctx.rect(215,75,125,365);ctx.clip();
    const sc=Math.max(1280/im.width,720/im.height)*1.035,w=im.width*sc,h=im.height*sc;
    for(let y=70;y<450;y+=6){const dx=Math.sin(t*1.6+y/170)*3*(y-60)/390;ctx.drawImage(im,0,Math.max(0,(y-(720-h)/2)/sc),im.width,6/sc,(1280-w)/2+dx,y,w,6.8);}
    ctx.restore();
  }
  function rain(ctx,t){
    ctx.save();ctx.lineWidth=1;ctx.strokeStyle='#e9f5ff';
    for(let i=0;i<92;i++){
      const x=(i*127.91-t*70)%1380,y=(i*83.47+t*(330+i%5*40))%840-80;
      ctx.globalAlpha=.07+i%4*.035;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-9,y+25+i%5*4);ctx.stroke();
    }ctx.restore();
  }
  function paintShot(ctx,shot,t){
    const u=clamp((t-shot.start)/(shot.end-shot.start)),e=ease(u);
    if(shot.id==='door'){
      const step=Math.sin(u*15)*2*(1-e);
      cover(ctx,imgs.door,lerp(1,1.15,e),lerp(0,-24,e),step);
      // Passing the near doorframe gives a distinct foreground parallax.
      const im=imgs.door,strip=im.width*.075;ctx.save();ctx.globalAlpha=1-ease(u/.75);ctx.drawImage(im,0,0,strip,im.height,-e*180,0,105,720);ctx.restore();dust(ctx,t);light(ctx,t);
    }else if(shot.id==='desk'){
      cover(ctx,imgs.desk,lerp(1.035,1.065,e),0,Math.sin(u*8)*2*(1-e));
      const settle=ease((u-.08)/.48),bounce=Math.sin(Math.max(0,u-.56)*18)*Math.exp(-Math.max(0,u-.56)*18)*5;
      ctx.save();ctx.globalAlpha=settle*.17;ctx.fillStyle='#33342b';ctx.beginPath();ctx.ellipse(815,650,160,25,0,0,Math.PI*2);ctx.fill();ctx.restore();
      const im=imgs.bag,w=370,h=w*im.height/im.width,cx=lerp(1470,817,settle),bottom=lerp(1020,680,settle)+bounce;
      ctx.save();ctx.translate(cx,bottom);ctx.rotate(lerp(-.2,-.035,settle));ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();dust(ctx,t);light(ctx,t);
    }else if(shot.id==='hello'){
      cover(ctx,imgs.classroom,1.035,-8+e*12,0);paintedCurtain(ctx,t);
      const smile=ease((u-.2)/.38),blink=ease((u-.53)/.035)*(1-ease((u-.59)/.05));
      const im=imgs.boy,h=690,w=h*im.width/im.height,px=760+Math.sin(u*2)*5,py=793+Math.sin(t*2)*2;
      ctx.drawImage(im,px-w/2,py-h,w,h);ctx.save();ctx.globalAlpha=smile;ctx.drawImage(imgs.smile,px-w/2,py-h,w,h);ctx.globalAlpha=blink;ctx.drawImage(imgs.blink,px-w/2,py-h,w,h);ctx.restore();dust(ctx,t,14);
    }else if(shot.id==='track'){
      cover(ctx,imgs.track,lerp(1.07,1.18,u),-u*28,Math.sin(u*24)*2.4);
      ctx.save();for(let i=0;i<9;i++){
        const x=1280-((u*980+i*177)%1450),y=140+i*61;ctx.globalAlpha=.11;ctx.fillStyle=i%2?'#a4af76':'#d5bb79';ctx.beginPath();ctx.ellipse(x,y,9,3,-.5,0,Math.PI*2);ctx.fill();
      }ctx.restore();light(ctx,t);
    }else if(shot.id==='rain'){
      cover(ctx,imgs.rain,lerp(1.025,1.075,e),lerp(10,-8,e),0);rain(ctx,t);
    }else{
      cover(ctx,imgs.seat,lerp(1.06,1.015,e),lerp(8,-5,e),0);dust(ctx,t);light(ctx,t);
      const title=ease((t-16.25)/1.1);
      ctx.save();ctx.globalAlpha=title;const wash=ctx.createLinearGradient(0,0,940,0);wash.addColorStop(0,'#edf0e6e8');wash.addColorStop(.55,'#edf0e6d4');wash.addColorStop(1,'#edf0e600');ctx.fillStyle=wash;ctx.fillRect(0,0,1280,720);
      ctx.fillStyle='#314d43';ctx.textAlign='left';ctx.font='500 79px "Microsoft YaHei",sans-serif';ctx.fillText('校园三年',107,313);ctx.font='26px "Microsoft YaHei",sans-serif';ctx.fillStyle='#597366';ctx.fillText('风经过座位',114,370);ctx.fillStyle='#769083';ctx.fillRect(115,406,39,1);ctx.font='19px "Microsoft YaHei",sans-serif';ctx.fillText('从这一次下课开始。',114,449);ctx.restore();
    }
  }
  function draw(ctx,time){
    if(!imgs.seat)throw Error('Await film.load() before rendering');
    const t=Math.max(0,Math.min(duration-.001,time));
    ctx.save();ctx.scale(ctx.canvas.width/1280,ctx.canvas.height/720);ctx.fillStyle='#26372f';ctx.fillRect(0,0,1280,720);
    const i=shots.findIndex(s=>t<s.end),shot=shots[i];
    if(i>0&&t-shot.start<.27){
      paintShot(ctx,shots[i-1],Math.min(shots[i-1].end-.001,t));ctx.save();ctx.globalAlpha=ease((t-shot.start)/.27);paintShot(ctx,shot,t);ctx.restore();
    }else paintShot(ctx,shot,t);
    // Gentle vignette and letterbox, without flashing transitions.
    const vg=ctx.createRadialGradient(640,340,180,640,340,850);vg.addColorStop(0,'#1b302600');vg.addColorStop(1,'#14251c42');ctx.fillStyle=vg;ctx.fillRect(0,0,1280,720);
    ctx.fillStyle='#172a24';ctx.fillRect(0,0,1280,25);ctx.fillRect(0,695,1280,25);
    const capAlpha=ease((t-shot.start-.35)/.35)*(1-ease((t-16.25)/.35));
    if(capAlpha>0){
      ctx.save();ctx.globalAlpha=capAlpha;ctx.textAlign='left';ctx.font='18px "Microsoft YaHei",sans-serif';ctx.shadowColor='#17271f';ctx.shadowBlur=14;ctx.fillStyle='#fff8e9';ctx.fillText(shot.label,70,78);
      if(shot.caption){const gr=ctx.createLinearGradient(0,495,0,695);gr.addColorStop(0,'#1a2c2600');gr.addColorStop(1,'#1a2c2677');ctx.fillStyle=gr;ctx.fillRect(0,495,1280,200);ctx.fillStyle='#fffaf0';ctx.textAlign='center';ctx.font='36px "Microsoft YaHei",sans-serif';ctx.fillText(shot.caption,640,618);}
      ctx.restore();
    }
    const fade=ease(t/.45);if(fade<1){ctx.fillStyle=`rgba(27,43,35,${1-fade})`;ctx.fillRect(0,0,1280,720);}
    ctx.restore();
  }
  return {load,draw,shots,duration,width:1280,height:720};
})();
