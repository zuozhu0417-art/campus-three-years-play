/* Clothing and body language are authored with the scene, never chosen at random. */
window.CampusSituations=Object.freeze([
  ['outing','便服出游','自然侧身，目光看向同行的人','你到了？那我们慢慢走过去吧。','holiday-bookshop-summer-v23'],
  ['date','腼腆赴约','碎花裙与针织衫，双手放在身后','我也刚到，没有等很久。今天想先去哪边？','holiday-bookshop-summer-v23'],
  ['argument','空手争执','抱臂站稳，认真表达不满','这件事让我很不舒服。请先听我把话说完。','classroom'],
  ['aversion','转身回避','头和肩膀顺向，侧目避开','我不想继续这个话题。请和我保持一点距离。','classroom'],
  ['tears','难过拭泪','便服垂肩，用手拭去眼泪','你让我缓一会儿，我现在还说不清楚。','home'],
  ['lunch','食堂端餐','双手端着餐盘，刚打好午饭','这边还有空位吗？我刚从那个窗口过来。','canteen'],
  ['winter','冬日见面','大衣、围巾与手套，站在约好的地方','外面有点冷。我们先进去，再慢慢说。','holiday-bookshop-v23'],
  ['home','居家放松','宽松卫衣与长裤，安静放松下来','今天没有特别安排，就在家歇一会儿。','home']
].map(([id,label,description,line,scene])=>{
  const folder=['outing','aversion'].includes(id)?'poses-v26':'situations-v25';
  return Object.freeze({id,label,description,line,scene,pose:'situation-'+id,src:`assets/${folder}/linyao-${id}.webp`,thumb:`assets/${folder}/thumbs/linyao-${id}.webp`});
}));
