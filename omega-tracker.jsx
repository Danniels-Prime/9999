import { useState, useEffect, useRef } from "react";

const SK = "omega_v4";
const mkDef = () => ({
  streak:0,lastDate:null,totalWords:0,totalIslands:0,totalShadowMin:0,totalAnkiCards:0,
  days:{},islands:[],shadows:[],
  focus:{
    active:false,sessionMin:120,scheduleEnabled:false,
    scheduleOn:"15:00",scheduleOff:"17:00",sessionStarted:null,
    allowedApps:[
      {id:1,name:"AnkiWeb",url:"https://ankiweb.net",icon:"🃏"},
      {id:2,name:"YouTube",url:"https://youtube.com",icon:"📺"},
      {id:3,name:"TTSMaker",url:"https://ttsmaker.com",icon:"🔊"},
      {id:4,name:"ChatGPT",url:"https://chat.openai.com",icon:"🤖"},
      {id:5,name:"Quizlet",url:"https://quizlet.com",icon:"🎯"},
      {id:6,name:"Obsidian",url:"obsidian://open",icon:"🗂️"},
    ],
    blocked:["instagram.com","twitter.com","reddit.com","netflix.com","tiktok.com","facebook.com","discord.com"],
    newApp:{name:"",url:"",icon:"🔗"},
  },
});

const load=()=>{try{const r=localStorage.getItem(SK);return r?{...mkDef(),...JSON.parse(r)}:mkDef();}catch{return mkDef();}};
const persist=s=>{try{localStorage.setItem(SK,JSON.stringify(s));}catch{}};
const todayStr=()=>new Date().toISOString().split("T")[0];
const pad=n=>String(n).padStart(2,"0");
const fmtS=s=>{const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return h?`${pad(h)}:${pad(m)}:${pad(sc)}`:`${pad(m)}:${pad(sc)}`;};
const nowHHMM=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};

const C={bg:"#080810",deep:"#0d0d1a",card:"#12122b",
  violet:"#c77dff",electric:"#7b2fbe",cyan:"#00e5ff",
  gold:"#FFD700",lime:"#ccff00",rose:"#ff6b9d",
  orange:"#ff9f1c",mint:"#80ffdb",silver:"#e0e0e0",
  dim:"#666",ghost:"#333",red:"#ff2d55"};

const LAWS=[
  {id:1,title:"OPERATE",sub:"Don't Study",col:C.cyan,desc:"CIA method. High-freq words only. 6–9 months to operational fluency. Speak immediately."},
  {id:2,title:"ENVIRONMENT",sub:"Is Memory",col:C.violet,desc:"Same space = same brain state. Context-dependent recall. Your zone is your hard drive."},
  {id:3,title:"SCENT",sub:"Is The Key",col:C.rose,desc:"Olfaction bypasses thalamus. Same scent every session = direct wormhole to recall."},
  {id:4,title:"PALACE",sub:"Is Language",col:C.orange,desc:"Memory palace = embodied vocab. You are the character. Words become unforgettable."},
  {id:5,title:"IMMERSION",sub:"Is Frequency",col:C.lime,desc:"Flood every sensory channel. Paris in your nervous system. Survival-mode encoding."},
];
const METHODS=[
  {key:"anki", label:"ANKIdroid",   icon:"🃏",unit:"cards",    col:C.cyan,  hint:"Cards reviewed?"},
  {key:"words",label:"Vocab Assoc.",icon:"🔗",unit:"words",    col:C.violet,hint:"New associations?"},
  {key:"shad", label:"Shadowing",   icon:"🎙️",unit:"min",     col:C.rose,  hint:"Minutes shadowed?"},
  {key:"list", label:"Listening",   icon:"👂",unit:"min",     col:C.orange,hint:"Minutes listening?"},
  {key:"isle", label:"Island",      icon:"🏝️",unit:"sentences",col:C.lime,  hint:"Sentences written?"},
  {key:"quiz", label:"Quizlet",     icon:"🎯",unit:"min",     col:C.mint,  hint:"Minutes in Quizlet?"},
];
const CHECKS=[
  {key:"scent",label:"Scent anchor activated"},
  {key:"nb",   label:"Physical notebook open"},
  {key:"wb",   label:"Whiteboard updated"},
  {key:"tts",  label:"TTSMaker audio made"},
  {key:"gpt",  label:"ChatGPT corrections done"},
  {key:"obs",  label:"Obsidian logged"},
];
const TABS=[
  {id:"today",icon:"⚡",label:"TODAY"},
  {id:"laws", icon:"◈", label:"LAWS"},
  {id:"isle", icon:"🏝️",label:"ISLANDS"},
  {id:"shad", icon:"🎙️",label:"SHADOWS"},
  {id:"stats",icon:"📈",label:"STATS"},
  {id:"focus",icon:"🔒",label:"FOCUS"},
];
const QUOTES=["You don't study. You become.","Every scent is a door back to everything you built.","Your brain doesn't store language. It stores EXPERIENCE.","Willpower is finite. Environment is infinite.","Every shadow is your new voice finding its shape.","You are not learning a language. You are remembering who you already are."];

// ── tiny UI helpers ──────────────────────────────────────────────
function Orb({value,label,col,icon}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"14px 10px",
      background:`radial-gradient(circle at 50% 20%,${col}18,${C.deep} 70%)`,
      border:`1px solid ${col}35`,borderRadius:14,minWidth:80,overflow:"hidden",position:"relative"}}>
      <div style={{fontSize:18}}>{icon}</div>
      <div style={{fontSize:20,fontFamily:"'Bebas Neue',sans-serif",color:col,letterSpacing:1,lineHeight:1}}>
        {typeof value==="number"?value.toLocaleString():value}
      </div>
      <div style={{fontSize:8,color:C.dim,textTransform:"uppercase",letterSpacing:1,textAlign:"center"}}>{label}</div>
    </div>
  );
}
function NumIn({value,onChange,hint,unit,col}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <div style={{fontSize:8,color:C.ghost,letterSpacing:1}}>{hint}</div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <input type="number" min="0" value={value||""} placeholder="0"
          onChange={e=>onChange(parseInt(e.target.value)||0)}
          style={{width:60,padding:"6px 8px",background:C.bg,border:`1px solid ${col}40`,
            borderRadius:7,color:col,fontSize:13,fontFamily:"'Bebas Neue',sans-serif",outline:"none"}}/>
        <span style={{fontSize:9,color:C.ghost,textTransform:"uppercase"}}>{unit}</span>
      </div>
    </div>
  );
}
function Btn({children,onClick,col=C.violet,style={}}){
  return(
    <button onClick={onClick} style={{padding:"11px 16px",borderRadius:10,cursor:"pointer",
      background:`linear-gradient(135deg,${col}20,${col}08)`,
      border:`1px solid ${col}50`,color:col,
      fontSize:10,fontFamily:"'Space Mono',monospace",letterSpacing:2,
      fontWeight:700,transition:"all .2s",...style}}>
      {children}
    </button>
  );
}
function Tag({label,onRemove,col=C.rose}){
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",
      background:`${col}12`,border:`1px solid ${col}35`,borderRadius:20}}>
      <span style={{fontSize:10,color:col}}>{label}</span>
      {onRemove&&<span onClick={onRemove} style={{fontSize:10,color:col,cursor:"pointer",opacity:.6}}>✕</span>}
    </div>
  );
}

