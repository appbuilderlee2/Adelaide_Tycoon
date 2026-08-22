(()=>{
  const VERSION='V1.2';
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const JAIL_INDEX=7;
  const GO_TO_JAIL_INDEX=19;

  document.title=`Adelaide Tycoon ${VERSION}`;
  qa('.version').forEach(el=>el.textContent=`${VERSION} · Classic Rules`);
  const badge=q('.version-badge'); if(badge) badge.textContent=VERSION;
  const tag=q('.hero-tag'); if(tag) tag.textContent='Classic Rules Upgrade';
  const copy=q('.hero-copy p'); if(copy) copy.textContent='加入雙骰再行、三次雙骰入獄、Go To Jail、強制拍賣、酒店與債權人破產轉移。';

  // Repurpose one special square so the physical-board loop includes Go To Jail.
  if(typeof SPACES!=='undefined'&&SPACES[GO_TO_JAIL_INDEX]){
    SPACES[GO_TO_JAIL_INDEX].name='Go To Jail';
    SPACES[GO_TO_JAIL_INDEX].type='gotojail';
  }

  function ensureRules(){
    if(typeof state==='undefined') return null;
    state.v12=state.v12||{};
    state.v12.doublesStreak=state.v12.doublesStreak||0;
    state.v12.extraRoll=!!state.v12.extraRoll;
    if(state.v12.debtCreditor===undefined) state.v12.debtCreditor=null;
    return state.v12;
  }

  const oldRent=rent;
  rent=function(i){
    const s=SPACES[i];
    if(!s||s.type!=='property'||state.mortgaged[i]) return 0;
    const h=state.houses[i]||0;
    if(h===5) return s.rent*10;
    if(h>0) return s.rent*(h+1);
    return s.rent*(ownsGroup(state.owners[i],s.group)?2:1);
  };

  canBuild=function(pi,i){
    const s=SPACES[i];
    if(!s?.group||state.owners[i]!==pi||state.mortgaged[i]||!ownsGroup(pi,s.group)) return false;
    const h=state.houses[i]||0;
    if(h>=5) return false;
    const ids=groupIds(s.group), levels=ids.map(x=>state.houses[x]||0);
    if(h===4) return levels.every(x=>x===4); // hotel only after every property has 4 houses
    return h===Math.min(...levels); // even building
  };

  canSell=function(pi,i){
    const s=SPACES[i];
    if(!s?.group||state.owners[i]!==pi) return false;
    const h=state.houses[i]||0;
    if(h<=0) return false;
    const levels=groupIds(s.group).map(x=>state.houses[x]||0);
    return h===Math.max(...levels);
  };

  buildCurrent=function(){
    const p=state.players[state.current],i=p.pos,s=SPACES[i];
    if(!canBuild(state.current,i)||p.cash<s.build) return;
    p.cash-=s.build;
    state.houses[i]=(state.houses[i]||0)+1;
    const level=state.houses[i];
    if(level===5){
      msg(`${p.name} 喺 ${s.name} 升級成酒店！`);
      log(`${p.name} 喺 ${s.name} 建成酒店。`);
      beep(980,.12,'triangle');
      haptic([20,35,25]);
    }else{
      msg(`${p.name} 喺 ${s.name} 建咗第 ${level} 間屋。`);
      log(`${p.name} 喺 ${s.name} 建屋。`);
      beep(720,.08,'triangle');
      haptic(20);
    }
    render();save();
  };
  const buildBtn=q('#buildBtn'); if(buildBtn) buildBtn.onclick=()=>buildCurrent();

  const legacyResolve=resolve;
  resolve=async function(i){
    const rules=ensureRules();
    const p=state.players[state.current];
    const s=SPACES[i];
    const creditor=(s?.type==='property'&&state.owners[i]!=null&&state.owners[i]!==state.current)?state.owners[i]:null;
    if(rules) rules.debtCreditor=creditor;
    await legacyResolve(i);
    if(s?.type==='gotojail'){
      p.pos=JAIL_INDEX;
      p.inJail=true;
      p.jailTurns=0;
      if(rules){rules.doublesStreak=0;rules.extraRoll=false;rules.debtCreditor=null;}
      msg(`${p.name} 落到 Go To Jail，立即入獄。`);
      log(`${p.name} → Go To Jail → Jail。`);
      beep(180,.16,'sawtooth');haptic([40,40,60]);
      render();save();
      return;
    }
    if(p.cash>0&&rules) rules.debtCreditor=null;
  };

  bankrupt=function(i){
    const rules=ensureRules();
    const p=state.players[i];
    if(!p||p.bankrupt) return;
    const ci=rules?.debtCreditor;
    const creditor=Number.isInteger(ci)&&ci>=0&&ci<state.players.length&&ci!==i&&!state.players[ci].bankrupt?state.players[ci]:null;
    p.bankrupt=true;
    if(creditor){
      p.assets.forEach(x=>{
        if(!creditor.assets.includes(x)) creditor.assets.push(x);
        state.owners[x]=ci;
      });
      if(p.cash>0){creditor.cash+=p.cash;p.cash=0;}
      log(`${p.name} 破產，地產轉交俾債權人 ${creditor.name}。`);
      msg(`${p.name} 破產；資產已轉交俾 ${creditor.name}。`);
    }else{
      p.assets.forEach(x=>{delete state.owners[x];delete state.houses[x];delete state.mortgaged[x]});
      log(`${p.name} 向銀行破產，地產退回銀行。`);
      msg(`${p.name} 已破產，地產退回銀行。`);
    }
    p.assets=[];
    if(rules){rules.debtCreditor=null;rules.extraRoll=false;rules.doublesStreak=0;}
  };

  const legacyRenderBoard=renderBoard;
  renderBoard=function(){
    legacyRenderBoard();
    qa('.space[data-index]').forEach(el=>{
      const i=+el.dataset.index,h=state.houses[i]||0;
      const houses=el.querySelector('.houses');
      if(houses) houses.textContent=h===5?'🏨':'🏠'.repeat(h);
      if(i===GO_TO_JAIL_INDEX){
        el.classList.add('v12-go-jail');
        const icon=el.querySelector('.space-icon')||document.createElement('div');
        icon.className='space-icon';icon.textContent='🚓';
        if(!icon.parentNode) el.appendChild(icon);
      }
    });
  };

  const legacyRenderInfo=renderInfo;
  renderInfo=function(){
    legacyRenderInfo();
    const rules=ensureRules();
    const p=state.players[state.current],s=SPACES[p.pos];
    const end=q('#endTurnBtn');
    q('#v12ExtraRoll')?.remove();
    if(s?.type==='gotojail'){
      q('#spaceMeta').textContent='立即前往 Jail，不會經過 START。';
    }
    if(s?.type==='property'){
      const h=state.houses[p.pos]||0;
      if(h===5) q('#spaceMeta').textContent+=` · 🏨 酒店 · 租金 $${rent(p.pos)}`;
    }
    // In classic rules, declining an unowned property triggers an auction.
    const mustAuction=state.rolled&&s?.type==='property'&&state.owners[p.pos]==null;
    if(mustAuction&&end){
      end.classList.add('hidden');
      q('#message').textContent=`${s.name} 未出售：購買，或者拍賣後先可以完結回合。`;
    }
    // Doubles grant another roll, but property decisions are resolved first.
    if(rules?.extraRoll&&state.rolled&&!mustAuction&&!p.inJail&&!state.winner){
      if(end) end.classList.add('hidden');
      const b=document.createElement('button');
      b.id='v12ExtraRoll';b.className='v12-extra-roll';
      b.innerHTML='<span>🎲🎲</span><b>雙骰！再擲一次</b>';
      b.onclick=()=>{
        rules.extraRoll=false;
        state.rolled=false;
        save();render();
        setTimeout(()=>q('#rollBtn')?.click(),60);
      };
      q('.property-actions')?.appendChild(b);
    }
    if(buildBtn&&!buildBtn.classList.contains('hidden')){
      const h=state.houses[p.pos]||0;
      buildBtn.textContent=h===4?`升級酒店 $${s.build}`:`建屋 $${s.build}`;
    }
  };

  rollDice=async function(){
    if(state.rolled||animating||state.winner) return;
    const rules=ensureRules();
    const p=state.players[state.current];
    await animateDice();
    const d1=1+Math.floor(Math.random()*6),d2=1+Math.floor(Math.random()*6),sum=d1+d2;
    const isDouble=d1===d2;
    state.lastDice={d1,d2,sum};
    state.rolled=true;
    beep(430,.05);setTimeout(()=>beep(560,.07),55);haptic(25);

    if(p.inJail){
      rules.doublesStreak=0;
      rules.extraRoll=false;
      p.jailTurns++;
      if(isDouble){
        p.inJail=false;p.jailTurns=0;
        msg(`${p.name} 擲到雙骰，成功出獄！`);
        await move(p,sum);await resolve(p.pos);
      }else if(p.jailTurns>=3){
        p.cash-=50;p.inJail=false;p.jailTurns=0;
        msg(`${p.name} 第 3 次未擲到雙骰，支付 $50 出獄。`);
        await move(p,sum);await resolve(p.pos);
      }else{
        msg(`${p.name} 未擲到雙骰，仍然留喺監獄。`);
      }
    }else{
      rules.doublesStreak=isDouble?(rules.doublesStreak+1):0;
      if(rules.doublesStreak>=3){
        p.pos=JAIL_INDEX;p.inJail=true;p.jailTurns=0;
        rules.doublesStreak=0;rules.extraRoll=false;
        msg(`${p.name} 連續 3 次雙骰，直接入獄！`);
        log(`${p.name} 連續 3 次雙骰 → Jail。`);
        beep(170,.18,'sawtooth');haptic([50,45,70]);
      }else{
        await move(p,sum);
        await resolve(p.pos);
        rules.extraRoll=isDouble&&!p.inJail&&SPACES[p.pos]?.type!=='gotojail';
        if(rules.extraRoll){
          msg(`${p.name} 擲到雙骰！先處理目前格，之後再擲一次。`);
          log(`${p.name} 擲到雙骰，可再擲。`);
        }
      }
    }
    checkCash(p);checkWinner();render();save();
  };
  const rollBtn=q('#rollBtn'); if(rollBtn) rollBtn.onclick=()=>rollDice();

  // Reset doubles streak only when the turn genuinely passes to another player.
  const legacyEnd=endTurn;
  endTurn=function(){
    const rules=ensureRules();
    const p=state.players[state.current],s=SPACES[p.pos];
    if(state.rolled&&s?.type==='property'&&state.owners[p.pos]==null){
      msg('現實規則：唔買地就必須先拍賣。');
      q('#auctionBtn')?.classList.remove('hidden');
      return;
    }
    if(rules?.extraRoll){
      msg('你擲到雙骰，必須再擲一次。');
      renderInfo();
      return;
    }
    if(rules) rules.doublesStreak=0;
    legacyEnd();
  };
  const endBtn=q('#endTurnBtn'); if(endBtn) endBtn.onclick=()=>endTurn();

  // Small rules badge in the one-screen HUD.
  if(!q('#v12RulesBadge')&&q('#gamePanel')){
    const b=document.createElement('div');b.id='v12RulesBadge';b.className='v12-rules-badge';b.textContent='CLASSIC RULES';
    q('#v8PhaseBar')?.insertAdjacentElement('afterend',b);
  }

  try{ensureRules();render();save()}catch(err){console.error('V1.2 rules init',err)}
  const st=q('#qaStatus');if(st&&!st.classList.contains('qa-bad'))st.textContent='QA：V1.2 Classic Rules 已載入';
})();