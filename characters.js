/* Stable character identities, expression assets and line-level presentation metadata. */
window.CampusCharacters = (() => {
  const npc=(id,name,role)=>({id,name,role,base:`assets/${id}.png`,poses:{neutral:`assets/${id}.png`,blink:`assets/expressions/${id}-blink.png`,smile:`assets/expressions/${id}-smile.png`},clips:{idle:`assets/motion/${id}-idle.webm`,warm:`assets/motion/${id}-warm.webm`}});
  const actors={linyao:npc('linyao','林遥','窗边的同学'),zhaocheng:npc('zhaocheng','赵程','同桌'),teacher:npc('teacher','韩老师','班主任'),mother:npc('mother','妈妈','家里等你的人')};
  for(const gender of ['male','female']){const id='player-'+gender;actors[id]={id,name:'你',role:gender==='female'?'女生主角':'男生主角',base:`assets/expressions/${id}.png`,poses:{neutral:`assets/expressions/${id}.png`,smile:`assets/expressions/${id}-smile.png`},clips:{warm:`assets/motion/${id}-warm.webm`}};}
  actors.linyao.poses.sad='assets/expressions/linyao-sad.png';actors.zhaocheng.poses.sad='assets/expressions/zhaocheng-sad.png';
  for(const [id,name,role] of [['azhe','阿哲','喜欢动手试试的同学'],['father','爸爸','即将去外地工作'],['qiaosui','乔穗','广播站的新来客'],['chenyu','陈聿','广播站的新来客']])actors[id]={id,name,role,base:`assets/${id}-v13.webp`,poses:{neutral:`assets/${id}-v13.webp`,smile:`assets/${id}-v13.webp`},clips:{}};
  Object.assign(actors.linyao.poses,{laugh:'assets/linyao-laugh-v14.webp',thoughtful:'assets/linyao-think-v14.webp',shy:'assets/linyao-shy-v14.webp'});
  Object.assign(actors.qiaosui.poses,{wave:'assets/qiaosui-wave-v14.webp',pause:'assets/qiaosui-pause-v14.webp'});
  let profile={gender:null,name:'你'};
  const get=id=>actors[id==='you'?'player-'+profile.gender:id];
  function enrich(line,index=0){
    const actor=get(line.who);if(!actor)return {...line,id:line.id||`narrative-${index}`};
    const text=String(line.text).replaceAll('{name}',profile.name||'你').replaceAll('{pronoun}',profile.gender==='female'?'她':'他');
    let mood=line.mood;
    if(!mood){mood=/谢谢|幸好|笑|下次还|来了|一起|看懂|稳|没关系|还温着/.test(text)?'smile':/没来|找别人|先忙|没事|先不了|忘了|后来.*阿哲/.test(text)&&actor.poses.sad?'sad':'neutral';}
    if(!actor.poses[mood])mood='neutral';
    return {...line,text,mood,id:line.id||`${actor.id}-${index}`,motion:line.motion===false?false:line.motion||(mood==='smile'?'warm':'idle')};
  }
  return {actors,get,enrich,setProfile(p){profile={gender:p.gender,name:p.name||'你'};},get profile(){return {...profile};}};
})();
