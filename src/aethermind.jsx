// ÆTHERMIND LUCID DREAMLAND — Russian Neural Interface
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VOCAB } from './vocab.js';

const C = {
  void:'#03010a',deep:'#080810',card:'#0e0c1a',glass:'#14102a',
  violet:'#c77dff',ultra:'#9b30ff',cyan:'#00e5ff',bio:'#00ff88',
  acid:'#aaff00',gold:'#FFD700',rose:'#ff006b',silver:'#d0d0e8',
  dim:'#44406a',ghost:'#140f20',red:'#ff0044',glitch:'#ff00ff',
  amber:'#ffaa00',indigo:'#4444ff',teal:'#00ccaa'
};

const FREQS = [
  {hz:174,name:'Liberation',desc:'Pain relief & security',color:'#8800ff'},
  {hz:285,name:'Quantum Heal',desc:'Cellular restoration',color:'#00cc88'},
  {hz:396,name:'Root Release',desc:'Guilt & fear dissolve',color:'#cc0044'},
  {hz:432,name:'Cosmic Tune',desc:'Universal harmony',color:'#0088cc'},
  {hz:528,name:'DNA Repair',desc:'Love frequency',color:'#00cc44'},
  {hz:639,name:'Connection',desc:'Heart relationships',color:'#88cc00'},
  {hz:741,name:'Awakening',desc:'Intuition & expression',color:'#00cccc'},
  {hz:852,name:'Third Eye',desc:'Spiritual order',color:'#cc0088'},
  {hz:963,name:'Crown',desc:'Divine consciousness',color:'#cccc00'},
];

const LEVELS = [
  {n:1,xp:0,title:'Cosmonaut',emoji:'🚀',color:C.dim},
  {n:2,xp:100,title:'Dreamer',emoji:'🌙',color:C.violet},
  {n:3,xp:250,title:'Seeker',emoji:'🔮',color:C.ultra},
  {n:4,xp:500,title:'Voyager',emoji:'🌌',color:C.cyan},
  {n:5,xp:900,title:'Wanderer',emoji:'✨',color:C.bio},
  {n:6,xp:1400,title:'Mystic',emoji:'🧿',color:C.acid},
  {n:7,xp:2000,title:'Oracle',emoji:'👁️',color:C.gold},
  {n:8,xp:2700,title:'Shaman',emoji:'🌀',color:C.rose},
  {n:9,xp:3500,title:'Sage',emoji:'🌊',color:C.glitch},
  {n:10,xp:4500,title:'Æther Master',emoji:'∞',color:'#ffffff'},
];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORE_KEY = 'æthermind_v1';
const DEFAULT = {
  srs:{}, xp:0, streak:0, lastStudied:null,
  settings:{wrongEffect:'burn',showPron:true,showEx:true,hzUI:true,cardLang:'ru'},
  aiKey:'', voiceRecs:{}, focusMin:25,
};

function loadState() {
  try { const d = JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); return {...DEFAULT,...d,settings:{...DEFAULT.settings,...(d.settings||{})}}; }
  catch { return {...DEFAULT}; }
}
function saveState(s) { try { localStorage.setItem(STORE_KEY,JSON.stringify(s)); } catch {} }

// ─── SRS ─────────────────────────────────────────────────────────────────────
function processAnswer(srs, cardId, answer) {
  const c = srs[cardId] || {reps:0};
  if (answer === 'again') return {...srs,[cardId]:{...c,nextReview:Date.now()+180000}};
  const interval = 900000 * Math.pow(2, c.reps);
  return {...srs,[cardId]:{reps:c.reps+1,nextReview:Date.now()+interval}};
}
function getDue(srs, max=20) {
  const now = Date.now();
  const due = VOCAB.filter(v => { const s=srs[v.id]; return !s||now>=s.nextReview; });
  return due.slice(0, max);
}
function getLvl(xp) {
  let lv = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.xp) lv = l; else break; }
  return lv;
}
function getNextLvl(xp) { return LEVELS.find(l => l.xp > xp) || LEVELS[LEVELS.length-1]; }
function calcXP(answer) { return answer === 'easy' ? 12 : 2; }

