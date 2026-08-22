(()=>{
  const VERSION='V1.0';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · 本地多人 PWA`);
  const badge=q('.version-badge'); if(badge) badge.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='Mobile Game UI';
  const copy=q('.hero-copy p'); if(copy) copy.textContent='棋盤優先、中央大型擲骰、底部操作 Dock、地產 contextual actions，介面更接近商業手機桌遊。';

  function ensureTopChip(){
    const top=q('.topbar>div:first-child');
    if(!top||q('.v10-game-chip')) return;
    const chip=document.createElement('div');
    chip.className='v10-game-chip';
    chip.innerHTML='<span class="v10-dot"></span><span>LIVE GAME</span>';
    top.appendChild(chip);
  }

  function syncMode(){
    const setup=q('#setupPanel');
    const game=q('#gamePanel');
    const playing=!!game&&!game.classList.contains('hidden')&&!!setup&&setup.classList.contains('hidden');
    document.body.classList.toggle('v10-playing',playing);
    if(playing){
      const roll=q('#rollBtn');
      if(roll){
        const disabled=roll.disabled;
        roll.setAttribute('aria-label',disabled?'今個回合已擲骰':'擲骰');
      }
    }
  }

  function polishLabels(){
    const settings=q('#settingsBtn'); if(settings) settings.title='設定';
    const newGame=q('#newGameBtn'); if(newGame) newGame.title='新遊戲';
    const roll=q('#rollBtn'); if(roll) roll.innerHTML='<span>🎲</span><b>擲骰</b>';
    const assets=q('#assetsBtn'); if(assets) assets.innerHTML='<span>🏠</span><b>資產</b>';
    const trade=q('#tradeBtn'); if(trade) trade.innerHTML='<span>↔️</span><b>交易</b>';
    const players=q('#playersBtn'); if(players) players.innerHTML='<span>👥</span><b>玩家</b>';
  }

  ensureTopChip();
  polishLabels();
  syncMode();

  const setup=q('#setupPanel'),game=q('#gamePanel');
  if(setup) new MutationObserver(syncMode).observe(setup,{attributes:true,attributeFilter:['class']});
  if(game) new MutationObserver(syncMode).observe(game,{attributes:true,attributeFilter:['class']});

  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{});
  }

  const st=q('#qaStatus');
  if(st&&!st.classList.contains('qa-bad')) st.textContent='QA：V1.0 介面層已載入';
})();
