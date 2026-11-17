/* Explicitly authored emotions. Never infer anger or aversion from relationship score. */
window.CampusEmotions=Object.freeze([
  ['grieving','难过','低落时还没说出口的话','我想一个人静一会儿，可以吗？'],
  ['tearful','忍泪','眼眶湿了，仍在努力把话说稳','我听见了。你让我缓一会儿。'],
  ['crying','落泪','克制不住的难过，不再假装没事','我本来以为，自己已经想明白了。'],
  ['hurt','委屈','被误解之后，还想让人听完','不是你想的那样。你能不能先听完？'],
  ['disappointed','失望','期待落空后，慢慢收回目光','我知道你的意思了。今天就到这里吧。'],
  ['angry','生气','正面表达不满，认真守住边界','这件事让我很不舒服。请先听我把话说完。'],
  ['disgusted','反感 / 厌恶','回避和退让，明确不想再靠近','我不想继续这个话题。请和我保持一点距离。'],
  ['worried','担心','注意到对方的变化，想确认情况','你今天看起来不太好，需要我做些什么吗？'],
  ['surprised','惊讶','没预料到的消息，让目光抬起来','啊？你刚才说的，是真的吗？'],
  ['embarrassed','不好意思','有些局促，仍认真回应','抱歉，是我记错了。让你白等了一会儿。'],
  ['delighted','开心','遇到好事时，藏不住的明亮','原来真的做到了。我想把这件事先告诉你。'],
  ['relieved','释然','终于把话说清，肩膀也放松下来','说清楚以后，心里终于没那么乱了。'],
  ['tired','疲惫','没有多余的力气，先照顾自己','我有点累了，今天想早点回去休息。'],
  ['determined','认真坚定','想清楚之后，平静地作出决定','这次我已经想好了，也会把该做的事做好。']
].map(([id,label,description,line])=>{
  const replacement={angry:'argument',disgusted:'aversion'}[id],folder=replacement?'situations-v25':'emotions-v24',file=replacement||id;
  return Object.freeze({id,label,description,line,src:`assets/${folder}/linyao-${file}.webp`,thumb:`assets/${folder}/thumbs/linyao-${file}.webp`});
}));
