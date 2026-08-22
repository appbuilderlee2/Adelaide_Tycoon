(()=>{
  const VERSION='V0.9';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const prefersReduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const short=()=>prefersReduced||(typeof state!=='undefined'&&state.settings?.fastAnimation);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let lastPos=null;
  let rollToken=0;

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · 本地多人 PWA`);
  const badge=q('.version-badge'); if(badge) badge.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='Animation Upgrade';
  const copy=q('.hero-copy p');
  if(copy) copy.textContent='更接近商業手機桌遊：骰仔物理感、棋子逐格跳、落地衝擊、買地／收租／起屋慶祝動畫。';

  function ensureFx(){
    if(q('#v9Fx')) return;
    const root=document.createElement('div');
    root.id='v9Fx';
    root.innerHTML=`
      <div class="v9-roll-scene" aria-hidden="true">
        <div class="v9-roll-glow"></div>
        <div class="v9-dice-cube v9-d1">⚀</div>
        <div class="v9-dice-cube v9-d2">⚀</div>
        <div class="v9-roll-total">ROLL</div>
      </div>
      <div class="v9-event-banner" aria-live="polite"><small></small><strong></strong><span></span></div>
      <div class="v9-shockwave"></div>`;
    document.body.appendChild(root);
  }

  function vibrate(pattern){
    try{if(typeof state!=='undefined'&&state.settings?.vibration&&navigator.vibrate)navigator.vibrate(pattern)}catch{}
  }

  function showBanner(kicker,title,sub='',tone='blue',ms=1050){
    const b=q('.v9-event-banner'); if(!b) return;
    b.className=`v9-event-banner show ${tone}`;
    b.querySelector('small').textContent=kicker;
    b.querySelector('strong').textContent=title;
    b.querySelector('span').textContent=sub;
    clearTimeout(b._timer);
    b._timer=setTimeout(()=>b.classList.remove('show'),short()?520:ms);
  }

  function particles(kind='gold',count=16){
    if(prefersReduced) return;
    const root=q('#v9Fx'); if(!root) return;
    for(let i=0;i<count;i++){
      const p=document.createElement('i');
      p.className=`v9-particle ${kind}`;
      p.style.setProperty('--x',`${(Math.random()-.5)*240}px`);
      p.style.setProperty('--y',`${-50-Math.random()*170}px`);
      p.style.setProperty('--r',`${Math.random()*420-210}deg`);
      p.style.setProperty('--d',`${520+Math.random()*420}ms`);
      p.style.left=`${45+Math.random()*10}%`;
      p.style.top=`${42+Math.random()*8}%`;
      root.appendChild(p);
      setTimeout(()=>p.remove(),1100);
    }
  }

  function landingShock(){
    const tile=q('.space.active-space');
    if(tile){
      tile.classList.remove('v9-land');
      void tile.offsetWidth;
      tile.classList.add('v9-land');
      setTimeout(()=>tile.classList.remove('v9-land'),700);
    }
    const s=q('.v9-shockwave');
    if(s&&!prefersReduced){
      s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
      setTimeout(()=>s.classList.remove('go'),650);
    }
    q('.board-wrap')?.classList.add('v9-impact');
    setTimeout(()=>q('.board-wrap')?.classList.remove('v9-impact'),430);
    vibrate([10,20,18]);
  }

  async function cinematicRoll(){
    const scene=q('.v9-roll-scene'); if(!scene||prefersReduced) return;
    const token=++rollToken;
    scene.classList.add('show','rolling');
    const d1=scene.querySelector('.v9-d1'),d2=scene.querySelector('.v9-d2'),total=scene.querySelector('.v9-roll-total');
    total.textContent='ROLL';
    const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
    for(let i=0;i<7&&token===rollToken;i++){
      d1.textContent=faces[Math.floor(Math.random()*6)];
      d2.textContent=faces[Math.floor(Math.random()*6)];
      await sleep(short()?35:58);
    }
    let tries=0;
    while(token===rollToken&&tries++<24){
      if(typeof state!=='undefined'&&state.lastDice) break;
      await sleep(45);
    }
    if(token!==rollToken) return;
    if(typeof state!=='undefined'&&state.lastDice){
      d1.textContent=faces[state.lastDice.d1-1];
      d2.textContent=faces[state.lastDice.d2-1];
      total.textContent=String(state.lastDice.sum);
      scene.classList.remove('rolling');
      scene.classList.add('result');
      vibrate([12,18,24]);
    }
    await sleep(short()?240:520);
    scene.classList.remove('show','result','rolling');
  }

  function cashDelta(before){
    if(typeof state==='undefined'||!before) return;
    state.players.forEach((p,i)=>{
      const d=p.cash-(before[i]??p.cash);
      if(!d) return;
      const card=qa('.player-card')[i];
      if(!card) return;
      const f=document.createElement('b');
      f.className=`v9-cash ${d>0?'plus':'minus'}`;
      f.textContent=`${d>0?'+':'−'}$${Math.abs(d)}`;
      card.appendChild(f);
      setTimeout(()=>f.remove(),1100);
    });
  }

  ensureFx();

  q('#rollBtn')?.addEventListener('click',()=>{
    if(typeof state==='undefined'||state.rolled||typeof animating!=='undefined'&&animating) return;
    cinematicRoll();
  });

  if(typeof renderBoard==='function'){
    const oldRenderBoard=renderBoard;
    renderBoard=function(){
      oldRenderBoard();
      try{
        const p=state?.players?.[state.current];
        if(!p) return;
        const tile=q(`.space[data-index="${p.pos}"]`);
        tile?.classList.add('v9-current-tile');
        tile?.querySelector('.current-token')?.classList.add('v9-token');
        if(lastPos!==null&&lastPos!==p.pos&&typeof animating!=='undefined'&&animating){
          tile?.classList.add('v9-step');
          setTimeout(()=>tile?.classList.remove('v9-step'),180);
        }
        lastPos=p.pos;
      }catch{}
    };
  }

  if(typeof move==='function'){
    const oldMove=move;
    move=async function(p,n){
      const wrap=q('.board-wrap');
      wrap?.classList.add('v9-travelling');
      const out=await oldMove(p,n);
      wrap?.classList.remove('v9-travelling');
      landingShock();
      return out;
    };
  }

  if(typeof resolve==='function'){
    const oldResolve=resolve;
    resolve=async function(i){
      const before=typeof state!=='undefined'?state.players.map(p=>p.cash):null;
      const s=typeof SPACES!=='undefined'?SPACES[i]:null;
      const ownerBefore=s?.type==='property'&&state?.owners?.[i]!=null?state.owners[i]:null;
      const out=await oldResolve(i);
      cashDelta(before);
      try{
        const p=state.players[state.current];
        if(s?.type==='property'&&ownerBefore!=null&&ownerBefore!==state.current){
          const paid=(before?.[state.current]??p.cash)-p.cash;
          if(paid>0){
            showBanner('RENT PAID',`−$${paid}`,`${s.name} → ${state.players[ownerBefore].name}`,'red',1150);
            q('.board-wrap')?.classList.add('v9-rent-hit');
            setTimeout(()=>q('.board-wrap')?.classList.remove('v9-rent-hit'),500);
          }
        }else if(s?.type==='chance'||s?.type==='chest'){
          showBanner(s.type==='chance'?'CHANCE':'COMMUNITY CHEST',s.name,'事件已處理','gold',950);
        }else if(s?.type==='free'){
          showBanner('FREE PARKING','休息一回合','好運可能喺下一格','green',900);
        }else if(s?.type==='jail'){
          showBanner('JAIL','探監／監獄','小心下一張事件卡','red',900);
        }
      }catch{}
      return out;
    };
  }

  if(typeof buyCurrent==='function'){
    const oldBuy=buyCurrent;
    buyCurrent=function(){
      const p=state.players[state.current],i=p.pos,s=SPACES[i];
      const beforeOwner=state.owners[i];
      const out=oldBuy();
      if(beforeOwner==null&&state.owners[i]===state.current){
        showBanner('PROPERTY ACQUIRED','OWNED!',s.name,'blue',1250);
        particles('gold',20);
        q(`.space[data-index="${i}"]`)?.classList.add('v9-owned');
        setTimeout(()=>q(`.space[data-index="${i}"]`)?.classList.remove('v9-owned'),900);
        vibrate([20,30,20,40,28]);
      }
      return out;
    };
    q('#buyBtn').onclick=buyCurrent;
  }

  if(typeof buildCurrent==='function'){
    const oldBuild=buildCurrent;
    buildCurrent=function(){
      const p=state.players[state.current],i=p.pos,s=SPACES[i];
      const before=state.houses[i]||0;
      const out=oldBuild();
      const after=state.houses[i]||0;
      if(after>before){
        showBanner('LANDMARK UPGRADE',`🏠 ${after}/4`,s.name,'green',1150);
        particles('green',14);
        const tile=q(`.space[data-index="${i}"]`);
        tile?.classList.add('v9-upgrade');
        setTimeout(()=>tile?.classList.remove('v9-upgrade'),900);
        vibrate([12,18,12]);
      }
      return out;
    };
    q('#buildBtn').onclick=buildCurrent;
  }

  q('#passModal')?.addEventListener('close',()=>{
    const game=q('#gamePanel');
    game?.classList.add('v9-turn-in');
    setTimeout(()=>game?.classList.remove('v9-turn-in'),550);
  });

  const style=document.createElement('style');
  style.textContent='.v7-dice-burst{display:none!important}';
  document.head.appendChild(style);

  const qaStatus=q('#qaStatus');
  if(qaStatus&&!qaStatus.classList.contains('qa-bad')) qaStatus.textContent='QA：V0.9 動畫層已載入';
})();