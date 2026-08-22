(()=>{
  const VERSION='V1.3';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · 3D Mobile Board Game`);
  const badge=q('.version-badge'); if(badge) badge.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='3D Board Game Style';
  const copy=q('.hero-copy p'); if(copy) copy.textContent='亮藍遊戲 HUD、立體玩家卡、中央棋盤、奶油色地產卡，同紅色大型擲骰主按鈕。';

  function ensureTopStats(){
    if(q('#v13TopStats')||!q('#gamePanel')) return;
    const row=document.createElement('div');
    row.id='v13TopStats';
    row.className='v13-top-stats';
    row.innerHTML=`
      <div class="v13-top-stat"><span class="icon">👑</span><span id="v13Mode">CLASSIC</span></div>
      <div class="v13-top-stat"><span id="v13Round">Round 1</span></div>
      <div class="v13-top-stat"><span class="icon">💵</span><span>FREE PARKING</span><b id="v13Pot">$0</b></div>`;
    q('#gamePanel').prepend(row);
  }

  function ensureMoreButton(){
    const dock=q('.bottom-actions');
    if(!dock||q('#v13MoreBtn')) return;
    const b=document.createElement('button');
    b.id='v13MoreBtn';
    b.type='button';
    b.className='v13-more-btn';
    b.innerHTML='<span>☰</span><b>更多</b>';
    b.onclick=()=>q('#settingsBtn')?.click();
    dock.appendChild(b);
  }

  function syncTopStats(){
    if(typeof state==='undefined'||!state?.players?.length) return;
    const mode=state.v7?.mode==='quick'?'QUICK MODE':'CLASSIC MODE';
    const turns=state.v7?.turns||0;
    const round=Math.floor(turns/Math.max(1,state.players.length))+1;
    if(q('#v13Mode')) q('#v13Mode').textContent=mode;
    if(q('#v13Round')) q('#v13Round').textContent=state.v7?.mode==='quick'?`Round ${round}/6`:`Round ${round}`;
    if(q('#v13Pot')) q('#v13Pot').textContent=`$${state.v7?.freePot||0}`;
  }

  function syncPlayerCards(){
    if(typeof state==='undefined'||!state?.players?.length) return;
    qa('.player-card').forEach((card,i)=>{
      const p=state.players[i];
      if(!p) return;
      card.dataset.player=i;
      const name=card.querySelector('.name');
      name?.querySelector('.v13-star')?.remove();
      if(name&&i===state.current&&!p.bankrupt){
        const star=document.createElement('span');
        star.className='v13-star';
        star.textContent=' ★';
        name.appendChild(star);
      }
    });
  }

  function syncPropertyButtons(){
    const buy=q('#buyBtn'), auction=q('#auctionBtn'), build=q('#buildBtn'), end=q('#endTurnBtn');
    if(buy&&!buy.classList.contains('hidden')&&!buy.textContent.startsWith('💵')) buy.textContent=`💵 ${buy.textContent}`;
    if(auction&&!auction.classList.contains('hidden')&&!auction.textContent.startsWith('🔨')) auction.textContent=`🔨 ${auction.textContent}`;
    if(build&&!build.classList.contains('hidden')&&!build.textContent.startsWith('🏠')) build.textContent=`🏠 ${build.textContent}`;
    if(end&&!end.classList.contains('hidden')&&!end.textContent.startsWith('✓')) end.textContent=`✓ ${end.textContent}`;
  }

  function sync(){syncTopStats();syncPlayerCards();syncPropertyButtons()}

  ensureTopStats();
  ensureMoreButton();
  sync();

  const playersStrip=q('#playersStrip');
  if(playersStrip) new MutationObserver(()=>requestAnimationFrame(()=>{syncPlayerCards();syncTopStats()})).observe(playersStrip,{childList:true});
  ['#rollBtn','#endTurnBtn','#buyBtn','#auctionBtn','#buildBtn'].forEach(sel=>{
    const el=q(sel);
    if(el) new MutationObserver(()=>requestAnimationFrame(()=>{syncPropertyButtons();syncTopStats()})).observe(el,{attributes:true,attributeFilter:['class','disabled']});
  });
  const setup=q('#setupPanel');
  if(setup) new MutationObserver(()=>requestAnimationFrame(syncTopStats)).observe(setup,{attributes:true,attributeFilter:['class']});

  if('serviceWorker'in navigator){navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{})}

  const st=q('#qaStatus');
  if(st&&!st.classList.contains('qa-bad')) st.textContent='QA：V1.3 3D 介面層已載入';
})();