// ─── AUDIO ───────────────────────────────────────────────────────────────────
function useHz() {
  const ctx = useRef(null), oscs = useRef([]);
  const stop = useCallback(() => {
    oscs.current.forEach(o => { try{o.stop();}catch{} });
    oscs.current = [];
    if (ctx.current) { try{ctx.current.close();}catch{} ctx.current=null; }
  }, []);
  const play = useCallback((hz) => {
    stop();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = new AC(); ctx.current = c;
    const g = c.createGain(); g.gain.value = 0.18; g.connect(c.destination);
    const mkOsc = (freq, pan) => {
      const o = c.createOscillator(), p = c.createStereoPanner();
      o.type='sine'; o.frequency.value=freq; p.pan.value=pan;
      o.connect(p); p.connect(g); o.start(); return o;
    };
    oscs.current = [mkOsc(hz,-1), mkOsc(hz+4,1)];
  }, [stop]);
  useEffect(() => () => stop(), [stop]);
  return {play, stop};
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
function InjectCSS() {
  useEffect(() => {
    const id='am-css';
    let s=document.getElementById(id);
    if(!s){s=document.createElement('style');s.id=id;document.head.appendChild(s);}
    s.textContent=`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;600;700&family=Space+Mono:wght@400;700&display=swap');
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
      @keyframes nebula{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes starPulse{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:1;transform:scale(2)}}
      @keyframes glitchA{0%{clip-path:inset(0 0 100% 0);transform:translate(0,0)}20%{clip-path:inset(15% 0 70% 0);transform:translate(-5px,2px)}40%{clip-path:inset(50% 0 40% 0);transform:translate(5px,-2px)}60%{clip-path:inset(0 0 0 0);transform:translate(0,0)}80%{clip-path:inset(35% 0 55% 0);transform:translate(6px,0)}100%{clip-path:inset(0 0 0 0);transform:translate(0,0)}}
      @keyframes burnOut{0%{transform:scale(1);filter:none}25%{transform:scale(1.06) skewX(-4deg);filter:hue-rotate(180deg) brightness(3) saturate(8)}55%{transform:scale(.93) skewX(3deg);filter:hue-rotate(300deg) brightness(4)}80%{transform:scale(1.02);filter:brightness(1.5)}100%{transform:scale(1);filter:none}}
      @keyframes shakeIt{0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(10px)}45%{transform:translateX(-8px)}60%{transform:translateX(8px)}75%{transform:translateX(-4px)}90%{transform:translateX(4px)}}
      @keyframes easyFloat{0%{transform:translateY(0) scale(1);filter:none}40%{transform:translateY(-14px) scale(1.04);filter:brightness(1.6) drop-shadow(0 0 16px #00ff88)}70%{transform:translateY(-7px) scale(1.02)}100%{transform:translateY(0) scale(1);filter:none}}
      @keyframes chromab{0%,100%{text-shadow:none}33%{text-shadow:-3px 0 #ff00ff,3px 0 #00e5ff}66%{text-shadow:3px 0 #ff00ff,-3px 0 #00ff88}}
      @keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
      @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes bioGlow{0%,100%{box-shadow:0 0 8px #00ff8844,0 0 16px #00ff8822}50%{box-shadow:0 0 24px #00ff8899,0 0 48px #00ff8855}}
      @keyframes pulseRing{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}
      @keyframes spin360{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes waveBar{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
      @keyframes recPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}
      .burn{animation:burnOut .65s ease-out}
      .shake{animation:shakeIt .5s ease-out}
      .glitch-fx{animation:glitchA .4s steps(1)}
      .easy{animation:easyFloat .55s ease-out}
      .slide-up{animation:slideUp .35s cubic-bezier(.22,.68,0,1.2) both}
      .float-y{animation:floatY 4s ease-in-out infinite}
      .chromab{animation:chromab 1.5s ease-in-out infinite}
      .bio-glow{animation:bioGlow 2.5s ease-in-out infinite}
      .fade-in{animation:fadeIn .3s ease-out both}
      .rec-pulse{animation:recPulse 1s ease-in-out infinite}
      ::-webkit-scrollbar{width:3px}
      ::-webkit-scrollbar-track{background:#03010a}
      ::-webkit-scrollbar-thumb{background:#44406a;border-radius:2px}
      input[type=number]::-webkit-inner-spin-button{opacity:1}
    `;
  }, []);
  return null;
}

// ─── UI ATOMS ────────────────────────────────────────────────────────────────
function Stars({count=60,hz=null}) {
  const stars = useMemo(() => Array.from({length:count},(_,i)=>({
    id:i,x:Math.random()*100,y:Math.random()*100,
    size:Math.random()*2.5+0.5,delay:Math.random()*4,dur:Math.random()*3+2
  })),[count]);
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      {stars.map(s=>(
        <div key={s.id} style={{
          position:'absolute',left:`${s.x}%`,top:`${s.y}%`,
          width:s.size,height:s.size,borderRadius:'50%',
          background:hz?FREQS.find(f=>f.hz===hz)?.color||C.bio:C.violet,
          animation:`starPulse ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  );
}

function Nebula({hz=null}) {
  const col = hz ? FREQS.find(f=>f.hz===hz)?.color : null;
  return (
    <div style={{
      position:'absolute',inset:0,pointerEvents:'none',
      background: col
        ? `radial-gradient(ellipse at 30% 20%,${col}22 0%,transparent 60%),
           radial-gradient(ellipse at 70% 80%,${col}11 0%,transparent 60%),
           radial-gradient(ellipse at 50% 50%,#9b30ff11 0%,transparent 70%)`
        : `radial-gradient(ellipse at 30% 20%,#9b30ff22 0%,transparent 60%),
           radial-gradient(ellipse at 70% 80%,#00e5ff11 0%,transparent 60%),
           radial-gradient(ellipse at 80% 10%,#ff006b08 0%,transparent 50%)`,
      animation:'nebula 18s ease-in-out infinite',
      backgroundSize:'200% 200%',
    }}/>
  );
}

function Glass({children,style={},onClick,className=''}){
  return (
    <div onClick={onClick} className={className} style={{
      background:'rgba(14,12,26,0.7)',
      backdropFilter:'blur(16px)',
      WebkitBackdropFilter:'blur(16px)',
      border:'1px solid rgba(199,125,255,0.18)',
      borderRadius:16,
      ...style,
    }}>{children}</div>
  );
}

function Btn({children,onClick,color=C.violet,style={},disabled=false,className=''}){
  return (
    <button onClick={onClick} disabled={disabled} className={`${className}`} style={{
      background:`linear-gradient(135deg,${color}22,${color}11)`,
      border:`1px solid ${color}66`,
      borderRadius:12,padding:'12px 20px',color,
      fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:15,
      cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,
      transition:'all .2s',letterSpacing:.5,
      ...style,
    }} onMouseEnter={e=>{if(!disabled)e.target.style.background=`linear-gradient(135deg,${color}44,${color}22)`;}}
       onMouseLeave={e=>{if(!disabled)e.target.style.background=`linear-gradient(135deg,${color}22,${color}11)`;}}
       onTouchStart={e=>{if(!disabled)e.currentTarget.style.transform='scale(0.97)';}}
       onTouchEnd={e=>{e.currentTarget.style.transform='scale(1)';}}>
      {children}
    </button>
  );
}

// ─── COSMOS SCREEN ───────────────────────────────────────────────────────────
function CosmosScreen({state,nav,hz}) {
  const due = getDue(state.srs);
  const lv = getLvl(state.xp);
  const nextLv = getNextLvl(state.xp);
  const xpPct = nextLv.xp>lv.xp ? Math.round(((state.xp-lv.xp)/(nextLv.xp-lv.xp))*100) : 100;
  const reviewed = Object.keys(state.srs).length;
  const cats = [...new Set(VOCAB.map(v=>v.cat))];

  return (
    <div style={{padding:'0 16px 90px',paddingTop:60}}>
      <div style={{textAlign:'center',marginBottom:32}} className="slide-up">
        <div className="chromab" style={{
          fontFamily:"'Bebas Neue',display",fontSize:52,letterSpacing:4,
          background:`linear-gradient(135deg,${C.violet},${C.cyan})`,
          WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
          lineHeight:1,
        }}>ÆTHERMIND</div>
        <div style={{color:C.dim,fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:6,marginTop:4}}>
          LUCID DREAMLAND
        </div>
      </div>

      {hz && (
        <Glass style={{padding:'12px 16px',marginBottom:16,borderColor:`${FREQS.find(f=>f.hz===hz)?.color}55`}} className="bio-glow fade-in">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:FREQS.find(f=>f.hz===hz)?.color,animation:'recPulse 1s ease-in-out infinite'}}/>
            <span style={{color:FREQS.find(f=>f.hz===hz)?.color,fontSize:13,fontWeight:600}}>{hz}Hz — {FREQS.find(f=>f.hz===hz)?.name}</span>
          </div>
        </Glass>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <Glass style={{padding:16,textAlign:'center'}}>
          <div style={{fontSize:32,fontWeight:700,color:due.length>0?C.bio:C.dim,fontFamily:"'Bebas Neue'"}}>{due.length}</div>
          <div style={{fontSize:12,color:C.dim,marginTop:2}}>Cards Due</div>
          {due.length>0&&<Btn onClick={()=>nav('quiz')} color={C.bio} style={{width:'100%',marginTop:10,padding:'8px 0'}}>Study Now</Btn>}
        </Glass>
        <Glass style={{padding:16,textAlign:'center'}}>
          <div style={{fontSize:32,fontWeight:700,color:C.violet,fontFamily:"'Bebas Neue'"}}>{state.streak}</div>
          <div style={{fontSize:12,color:C.dim,marginTop:2}}>Day Streak 🔥</div>
          <div style={{fontSize:11,color:C.dim,marginTop:4}}>{reviewed} / {VOCAB.length} learned</div>
        </Glass>
      </div>

      <Glass style={{padding:16,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{color:lv.color,fontWeight:700,fontSize:14}}>{lv.emoji} Lv.{lv.n} — {lv.title}</span>
          <span style={{color:C.dim,fontSize:12}}>{state.xp} XP</span>
        </div>
        <div style={{height:6,background:C.ghost,borderRadius:3,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${xpPct}%`,background:`linear-gradient(90deg,${lv.color},${C.cyan})`,borderRadius:3,transition:'width .6s ease'}}/>
        </div>
        <div style={{fontSize:11,color:C.dim,marginTop:4,textAlign:'right'}}>{nextLv.n>lv.n?`${nextLv.xp-state.xp} XP to Lv.${nextLv.n}`:'MAX LEVEL'}</div>
      </Glass>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
        {[
          {label:'Frequencies',icon:'〰',screen:'freq',color:C.ultra},
          {label:'Voice Lab',icon:'🎙',screen:'voice',color:C.rose},
          {label:'Focus',icon:'◎',screen:'focus',color:C.gold},
          {label:'All Cards',icon:'⚡',screen:'cards',color:C.cyan},
          {label:'Levels',icon:'▲',screen:'levels',color:C.acid},
          {label:'Settings',icon:'⚙',screen:'settings',color:C.dim},
        ].map(btn=>(
          <Glass key={btn.screen} onClick={()=>nav(btn.screen)} style={{padding:'14px 8px',textAlign:'center',cursor:'pointer',borderColor:`${btn.color}33`}}>
            <div style={{fontSize:20}}>{btn.icon}</div>
            <div style={{fontSize:11,color:btn.color,marginTop:4,fontWeight:600}}>{btn.label}</div>
          </Glass>
        ))}
      </div>

      <Glass style={{padding:16,marginTop:16}}>
        <div style={{color:C.dim,fontSize:11,marginBottom:8,letterSpacing:2}}>CATEGORIES</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {cats.map(cat=>(
            <div key={cat} style={{
              background:`${C.ultra}22`,border:`1px solid ${C.ultra}33`,
              borderRadius:20,padding:'4px 10px',fontSize:11,color:C.violet,cursor:'pointer',
            }} onClick={()=>nav('cards')}>{cat}</div>
          ))}
        </div>
      </Glass>
    </div>
  );
}

// ─── QUIZ SCREEN ─────────────────────────────────────────────────────────────
function QuizScreen({state,setState,nav,hz}) {
  const [queue,setQueue] = useState(()=>getDue(state.srs));
  const [idx,setIdx] = useState(0);
  const [flipped,setFlipped] = useState(false);
  const [effect,setEffect] = useState('');
  const [sessionEasy,setSessionEasy] = useState(0);
  const [sessionAgain,setSessionAgain] = useState(0);
  const cardRef = useRef(null);

  const card = queue[idx];

  useEffect(()=>{
    if(queue.length===0){
      const fresh=getDue(state.srs);
      if(fresh.length>0){setQueue(fresh);setIdx(0);}
    }
  },[state.srs]);

  if(!card) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:32,gap:20}}>
      <div style={{fontSize:60}}>🌟</div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:32,color:C.bio,letterSpacing:2}}>All Caught Up!</div>
      <div style={{color:C.dim,fontSize:14,textAlign:'center'}}>Easy: {sessionEasy} · Again: {sessionAgain}</div>
      <Btn onClick={()=>nav('cosmos')} color={C.violet}>Back to Cosmos</Btn>
    </div>
  );

  const hzColor = hz ? FREQS.find(f=>f.hz===hz)?.color : null;

  const answer = async (type) => {
    if(!flipped && type==='again') { setFlipped(true); return; }
    const anim = type==='easy' ? 'easy' : (state.settings.wrongEffect==='burn'?'burn':state.settings.wrongEffect==='shake'?'shake':state.settings.wrongEffect==='glitch'?'glitch-fx':'');
    if(anim && cardRef.current){ cardRef.current.className=anim; setTimeout(()=>{if(cardRef.current)cardRef.current.className='';},700); }
    const xpGain = calcXP(type);
    const newSrs = processAnswer(state.srs, card.id, type);
    const today = new Date().toDateString();
    const newStreak = state.lastStudied===today ? state.streak : (state.lastStudied===new Date(Date.now()-86400000).toDateString()?state.streak+1:1);
    const newState = {...state, srs:newSrs, xp:state.xp+xpGain, streak:newStreak, lastStudied:today};
    setState(newState); saveState(newState);
    if(type==='easy'){setSessionEasy(e=>e+1);}else{setSessionAgain(a=>a+1);}
    setTimeout(()=>{
      setFlipped(false);
      if(idx+1<queue.length){setIdx(i=>i+1);}
      else{const fresh=getDue(newSrs);setQueue(fresh);setIdx(0);}
    },350);
  };

  const progress = queue.length>0 ? Math.round(((idx)/queue.length)*100) : 100;
  const borderCol = hzColor || C.ultra;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',padding:'16px 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
        <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer',padding:4}}>←</button>
        <div style={{flex:1,height:4,background:C.ghost,borderRadius:2,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${progress}%`,background:`linear-gradient(90deg,${borderCol},${C.cyan})`,transition:'width .3s'}}/>
        </div>
        <span style={{color:C.dim,fontSize:12,minWidth:50,textAlign:'right'}}>{idx+1}/{queue.length}</span>
      </div>

      <div style={{flex:1,display:'flex',flexDirection:'column',gap:16}}>
        <div ref={cardRef} onClick={()=>!flipped&&setFlipped(true)} style={{
          flex:1,
          background:`linear-gradient(145deg,${C.card},${C.glass})`,
          border:`1px solid ${borderCol}${hzColor?'99':'44'}`,
          borderRadius:24,padding:32,
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          cursor:'pointer',userSelect:'none',
          boxShadow:hzColor?`0 0 24px ${hzColor}33,inset 0 0 40px ${hzColor}11`:`0 0 24px ${C.ultra}22`,
          animation:'slideUp .3s ease-out both',
          minHeight:280,
        }}>
          <div style={{fontSize:11,color:C.dim,letterSpacing:3,marginBottom:20,fontFamily:"'Space Mono',monospace"}}>
            {card.cat}
          </div>
          <div style={{
            fontFamily:"'Bebas Neue'",fontSize:52,
            color:hzColor||C.violet,letterSpacing:2,textAlign:'center',lineHeight:1.1,
            textShadow:hzColor?`0 0 20px ${hzColor}88`:`0 0 20px ${C.ultra}66`,
          }}>{state.settings.cardLang==='en'?card.en:card.ru}</div>
          {state.settings.showPron&&!flipped&&state.settings.cardLang==='ru'&&(
            <div style={{color:C.dim,fontSize:14,marginTop:16,fontFamily:"'Space Mono',monospace",fontStyle:'italic'}}>{card.pr}</div>
          )}
          {!flipped && (
            <div style={{marginTop:24,color:C.dim,fontSize:12,letterSpacing:2}}>TAP TO REVEAL</div>
          )}
          {flipped && (
            <div style={{marginTop:24,width:'100%',borderTop:`1px solid ${C.dim}44`,paddingTop:20,textAlign:'center',animation:'fadeIn .3s'}}>
              <div style={{fontSize:22,color:C.silver,fontWeight:600,marginBottom:8}}>
                {state.settings.cardLang==='en'?card.ru:card.en}
              </div>
              {state.settings.showPron&&state.settings.cardLang==='ru'&&(
                <div style={{color:C.dim,fontSize:13,fontFamily:"'Space Mono',monospace",fontStyle:'italic',marginBottom:12}}>{card.pr}</div>
              )}
              {state.settings.showEx&&(
                <div style={{background:`${C.ultra}11`,borderRadius:10,padding:'10px 14px',fontSize:13}}>
                  <div style={{color:C.silver,marginBottom:4}}>{card.ex_ru}</div>
                  <div style={{color:C.dim,fontSize:12}}>{card.ex_en}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {flipped ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Btn onClick={()=>answer('again')} color={C.red} style={{padding:'18px 0',fontSize:18,letterSpacing:1,borderRadius:16,
              boxShadow:`0 4px 20px ${C.red}44`}}>
              ✗ AGAIN
            </Btn>
            <Btn onClick={()=>answer('easy')} color={C.bio} style={{padding:'18px 0',fontSize:18,letterSpacing:1,borderRadius:16,
              boxShadow:`0 4px 20px ${C.bio}44`}}>
              ✓ EASY
            </Btn>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Btn onClick={()=>answer('again')} color={C.red} style={{padding:'18px 0',fontSize:16,borderRadius:16,opacity:.7}}>✗ Again (3m)</Btn>
            <Btn onClick={()=>setFlipped(true)} color={C.bio} style={{padding:'18px 0',fontSize:16,borderRadius:16}}>Reveal →</Btn>
          </div>
        )}

        <div style={{display:'flex',justifyContent:'center',gap:24,color:C.dim,fontSize:12}}>
          <span>✓ Easy: <span style={{color:C.bio}}>{sessionEasy}</span></span>
          <span>✗ Again: <span style={{color:C.red}}>{sessionAgain}</span></span>
          <span>+{calcXP(flipped?'easy':'again')} XP next</span>
        </div>
      </div>
    </div>
  );
}

// ─── CARDS SCREEN ────────────────────────────────────────────────────────────
function CardsScreen({state,nav}) {
  const [search,setSearch] = useState('');
  const [catFilter,setCatFilter] = useState('ALL');
  const [expanded,setExpanded] = useState(null);
  const cats = ['ALL',...new Set(VOCAB.map(v=>v.cat))];
  const filtered = VOCAB.filter(v=>{
    if(catFilter!=='ALL'&&v.cat!==catFilter) return false;
    if(search&&!v.ru.toLowerCase().includes(search.toLowerCase())&&!v.en.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getSrsStatus = (id) => {
    const s = state.srs[id];
    if(!s) return {label:'New',color:C.dim};
    if(Date.now()>=s.nextReview) return {label:'Due',color:C.rose};
    const mins = Math.round((s.nextReview-Date.now())/60000);
    if(mins<60) return {label:`${mins}m`,color:C.amber};
    return {label:`${Math.round(mins/60)}h`,color:C.bio};
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'16px 16px 0',background:C.void}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
          <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer'}}>←</button>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:C.violet,letterSpacing:2}}>ALL CARDS</div>
          <span style={{marginLeft:'auto',color:C.dim,fontSize:12}}>{filtered.length}</span>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search cards..."
          style={{width:'100%',background:C.glass,border:`1px solid ${C.dim}44`,borderRadius:10,
            padding:'10px 14px',color:C.silver,fontSize:14,marginBottom:10,outline:'none',
            fontFamily:"'Outfit',sans-serif"}}/>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)} style={{
              flexShrink:0,background:catFilter===c?`${C.ultra}44`:C.glass,
              border:`1px solid ${catFilter===c?C.ultra:C.dim}44`,borderRadius:20,
              padding:'5px 12px',fontSize:11,color:catFilter===c?C.violet:C.dim,cursor:'pointer',
              fontFamily:"'Outfit',sans-serif",
            }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'8px 16px 90px'}}>
        {filtered.map(v=>{
          const st = getSrsStatus(v.id);
          return (
            <Glass key={v.id} onClick={()=>setExpanded(expanded===v.id?null:v.id)}
              style={{marginBottom:8,padding:'12px 14px',cursor:'pointer',
                borderColor:expanded===v.id?`${C.ultra}66`:`${C.dim}33`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{color:C.silver,fontSize:16,fontWeight:600}}>{v.ru}</div>
                  <div style={{color:C.dim,fontSize:13}}>{v.en}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:st.color,fontSize:11,fontWeight:600}}>{st.label}</div>
                  <div style={{fontSize:10,color:C.dim}}>{v.cat}</div>
                </div>
              </div>
              {expanded===v.id&&(
                <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.dim}33`,animation:'fadeIn .2s'}}>
                  <div style={{color:C.dim,fontSize:12,fontFamily:"'Space Mono',monospace",fontStyle:'italic',marginBottom:6}}>{v.pr}</div>
                  <div style={{background:`${C.ultra}11`,borderRadius:8,padding:'8px 10px',fontSize:12}}>
                    <div style={{color:C.silver,marginBottom:2}}>{v.ex_ru}</div>
                    <div style={{color:C.dim}}>{v.ex_en}</div>
                  </div>
                </div>
              )}
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

// ─── FREQ SCREEN ─────────────────────────────────────────────────────────────
function FreqScreen({hz,setHz,audioHook,nav}) {
  const {play,stop} = audioHook;
  const [vol,setVol] = useState(true);

  const toggle = (f) => {
    if(hz===f.hz){ stop(); setHz(null); }
    else { play(f.hz); setHz(f.hz); }
  };

  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C.ultra,letterSpacing:3}}>SOLFEGGIO FREQUENCIES</div>
      </div>
      <div style={{color:C.dim,fontSize:13,marginBottom:20,lineHeight:1.6}}>
        Binaural beats: left ear receives base Hz, right ear +4Hz. Use headphones for full effect. Active frequency transforms your entire UI.
      </div>

      <div style={{display:'grid',gap:12}}>
        {FREQS.map(f=>{
          const active = hz===f.hz;
          return (
            <div key={f.hz} onClick={()=>toggle(f)} style={{
              background:active?`linear-gradient(135deg,${f.color}33,${f.color}11)`:C.glass,
              border:`1px solid ${active?f.color+'aa':f.color+'33'}`,
              borderRadius:16,padding:'16px 20px',cursor:'pointer',
              boxShadow:active?`0 0 24px ${f.color}44,inset 0 0 30px ${f.color}11`:'none',
              transition:'all .25s',
              animation:active?'bioGlow 2.5s ease-in-out infinite':'none',
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:28,color:f.color,letterSpacing:1}}>{f.hz}</span>
                    <span style={{color:C.dim,fontSize:12,fontFamily:"'Space Mono',monospace"}}>Hz</span>
                    {active&&<div style={{width:8,height:8,borderRadius:'50%',background:f.color,animation:'recPulse 1s ease-in-out infinite'}}/>}
                  </div>
                  <div style={{color:active?C.silver:C.dim,fontSize:14,fontWeight:600}}>{f.name}</div>
                  <div style={{color:C.dim,fontSize:12}}>{f.desc}</div>
                </div>
                <div style={{
                  width:44,height:44,borderRadius:'50%',
                  background:active?f.color:'transparent',
                  border:`2px solid ${f.color}`,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:active?C.void:f.color,fontSize:18,fontWeight:700,transition:'all .25s',
                }}>{active?'■':'▶'}</div>
              </div>
              {active&&(
                <div style={{display:'flex',gap:4,marginTop:12,height:24,alignItems:'flex-end'}}>
                  {Array.from({length:16}).map((_,i)=>(
                    <div key={i} style={{
                      flex:1,background:f.color,borderRadius:2,
                      animation:`waveBar ${.3+Math.random()*.7}s ${i*.05}s ease-in-out infinite`,
                      transformOrigin:'bottom',
                    }}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hz&&(
        <Btn onClick={()=>{stop();setHz(null);}} color={C.red} style={{width:'100%',marginTop:16,padding:'14px 0'}}>
          Stop Frequency
        </Btn>
      )}
    </div>
  );
}

// ─── LEVELS SCREEN ───────────────────────────────────────────────────────────
function LevelsScreen({state,nav}) {
  const lv = getLvl(state.xp);
  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C.acid,letterSpacing:3}}>ASCENSION LEVELS</div>
      </div>

      <Glass style={{padding:20,marginBottom:20,textAlign:'center'}}>
        <div style={{fontSize:48}}>{lv.emoji}</div>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:32,color:lv.color,letterSpacing:2,marginTop:8}}>{lv.title}</div>
        <div style={{color:C.dim,fontSize:14,marginTop:4}}>Level {lv.n} · {state.xp} XP</div>
        <div style={{color:C.dim,fontSize:13,marginTop:8}}>
          {Object.keys(state.srs).length} cards mastered · {state.streak} day streak
        </div>
      </Glass>

      <div style={{display:'grid',gap:10}}>
        {LEVELS.map(l=>{
          const done = state.xp >= l.xp;
          const current = l.n === lv.n;
          return (
            <Glass key={l.n} style={{
              padding:'14px 18px',
              borderColor:current?`${l.color}88`:done?`${l.color}44`:`${C.dim}22`,
              opacity:done?1:.5,
            }}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{fontSize:28,filter:done?'none':'grayscale(1)'}}>{l.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{color:done?l.color:C.dim,fontWeight:600,fontSize:15}}>
                    Lv.{l.n} — {l.title}
                  </div>
                  <div style={{color:C.dim,fontSize:12}}>{l.xp} XP required</div>
                </div>
                {current&&<div style={{color:l.color,fontSize:12,fontWeight:700}}>CURRENT</div>}
                {done&&!current&&<div style={{color:C.bio,fontSize:16}}>✓</div>}
              </div>
            </Glass>
          );
        })}
      </div>
    </div>
  );
}

// ─── FOCUS SCREEN ────────────────────────────────────────────────────────────
function FocusScreen({state,setState,nav,hz}) {
  const [running,setRunning] = useState(false);
  const [elapsed,setElapsed] = useState(0);
  const [minutes,setMinutes] = useState(state.focusMin||25);
  const timerRef = useRef(null);
  const total = minutes * 60;
  const remaining = Math.max(0, total - elapsed);
  const pct = total>0?Math.round((elapsed/total)*100):0;
  const done = elapsed >= total && total > 0;
  const hzColor = hz ? FREQS.find(f=>f.hz===hz)?.color : C.violet;

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  useEffect(()=>{
    if(running&&!done){
      timerRef.current=setInterval(()=>setElapsed(e=>e+1),1000);
    } else { clearInterval(timerRef.current); }
    return ()=>clearInterval(timerRef.current);
  },[running,done]);

  useEffect(()=>{
    if(done){setRunning(false);}
  },[done]);

  const reset = () => { setRunning(false); setElapsed(0); };
  const saveMin = (v) => {
    const m=parseInt(v)||25;
    setMinutes(m);
    const ns={...state,focusMin:m}; setState(ns); saveState(ns);
  };

  const r = 80, circ = 2*Math.PI*r;
  const dash = circ - (pct/100)*circ;

  return (
    <div style={{padding:'16px 16px 90px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24,width:'100%'}}>
        <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C.gold,letterSpacing:3}}>FOCUS TIMER</div>
      </div>

      <div style={{position:'relative',width:200,height:200,marginBottom:32}}>
        <svg width={200} height={200} style={{transform:'rotate(-90deg)'}}>
          <circle cx={100} cy={100} r={r} fill="none" stroke={C.ghost} strokeWidth={8}/>
          <circle cx={100} cy={100} r={r} fill="none" stroke={hzColor} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
            style={{transition:'stroke-dashoffset .5s ease'}}/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:44,color:done?C.bio:hzColor,letterSpacing:2,lineHeight:1}}>
            {done ? 'DONE!' : fmt(remaining)}
          </div>
          <div style={{color:C.dim,fontSize:12,marginTop:4}}>{pct}%</div>
        </div>
      </div>

      {!running&&elapsed===0&&(
        <Glass style={{padding:'12px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
          <span style={{color:C.dim,fontSize:14}}>Minutes:</span>
          <input type="number" min={1} max={300} value={minutes}
            onChange={e=>saveMin(e.target.value)}
            style={{width:70,background:C.ghost,border:`1px solid ${C.dim}44`,borderRadius:8,
              padding:'6px 10px',color:C.silver,fontSize:16,textAlign:'center',outline:'none',
              fontFamily:"'Outfit',sans-serif"}}/>
          <div style={{display:'flex',gap:6}}>
            {[5,10,25,45].map(m=>(
              <button key={m} onClick={()=>saveMin(m)} style={{
                background:minutes===m?`${C.gold}33`:C.glass,border:`1px solid ${minutes===m?C.gold:C.dim}44`,
                borderRadius:8,padding:'5px 8px',color:minutes===m?C.gold:C.dim,
                fontSize:12,cursor:'pointer',fontFamily:"'Outfit',sans-serif",
              }}>{m}</button>
            ))}
          </div>
        </Glass>
      )}

      <div style={{display:'flex',gap:12}}>
        {!done&&(
          <Btn onClick={()=>setRunning(r=>!r)} color={running?C.amber:C.bio} style={{padding:'14px 32px',fontSize:18}}>
            {running?'⏸ Pause':'▶ Start'}
          </Btn>
        )}
        {(elapsed>0||done)&&(
          <Btn onClick={reset} color={C.dim} style={{padding:'14px 24px',fontSize:16}}>↺ Reset</Btn>
        )}
      </div>

      {done&&(
        <div style={{marginTop:20,textAlign:'center',animation:'slideUp .4s'}}>
          <div style={{fontSize:40}}>🧠</div>
          <div style={{color:C.bio,fontSize:18,fontWeight:700,marginTop:8}}>Focus session complete!</div>
          <Btn onClick={reset} color={C.violet} style={{marginTop:12,padding:'12px 28px'}}>New Session</Btn>
        </div>
      )}
    </div>
  );
}

// ─── VOICE SCREEN ────────────────────────────────────────────────────────────
function VoiceScreen({state,setState,nav}) {
  const [cardIdx,setCardIdx] = useState(0);
  const [recording,setRecording] = useState(false);
  const [hasRec,setHasRec] = useState(false);
  const [playing,setPlaying] = useState(false);
  const [status,setStatus] = useState('');
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const card = VOCAB[cardIdx];
  const recKey = card.id;
  const storedRec = state.voiceRecs?.[recKey];

  useEffect(()=>{ setHasRec(!!storedRec); setStatus(''); },[cardIdx,storedRec]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true});
      chunksRef.current=[];
      mrRef.current = new MediaRecorder(stream);
      mrRef.current.ondataavailable = e=>chunksRef.current.push(e.data);
      mrRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current,{type:'audio/webm'});
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = reader.result;
          const ns={...state,voiceRecs:{...state.voiceRecs,[recKey]:b64}};
          setState(ns); saveState(ns);
          setHasRec(true); setStatus('Recording saved!');
          setTimeout(()=>setStatus(''),2000);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t=>t.stop());
      };
      mrRef.current.start();
      setRecording(true); setStatus('Recording…');
    } catch(e){
      setStatus('Microphone access denied'); setTimeout(()=>setStatus(''),3000);
    }
  };

  const stopRec = () => {
    if(mrRef.current&&recording){ mrRef.current.stop(); setRecording(false); }
  };

  const playRec = () => {
    if(!storedRec) return;
    if(audioRef.current){ audioRef.current.pause(); audioRef.current=null; }
    const audio = new Audio(storedRec);
    audioRef.current=audio;
    audio.onplay=()=>setPlaying(true);
    audio.onended=()=>setPlaying(false);
    audio.onerror=()=>setPlaying(false);
    audio.play().catch(()=>setPlaying(false));
  };

  const deleteRec = () => {
    const nr={...state.voiceRecs}; delete nr[recKey];
    const ns={...state,voiceRecs:nr}; setState(ns); saveState(ns);
    setHasRec(false); setStatus('Deleted');
    setTimeout(()=>setStatus(''),1500);
  };

  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C.rose,letterSpacing:3}}>VOICE LAB</div>
        <span style={{marginLeft:'auto',color:C.dim,fontSize:12}}>{Object.keys(state.voiceRecs||{}).length} recs</span>
      </div>

      <div style={{color:C.dim,fontSize:13,marginBottom:20,lineHeight:1.6}}>
        Record yourself reading each phrase. Play back to check your pronunciation.
      </div>

      <Glass style={{padding:24,marginBottom:20,textAlign:'center'}}>
        <div style={{fontSize:11,color:C.dim,letterSpacing:3,marginBottom:12,fontFamily:"'Space Mono',monospace"}}>{card.cat}</div>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:44,color:C.rose,letterSpacing:2,marginBottom:8}}>{card.ru}</div>
        <div style={{color:C.dim,fontFamily:"'Space Mono',monospace",fontSize:13,fontStyle:'italic',marginBottom:6}}>{card.pr}</div>
        <div style={{color:C.silver,fontSize:15}}>{card.en}</div>
        <div style={{marginTop:12,fontSize:12,background:`${C.ultra}11`,borderRadius:8,padding:'8px 12px'}}>
          <div style={{color:C.silver}}>{card.ex_ru}</div>
          <div style={{color:C.dim,fontSize:11,marginTop:2}}>{card.ex_en}</div>
        </div>
      </Glass>

      <div style={{display:'flex',gap:10,marginBottom:16,justifyContent:'center'}}>
        <button onClick={()=>setCardIdx(i=>Math.max(0,i-1))} disabled={cardIdx===0}
          style={{background:C.glass,border:`1px solid ${C.dim}44`,borderRadius:10,padding:'10px 16px',
            color:C.dim,cursor:'pointer',fontFamily:"'Outfit',sans-serif",fontSize:14}}>← Prev</button>
        <span style={{color:C.dim,fontSize:13,padding:'10px 16px',background:C.glass,borderRadius:10,border:`1px solid ${C.dim}22`}}>
          {cardIdx+1} / {VOCAB.length}
        </span>
        <button onClick={()=>setCardIdx(i=>Math.min(VOCAB.length-1,i+1))} disabled={cardIdx===VOCAB.length-1}
          style={{background:C.glass,border:`1px solid ${C.dim}44`,borderRadius:10,padding:'10px 16px',
            color:C.dim,cursor:'pointer',fontFamily:"'Outfit',sans-serif",fontSize:14}}>Next →</button>
      </div>

      <div style={{display:'flex',gap:12,justifyContent:'center',marginBottom:16}}>
        {!recording ? (
          <Btn onClick={startRec} color={C.rose} style={{padding:'16px 28px',fontSize:16}}>🎙 Record</Btn>
        ) : (
          <Btn onClick={stopRec} color={C.red} className="rec-pulse" style={{padding:'16px 28px',fontSize:16}}>⏹ Stop</Btn>
        )}
        {hasRec&&<Btn onClick={playRec} color={C.bio} disabled={playing} style={{padding:'16px 24px',fontSize:16}}>{playing?'▶ Playing':'▶ Play'}</Btn>}
        {hasRec&&<Btn onClick={deleteRec} color={C.dim} style={{padding:'16px 16px',fontSize:16}}>🗑</Btn>}
      </div>

      {status&&<div style={{textAlign:'center',color:C.bio,fontSize:14,animation:'fadeIn .2s'}}>{status}</div>}

      {recording&&(
        <div style={{display:'flex',gap:3,justifyContent:'center',height:32,alignItems:'flex-end',marginTop:8}}>
          {Array.from({length:20}).map((_,i)=>(
            <div key={i} style={{
              width:6,background:C.rose,borderRadius:3,
              animation:`waveBar ${.2+Math.random()*.5}s ${i*.04}s ease-in-out infinite`,
              transformOrigin:'bottom',
            }}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS SCREEN ────────────────────────────────────────────────────────
function SettingsScreen({state,setState,nav}) {
  const [clearConfirm,setClearConfirm] = useState(false);
  const [aiKeyInput,setAiKeyInput] = useState(state.aiKey||'');

  const upd = (key,val) => {
    const ns={...state,settings:{...state.settings,[key]:val}};
    setState(ns); saveState(ns);
  };

  const clearAll = () => {
    if(!clearConfirm){setClearConfirm(true);setTimeout(()=>setClearConfirm(false),4000);return;}
    const ns={...DEFAULT}; setState(ns); saveState(ns); setClearConfirm(false);
  };

  const saveKey = () => {
    const ns={...state,aiKey:aiKeyInput}; setState(ns); saveState(ns);
  };

  const Row = ({label,children}) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:`1px solid ${C.dim}22`}}>
      <span style={{color:C.silver,fontSize:14}}>{label}</span>
      {children}
    </div>
  );

  const Toggle = ({val,onChange,color=C.bio}) => (
    <div onClick={()=>onChange(!val)} style={{
      width:44,height:24,borderRadius:12,background:val?color:C.ghost,
      position:'relative',cursor:'pointer',transition:'background .2s',border:`1px solid ${val?color:C.dim}44`,
    }}>
      <div style={{position:'absolute',top:2,left:val?20:2,width:18,height:18,borderRadius:'50%',
        background:val?C.void:C.dim,transition:'left .2s'}}/>
    </div>
  );

  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C.dim,letterSpacing:3}}>SETTINGS</div>
      </div>

      <Glass style={{padding:'0 16px',marginBottom:16}}>
        <Row label="Wrong answer effect">
          <select value={state.settings.wrongEffect} onChange={e=>upd('wrongEffect',e.target.value)}
            style={{background:C.glass,border:`1px solid ${C.dim}44`,borderRadius:8,padding:'6px 10px',
              color:C.silver,fontSize:13,outline:'none',fontFamily:"'Outfit',sans-serif"}}>
            <option value="burn">🔥 Burn</option>
            <option value="shake">💥 Shake</option>
            <option value="glitch">👾 Glitch</option>
            <option value="none">None</option>
          </select>
        </Row>
        <Row label="Show pronunciation">
          <Toggle val={state.settings.showPron} onChange={v=>upd('showPron',v)}/>
        </Row>
        <Row label="Show examples">
          <Toggle val={state.settings.showEx} onChange={v=>upd('showEx',v)}/>
        </Row>
        <Row label="Hz effects on UI">
          <Toggle val={state.settings.hzUI!==false} onChange={v=>upd('hzUI',v)}/>
        </Row>
        <Row label="Card front language">
          <select value={state.settings.cardLang||'ru'} onChange={e=>upd('cardLang',e.target.value)}
            style={{background:C.glass,border:`1px solid ${C.dim}44`,borderRadius:8,padding:'6px 10px',
              color:C.silver,fontSize:13,outline:'none',fontFamily:"'Outfit',sans-serif"}}>
            <option value="ru">Russian → English</option>
            <option value="en">English → Russian</option>
          </select>
        </Row>
      </Glass>

      <Glass style={{padding:16,marginBottom:16}}>
        <div style={{color:C.dim,fontSize:11,letterSpacing:2,marginBottom:12}}>STATS</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            ['Cards Learned',Object.keys(state.srs).length],
            ['Total Cards',VOCAB.length],
            ['Total XP',state.xp],
            ['Day Streak',state.streak],
          ].map(([l,v])=>(
            <div key={l} style={{textAlign:'center',padding:10,background:C.ghost,borderRadius:8}}>
              <div style={{color:C.violet,fontSize:20,fontWeight:700}}>{v}</div>
              <div style={{color:C.dim,fontSize:11,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </Glass>

      <Btn onClick={clearAll} color={clearConfirm?C.red:C.dim} style={{width:'100%',padding:'14px 0',marginBottom:16}}>
        {clearConfirm?'⚠️ Tap again to confirm clear':'Clear All Data'}
      </Btn>

      <div style={{color:C.dim,fontSize:11,textAlign:'center',fontFamily:"'Space Mono',monospace"}}>
        ÆTHERMIND v1.0 · {VOCAB.length} cards · 9 frequencies
      </div>
    </div>
  );
}

// ─── AI SCREEN ───────────────────────────────────────────────────────────────
function AIScreen({state,setState,nav}) {
  const [key,setKey] = useState(state.aiKey||'');
  const [prompt,setPrompt] = useState('');
  const [result,setResult] = useState('');
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');
  const [keySaved,setKeySaved] = useState(!!state.aiKey);

  const saveKey = () => {
    const ns={...state,aiKey:key}; setState(ns); saveState(ns);
    setKeySaved(true); setTimeout(()=>setKeySaved(false),2000);
  };

  const send = async () => {
    if(!state.aiKey){setErr('Add your Claude API key first.');return;}
    if(!prompt.trim()) return;
    setLoading(true); setErr(''); setResult('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':state.aiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
        body:JSON.stringify({
          model:'claude-haiku-4-5-20251001',max_tokens:512,
          system:'You are a Russian language tutor. Give concise, helpful answers. Include Russian examples with transliterations.',
          messages:[{role:'user',content:prompt}],
        }),
      });
      if(!res.ok){const e=await res.json();throw new Error(e.error?.message||'API error');}
      const data=await res.json();
      setResult(data.content?.[0]?.text||'No response');
    } catch(e){setErr(e.message);}
    finally{setLoading(false);}
  };

  const SUGGESTIONS = [
    'Explain the difference between ты and вы',
    'Give me 5 sentences using the word пожалуйста',
    'How do Russian verb aspects work?',
    'What are common Russian filler words?',
    'Generate a short dialogue at a café in Russian',
  ];

  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>nav('cosmos')} style={{background:'none',border:'none',color:C.dim,fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:C.cyan,letterSpacing:3}}>AI TUTOR</div>
      </div>

      <Glass style={{padding:16,marginBottom:16}}>
        <div style={{color:C.dim,fontSize:11,letterSpacing:2,marginBottom:8}}>CLAUDE API KEY</div>
        <div style={{display:'flex',gap:8}}>
          <input type="password" value={key} onChange={e=>setKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{flex:1,background:C.ghost,border:`1px solid ${C.dim}44`,borderRadius:8,
              padding:'10px 12px',color:C.silver,fontSize:13,outline:'none',fontFamily:"'Space Mono',monospace"}}/>
          <Btn onClick={saveKey} color={keySaved?C.bio:C.cyan} style={{padding:'10px 16px',fontSize:13}}>
            {keySaved?'Saved!':'Save'}
          </Btn>
        </div>
        <div style={{color:C.dim,fontSize:11,marginTop:8}}>
          Key stored locally only. Get yours at console.anthropic.com
        </div>
      </Glass>

      <div style={{marginBottom:12}}>
        <div style={{color:C.dim,fontSize:11,letterSpacing:2,marginBottom:8}}>QUICK PROMPTS</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {SUGGESTIONS.map(s=>(
            <div key={s} onClick={()=>setPrompt(s)} style={{
              background:C.glass,border:`1px solid ${C.dim}22`,borderRadius:8,
              padding:'8px 12px',fontSize:13,color:C.dim,cursor:'pointer',
            }}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{position:'relative',marginBottom:12}}>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
          placeholder="Ask about Russian grammar, vocabulary, culture..."
          rows={3}
          style={{width:'100%',background:C.glass,border:`1px solid ${C.dim}44`,borderRadius:10,
            padding:'10px 12px',color:C.silver,fontSize:14,outline:'none',resize:'none',
            fontFamily:"'Outfit',sans-serif",boxSizing:'border-box'}}/>
      </div>
      <Btn onClick={send} disabled={loading||!prompt.trim()} color={C.cyan}
        style={{width:'100%',padding:'14px 0',marginBottom:16,fontSize:16}}>
        {loading?'Thinking…':'Ask Claude →'}
      </Btn>

      {err&&<div style={{color:C.red,fontSize:13,marginBottom:12,padding:'10px 12px',background:`${C.red}11`,borderRadius:8}}>{err}</div>}

      {result&&(
        <Glass style={{padding:16,animation:'slideUp .3s'}}>
          <div style={{color:C.dim,fontSize:11,letterSpacing:2,marginBottom:8}}>RESPONSE</div>
          <div style={{color:C.silver,fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{result}</div>
        </Glass>
      )}
    </div>
  );
}

// ─── BOTTOM NAV ──────────────────────────────────────────────────────────────
function BottomNav({screen,nav,hz,dueCount}) {
  const tabs = [
    {id:'cosmos',icon:'◈',label:'Home'},
    {id:'quiz',icon:'⚡',label:`Quiz${dueCount?` (${dueCount})`:''}`},
    {id:'freq',icon:'〰',label:hz?`${hz}Hz`:'Freq'},
    {id:'ai',icon:'∞',label:'AI'},
    {id:'settings',icon:'⚙',label:'More'},
  ];
  return (
    <div style={{
      position:'fixed',bottom:0,left:0,right:0,height:70,
      background:'rgba(3,1,10,0.92)',backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)',
      borderTop:`1px solid ${C.dim}33`,
      display:'flex',alignItems:'center',justifyContent:'space-around',
      zIndex:100,paddingBottom:'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(t=>{
        const active=screen===t.id;
        const col=active?(t.id==='freq'&&hz?FREQS.find(f=>f.hz===hz)?.color||C.violet:C.violet):C.dim;
        return (
          <div key={t.id} onClick={()=>nav(t.id)} style={{
            display:'flex',flexDirection:'column',alignItems:'center',gap:3,
            cursor:'pointer',padding:'6px 12px',minWidth:56,
          }}>
            <div style={{fontSize:t.id==='quiz'&&dueCount?20:18,color:col,transition:'color .2s',
              animation:active&&t.id==='freq'&&hz?'bioGlow 2.5s ease-in-out infinite':undefined}}>{t.icon}</div>
            <div style={{fontSize:10,color:col,transition:'color .2s',fontFamily:"'Space Mono',monospace",letterSpacing:.5}}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────
export default function AethermindApp() {
  const [state,setStateRaw] = useState(loadState);
  const [screen,setScreen] = useState('cosmos');
  const [hz,setHz] = useState(null);
  const audioHook = useHz();

  const setState = useCallback((s) => { setStateRaw(s); saveState(s); }, []);

  const nav = useCallback((s) => setScreen(s), []);
  const dueCount = useMemo(()=>getDue(state.srs).length,[state.srs]);
  const hzColor = hz ? FREQS.find(f=>f.hz===hz)?.color : null;

  const bgStyle = {
    position:'fixed',inset:0,overflowY:'auto',
    background: hzColor&&state.settings.hzUI!==false
      ? `radial-gradient(ellipse at 50% 0%,${hzColor}18 0%,${C.void} 60%)`
      : C.void,
    transition:'background 1s ease',
    fontFamily:"'Outfit',sans-serif",color:C.silver,
    minHeight:'100%',
  };

  const screens = {
    cosmos: <CosmosScreen state={state} nav={nav} hz={hz}/>,
    quiz:   <QuizScreen state={state} setState={setState} nav={nav} hz={hz}/>,
    cards:  <CardsScreen state={state} nav={nav}/>,
    freq:   <FreqScreen hz={hz} setHz={setHz} audioHook={audioHook} nav={nav}/>,
    levels: <LevelsScreen state={state} nav={nav}/>,
    focus:  <FocusScreen state={state} setState={setState} nav={nav} hz={hz}/>,
    voice:  <VoiceScreen state={state} setState={setState} nav={nav}/>,
    settings:<SettingsScreen state={state} setState={setState} nav={nav}/>,
    ai:     <AIScreen state={state} setState={setState} nav={nav}/>,
  };

  return (
    <div style={bgStyle}>
      <InjectCSS/>
      <Stars count={50} hz={hz}/>
      <Nebula hz={hz}/>
      <div style={{position:'relative',zIndex:1}}>
        {screens[screen] || screens.cosmos}
      </div>
      <BottomNav screen={screen} nav={nav} hz={hz} dueCount={dueCount}/>
    </div>
  );
}
