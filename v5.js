(()=>{
  const VERSION='V0.7.1';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const TOKENS=['🚗','🎩','🐕','🚢','🛼','🦆'];
  const BOARD_COORDS=[
    [7,1],[6,2],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],
    [6,7],[5,7],[4,7],[3,7],[2,7],[1,7],
    [1,6],[1,5],[1,4],[1,3],[1,2],[1,1],
    [2,1],[3,1],[4,1],[5,1],[6,1]
  ];

  const toast=text=>{
    q('.v5-toast')?.remove();
    const t=document.createElement('div');
    t.className='v5-toast';
    t.textContent=text;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1800);
  };

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · 本地多人 PWA`);
  const badge=q('.version-badge'); if(badge) badge.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='Mobile Board Game Update';
  const heroCopy=q('.hero-copy p');
  if(heroCopy) heroCopy.textContent='參考現代手機桌遊節奏：Quick Mode、House Rules、自訂棋子、回合 HUD 同更強動畫回饋。';

  try{grid=function(i){return BOARD_COORDS[i]}}catch(err){console.error('grid patch failed',err)}

  const setup=q('#setupPanel');
  const game=q('#gamePanel');
  const players=q('#playerInputs');
  const rollBtn=q('#rollBtn');
  const heroBtn=q('#rollHeroBtn');
  const startBtn=q('#startGameBtn');
  const endBtn=q('#endTurnBtn');
  let selectedMode='classic';
  let rules={freeParking:true,doubleGo:false};
  let syncing=false;

  function injectSetupOptions(){
    if(!setup||q('#v7Options')) return;
    const box=document.createElement('div');
    box.id='v7Options';
    box.className='v7-options';
    box.innerHTML=`
      <div class="v7-option-title">遊戲模式</div>
      <div class="v7-segmented" role="group" aria-label="遊戲模式">
        <button type="button" class="active" data-mode="classic"><b>Classic</b><small>完整大富翁</small></button>
        <button type="button" data-mode="quick"><b>Quick</b><small>6 輪後計資產</small></button>
      </div>
      <div class="v7-option-title">House Rules</div>
      <div class="v7-rules">
        <label><input id="ruleFreeParking" type="checkbox" checked><span><b>Free Parking Jackpot</b><small>事件罰款累積到免費泊車</small></span></label>
        <label><input id="ruleDoubleGo" type="checkbox"><span><b>Double GO</b><small>剛好落 START 額外 +$200</small></span></label>
      </div>`;
    setup.insertBefore(box,setup.querySelector('.setup-actions'));
    qa('.v7-segmented button').forEach(b=>b.onclick=()=>{
      selectedMode=b.dataset.mode;
      qa('.v7-segmented button').forEach(x=>x.classList.toggle('active',x===b));
    });
    q('#ruleFreeParking').onchange=e=>rules.freeParking=e.target.checked;
    q('#ruleDoubleGo').onchange=e=>rules.doubleGo=e.target.checked;
  }

  function decoratePlayerRows(){
    if(!players) return;
    [...players.children].forEach((row,i)=>{
      let select=row.querySelector('.v7-token-select');
      if(!select){
        select=document.createElement('select');
        select.className='v7-token-select';
        select.setAttribute('aria-label',`玩家 ${i+1} 棋子`);
        select.innerHTML=TOKENS.map((t,n)=>`<option value="${t}" ${n===i%TOKENS.length?'selected':''}>${t}</option>`).join('');
        row.appendChild(select);
      }
      const preview=row.querySelector('.pawn-preview');
      if(preview) preview.textContent=select.value;
      select.onchange=()=>{if(preview) preview.textContent=select.value};
    });
  }

  function injectHud(){
    if(!game||q('#v7TurnHud')) return;
    const hud=document.createElement('section');
    hud.id='v7TurnHud';
    hud.className='v7-turn-hud';
    hud.innerHTML='<div class="v7-current-token">🎩</div><div class="v7-hud-copy"><small>YOUR TURN</small><strong>—</strong><span>現金 $0</span></div><div class="v7-hud-side"><b id="v7ModeLabel">CLASSIC</b><span id="v7RoundLabel">Round 1</span></div>';
    const status=game.querySelector('.status-row');
    game.insertBefore(hud,status);
  }

  function ensureV7State(){
    if(typeof state==='undefined') return;
    state.v7=state.v7||{};
    state.v7.mode=state.v7.mode||selectedMode;
    state.v7.rules={freeParking:true,doubleGo:false,...rules,...(state.v7.rules||{})};
    state.v7.turns=Number.isFinite(state.v7.turns)?state.v7.turns:0;
    state.v7.freePot=Number.isFinite(state.v7.freePot)?state.v7.freePot:0;
    state.v7.maxTurns=state.v7.maxTurns||Math.max(12,(state.players?.length||2)*6);
    (state.players||[]).forEach((p,i)=>{p.token=p.token||TOKENS[i%TOKENS.length]});
  }

  function netWorth(p){
    return p.cash+(p.assets||[]).reduce((n,i)=>n+Math.round((SPACES[i]?.price||0)/2)+(state.houses?.[i]||0)*Math.round((SPACES[i]?.build||0)/2),0);
  }

  function refreshTokens(){
    if(typeof state==='undefined'||!state?.players?.length) return;
    qa('.space[data-index]').forEach(space=>{
      const i=+space.dataset.index;
      const row=space.querySelector('.token-row');
      if(!row) return;
      const desired=state.players.map((p,pi)=>({p,pi})).filter(({p})=>!p.bankrupt&&p.pos===i);
      const signature=desired.map(({p,pi})=>`${pi}:${p.token||TOKENS[pi%TOKENS.length]}:${pi===state.current}`).join('|');
      if(row.dataset.sig===signature) return;
      row.dataset.sig=signature;
      row.innerHTML='';
      desired.forEach(({p,pi})=>{
        const t=document.createElement('span');
        t.className='pawn-token v7-token'+(pi===state.current?' current-token':'');
        t.style.setProperty('--pawn',p.color);
        t.textContent=p.token||TOKENS[pi%TOKENS.length];
        row.appendChild(t);
      });
    });
    qa('.player-card').forEach((card,i)=>{
      const el=card.querySelector('.mini-pawn');
      const token=state.players[i]?.token||TOKENS[i%TOKENS.length];
      if(el&&el.textContent!==token) el.textContent=token;
    });
  }

  function updateHud(){
    if(typeof state==='undefined'||!state?.players?.length) return;
    ensureV7State();
    const p=state.players[state.current];
    const hud=q('#v7TurnHud');
    if(hud){
      hud.style.setProperty('--player',p.color);
      hud.querySelector('.v7-current-token').textContent=p.token||'🎩';
      hud.querySelector('.v7-hud-copy strong').textContent=p.name;
      hud.querySelector('.v7-hud-copy span').textContent=`現金 $${p.cash} · 資產 ~$${netWorth(p)}`;
      q('#v7ModeLabel').textContent=state.v7.mode==='quick'?'QUICK':'CLASSIC';
      const round=Math.min(6,Math.floor(state.v7.turns/Math.max(1,state.players.length))+1);
      q('#v7RoundLabel').textContent=state.v7.mode==='quick'?`Round ${round}/6`:`Round ${round}`;
    }
    const pot=q('#v7PotBadge');
    if(pot) pot.textContent=`FREE PARKING $${state.v7.freePot||0}`;
  }

  function enhancePropertyPanel(){
    if(typeof state==='undefined'||!state?.players?.length) return;
    const p=state.players[state.current];
    const s=SPACES[p.pos];
    const panel=q('.property-panel');
    if(!panel) return;
    panel.classList.toggle('v7-property',s.type==='property');
    panel.style.setProperty('--group',s.group&&GROUPS[s.group]?GROUPS[s.group][1]:'#2487f3');
    if(!q('#v7PotBadge')){
      const b=document.createElement('div');
      b.id='v7PotBadge';
      b.className='v7-pot-badge';
      panel.appendChild(b);
    }
  }

  function diceBurst(){
    if(typeof state==='undefined'||!state?.lastDice) return;
    q('.v7-dice-burst')?.remove();
    const b=document.createElement('div');
    b.className='v7-dice-burst';
    b.innerHTML=`<div>${DICE[state.lastDice.d1-1]} ${DICE[state.lastDice.d2-1]}</div><strong>${state.lastDice.sum}</strong>`;
    document.body.appendChild(b);
    setTimeout(()=>b.remove(),1000);
  }

  function syncStage(){
    if(syncing) return;
    syncing=true;
    try{
      const turn=(q('#turnName')?.textContent||'下一位玩家').trim();
      const setupVisible=setup&&!setup.classList.contains('hidden');
      const rolled=!endBtn?.classList.contains('hidden');
      const blocked=setupVisible||rolled||!!rollBtn?.disabled;
      if(q('#rollStageName')) q('#rollStageName').textContent=setupVisible?'先建立玩家':`${turn}，到你喇`;
      if(q('#heroTurnChip')) q('#heroTurnChip').textContent=setupVisible?'未開始':rolled?'已擲骰':'未擲骰';
      if(q('#rollStageHint')) q('#rollStageHint').textContent=setupVisible?'揀模式、棋子同規則後開始':rolled?'完成買地／交易後結束回合':'撳骰仔開始今個回合';
      heroBtn?.classList.toggle('is-disabled',blocked);
      updateHud();
      refreshTokens();
      enhancePropertyPanel();
    }finally{syncing=false}
  }

  injectSetupOptions();
  decoratePlayerRows();
  injectHud();
  if(players) new MutationObserver(decoratePlayerRows).observe(players,{childList:true});

  const legacyStart=startGame;
  startGame=function(){
    const chosen=[...players.children].map((r,i)=>r.querySelector('.v7-token-select')?.value||TOKENS[i%TOKENS.length]);
    legacyStart();
    if(!state?.players?.length) return;
    state.players.forEach((p,i)=>p.token=chosen[i]);
    state.v7={mode:selectedMode,rules:{...rules},turns:0,freePot:0,maxTurns:state.players.length*6};
    if(selectedMode==='quick') state.players.forEach(p=>p.cash=1200);
    save();
    render();
    toast(selectedMode==='quick'?'Quick Mode：6 輪後計總資產':'Classic Mode 開始');
  };
  if(startBtn) startBtn.onclick=startGame;

  const legacyRenderBoard=renderBoard;
  renderBoard=function(){legacyRenderBoard();refreshTokens()};
  const legacyRenderPlayers=renderPlayers;
  renderPlayers=function(){legacyRenderPlayers();refreshTokens()};
  const legacyRender=render;
  render=function(){legacyRender();ensureV7State();updateHud();refreshTokens();enhancePropertyPanel()};

  const legacyMove=move;
  move=async function(p,n){
    await legacyMove(p,n);
    ensureV7State();
    if(state.v7.rules.doubleGo&&p.pos===0&&n>0){
      p.cash+=200;
      log(`${p.name} 剛好落 START，House Rule 額外收 $200。`);
      msg(`${p.name} Double GO！額外 +$200。`);
      beep(900,.1,'triangle');
    }
  };

  const legacyDrawCard=drawCard;
  drawCard=async function(type){
    ensureV7State();
    const p=state.players[state.current];
    const beforeCash=p.cash;
    const beforePos=p.pos;
    await legacyDrawCard(type);
    const directPenalty=beforePos===p.pos&&p.cash<beforeCash ? beforeCash-p.cash : 0;
    if(state.v7.rules.freeParking&&directPenalty>0){
      state.v7.freePot+=directPenalty;
      save();
      updateHud();
    }
  };

  const legacyResolve=resolve;
  resolve=async function(i){
    await legacyResolve(i);
    ensureV7State();
    if(SPACES[i]?.type==='free'&&state.v7.rules.freeParking&&(state.v7.freePot||0)>0){
      const p=state.players[state.current];
      const win=state.v7.freePot;
      p.cash+=win;
      state.v7.freePot=0;
      msg(`${p.name} 拎到 Free Parking Jackpot $${win}！`);
      log(`${p.name} 免費泊車獎金 +$${win}。`);
      beep(980,.12,'triangle');
      renderPlayers();
      save();
    }
  };

  const legacyEnd=endTurn;
  endTurn=function(){
    if(!state?.rolled||state.winner) return;
    ensureV7State();
    const finishingQuick=state.v7.mode==='quick'&&state.v7.turns+1>=state.v7.maxTurns;
    state.v7.turns++;
    const oldPrivacy=state.settings?.privacy;
    if(finishingQuick&&state.settings) state.settings.privacy=false;
    legacyEnd();
    if(finishingQuick&&state.settings) state.settings.privacy=oldPrivacy;
    if(finishingQuick&&!state.winner){
      const pass=q('#passModal'); if(pass?.open) pass.close();
      const alive=state.players.filter(p=>!p.bankrupt).sort((a,b)=>netWorth(b)-netWorth(a));
      const winner=alive[0];
      state.winner=winner.name;
      q('#winnerName').textContent=winner.name;
      q('#winnerModal').showModal();
      msg(`Quick Mode 完成：${winner.name} 以最高總資產勝出。`);
      log(`${winner.name} Quick Mode 勝出，總資產 ~$${netWorth(winner)}。`);
      save();
      render();
    }
    syncStage();
  };
  if(endBtn) endBtn.onclick=endTurn;

  heroBtn?.addEventListener('click',()=>{
    if(setup&&!setup.classList.contains('hidden')){toast('請先開始遊戲');return}
    if(!rollBtn||rollBtn.disabled) return;
    heroBtn.classList.add('v5-rolling');
    rollBtn.click();
    setTimeout(()=>{heroBtn.classList.remove('v5-rolling');diceBurst();syncStage()},620);
  });
  rollBtn?.addEventListener('click',()=>setTimeout(()=>{diceBurst();syncStage()},620));

  [heroBtn,rollBtn,q('#buyBtn'),q('#auctionBtn'),q('#buildBtn'),endBtn,q('#assetsBtn'),q('#tradeBtn'),q('#playersBtn'),q('#settingsBtn'),q('#newGameBtn'),startBtn].forEach(btn=>{
    if(!btn) return;
    btn.addEventListener('pointerdown',()=>btn.classList.add('btn-press'));
    const clear=()=>btn.classList.remove('btn-press');
    btn.addEventListener('pointerup',clear);
    btn.addEventListener('pointercancel',clear);
  });

  function runSelfCheck(){
    const errors=[];
    try{if(SPACES.length!==BOARD_COORDS.length) errors.push('棋盤格數不一致')}catch{errors.push('棋盤資料未載入')}
    if(new Set(BOARD_COORDS.map(x=>x.join(','))).size!==BOARD_COORDS.length) errors.push('棋盤座標重複');
    ['#startGameBtn','#rollBtn','#endTurnBtn','#assetsBtn','#tradeBtn','#playersBtn'].forEach(id=>{if(!q(id)) errors.push(`缺少 ${id}`)});
    if(rollBtn&&typeof rollBtn.onclick!=='function') errors.push('核心擲骰 handler 未綁定');
    const st=q('#qaStatus');
    if(st){
      st.textContent=errors.length?`QA：${errors.length} 個問題`:'QA：V0.7.1 核心檢查通過';
      st.className=`qa-status ${errors.length?'qa-bad':'qa-good'}`;
    }
    if(errors.length) console.error('V0.7.1 QA',errors);
    return errors.length===0;
  }

  window.addEventListener('error',e=>{
    console.error('Runtime error',e.error||e.message);
    if(q('#message')) q('#message').textContent=`系統錯誤：${e.message||'未知錯誤'}`;
  });
  window.addEventListener('unhandledrejection',e=>{
    console.error('Unhandled promise rejection',e.reason);
    if(q('#message')) q('#message').textContent='系統錯誤：非同步操作失敗';
  });

  if(game) new MutationObserver(syncStage).observe(game,{subtree:true,attributes:true,attributeFilter:['class','disabled']});
  if(setup) new MutationObserver(syncStage).observe(setup,{attributes:true,attributeFilter:['class']});

  if('serviceWorker'in navigator){
    navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>toast(`${VERSION} 已更新`));
  }

  try{if(state?.players?.length){ensureV7State();render();save()}}catch(err){console.error('V0.7.1 saved-game recovery',err)}
  runSelfCheck();
  syncStage();
})();
