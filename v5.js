(()=>{
  const VERSION='V0.6.2';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));

  const toast=text=>{
    const old=q('.v5-toast');
    if(old) old.remove();
    const t=document.createElement('div');
    t.className='v5-toast';
    t.textContent=text;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1800);
  };

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · 本地多人 PWA`);
  const badge=q('.version-badge');
  if(badge) badge.textContent=VERSION;

  // Critical QA hotfix: app.js defines 25 spaces but its original grid() only
  // returned 20 coordinates. Replace it before the user starts a new game.
  // Route uses a 7x7 board: 24 perimeter cells + one inner transition cell.
  const BOARD_COORDS=[
    [7,1],[6,2],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],
    [6,7],[5,7],[4,7],[3,7],[2,7],[1,7],
    [1,6],[1,5],[1,4],[1,3],[1,2],[1,1],
    [2,1],[3,1],[4,1],[5,1],[6,1]
  ];
  try{
    grid=function(i){return BOARD_COORDS[i]};
  }catch(err){
    console.error('Unable to patch board grid',err);
  }

  const rollBtn=q('#rollBtn');
  const heroBtn=q('#rollHeroBtn');
  const startBtn=q('#startGameBtn');

  function runSelfCheck(){
    const errors=[];
    try{
      if(typeof SPACES==='undefined') errors.push('SPACES 未載入');
      else if(SPACES.length!==BOARD_COORDS.length) errors.push(`格數 ${SPACES.length} 與座標 ${BOARD_COORDS.length} 不一致`);
    }catch{errors.push('無法讀取棋盤資料')}

    const unique=new Set(BOARD_COORDS.map(([r,c])=>`${r},${c}`));
    if(unique.size!==BOARD_COORDS.length) errors.push('棋盤座標有重複');

    ['#startGameBtn','#rollBtn','#buyBtn','#endTurnBtn','#assetsBtn','#tradeBtn','#playersBtn'].forEach(id=>{
      if(!q(id)) errors.push(`缺少 ${id}`);
    });
    if(rollBtn && typeof rollBtn.onclick!=='function') errors.push('核心擲骰 handler 未綁定');
    if(startBtn && typeof startBtn.onclick!=='function') errors.push('開始遊戲 handler 未綁定');

    const status=q('#qaStatus');
    if(status){
      status.textContent=errors.length?`QA：${errors.length} 個問題`:'QA：核心檢查通過';
      status.classList.toggle('qa-bad',!!errors.length);
      status.classList.toggle('qa-good',!errors.length);
    }
    if(errors.length){
      console.error('Adelaide Tycoon self-check failed',errors);
      toast(`自檢發現 ${errors.length} 個問題`);
      return false;
    }
    console.info('Adelaide Tycoon V0.6.2 self-check passed');
    return true;
  }

  function syncStage(){
    const turn=(q('#turnName')?.textContent || '下一位玩家').trim();
    const setupVisible=q('#setupPanel') && !q('#setupPanel').classList.contains('hidden');
    const rolled=!q('#endTurnBtn')?.classList.contains('hidden');
    const blocked=setupVisible || rolled || !!rollBtn?.disabled;

    if(q('#rollStageName')) q('#rollStageName').textContent=setupVisible?'先建立玩家':`${turn}，到你喇`;
    if(q('#heroTurnChip')) q('#heroTurnChip').textContent=setupVisible?'未開始':rolled?'已擲骰':'未擲骰';
    if(q('#rollStageHint')) q('#rollStageHint').textContent=setupVisible?'開始遊戲後就可以擲骰':rolled?'今個回合已擲骰，請完成操作後按「結束回合」':'撳大型骰仔開始今個回合';
    if(heroBtn){
      heroBtn.classList.toggle('is-disabled',blocked);
      heroBtn.setAttribute('aria-disabled',String(blocked));
    }
  }

  function addPressFx(btn){
    if(!btn) return;
    btn.addEventListener('pointerdown',()=>btn.classList.add('btn-press'));
    const clear=()=>btn.classList.remove('btn-press');
    btn.addEventListener('pointerup',clear);
    btn.addEventListener('pointercancel',clear);
    btn.addEventListener('mouseleave',clear);
  }

  [heroBtn,rollBtn,q('#buyBtn'),q('#auctionBtn'),q('#buildBtn'),q('#endTurnBtn'),q('#assetsBtn'),q('#tradeBtn'),q('#playersBtn'),q('#settingsBtn'),q('#newGameBtn'),startBtn].forEach(addPressFx);

  // Keep app.js's original roll handler untouched. The large button delegates to it.
  heroBtn?.addEventListener('click',()=>{
    const setupVisible=q('#setupPanel') && !q('#setupPanel').classList.contains('hidden');
    if(setupVisible){toast('請先開始遊戲');return}
    if(!rollBtn){toast('搵唔到擲骰按鈕');return}
    if(rollBtn.disabled){toast('今個回合暫時唔可以再擲骰');return}
    heroBtn.classList.add('v5-rolling');
    try{
      rollBtn.click();
    }catch(err){
      console.error('Hero dice delegation failed',err);
      toast('擲骰失敗，請重新整理');
    }
    setTimeout(()=>{
      heroBtn.classList.remove('v5-rolling');
      syncStage();
    },650);
  });

  // Surface uncaught runtime errors instead of silently failing.
  window.addEventListener('error',event=>{
    console.error('Runtime error',event.error||event.message);
    const m=q('#message');
    if(m) m.textContent=`系統錯誤：${event.message||'未知錯誤'}`;
  });
  window.addEventListener('unhandledrejection',event=>{
    console.error('Unhandled promise rejection',event.reason);
    const m=q('#message');
    if(m) m.textContent='系統錯誤：非同步操作失敗';
  });

  const obs=new MutationObserver(syncStage);
  if(q('#gamePanel')) obs.observe(q('#gamePanel'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});
  if(q('#setupPanel')) obs.observe(q('#setupPanel'),{attributes:true,attributeFilter:['class']});

  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>toast('V0.6.2 已更新'));
  }

  runSelfCheck();
  syncStage();
})();
