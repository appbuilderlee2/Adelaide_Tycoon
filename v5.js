(()=>{
  const VERSION='V0.6';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const toast=text=>{
    const old=q('.v5-toast'); if(old) old.remove();
    const t=document.createElement('div');
    t.className='v5-toast';
    t.textContent=text;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),1800);
  };

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · 本地多人 PWA`);

  function syncStage(){
    const turn=(q('#turnName')?.textContent || '下一位玩家').trim();
    const rolled=!q('#endTurnBtn')?.classList.contains('hidden');
    if(q('#rollStageName')) q('#rollStageName').textContent=`${turn}，到你喇`;
    if(q('#heroTurnChip')) q('#heroTurnChip').textContent=rolled?'已擲骰':'未擲骰';
    if(q('#rollStageHint')) q('#rollStageHint').textContent=rolled?'今個回合已擲骰，請完成操作後按「結束回合」':'撳大型骰仔開始今個回合';
    const hero=q('#rollHeroBtn');
    if(hero) hero.classList.toggle('is-disabled',rolled);
    const bottom=q('#rollBtn');
    if(bottom){
      bottom.disabled=false;
      bottom.classList.toggle('is-disabled',rolled);
    }
  }

  const appRollBtn=q('#rollBtn');
  const originalRollHandler=appRollBtn?.onclick || null;
  const originalStartHandler=q('#startGameBtn')?.onclick || null;
  const originalEndHandler=q('#endTurnBtn')?.onclick || null;

  async function safeRoll(ev){
    ev?.preventDefault?.();
    const rolled=!q('#endTurnBtn')?.classList.contains('hidden');
    if(q('#setupPanel') && !q('#setupPanel').classList.contains('hidden')){
      toast('請先開始遊戲');
      return;
    }
    if(rolled){
      toast('今個回合已擲骰');
      return;
    }
    q('#rollHeroBtn')?.classList.add('v5-rolling');
    try{
      if(typeof originalRollHandler==='function'){
        await originalRollHandler.call(appRollBtn || q('#rollHeroBtn'), ev || new Event('click'));
      } else {
        throw new Error('Missing original roll handler');
      }
    } catch(err){
      console.error('V0.6 dice error',err);
      if(q('#message')) q('#message').textContent='擲骰發生錯誤，請重新載入 V0.6。';
      toast('擲骰出錯');
    } finally {
      q('#rollHeroBtn')?.classList.remove('v5-rolling');
      setTimeout(syncStage,40);
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

  addPressFx(q('#rollHeroBtn'));
  addPressFx(q('#rollBtn'));
  ['#buyBtn','#auctionBtn','#buildBtn','#endTurnBtn','#assetsBtn','#tradeBtn','#playersBtn','#settingsBtn','#newGameBtn','#startGameBtn'].forEach(id=>addPressFx(q(id)));

  if(appRollBtn){
    appRollBtn.onclick=null;
    appRollBtn.addEventListener('click',safeRoll,{passive:false});
  }
  q('#rollHeroBtn')?.addEventListener('click',safeRoll,{passive:false});

  if(typeof originalStartHandler==='function' && q('#startGameBtn')){
    q('#startGameBtn').onclick=function(e){
      const out=originalStartHandler.call(this,e);
      setTimeout(syncStage,80);
      return out;
    }
  }
  if(typeof originalEndHandler==='function' && q('#endTurnBtn')){
    q('#endTurnBtn').onclick=function(e){
      const out=originalEndHandler.call(this,e);
      setTimeout(syncStage,80);
      return out;
    }
  }

  const obs=new MutationObserver(()=>syncStage());
  if(q('#gamePanel')) obs.observe(q('#gamePanel'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});

  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>toast('V0.6 已更新'));
  }

  syncStage();
})();
