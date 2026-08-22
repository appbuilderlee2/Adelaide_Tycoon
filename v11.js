(()=>{
  const VERSION='V1.1';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · One-Screen PWA`);
  const badge=q('.version-badge'); if(badge) badge.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='One-Screen Mode';
  const copy=q('.hero-copy p'); if(copy) copy.textContent='遊戲開始後，一頁睇晒玩家、回合、棋盤、地產操作、訊息同底部擲骰 Dock。';

  function setViewport(){
    document.documentElement.style.setProperty('--v11-height',`${window.innerHeight}px`);
  }
  setViewport();
  window.addEventListener('resize',setViewport,{passive:true});
  window.visualViewport?.addEventListener('resize',setViewport,{passive:true});

  // Keep the log accessible without occupying permanent screen space.
  const msg=q('#message');
  if(msg){
    msg.title='撳一下查看遊戲紀錄';
    msg.setAttribute('role','button');
    msg.addEventListener('click',()=>{
      if(typeof state==='undefined'||!state?.players?.length) return;
      const modal=q('#modal'),title=q('#modalTitle'),body=q('#modalBody');
      if(!modal||!title||!body) return;
      title.textContent='遊戲紀錄';
      body.innerHTML=`<div class="game-log">${(state.log||[]).map(x=>`<div>${typeof esc==='function'?esc(x):x}</div>`).join('')||'<div>未有紀錄。</div>'}</div>`;
      try{modal.showModal()}catch{}
    });
  }

  const st=q('#qaStatus');
  if(st&&!st.classList.contains('qa-bad')) st.textContent='QA：V1.1 單頁介面已載入';

  if('serviceWorker' in navigator){
    navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{});
  }
})();
