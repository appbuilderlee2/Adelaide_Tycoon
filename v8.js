(()=>{
  const VERSION='V0.8';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const rollBtn=q('#rollBtn'), endBtn=q('#endTurnBtn'), buyBtn=q('#buyBtn'), auctionBtn=q('#auctionBtn');
  let bypassEnd=false, rollSnapshot=null, deedOpenFor=null;

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · 本地多人 PWA`);
  const vb=q('.version-badge'); if(vb) vb.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='Turn Experience Update';
  const copy=q('.hero-copy p'); if(copy) copy.textContent='更接近商業手機桌遊：回合階段、落地事件、地契決策、金錢動畫同回合摘要。';

  function money(n){return `${n>=0?'+':'−'}$${Math.abs(n)}`}
  function current(){return typeof state!=='undefined'&&state.players?.length?state.players[state.current]:null}

  function ensureUi(){
    if(!q('#v8PhaseBar')&&q('#gamePanel')){
      const bar=document.createElement('div');
      bar.id='v8PhaseBar'; bar.className='v8-phase-bar';
      bar.innerHTML=`<span data-p="roll">1 ROLL</span><span data-p="resolve">2 RESOLVE</span><span data-p="manage">3 MANAGE</span><span data-p="end">4 END</span>`;
      const hud=q('#v7TurnHud')||q('.status-row');
      hud?.insertAdjacentElement('afterend',bar);
    }
    if(!q('#v8Deed')){
      const d=document.createElement('dialog');d.id='v8Deed';d.className='v8-deed-dialog';
      d.innerHTML=`<div class="v8-deed"><div class="v8-deed-band"></div><button class="v8-x" aria-label="關閉">×</button><div class="v8-eyebrow">PROPERTY AVAILABLE</div><h2>—</h2><p class="v8-group">—</p><div class="v8-price-grid"><div><small>售價</small><strong class="v8-price">$0</strong></div><div><small>基本租金</small><strong class="v8-rent">$0</strong></div><div><small>建屋</small><strong class="v8-build">$0</strong></div></div><div class="v8-deed-actions"><button class="v8-auction">拍賣</button><button class="v8-buy">購買</button></div></div>`;
      document.body.appendChild(d);
      d.querySelector('.v8-x').onclick=()=>d.close();
      d.querySelector('.v8-buy').onclick=()=>{d.close();buyBtn?.click()};
      d.querySelector('.v8-auction').onclick=()=>{d.close();auctionBtn?.click()};
    }
    if(!q('#v8TurnSummary')){
      const d=document.createElement('dialog');d.id='v8TurnSummary';d.className='v8-summary-dialog';
      d.innerHTML=`<div class="v8-summary"><div class="v8-summary-icon">✓</div><small>TURN COMPLETE</small><h2>—</h2><div class="v8-summary-stats"></div><button class="v8-summary-next">交俾下一位玩家</button></div>`;
      document.body.appendChild(d);
      d.querySelector('.v8-summary-next').onclick=()=>{d.close();bypassEnd=true;endBtn?.click()};
    }
  }

  function setPhase(phase){
    qa('#v8PhaseBar span').forEach(el=>el.classList.toggle('active',el.dataset.p===phase));
  }

  function updatePhase(){
    const setup=q('#setupPanel');
    if(setup&&!setup.classList.contains('hidden')) return;
    if(typeof animating!=='undefined'&&animating){setPhase('resolve');return}
    if(typeof state!=='undefined'&&state.rolled){setPhase('manage');return}
    setPhase('roll');
  }

  function floatCash(playerIndex,delta){
    if(!delta) return;
    const card=qa('.player-card')[playerIndex]||q('#v7TurnHud');
    if(!card) return;
    const f=document.createElement('div');f.className=`v8-money ${delta>0?'plus':'minus'}`;f.textContent=money(delta);card.appendChild(f);setTimeout(()=>f.remove(),1100);
  }

  function showDeedIfNeeded(){
    const p=current(); if(!p||!state.rolled) return;
    const s=SPACES[p.pos];
    if(s?.type!=='property'||state.owners[p.pos]!=null||deedOpenFor===`${state.current}:${p.pos}:${state.v7?.turns||0}`) return;
    const d=q('#v8Deed'); if(!d) return;
    deedOpenFor=`${state.current}:${p.pos}:${state.v7?.turns||0}`;
    d.querySelector('.v8-deed-band').style.background=GROUPS[s.group]?.[1]||'#2487f3';
    d.querySelector('h2').textContent=s.name;
    d.querySelector('.v8-group').textContent=GROUPS[s.group]?.[0]||'Adelaide Property';
    d.querySelector('.v8-price').textContent=`$${s.price}`;
    d.querySelector('.v8-rent').textContent=`$${s.rent}`;
    d.querySelector('.v8-build').textContent=`$${s.build}`;
    const canBuy=p.cash>=s.price;
    d.querySelector('.v8-buy').disabled=!canBuy;
    d.querySelector('.v8-buy').textContent=canBuy?`購買 $${s.price}`:'現金不足';
    try{d.showModal()}catch{}
  }

  function snapshot(){return state.players.map(p=>p.cash)}
  function settleRoll(before){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      const moving=typeof animating!=='undefined'&&animating;
      if((state.rolled&&!moving)||tries>35){
        clearInterval(timer);
        state.players.forEach((p,i)=>floatCash(i,p.cash-(before[i]??p.cash)));
        setPhase('manage');
        showDeedIfNeeded();
      }else setPhase('resolve');
    },100);
  }

  rollBtn?.addEventListener('click',()=>{
    if(!current()||state.rolled) return;
    rollSnapshot=snapshot();
    setPhase('resolve');
    settleRoll(rollSnapshot);
  });

  buyBtn?.addEventListener('click',()=>setTimeout(()=>{updatePhase();const p=current();if(p)floatCash(state.current,-(SPACES[p.pos]?.price||0))},30));

  endBtn?.addEventListener('click',e=>{
    if(bypassEnd){bypassEnd=false;deedOpenFor=null;setTimeout(()=>setPhase('roll'),60);return}
    if(!state?.rolled||state.winner) return;
    e.preventDefault();e.stopImmediatePropagation();
    setPhase('end');
    const p=current(), d=q('#v8TurnSummary'); if(!p||!d){bypassEnd=true;endBtn.click();return}
    const start=rollSnapshot?.[state.current]??p.cash;
    const change=p.cash-start;
    d.querySelector('h2').textContent=`${p.token||'♟'} ${p.name}`;
    const pos=SPACES[p.pos]?.name||`第 ${p.pos} 格`;
    d.querySelector('.v8-summary-stats').innerHTML=`<div><small>本回合現金</small><strong class="${change>=0?'good':'bad'}">${money(change)}</strong></div><div><small>目前現金</small><strong>$${p.cash}</strong></div><div><small>停留位置</small><strong>${pos}</strong></div><div><small>持有地產</small><strong>${p.assets?.length||0}</strong></div>`;
    try{d.showModal()}catch{bypassEnd=true;endBtn.click()}
  },true);

  function jailAction(){
    q('#v8Bail')?.remove();
    const p=current(); if(!p?.inJail||state.rolled||p.cash<50) return;
    const b=document.createElement('button');b.id='v8Bail';b.className='v8-bail';b.textContent='🚔 支付 $50 即時出獄';
    b.onclick=()=>{p.cash-=50;p.inJail=false;p.jailTurns=0;log(`${p.name} 支付 $50 保釋出獄。`);msg(`${p.name} 已支付 $50 出獄，可以擲骰。`);save();render();floatCash(state.current,-50);b.remove()};
    q('#v8PhaseBar')?.insertAdjacentElement('afterend',b);
  }

  const phaseObserver=new MutationObserver(()=>{updatePhase();jailAction()});
  if(q('#gamePanel')) phaseObserver.observe(q('#gamePanel'),{subtree:true,attributes:true,attributeFilter:['class','disabled']});

  window.addEventListener('error',e=>console.error('V0.8 runtime',e.error||e.message));
  ensureUi();updatePhase();jailAction();
  const st=q('#qaStatus');if(st&&!st.classList.contains('qa-bad'))st.textContent='QA：V0.8 互動層已載入';
})();