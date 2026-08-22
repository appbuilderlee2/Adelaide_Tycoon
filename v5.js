(()=>{
  const VERSION='V0.6.1';
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

  const rollBtn=q('#rollBtn');
  const heroBtn=q('#rollHeroBtn');

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

  [heroBtn,rollBtn,q('#buyBtn'),q('#auctionBtn'),q('#buildBtn'),q('#endTurnBtn'),q('#assetsBtn'),q('#tradeBtn'),q('#playersBtn'),q('#settingsBtn'),q('#newGameBtn'),q('#startGameBtn')].forEach(addPressFx);

  // Important: keep app.js's original #rollBtn onclick untouched.
  // The large V0.6.1 button simply clicks that native game button.
  heroBtn?.addEventListener('click',()=>{
    const setupVisible=q('#setupPanel') && !q('#setupPanel').classList.contains('hidden');
    if(setupVisible){
      toast('請先開始遊戲');
      return;
    }
    if(!rollBtn){
      toast('搵唔到擲骰按鈕');
      return;
    }
    if(rollBtn.disabled){
      toast('今個回合暫時唔可以再擲骰');
      return;
    }
    heroBtn.classList.add('v5-rolling');
    rollBtn.click();
    setTimeout(()=>{
      heroBtn.classList.remove('v5-rolling');
      syncStage();
    },650);
  });

  // Only observe UI state. Do not rewrite disabled/onClick states from app.js.
  const obs=new MutationObserver(syncStage);
  if(q('#gamePanel')) obs.observe(q('#gamePanel'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});
  if(q('#setupPanel')) obs.observe(q('#setupPanel'),{attributes:true,attributeFilter:['class']});

  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>toast('V0.6.1 已更新'));
  }

  syncStage();
})();
