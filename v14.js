(()=>{
  const VERSION='V1.4';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · Cartoon 3D Board Game`);
  const badge=q('.version-badge'); if(badge) badge.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='Cartoon 3D Board Game';
  const copy=q('.hero-copy p'); if(copy) copy.textContent='斜角城市棋盤、Q版棋子、浮空骰仔、卡通城市場景，同大型 GO 擲骰主按鈕。';

  function ensureBoardDecor(){
    const wrap=q('.board-wrap');
    if(!wrap) return;
    if(!q('#v14CityDecor')){
      const decor=document.createElement('div');
      decor.id='v14CityDecor';
      decor.className='v14-city-decor';
      decor.innerHTML=`
        <span class="v14-prop p1">🏛️</span><span class="v14-prop p2">🏢</span>
        <span class="v14-prop p3">🚋</span><span class="v14-prop p4">☕</span>
        <span class="v14-prop p5">🌳</span><span class="v14-prop p6">🌴</span>`;
      wrap.appendChild(decor);
    }
    if(!q('#v14BoardDice')){
      const dice=document.createElement('div');
      dice.id='v14BoardDice';dice.className='v14-board-dice';
      dice.innerHTML='<div class="v14-die d1">⚄</div><div class="v14-die d2">⚂</div>';
      wrap.appendChild(dice);
    }
  }

  function ensureCenterScene(){
    const center=q('#board .space.center');
    if(!center||center.querySelector('.v14-center-scene')) return;
    const scene=document.createElement('div');
    scene.className='v14-center-scene';
    scene.innerHTML=`<div class="v14-park"></div><span class="v14-landmark">🏛️</span><span class="v14-tree t1">🌳</span><span class="v14-tree t2">🌳</span><span class="v14-tree t3">🌲</span><span class="v14-tree t4">🌳</span><div class="v14-title">ADELAIDE<small>TYCOON</small></div>`;
    center.appendChild(scene);
  }

  function ensureRollLabel(){
    if(q('#v14RollLabel')) return;
    const l=document.createElement('div');l.id='v14RollLabel';l.className='v14-roll-label';l.textContent='GO · 擲骰';document.body.appendChild(l);
  }

  function syncDiceFaces(){
    if(typeof state==='undefined'||!state?.lastDice) return;
    const D=['⚀','⚁','⚂','⚃','⚄','⚅'];
    const a=q('.v14-die.d1'),b=q('.v14-die.d2');
    if(a) a.textContent=D[state.lastDice.d1-1]||'⚀';
    if(b) b.textContent=D[state.lastDice.d2-1]||'⚀';
  }

  let rollTimer=null;
  function playRollFx(){
    const roll=q('#rollBtn');
    if(!roll||roll.disabled) return;
    document.body.classList.remove('v14-rolling');
    void document.body.offsetWidth;
    document.body.classList.add('v14-rolling');
    clearTimeout(rollTimer);
    rollTimer=setTimeout(()=>{syncDiceFaces();document.body.classList.remove('v14-rolling')},900);
  }

  function polishDock(){
    const r=q('#rollBtn');
    if(r){r.innerHTML='<span>🎲</span><b>GO</b>';r.setAttribute('aria-label','擲骰');}
    const a=q('#assetsBtn'); if(a) a.innerHTML='<span>🏠</span><b>資產</b>';
    const t=q('#tradeBtn'); if(t) t.innerHTML='<span>🤝</span><b>交易</b>';
    const p=q('#playersBtn'); if(p) p.innerHTML='<span>👥</span><b>玩家</b>';
    const m=q('#v13MoreBtn'); if(m) m.innerHTML='<span>☰</span><b>更多</b>';
  }

  function sync(){ensureBoardDecor();ensureCenterScene();syncDiceFaces();polishDock()}

  ensureBoardDecor();ensureCenterScene();ensureRollLabel();polishDock();syncDiceFaces();

  const roll=q('#rollBtn');
  if(roll) roll.addEventListener('click',playRollFx,{passive:true});

  const board=q('#board');
  if(board){
    new MutationObserver(()=>requestAnimationFrame(()=>{ensureCenterScene();syncDiceFaces()})).observe(board,{childList:true});
  }

  const setup=q('#setupPanel');
  if(setup) new MutationObserver(()=>requestAnimationFrame(sync)).observe(setup,{attributes:true,attributeFilter:['class']});

  if('serviceWorker'in navigator){navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{})}

  const st=q('#qaStatus');if(st&&!st.classList.contains('qa-bad'))st.textContent='QA：V1.4 Cartoon 3D 介面已載入';
})();