// ── Particles ─────────────────────────────────────────────────────
function Particles(){
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {Array.from({length:26}).map((_,i)=>(
        <div key={i} style={{position:"absolute",borderRadius:"50%",
          width:i%4===0?"3px":"1px",height:i%4===0?"3px":"1px",
          background:[C.violet,C.cyan,C.rose,C.lime,C.orange][i%5],
          left:`${(i*37)%100}%`,top:`${(i*53)%100}%`,opacity:.35+(i%3)*.15,
          animation:`pf ${4+(i%5)}s ease-in-out infinite`,animationDelay:`${(i*.6)%4}s`}}/>
      ))}
    </div>
  );
}

// ── FOCUS OVERLAY ─────────────────────────────────────────────────
function FocusScreen({state,setState,secsLeft,onDeactivate,toast}){
  const f=state.focus;
  const total=f.sessionMin*60;
  const pct=secsLeft!=null?Math.max(0,Math.min(100,Math.round((secsLeft/total)*100))):100;
  const r=66, circ=2*Math.PI*r;
  const done=pct===0;

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:800,
      display:"flex",flexDirection:"column",alignItems:"center",overflowY:"auto"}}>
      <Particles/>
      {toast&&<div style={{position:"fixed",bottom:30,left:"50%",transform:"translateX(-50%)",
        background:C.deep,border:`1px solid ${toast.col}50`,borderRadius:12,
        padding:"10px 22px",color:toast.col,fontSize:12,fontWeight:700,
        zIndex:9999,whiteSpace:"nowrap",animation:"tin .25s ease"}}>{toast.msg}</div>}

      <div style={{width:"100%",maxWidth:520,padding:"28px 20px 80px",
        display:"flex",flexDirection:"column",alignItems:"center",gap:28,position:"relative",zIndex:1}}>

        {/* Header */}
        <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:22,fontFamily:"'Bebas Neue',sans-serif",color:C.violet,letterSpacing:4,
              textShadow:`0 0 24px ${C.violet}80`}}>⚡ FOCUS MODE</div>
            <div style={{fontSize:8,color:C.dim,letterSpacing:2}}>DISTRACTION-FREE ZONE ACTIVE</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
            background:"#ff2d5512",border:"1px solid #ff2d5535",borderRadius:20}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.red,
              boxShadow:`0 0 8px ${C.red}`,animation:"blink 1.4s infinite"}}/>
            <span style={{fontSize:9,color:C.red,letterSpacing:2}}>LIVE</span>
          </div>
        </div>

        {/* Timer ring */}
        <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={170} height={170} style={{transform:"rotate(-90deg)"}}>
            <circle cx={85} cy={85} r={r} fill="none" stroke={`${C.violet}15`} strokeWidth={8}/>
            <circle cx={85} cy={85} r={r} fill="none"
              stroke={done?C.lime:pct>30?C.violet:C.rose}
              strokeWidth={8} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
              style={{transition:"stroke-dashoffset .8s ease,stroke .5s"}}/>
          </svg>
          <div style={{position:"absolute",textAlign:"center"}}>
            <div style={{fontSize:done?22:32,fontFamily:"'Bebas Neue',sans-serif",
              color:done?C.lime:C.silver,letterSpacing:2,lineHeight:1}}>
              {done?"DONE":secsLeft!=null?fmtS(secsLeft):"∞"}
            </div>
            <div style={{fontSize:8,color:C.dim,letterSpacing:2,marginTop:2}}>
              {done?"SESSION COMPLETE":"REMAINING"}
            </div>
            <div style={{fontSize:10,color:C.violet,marginTop:4}}>{pct}%</div>
          </div>
        </div>

        {/* DND banner */}
        <div style={{width:"100%",padding:"12px 16px",
          background:`linear-gradient(135deg,${C.rose}10,${C.orange}08)`,
          border:`1px solid ${C.rose}30`,borderRadius:12,
          display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:22}}>🔕</div>
          <div>
            <div style={{fontSize:11,color:C.rose,fontWeight:700,letterSpacing:1}}>DO NOT DISTURB</div>
            <div style={{fontSize:9,color:C.dim,marginTop:2}}>All notifications silenced · Calls blocked · Zero distractions</div>
          </div>
        </div>

        {/* Allowed apps launcher */}
        <div style={{width:"100%"}}>
          <div style={{fontSize:10,color:C.dim,letterSpacing:2,marginBottom:12,textAlign:"center"}}>
            ◈ YOUR TOOLS — TAP TO OPEN
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {f.allowedApps.map(app=>(
              <a key={app.id} href={app.url} target="_blank" rel="noreferrer"
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                  padding:"16px 8px",textDecoration:"none",
                  background:`linear-gradient(135deg,${C.violet}12,${C.card})`,
                  border:`1px solid ${C.violet}30`,borderRadius:14,
                  transition:"all .2s",cursor:"pointer"}}>
                <div style={{fontSize:28}}>{app.icon}</div>
                <div style={{fontSize:9,color:C.silver,letterSpacing:1,textAlign:"center"}}>{app.name}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Blocked sites */}
        <div style={{width:"100%",padding:"14px 16px",
          background:`${C.red}08`,border:`1px solid ${C.red}20`,borderRadius:12}}>
          <div style={{fontSize:9,color:C.red,letterSpacing:2,marginBottom:10}}>🚫 BLOCKED SITES</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {f.blocked.map((b,i)=>(
              <div key={i} style={{padding:"3px 10px",background:`${C.red}10`,
                border:`1px solid ${C.red}25`,borderRadius:20}}>
                <span style={{fontSize:9,color:`${C.red}90`}}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div style={{textAlign:"center",fontSize:10,color:C.dim,fontStyle:"italic",
          letterSpacing:.5,lineHeight:1.7,padding:"0 16px"}}>
          ∞ {QUOTES[Math.floor(Date.now()/1000)%QUOTES.length]}
        </div>

        {/* End session */}
        <button onClick={onDeactivate} style={{padding:"13px 40px",borderRadius:30,
          background:`linear-gradient(135deg,${C.red}20,${C.red}08)`,
          border:`1px solid ${C.red}50`,color:C.red,
          fontSize:11,fontFamily:"'Space Mono',monospace",letterSpacing:2,
          cursor:"pointer",fontWeight:700}}>
          END SESSION
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════════════
export default function OmegaCodex(){
  const [S,setS]=useState(load);
  const [tab,setTab]=useState("today");
  const [quote]=useState(()=>QUOTES[Math.floor(Math.random()*QUOTES.length)]);
  const [toast,setToast]=useState(null);
  const [lawOpen,setLawOpen]=useState(null);
  const [secsLeft,setSecsLeft]=useState(null);
  const [newIsle,setNewIsle]=useState({topic:"",count:"",sentence:""});
  const [newShad,setNewShad]=useState({src:"",sent:"",reps:""});
  const [newApp,setNewApp]=useState({name:"",url:"",icon:"🔗"});
  const [newBlocked,setNewBlocked]=useState("");
  const timerRef=useRef(null);

  const tday=todayStr();
  const todayData=S.days[tday]||{metrics:{},checks:{}};

  useEffect(()=>{persist(S);},[S]);

  // ── timer ──────────────────────────────────────────────────────
  useEffect(()=>{
    if(S.focus.active&&S.focus.sessionStarted){
      const tick=()=>{
        const elapsed=Math.floor((Date.now()-S.focus.sessionStarted)/1000);
        const left=Math.max(0,S.focus.sessionMin*60-elapsed);
        setSecsLeft(left);
        if(left===0){
          showToast("✅ Session complete! Unlocking.",C.lime);
          setTimeout(()=>deactivate(),2000);
        }
      };
      tick();
      timerRef.current=setInterval(tick,1000);
      return()=>clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
      setSecsLeft(null);
    }
  },[S.focus.active,S.focus.sessionStarted]);

  // ── schedule checker ───────────────────────────────────────────
  useEffect(()=>{
    if(!S.focus.scheduleEnabled) return;
    const check=()=>{
      const now=nowHHMM();
      const on=S.focus.scheduleOn, off=S.focus.scheduleOff;
      if(now===on&&!S.focus.active) activate();
      if(now===off&&S.focus.active) deactivate();
    };
    const iv=setInterval(check,30000);
    check();
    return()=>clearInterval(iv);
  },[S.focus.scheduleEnabled,S.focus.scheduleOn,S.focus.scheduleOff,S.focus.active]);

  const showToast=(msg,col=C.violet)=>{
    setToast({msg,col});
    setTimeout(()=>setToast(null),2600);
  };

  const activate=()=>{
    setS(s=>({...s,focus:{...s.focus,active:true,sessionStarted:Date.now()},lastDate:tday}));
    showToast("🔒 Focus Mode ON — get in the zone.",C.lime);
  };
  const deactivate=()=>{
    setS(s=>({...s,focus:{...s.focus,active:false,sessionStarted:null}}));
    showToast("🔓 Session ended. Well done.",C.violet);
    setSecsLeft(null);
  };

  const setFocus=(key,val)=>setS(s=>({...s,focus:{...s.focus,[key]:val}}));

  const updateMetric=(key,val)=>{
    setS(s=>{
      const day=s.days[tday]||{metrics:{},checks:{}};
      const diff=val-(day.metrics[key]||0);
      const nx={...s,days:{...s.days,[tday]:{...day,metrics:{...day.metrics,[key]:val}}},lastDate:tday};
      if(key==="words") nx.totalWords=Math.max(0,(s.totalWords||0)+diff);
      if(key==="shad")  nx.totalShadowMin=Math.max(0,(s.totalShadowMin||0)+diff);
      if(key==="anki")  nx.totalAnkiCards=Math.max(0,(s.totalAnkiCards||0)+diff);
      return nx;
    });
  };

  const toggleCheck=(key)=>{
    setS(s=>{
      const day=s.days[tday]||{metrics:{},checks:{}};
      const now=!day.checks[key];
      const allDone=CHECKS.every(c=>c.key===key?now:day.checks[c.key]);
      const nx={...s,days:{...s.days,[tday]:{...day,checks:{...day.checks,[key]:now}}},lastDate:tday};
      if(allDone&&s.lastDate!==tday){
        nx.streak=(s.streak||0)+1;
        showToast(`🔥 Day ${nx.streak} streak!`,C.lime);
      }
      return nx;
    });
  };

  const addIsland=()=>{
    if(!newIsle.topic) return;
    setS(s=>({...s,totalIslands:(s.totalIslands||0)+1,
      islands:[{...newIsle,date:tday,id:Date.now()},...s.islands]}));
    setNewIsle({topic:"",count:"",sentence:""});
    showToast("🏝️ Island claimed!",C.lime);
  };
  const addShadow=()=>{
    if(!newShad.sent) return;
    setS(s=>({...s,shadows:[{...newShad,date:tday,id:Date.now(),mastered:false},...s.shadows]}));
    setNewShad({src:"",sent:"",reps:""});
    showToast("🎙️ Shadow logged.",C.rose);
  };
  const toggleMastered=id=>setS(s=>({...s,shadows:s.shadows.map(sh=>sh.id===id?{...sh,mastered:!sh.mastered}:sh)}));

  const addApp=()=>{
    if(!newApp.name||!newApp.url) return;
    setFocus("allowedApps",[...S.focus.allowedApps,{...newApp,id:Date.now()}]);
    setNewApp({name:"",url:"",icon:"🔗"});
    showToast("✅ App added.",C.cyan);
  };
  const removeApp=id=>setFocus("allowedApps",S.focus.allowedApps.filter(a=>a.id!==id));
  const addBlocked=()=>{
    if(!newBlocked.trim()) return;
    setFocus("blocked",[...S.focus.blocked,newBlocked.trim()]);
    setNewBlocked("");
  };
  const removeBlocked=i=>setFocus("blocked",S.focus.blocked.filter((_,idx)=>idx!==i));

  const checks=CHECKS.filter(c=>todayData.checks?.[c.key]).length;
  const dayScore=(()=>{
    const m=todayData.metrics||{};
    let sc=0;
    if(m.anki>=20) sc+=20; if(m.words>=20) sc+=20;
    if(m.shad>=5)  sc+=20; if(m.isle>=15) sc+=20;
    if(checks>=4)  sc+=20;
    return sc;
  })();

  const inp=(placeholder,val,onChange,col=C.violet,type="text")=>(
    <input type={type} value={val} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
      style={{flex:1,padding:"9px 12px",background:C.bg,border:`1px solid ${col}35`,
        borderRadius:8,color:col,fontSize:11,fontFamily:"'Space Mono',monospace",outline:"none"}}/>
  );

  // ── FOCUS SCREEN OVERLAY ───────────────────────────────────────
  if(S.focus.active){
    return <FocusScreen state={S} setState={setS} secsLeft={secsLeft}
      onDeactivate={deactivate} toast={toast}/>;
  }

  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.silver,
      fontFamily:"'Space Mono','Courier New',monospace",position:"relative",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:${C.violet}30;border-radius:2px}
        @keyframes pf{0%,100%{transform:translateY(0) scale(1);opacity:.3}50%{transform:translateY(-18px) scale(1.8);opacity:.8}}
        @keyframes glow{0%,100%{text-shadow:0 0 10px ${C.violet}60}50%{text-shadow:0 0 28px ${C.violet},0 0 50px ${C.violet}40}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes tin{from{opacity:0;transform:translateX(-50%) translateY(12px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes slin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        a:hover>div{opacity:.75!important} button:active{transform:scale(.97)}
        input:focus{box-shadow:0 0 0 2px ${C.violet}30!important}
        textarea{resize:vertical;font-family:'Space Mono',monospace}
      `}</style>
      <Particles/>
      <Toast toast={toast}/>

      {/* HEADER */}
      <div style={{position:"sticky",top:0,zIndex:100,
        background:`linear-gradient(180deg,${C.bg} 0%,${C.bg}cc 100%)`,
        backdropFilter:"blur(18px)",borderBottom:`1px solid #ffffff06`,padding:"16px 20px 10px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:22,fontFamily:"'Bebas Neue',sans-serif",
              color:C.violet,letterSpacing:3,animation:"glow 3s ease-in-out infinite"}}>
              ⚡ OMEGA CODEX
            </div>
            <div style={{fontSize:8,color:C.ghost,letterSpacing:2}}>LANGUAGE ACQUISITION SYSTEM</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:28,fontFamily:"'Bebas Neue',sans-serif",color:C.lime,letterSpacing:1}}>
              🔥 {S.streak}
            </div>
            <div style={{fontSize:8,color:C.ghost,letterSpacing:1}}>DAY STREAK</div>
          </div>
        </div>
        <div style={{marginTop:7,fontSize:9,color:C.ghost,fontStyle:"italic",letterSpacing:.5,
          textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          ∞ {quote}
        </div>
      </div>

      {/* ORBS */}
      <div style={{padding:"14px 16px 0",display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>
        <Orb value={S.totalWords||0}   label="Words"       col={C.violet} icon="🔗"/>
        <Orb value={S.totalAnkiCards||0} label="Anki"      col={C.cyan}   icon="🃏"/>
        <Orb value={S.totalIslands||0} label="Islands"     col={C.lime}   icon="🏝️"/>
        <Orb value={S.totalShadowMin||0} label="Shad.min"  col={C.rose}   icon="🎙️"/>
        <Orb value={S.shadows?.filter(s=>s.mastered).length||0} label="Mastered" col={C.orange} icon="⭐"/>
      </div>

      {/* TABS */}
      <div style={{display:"flex",padding:"12px 16px",gap:5,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"7px 12px",borderRadius:20,whiteSpace:"nowrap",cursor:"pointer",
            border:tab===t.id?`1px solid ${C.violet}55`:"1px solid #ffffff0a",
            background:tab===t.id?`linear-gradient(135deg,${C.violet}18,${C.electric}12)`:"#ffffff04",
            color:tab===t.id?C.violet:C.ghost,
            fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:2,transition:"all .2s"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{padding:"0 16px 100px",animation:"slin .3s ease"}}>

        {/* ══ TODAY ══════════════════════════════════════════════ */}
        {tab==="today"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>

            {/* Score */}
            <div style={{background:`linear-gradient(135deg,${C.deep},${C.card})`,
              border:`1px solid ${C.violet}25`,borderRadius:16,padding:16,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,right:0,width:130,height:130,
                background:`radial-gradient(circle,${C.violet}12,transparent 70%)`}}/>
              <div style={{fontSize:10,color:C.ghost,letterSpacing:2,marginBottom:8}}>TODAY'S POWER LEVEL</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                <div style={{fontSize:54,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,
                  color:dayScore>=80?C.lime:dayScore>=60?C.cyan:dayScore>=40?C.violet:"#444"}}>
                  {dayScore}
                </div>
                <div style={{fontSize:14,color:C.ghost,marginBottom:10}}>/100</div>
              </div>
              <div style={{height:4,background:"#ffffff08",borderRadius:2,marginTop:6,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:2,width:`${dayScore}%`,transition:"width .6s ease",
                  background:dayScore>=80?"linear-gradient(90deg,#ccff00,#80ffdb)":
                    dayScore>=60?"linear-gradient(90deg,#00e5ff,#c77dff)":
                    "linear-gradient(90deg,#c77dff,#7b2fbe)"}}/>
              </div>
              <div style={{fontSize:9,color:C.ghost,marginTop:6}}>
                {dayScore>=80?"★ LEGENDARY":dayScore>=60?"✦ SOLID":dayScore>=40?"◈ BUILDING":"▸ GET IN THE ZONE"}
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{background:C.deep,border:`1px solid #ffffff0a`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.ghost,letterSpacing:2,marginBottom:14}}>WEAPON SYSTEM — LOG TODAY</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {METHODS.map(m=>(
                  <div key={m.key} style={{background:`linear-gradient(135deg,${m.col}08,transparent)`,
                    border:`1px solid ${m.col}22`,borderRadius:12,padding:12}}>
                    <div style={{fontSize:18,marginBottom:4}}>{m.icon}</div>
                    <div style={{fontSize:9,color:m.col,letterSpacing:1,marginBottom:8,fontWeight:700}}>{m.label}</div>
                    <NumIn value={todayData.metrics?.[m.key]} onChange={v=>updateMetric(m.key,v)}
                      hint={m.hint} unit={m.unit} col={m.col}/>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div style={{background:C.deep,border:`1px solid #ffffff0a`,borderRadius:16,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:10,color:C.ghost,letterSpacing:2}}>IGNITION CHECKLIST</div>
                <div style={{fontSize:10,color:C.lime,letterSpacing:1}}>{checks}/{CHECKS.length}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {CHECKS.map(c=>{
                  const on=todayData.checks?.[c.key];
                  return(
                    <button key={c.key} onClick={()=>toggleCheck(c.key)} style={{
                      display:"flex",alignItems:"center",gap:12,padding:"10px 12px",
                      borderRadius:10,cursor:"pointer",textAlign:"left",transition:"all .2s",
                      background:on?"#ccff0008":"#ffffff03",
                      border:`1px solid ${on?"#ccff0035":"#ffffff08"}`}}>
                      <div style={{width:18,height:18,borderRadius:4,flexShrink:0,transition:"all .2s",
                        border:`2px solid ${on?C.lime:C.ghost}`,
                        background:on?"#ccff0015":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:10,color:C.lime}}>
                        {on?"✓":""}
                      </div>
                      <span style={{fontSize:11,color:on?C.lime:C.dim,transition:"color .2s"}}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══ LAWS ═══════════════════════════════════════════════ */}
        {tab==="laws"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:9,color:C.ghost,letterSpacing:2,marginBottom:4,textAlign:"center"}}>TAP TO EXPAND</div>
            {LAWS.map(law=>(
              <div key={law.id} onClick={()=>setLawOpen(lawOpen===law.id?null:law.id)}
                style={{background:lawOpen===law.id?`linear-gradient(135deg,${law.col}12,${C.deep})`:C.deep,
                  border:`1px solid ${lawOpen===law.id?law.col+"45":"#ffffff08"}`,
                  borderRadius:14,padding:16,cursor:"pointer",transition:"all .3s"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${law.col}12`,
                      border:`1px solid ${law.col}35`,display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:14,fontFamily:"'Bebas Neue',sans-serif",color:law.col}}>
                      {law.id}
                    </div>
                    <div>
                      <div style={{fontSize:13,fontFamily:"'Bebas Neue',sans-serif",color:law.col,letterSpacing:2}}>
                        LAW {law.id} — {law.title}
                      </div>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:1}}>{law.sub}</div>
                    </div>
                  </div>
                  <div style={{color:C.ghost,fontSize:10}}>{lawOpen===law.id?"▲":"▼"}</div>
                </div>
                {lawOpen===law.id&&(
                  <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${law.col}18`,
                    fontSize:11,color:"#aaa",lineHeight:1.7,animation:"slin .2s ease"}}>
                    {law.desc}
                  </div>
                )}
              </div>
            ))}
            <div style={{background:C.deep,border:`1px solid #ffffff08`,borderRadius:14,padding:16,marginTop:6}}>
              <div style={{fontSize:10,color:C.ghost,letterSpacing:2,marginBottom:14}}>THE PROJECTION</div>
              {[{ms:"Day 17",words:"500+",st:"Core base locked",col:"#80ffdb"},
                {ms:"Month 3",words:"2,700+",st:"Ear calibrated",col:C.cyan},
                {ms:"Month 6",words:"5,400+",st:"CIA operational fluency",col:C.violet},
                {ms:"Month 12",words:"10,000+",st:"Confident & fluid",col:C.lime}
              ].map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",
                  borderBottom:i<3?`1px solid #ffffff05`:"none"}}>
                  <div style={{width:2,height:40,background:p.col,borderRadius:1,flexShrink:0}}/>
                  <div>
                    <div style={{display:"flex",gap:8,alignItems:"baseline"}}>
                      <span style={{fontSize:13,fontFamily:"'Bebas Neue',sans-serif",color:p.col,letterSpacing:1}}>{p.ms}</span>
                      <span style={{fontSize:10,color:C.gold,fontWeight:700}}>{p.words}</span>
                    </div>
                    <div style={{fontSize:9,color:C.dim}}>{p.st}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ISLANDS ════════════════════════════════════════════ */}
        {tab==="isle"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:C.deep,border:`1px solid ${C.lime}22`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.lime,letterSpacing:2,marginBottom:14}}>🏝️ LOG NEW ISLAND</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {inp("Today's topic…",newIsle.topic,v=>setNewIsle(s=>({...s,topic:v})),C.lime)}
                {inp("Sentences written (number)",newIsle.count,v=>setNewIsle(s=>({...s,count:v})),C.lime,"number")}
                <textarea value={newIsle.sentence} rows={2}
                  onChange={e=>setNewIsle(s=>({...s,sentence:e.target.value}))}
                  placeholder="Your strongest sentence today…"
                  style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.lime}25`,
                    borderRadius:8,color:"#aaa",fontSize:11,outline:"none"}}/>
                <Btn onClick={addIsland} col={C.lime}>＋ CLAIM TERRITORY</Btn>
              </div>
            </div>
            {S.islands?.length===0&&(
              <div style={{textAlign:"center",padding:40,color:C.ghost,fontSize:11}}>
                No islands yet.<br/><span style={{color:C.dim}}>Start with today's topic.</span>
              </div>
            )}
            {S.islands?.map(isle=>(
              <div key={isle.id} style={{background:C.deep,border:`1px solid ${C.lime}12`,borderRadius:12,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontSize:13,color:C.lime,fontWeight:700}}>🏝️ {isle.topic}</div>
                  <div style={{fontSize:9,color:C.ghost}}>{isle.date}</div>
                </div>
                {isle.count&&<div style={{fontSize:10,color:C.dim,marginTop:4}}>{isle.count} sentences</div>}
                {isle.sentence&&(
                  <div style={{marginTop:8,padding:"8px 10px",background:`${C.lime}06`,
                    border:`1px solid ${C.lime}12`,borderRadius:6,fontSize:10,color:"#888",
                    fontStyle:"italic",lineHeight:1.6}}>"{isle.sentence}"</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ SHADOWS ════════════════════════════════════════════ */}
        {tab==="shad"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:C.deep,border:`1px solid ${C.rose}22`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.rose,letterSpacing:2,marginBottom:14}}>🎙️ LOG NEW SHADOW</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {inp("Source (YouTube / TTSMaker…)",newShad.src,v=>setNewShad(s=>({...s,src:v})),C.rose)}
                <textarea value={newShad.sent} rows={2}
                  onChange={e=>setNewShad(s=>({...s,sent:e.target.value}))}
                  placeholder="Sentence in target language…"
                  style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.rose}25`,
                    borderRadius:8,color:C.silver,fontSize:11,outline:"none"}}/>
                {inp("Reps completed",newShad.reps,v=>setNewShad(s=>({...s,reps:v})),C.rose,"number")}
                <Btn onClick={addShadow} col={C.rose}>＋ LOG SHADOW</Btn>
              </div>
            </div>
            {S.shadows?.length>0&&(
              <div>
                <div style={{fontSize:9,color:C.ghost,letterSpacing:2,marginBottom:10}}>
                  {S.shadows.length} LOGGED · <span style={{color:C.orange}}>{S.shadows.filter(s=>s.mastered).length} MASTERED</span>
                </div>
                {S.shadows.map(sh=>(
                  <div key={sh.id} style={{background:sh.mastered?`${C.orange}08`:C.deep,
                    border:`1px solid ${sh.mastered?C.orange+"30":C.rose+"12"}`,
                    borderRadius:12,padding:14,marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <div style={{fontSize:9,color:C.rose}}>{sh.src||"–"} · {sh.reps||"?"} reps</div>
                      <div style={{fontSize:9,color:C.ghost}}>{sh.date}</div>
                    </div>
                    <div style={{fontSize:11,color:"#ccc",lineHeight:1.5,marginBottom:10}}>{sh.sent}</div>
                    <button onClick={()=>toggleMastered(sh.id)} style={{
                      padding:"5px 14px",borderRadius:20,cursor:"pointer",transition:"all .2s",
                      background:sh.mastered?`${C.orange}18`:"transparent",
                      border:`1px solid ${sh.mastered?C.orange+"45":C.ghost}`,
                      color:sh.mastered?C.orange:C.ghost,fontSize:9,
                      fontFamily:"'Space Mono',monospace",letterSpacing:1}}>
                      {sh.mastered?"★ MASTERED":"○ MARK MASTERED"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ STATS ══════════════════════════════════════════════ */}
        {tab==="stats"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:C.deep,border:`1px solid #ffffff08`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.ghost,letterSpacing:2,marginBottom:14}}>LIFETIME TOTALS</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[{label:"Words Acquired",value:S.totalWords||0,col:C.violet,icon:"🔗"},
                  {label:"Anki Cards",value:S.totalAnkiCards||0,col:C.cyan,icon:"🃏"},
                  {label:"Islands Written",value:S.totalIslands||0,col:C.lime,icon:"🏝️"},
                  {label:"Shadow Minutes",value:S.totalShadowMin||0,col:C.rose,icon:"🎙️"},
                  {label:"Sentences Logged",value:S.shadows?.length||0,col:C.orange,icon:"📝"},
                  {label:"Sentences Mastered",value:S.shadows?.filter(s=>s.mastered).length||0,col:C.mint,icon:"⭐"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"14px 12px",background:`${s.col}08`,
                    border:`1px solid ${s.col}18`,borderRadius:12}}>
                    <div style={{fontSize:18}}>{s.icon}</div>
                    <div style={{fontSize:26,fontFamily:"'Bebas Neue',sans-serif",color:s.col,marginTop:4}}>
                      {s.value.toLocaleString()}
                    </div>
                    <div style={{fontSize:9,color:C.dim}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 14-day heatmap */}
            <div style={{background:C.deep,border:`1px solid #ffffff08`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.ghost,letterSpacing:2,marginBottom:14}}>14-DAY ACTIVITY</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
                {Array.from({length:14}).map((_,i)=>{
                  const d=new Date(); d.setDate(d.getDate()-(13-i));
                  const k=d.toISOString().split("T")[0];
                  const dd=S.days[k];
                  const has=dd&&(Object.values(dd.metrics||{}).some(v=>v>0)||Object.values(dd.checks||{}).some(v=>v));
                  const chk=Object.values(dd?.checks||{}).filter(Boolean).length;
                  const intensity=has?chk/CHECKS.length:0;
                  return(
                    <div key={i} style={{aspectRatio:"1",borderRadius:5,
                      background:has?intensity>.7?C.lime:intensity>.4?C.violet:`${C.electric}55`:"#ffffff05",
                      border:k===tday?`1px solid ${C.violet}`:"1px solid transparent"}}/>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                {[["#ffffff05","none"],[`${C.electric}55`,"light"],[C.violet,"solid"],[C.lime,"legendary"]].map(([bg,lbl])=>(
                  <div key={lbl} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:9,height:9,borderRadius:2,background:bg}}/>
                    <span style={{fontSize:8,color:C.ghost}}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{textAlign:"center",paddingTop:4}}>
              <button onClick={()=>{if(confirm("Reset ALL data?"))setS(mkDef());}}
                style={{padding:"8px 20px",borderRadius:20,background:"transparent",
                  border:`1px solid ${C.red}25`,color:`${C.red}55`,fontSize:9,
                  letterSpacing:2,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>
                RESET ALL DATA
              </button>
            </div>
          </div>
        )}

        {/* ══ FOCUS ══════════════════════════════════════════════ */}
        {tab==="focus"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>

            {/* Activate card */}
            <div style={{background:`linear-gradient(135deg,${C.violet}14,${C.card})`,
              border:`1px solid ${C.violet}40`,borderRadius:18,padding:20,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:8}}>🔒</div>
              <div style={{fontSize:20,fontFamily:"'Bebas Neue',sans-serif",color:C.violet,
                letterSpacing:3,marginBottom:6}}>FOCUS MODE</div>
              <div style={{fontSize:10,color:C.dim,letterSpacing:.5,lineHeight:1.7,marginBottom:20}}>
                Activates your distraction-free zone.<br/>
                All blocked sites hidden · Allowed apps visible only.<br/>
                Timer counts down your session.
              </div>

              {/* Session duration */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:20}}>
                <div style={{fontSize:10,color:C.dim,letterSpacing:1}}>SESSION</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {[30,60,90,120,180].map(m=>(
                    <button key={m} onClick={()=>setFocus("sessionMin",m)}
                      style={{padding:"6px 10px",borderRadius:8,cursor:"pointer",
                        background:S.focus.sessionMin===m?`${C.violet}30`:"transparent",
                        border:`1px solid ${S.focus.sessionMin===m?C.violet:C.ghost}`,
                        color:S.focus.sessionMin===m?C.violet:C.ghost,
                        fontSize:9,fontFamily:"'Space Mono',monospace"}}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={activate} style={{padding:"14px 48px",borderRadius:30,cursor:"pointer",
                background:`linear-gradient(135deg,${C.violet}30,${C.electric}20)`,
                border:`1px solid ${C.violet}60`,color:C.violet,
                fontSize:13,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:4,
                boxShadow:`0 0 30px ${C.violet}25`,transition:"all .2s"}}>
                ⚡ ACTIVATE — {S.focus.sessionMin} MIN
              </button>
            </div>

            {/* Schedule */}
            <div style={{background:C.deep,border:`1px solid ${C.cyan}20`,borderRadius:16,padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:10,color:C.cyan,letterSpacing:2}}>⏰ AUTO-SCHEDULE</div>
                  <div style={{fontSize:9,color:C.dim,marginTop:2}}>Activates focus mode automatically</div>
                </div>
                <button onClick={()=>setFocus("scheduleEnabled",!S.focus.scheduleEnabled)}
                  style={{width:44,height:24,borderRadius:12,cursor:"pointer",border:"none",
                    background:S.focus.scheduleEnabled?`linear-gradient(90deg,${C.cyan},${C.teal})`:"#ffffff10",
                    position:"relative",transition:"all .3s"}}>
                  <div style={{position:"absolute",top:3,left:S.focus.scheduleEnabled?22:3,
                    width:18,height:18,borderRadius:"50%",background:"white",transition:"left .3s"}}/>
                </button>
              </div>
              {S.focus.scheduleEnabled&&(
                <div style={{display:"flex",gap:12,alignItems:"center",animation:"slin .2s ease"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:9,color:C.ghost,letterSpacing:1,marginBottom:5}}>LOCK AT</div>
                    <input type="time" value={S.focus.scheduleOn}
                      onChange={e=>setFocus("scheduleOn",e.target.value)}
                      style={{width:"100%",padding:"9px 12px",background:C.bg,
                        border:`1px solid ${C.cyan}30`,borderRadius:8,
                        color:C.cyan,fontSize:13,outline:"none",fontFamily:"'Space Mono',monospace"}}/>
                  </div>
                  <div style={{color:C.ghost,fontSize:16,marginTop:14}}>→</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:9,color:C.ghost,letterSpacing:1,marginBottom:5}}>UNLOCK AT</div>
                    <input type="time" value={S.focus.scheduleOff}
                      onChange={e=>setFocus("scheduleOff",e.target.value)}
                      style={{width:"100%",padding:"9px 12px",background:C.bg,
                        border:`1px solid ${C.cyan}30`,borderRadius:8,
                        color:C.cyan,fontSize:13,outline:"none",fontFamily:"'Space Mono',monospace"}}/>
                  </div>
                </div>
              )}
              {S.focus.scheduleEnabled&&(
                <div style={{marginTop:12,padding:"8px 12px",background:`${C.cyan}08`,
                  border:`1px solid ${C.cyan}15`,borderRadius:8,fontSize:9,color:C.dim}}>
                  🕐 Focus locks at {S.focus.scheduleOn} · Unlocks at {S.focus.scheduleOff} · Every day
                </div>
              )}
            </div>

            {/* Allowed apps */}
            <div style={{background:C.deep,border:`1px solid ${C.lime}20`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.lime,letterSpacing:2,marginBottom:14}}>
                ✅ ALLOWED APPS — VISIBLE DURING FOCUS
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                {S.focus.allowedApps.map(app=>(
                  <div key={app.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"10px 12px",background:`${C.lime}08`,border:`1px solid ${C.lime}20`,borderRadius:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>{app.icon}</span>
                      <span style={{fontSize:10,color:C.silver}}>{app.name}</span>
                    </div>
                    <span onClick={()=>removeApp(app.id)}
                      style={{fontSize:10,color:`${C.red}60`,cursor:"pointer"}}>✕</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                <input value={newApp.icon} onChange={e=>setNewApp(s=>({...s,icon:e.target.value}))}
                  placeholder="🔗" style={{width:44,padding:"8px",background:C.bg,
                    border:`1px solid ${C.lime}25`,borderRadius:8,color:C.silver,
                    fontSize:16,textAlign:"center",outline:"none"}}/>
                <input value={newApp.name} onChange={e=>setNewApp(s=>({...s,name:e.target.value}))}
                  placeholder="App name" style={{flex:1,padding:"8px 10px",background:C.bg,
                    border:`1px solid ${C.lime}25`,borderRadius:8,color:C.silver,
                    fontSize:11,fontFamily:"'Space Mono',monospace",outline:"none"}}/>
                <input value={newApp.url} onChange={e=>setNewApp(s=>({...s,url:e.target.value}))}
                  placeholder="https://…" style={{flex:2,padding:"8px 10px",background:C.bg,
                    border:`1px solid ${C.lime}25`,borderRadius:8,color:C.silver,
                    fontSize:11,fontFamily:"'Space Mono',monospace",outline:"none"}}/>
              </div>
              <Btn onClick={addApp} col={C.lime} style={{width:"100%",justifyContent:"center"}}>＋ ADD APP</Btn>
            </div>

            {/* Blocked sites */}
            <div style={{background:C.deep,border:`1px solid ${C.red}20`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.red,letterSpacing:2,marginBottom:14}}>
                🚫 BLOCKED SITES — HIDDEN DURING FOCUS
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
                {S.focus.blocked.map((b,i)=>(
                  <Tag key={i} label={b} col={C.red} onRemove={()=>removeBlocked(i)}/>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <input value={newBlocked} onChange={e=>setNewBlocked(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&addBlocked()}
                  placeholder="site.com" style={{flex:1,padding:"8px 12px",background:C.bg,
                    border:`1px solid ${C.red}25`,borderRadius:8,color:C.silver,
                    fontSize:11,fontFamily:"'Space Mono',monospace",outline:"none"}}/>
                <Btn onClick={addBlocked} col={C.red} style={{padding:"8px 16px"}}>＋</Btn>
              </div>
            </div>

            {/* How it works */}
            <div style={{background:C.deep,border:`1px solid #ffffff08`,borderRadius:16,padding:16}}>
              <div style={{fontSize:10,color:C.ghost,letterSpacing:2,marginBottom:12}}>HOW IT WORKS</div>
              {[
                {icon:"1",txt:"Hit ACTIVATE — the app enters full focus screen mode",col:C.violet},
                {icon:"2",txt:"Your allowed apps appear as a launcher — tap to open",col:C.cyan},
                {icon:"3",txt:"Blocked sites list is shown as a reminder — avoid them",col:C.rose},
                {icon:"4",txt:"Timer counts down. At zero, focus mode deactivates automatically",col:C.lime},
                {icon:"5",txt:"Enable Auto-Schedule to lock at a fixed time every day",col:C.orange},
              ].map((s,i)=>(
                <div key={i} style={{display:"flex",gap:12,padding:"9px 0",
                  borderBottom:i<4?`1px solid #ffffff05`:"none"}}>
                  <div style={{width:22,height:22,borderRadius:6,background:`${s.col}15`,
                    border:`1px solid ${s.col}30`,display:"flex",alignItems:"center",
                    justifyContent:"center",fontSize:9,color:s.col,flexShrink:0,fontWeight:700}}>
                    {s.icon}
                  </div>
                  <div style={{fontSize:10,color:C.dim,lineHeight:1.6}}>{s.txt}</div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function Toast({toast}){
  if(!toast) return null;
  return(
    <div style={{position:"fixed",bottom:76,left:"50%",transform:"translateX(-50%)",
      background:C.deep,border:`1px solid ${toast.col}50`,borderRadius:12,
      padding:"10px 22px",color:toast.col,fontSize:12,fontWeight:700,
      zIndex:9999,whiteSpace:"nowrap",boxShadow:`0 8px 32px ${toast.col}25`,
      animation:"tin .25s ease"}}>
      {toast.msg}
    </div>
  );
}

function FocusScreen({state,secsLeft,onDeactivate,toast}){
  const f=state.focus;
  const total=f.sessionMin*60;
  const pct=secsLeft!=null?Math.max(0,Math.min(100,Math.round((secsLeft/total)*100))):100;
  const r=70, circ=2*Math.PI*r;
  const done=pct===0;
  const col=done?C.lime:pct>50?C.violet:pct>25?C.orange:C.rose;

  return(
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:800,
      display:"flex",flexDirection:"column",alignItems:"center",overflowY:"auto"}}>
      <Particles/>
      <Toast toast={toast}/>
      <div style={{width:"100%",maxWidth:520,padding:"28px 20px 80px",
        display:"flex",flexDirection:"column",alignItems:"center",gap:24,position:"relative",zIndex:1}}>

        {/* header */}
        <div style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:22,fontFamily:"'Bebas Neue',sans-serif",color:C.violet,
              letterSpacing:4,textShadow:`0 0 24px ${C.violet}80`}}>⚡ FOCUS MODE</div>
            <div style={{fontSize:8,color:C.dim,letterSpacing:2}}>DISTRACTION-FREE ZONE ACTIVE</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
            background:"#ff2d5510",border:"1px solid #ff2d5530",borderRadius:20}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.red,
              boxShadow:`0 0 8px ${C.red}`,animation:"blink 1.4s infinite"}}/>
            <span style={{fontSize:9,color:C.red,letterSpacing:2}}>LIVE</span>
          </div>
        </div>

        {/* ring timer */}
        <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={180} height={180} style={{transform:"rotate(-90deg)"}}>
            <circle cx={90} cy={90} r={r} fill="none" stroke={`${col}15`} strokeWidth={9}/>
            <circle cx={90} cy={90} r={r} fill="none" stroke={col}
              strokeWidth={9} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
              style={{transition:"stroke-dashoffset .8s ease,stroke .6s"}}/>
          </svg>
          <div style={{position:"absolute",textAlign:"center"}}>
            <div style={{fontSize:done?20:34,fontFamily:"'Bebas Neue',sans-serif",
              color:done?C.lime:C.silver,letterSpacing:2,lineHeight:1}}>
              {done?"DONE":secsLeft!=null?fmtS(secsLeft):"∞"}
            </div>
            <div style={{fontSize:8,color:C.dim,letterSpacing:2,marginTop:3}}>
              {done?"SESSION COMPLETE":"REMAINING"}
            </div>
            <div style={{fontSize:12,color:col,marginTop:4,fontFamily:"'Bebas Neue',sans-serif"}}>{pct}%</div>
          </div>
        </div>

        {/* DND */}
        <div style={{width:"100%",padding:"12px 16px",
          background:`linear-gradient(135deg,${C.rose}10,${C.orange}06)`,
          border:`1px solid ${C.rose}28`,borderRadius:12,
          display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:24}}>🔕</div>
          <div>
            <div style={{fontSize:11,color:C.rose,fontWeight:700,letterSpacing:1}}>DO NOT DISTURB</div>
            <div style={{fontSize:9,color:C.dim,marginTop:2}}>Notifications silenced · Calls blocked · Zero distractions</div>
          </div>
        </div>

        {/* Allowed apps */}
        <div style={{width:"100%"}}>
          <div style={{fontSize:9,color:C.dim,letterSpacing:2,marginBottom:12,textAlign:"center"}}>
            ◈ YOUR TOOLS — CLICK TO OPEN
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {f.allowedApps.map(app=>(
              <a key={app.id} href={app.url} target="_blank" rel="noreferrer"
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                  padding:"18px 8px",textDecoration:"none",
                  background:`linear-gradient(135deg,${C.violet}12,${C.card})`,
                  border:`1px solid ${C.violet}28`,borderRadius:14,
                  transition:"all .2s",cursor:"pointer"}}>
                <div style={{fontSize:30}}>{app.icon}</div>
                <div style={{fontSize:9,color:C.silver,letterSpacing:.5,textAlign:"center"}}>{app.name}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Blocked */}
        <div style={{width:"100%",padding:"14px 16px",
          background:`${C.red}06`,border:`1px solid ${C.red}18`,borderRadius:12}}>
          <div style={{fontSize:9,color:`${C.red}90`,letterSpacing:2,marginBottom:10}}>🚫 STAY AWAY FROM</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {f.blocked.map((b,i)=>(
              <div key={i} style={{padding:"3px 10px",background:`${C.red}08`,
                border:`1px solid ${C.red}20`,borderRadius:20}}>
                <span style={{fontSize:9,color:`${C.red}80`}}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div style={{textAlign:"center",fontSize:10,color:C.dim,fontStyle:"italic",
          letterSpacing:.5,lineHeight:1.8,padding:"0 12px"}}>
          ∞ {QUOTES[Math.floor(Date.now()/60000)%QUOTES.length]}
        </div>

        {/* End session */}
        <button onClick={onDeactivate} style={{padding:"13px 44px",borderRadius:30,cursor:"pointer",
          background:`linear-gradient(135deg,${C.red}18,${C.red}06)`,
          border:`1px solid ${C.red}45`,color:C.red,
          fontSize:11,fontFamily:"'Space Mono',monospace",letterSpacing:2,fontWeight:700}}>
          ✕ END SESSION
        </button>
      </div>
    </div>
  );
}
