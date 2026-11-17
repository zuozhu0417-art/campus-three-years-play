/* Read-only sheet: no game or localStorage access. */
(() => {
  const entries=document.body.dataset.catalog==='situations'?window.CampusSituations:window.CampusEmotions,root=document.getElementById('emotion-selector');
  function select(id,bringIntoView=false){
    const e=entries.find(x=>x.id===id);if(!e)return;
    const image=document.getElementById('emotion-full');image.src=e.src;image.alt='林遥 · '+e.label;
    document.getElementById('emotion-name').textContent=e.label;
    document.getElementById('emotion-line').textContent='“'+e.line+'”';
    document.getElementById('emotion-description').textContent=e.description;
    document.getElementById('emotion-number').textContent=String(entries.indexOf(e)+1).padStart(2,'0')+' / '+entries.length;
    document.getElementById('emotion-original').href=e.src;
    root.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.emotion===id)));
    if(bringIntoView&&innerWidth<=600)document.querySelector('.emotion-focus').scrollIntoView({block:'start',behavior:'auto'});
  }
  for(const e of entries){
    const button=document.createElement('button');button.className='emotion-card';button.dataset.emotion=e.id;button.type='button';
    const img=document.createElement('img');img.src=e.thumb;img.alt='林遥 · '+e.label;img.loading='lazy';img.decoding='async';
    const title=document.createElement('strong');title.textContent=e.label;
    const description=document.createElement('span');description.textContent=e.description;
    button.append(img,title,description);button.addEventListener('click',()=>select(e.id,true));root.append(button);
  }
  select(entries[0].id);
})();
