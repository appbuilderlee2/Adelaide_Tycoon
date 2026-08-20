(()=>{
  const VERSION='V0.5';
  const q=s=>document.querySelector(s);
  const toast=text=>{
    const old=q('.v5-toast'); if(old) old.remove();
    const t=document.createElement('div'); t.className='v5-toast'; t.textContent=text; document.body.appendChild(t);
    setTimeout(()=>t.remove(),1800);
  };

  document.title=`Adelaide Tycoon ${VERSION}`;
  const stageName=q('#rollStageName'), stageHint=q('#rollStageHint');

  function syncStage(){
    try{
      const p=state?.players?.[state.current];
      if(!p) return;
      if(stageName) stageName.textContent=`${p.name}，到你喇`;
      if(stageHint) stageHint.textContent=state.rolled?'今回合已擲骰，完成操作後按「結束回合」':'撳右邊大型骰仔開始今個回合';
      const hero=q('#rollHeroBtn');
      if(hero) hero.setAttribute('aria-disabled',String(!!(state.rolled||animating||state.winner)));
    }catch{}
  }

  const legacyRender=window.render;
  if(typeof legacyRender==='function'){
    window.render=function(){ const out=legacyRender.apply(this,arguments); syncStage(); return out; };
  }

  const legacyRoll=window.rollDice;
  async function safeRoll(){
    try{
      if(!state?.players?.length){ toast('請先開始遊戲'); return; }
      if(state.winner){ toast('遊戲已完結'); return; }
      if(animating){ toast('棋子移動中'); return; }
      if(state.rolled){ toast('今回合已擲骰，請先結束回合'); return; }
      const hero=q('#rollHeroBtn');
      hero?.classList.add('v5-rolling');
      if(typeof legacyRoll!=='function') throw new Error('rollDice unavailable');
      await legacyRoll();
      syncStage();
    }catch(err){
      console.error('V0.5 dice error',err);
      const m=q('#message'); if(m) m.textContent='擲骰發生錯誤，請重新載入 V0.5。';
      toast('擲骰錯誤已捕捉');
    }finally{
      q('#rollHeroBtn')?.classList.remove('v5-rolling');
    }
  }

  function bindRollButton(id){
    const old=q(id); if(!old) return;
    const fresh=old.cloneNode(true);
    fresh.disabled=false;
    old.replaceWith(fresh);
    fresh.addEventListener('click',safeRoll,{passive:true});
  }
  bindRollButton('#rollBtn');
  q('#rollHeroBtn')?.addEventListener('click',safeRoll,{passive:true});

  const obs=new MutationObserver(()=>{
    const b=q('#rollBtn'); if(b&&b.disabled) b.disabled=false;
    syncStage();
  });
  const game=q('#gamePanel'); if(game) obs.observe(game,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','class']});

  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>toast('V0.5 已更新'));
  }

  syncStage();
})();
