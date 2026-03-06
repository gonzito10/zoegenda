import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";

// ── Constants ──────────────────────────────────────────────────────────────
const COLORS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#FFB347","#87CEEB"];
const CATEGORIES = [
  { id:"work",     label:"Trabajo",   color:"#FF6B6B" },
  { id:"personal", label:"Personal",  color:"#4ECDC4" },
  { id:"social",   label:"Social",    color:"#FFEAA7" },
  { id:"health",   label:"Salud",     color:"#96CEB4" },
  { id:"other",    label:"Otro",      color:"#DDA0DD" },
];
const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAYS_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ── Utils ──────────────────────────────────────────────────────────────────
function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function getFirstDay(y,m)   { return new Date(y,m,1).getDay(); }
function fmt(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function parse(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
function initials(n){ return n.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2); }

function expandRecurring(ev, rangeStart, rangeEnd) {
  if (!ev.recurring) return [];
  const rStart   = parse(rangeStart);
  const rEnd     = parse(rangeEnd);
  const origin   = parse(ev.date);
  const endDate  = ev.recurringEnd ? parse(ev.recurringEnd) : new Date(rEnd.getFullYear()+2,0,1);
  const exceptions = ev.exceptions || [];
  const instances  = [];
  (ev.recurringDays || []).forEach(dow => {
    let d = new Date(origin);
    d.setDate(d.getDate() + (dow - d.getDay() + 7) % 7);
    while (d <= endDate && d <= rEnd) {
      const dateStr = fmt(d);
      if (d >= rStart && !exceptions.includes(dateStr)) {
        instances.push({ ...ev, id:`${ev.id}_${dateStr}`, date:dateStr, _recurringBase:ev.id, _virtual:true });
      }
      d = new Date(d); d.setDate(d.getDate()+7);
    }
  });
  return instances;
}

const SAMPLE_EVENTS = [
  { id:"sample1", title:"Bienvenidos a Zoegenda 🎉", date:fmt(new Date()), time:"10:00", category:"social", attendees:[], notes:"¡Invitá a tus amigos!", color:"#FFEAA7", recurring:false },
];

// ── Supabase helpers ───────────────────────────────────────────────────────
// Single table: zoegenda_store (key text PK, value jsonb)
// Rows: { key: 'users', value: [...] } and { key: 'events', value: [...] }

async function dbGet(key) {
  const { data } = await supabase.from("zoegenda_store").select("value").eq("key", key).single();
  return data?.value ?? null;
}

async function dbSet(key, value) {
  await supabase.from("zoegenda_store").upsert({ key, value });
}

// ── App ────────────────────────────────────────────────────────────────────
export default function Zoegenda() {
  const today = new Date();

  const [users,        setUsers]       = useState([]);
  const [events,       setEvents]      = useState([]);
  const [activeUserId, setActiveUserId]= useState(null);
  const [loaded,       setLoaded]      = useState(false);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [view,         setView]         = useState("calendar");
  const [filterUser,   setFilterUser]   = useState("all");
  const [filterCat,    setFilterCat]    = useState("all");
  const [showEventModal,  setShowEventModal]  = useState(false);
  const [editingEvent,    setEditingEvent]    = useState(null);
  const [showUserPanel,   setShowUserPanel]   = useState(false);
  const [deleteDialog,    setDeleteDialog]    = useState(null);

  const [screen,   setScreen]   = useState("loading");
  const [regName,  setRegName]  = useState("");
  const [regColor, setRegColor] = useState(COLORS[0]);
  const [regError, setRegError] = useState("");

  // ── Load + realtime ────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const [savedUsers, savedEvents] = await Promise.all([dbGet("users"), dbGet("events")]);
      setUsers(savedUsers || []);
      setEvents(savedEvents || SAMPLE_EVENTS);

      const uid = localStorage.getItem("zoegenda-session");
      if (uid) {
        const found = (savedUsers || []).find(u => u.id === uid);
        if (found) { setActiveUserId(uid); setScreen("app"); }
        else { localStorage.removeItem("zoegenda-session"); setScreen("welcome"); }
      } else {
        setScreen("welcome");
      }
      setLoaded(true);
    }
    init();

    // Realtime subscription
    const channel = supabase
      .channel("zoegenda-changes")
      .on("postgres_changes", { event:"*", schema:"public", table:"zoegenda_store" }, payload => {
        const { key, value } = payload.new || {};
        if (key === "users")  setUsers(value  || []);
        if (key === "events") setEvents(value || []);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ── Auth ───────────────────────────────────────────────────────
  async function register() {
    const name = regName.trim();
    if (!name)           { setRegError("Ingresá tu nombre");       return; }
    if (name.length > 20){ setRegError("Máximo 20 caracteres");    return; }
    const latest = (await dbGet("users")) || [];
    if (latest.find(u => u.name.toLowerCase() === name.toLowerCase())) {
      setRegError("Ya existe ese nombre"); return;
    }
    const newUser  = { id:`u${Date.now()}`, name, color:regColor, avatar:initials(name) };
    const newUsers = [...latest, newUser];
    await dbSet("users", newUsers);
    localStorage.setItem("zoegenda-session", newUser.id);
    setActiveUserId(newUser.id);
    setScreen("app");
    setRegError("");
  }

  async function logout() {
    localStorage.removeItem("zoegenda-session");
    setActiveUserId(null); setScreen("welcome"); setShowUserPanel(false);
  }

  async function deleteAccount() {
    const nu = users.filter(u => u.id !== activeUserId);
    const ne = events.map(ev => ({ ...ev, attendees: ev.attendees.filter(id => id !== activeUserId) }));
    await dbSet("users", nu);
    await dbSet("events", ne);
    localStorage.removeItem("zoegenda-session");
    setActiveUserId(null); setScreen("welcome"); setShowUserPanel(false);
  }

  // ── Helpers ────────────────────────────────────────────────────
  const activeUser = users.find(u => u.id === activeUserId);
  const user = id  => users.find(u => u.id === id) || { name:"?", avatar:"?", color:"#555" };
  const cat  = id  => CATEGORIES.find(c => c.id === id) || CATEGORIES[4];

  const rangeStart = fmt(new Date(currentYear, currentMonth, 1));
  const rangeEnd   = fmt(new Date(currentYear, currentMonth+1, 0));

  function filterEvs(list) {
    return list.filter(e => {
      if (filterUser !== "all" && !e.attendees.includes(filterUser)) return false;
      if (filterCat  !== "all" && e.category !== filterCat)          return false;
      return true;
    });
  }

  const monthEvents = useMemo(() => {
    const expanded = events.flatMap(ev => {
      if (ev.recurring) return expandRecurring(ev, rangeStart, rangeEnd);
      if (ev.date >= rangeStart && ev.date <= rangeEnd) return [ev];
      return [];
    });
    return filterEvs(expanded).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  // eslint-disable-next-line
  }, [events, currentMonth, currentYear, filterUser, filterCat]);

  function eventsForDate(dateStr) {
    const expanded = events.flatMap(ev => {
      if (ev.recurring) return expandRecurring(ev, dateStr, dateStr);
      return ev.date === dateStr ? [ev] : [];
    });
    return filterEvs(expanded).sort((a,b) => a.time.localeCompare(b.time));
  }

  const agendaDates       = [...new Set(monthEvents.map(e => e.date))];
  const selectedDayEvents = eventsForDate(selectedDate);

  // ── Event CRUD ─────────────────────────────────────────────────
  function openNew(date) {
    const d = date ? parse(date) : parse(selectedDate);
    setEditingEvent({ id:null, title:"", date:date||selectedDate, time:"09:00", category:"work", attendees:[activeUserId], notes:"", color:"#FF6B6B", recurring:false, recurringDays:[d.getDay()], recurringEnd:"" });
    setShowEventModal(true);
  }

  function openEdit(ev) {
    if (ev._virtual) {
      const base = events.find(e => e.id === ev._recurringBase);
      if (base) setEditingEvent({ ...base, _editingVirtualDate: ev.date });
      else      setEditingEvent({ ...ev });
    } else {
      setEditingEvent({ ...ev, recurringDays: ev.recurringDays||[], recurringEnd: ev.recurringEnd||"" });
    }
    setShowEventModal(true);
  }

  function closeModal() { setShowEventModal(false); setEditingEvent(null); }

  async function saveEvent() {
    if (!editingEvent.title.trim()) return;
    const toSave = { ...editingEvent };
    delete toSave._editingVirtualDate;
    if (!toSave.recurring) { toSave.recurringDays=[]; toSave.recurringEnd=""; }
    if (toSave.recurring && !toSave.recurringDays?.length) toSave.recurringDays=[parse(toSave.date).getDay()];
    const ne = toSave.id
      ? events.map(e => e.id === toSave.id ? toSave : e)
      : [...events, { ...toSave, id:`e${Date.now()}` }];
    await dbSet("events", ne);
    closeModal();
  }

  async function confirmDelete(id, scope, virtualDate) {
    setDeleteDialog(null);
    let ne;
    if (scope === null || scope === "all") {
      ne = events.filter(e => e.id !== id);
    } else if (scope === "one" && virtualDate) {
      ne = events.map(e => e.id !== id ? e : { ...e, exceptions:[...(e.exceptions||[]), virtualDate] });
    }
    await dbSet("events", ne);
    closeModal();
  }

  function toggleAttendee(uid) {
    setEditingEvent(ev => ({ ...ev, attendees: ev.attendees.includes(uid) ? ev.attendees.filter(x=>x!==uid) : [...ev.attendees,uid] }));
  }
  function toggleRecurringDay(dow) {
    setEditingEvent(ev => ({ ...ev, recurringDays: ev.recurringDays?.includes(dow) ? ev.recurringDays.filter(d=>d!==dow) : [...(ev.recurringDays||[]),dow] }));
  }

  function prevMonth(){ if(currentMonth===0){setCurrentMonth(11);setCurrentYear(y=>y-1);}else setCurrentMonth(m=>m-1); }
  function nextMonth(){ if(currentMonth===11){setCurrentMonth(0);setCurrentYear(y=>y+1);}else setCurrentMonth(m=>m+1); }

  // ── Styles ─────────────────────────────────────────────────────
  const inp  = { background:"#0f0f13", border:"1px solid #2a2a3a", borderRadius:10, padding:"11px 13px", color:"#e8e8f0", fontSize:13, width:"100%", fontFamily:"DM Sans,sans-serif", outline:"none" };
  const lbl  = { fontSize:10, color:"#555", fontWeight:600, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:5 };
  const FONT = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap');`;
  const Logo = ({size=20}) => <span style={{fontFamily:"Fraunces,serif",fontSize:size,fontWeight:600,color:"#fff",letterSpacing:"-0.5px"}}>Zoe<span style={{color:"#FF6B6B"}}>genda</span></span>;

  // ── Screens ────────────────────────────────────────────────────
  if (screen==="loading") return (
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{FONT}</style><Logo size={26}/>
    </div>
  );

  if (screen==="welcome") return (
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{FONT}</style>
      <div style={{maxWidth:420,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:14}}>📅</div>
        <div style={{marginBottom:20}}><Logo size={34}/></div>
        <p style={{color:"#666",fontSize:14,marginBottom:36,lineHeight:1.7}}>Organizá eventos con tu grupo.<br/>Todos ven y editan la agenda en tiempo real.</p>
        {users.length>0&&(
          <div style={{marginBottom:28,background:"#131318",border:"1px solid #1e1e2a",borderRadius:16,padding:"14px 18px"}}>
            <div style={{fontSize:10,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Ya están en la app</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,justifyContent:"center"}}>
              {users.map(u=>(
                <div key={u.id} style={{display:"flex",alignItems:"center",gap:7,background:"#0f0f13",border:"1px solid #1e1e2a",borderRadius:20,padding:"4px 11px"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff"}}>{u.avatar}</div>
                  <span style={{fontSize:12,color:"#ccc"}}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={()=>setScreen("register")} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:12,padding:"13px 20px",cursor:"pointer",fontSize:14,fontWeight:700,width:"100%",marginBottom:10,fontFamily:"DM Sans,sans-serif"}}>Crear mi perfil ✨</button>
        {users.length>0&&<button onClick={()=>setScreen("login")} style={{background:"transparent",color:"#666",border:"1px solid #2a2a3a",borderRadius:12,padding:"12px 20px",cursor:"pointer",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif"}}>Ya tengo un perfil — Entrar</button>}
      </div>
    </div>
  );

  if (screen==="login") return (
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{FONT}</style>
      <div style={{maxWidth:420,width:"100%"}}>
        <button onClick={()=>setScreen("welcome")} style={{background:"transparent",border:"none",color:"#666",cursor:"pointer",fontSize:13,marginBottom:20}}>← Volver</button>
        <h2 style={{fontFamily:"Fraunces,serif",fontSize:26,color:"#fff",marginBottom:6,fontWeight:600}}>¿Quién sos?</h2>
        <p style={{color:"#666",fontSize:13,marginBottom:22}}>Seleccioná tu perfil</p>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {users.map(u=>(
            <div key={u.id} onClick={()=>{localStorage.setItem("zoegenda-session",u.id);setActiveUserId(u.id);setScreen("app");}}
              style={{display:"flex",alignItems:"center",gap:14,background:"#131318",border:"1px solid #1e1e2a",borderRadius:14,padding:"13px 16px",cursor:"pointer"}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff"}}>{u.avatar}</div>
              <div style={{flex:1,fontSize:15,fontWeight:600,color:"#e8e8f0"}}>{u.name}</div>
              <span style={{color:"#333",fontSize:20}}>›</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:18,textAlign:"center"}}>
          <button onClick={()=>setScreen("register")} style={{background:"transparent",border:"none",color:"#FF6B6B",cursor:"pointer",fontSize:13}}>+ Crear nuevo perfil</button>
        </div>
      </div>
    </div>
  );

  if (screen==="register") return (
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{`${FONT} input:focus{border-color:#FF6B6B!important;outline:none;}`}</style>
      <div style={{maxWidth:420,width:"100%"}}>
        <button onClick={()=>setScreen("welcome")} style={{background:"transparent",border:"none",color:"#666",cursor:"pointer",fontSize:13,marginBottom:20}}>← Volver</button>
        <h2 style={{fontFamily:"Fraunces,serif",fontSize:26,color:"#fff",marginBottom:6,fontWeight:600}}>Crear perfil</h2>
        <p style={{color:"#666",fontSize:13,marginBottom:26}}>Elegí tu nombre y color</p>
        <div style={{display:"flex",justifyContent:"center",marginBottom:26}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:regColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#fff",boxShadow:`0 0 0 5px ${regColor}33`,transition:"all .3s"}}>
            {regName.trim()?initials(regName):"?"}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={lbl}>Tu nombre</label>
            <input value={regName} onChange={e=>{setRegName(e.target.value);setRegError("");}} onKeyDown={e=>e.key==="Enter"&&register()} placeholder="Ej: Laura García" maxLength={20} style={inp} autoFocus/>
            {regError&&<div style={{fontSize:12,color:"#FF6B6B",marginTop:5}}>{regError}</div>}
          </div>
          <div>
            <label style={lbl}>Tu color</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLORS.map(c=><div key={c} onClick={()=>setRegColor(c)} style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",border:regColor===c?"3px solid #fff":"3px solid transparent",boxShadow:regColor===c?`0 0 0 2px ${c}`:"none",transition:"all .15s"}}/>)}
            </div>
          </div>
          <button onClick={register} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:12,padding:"13px",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>Unirme ✨</button>
        </div>
      </div>
    </div>
  );

  // ── Main App ───────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear,currentMonth);
  const firstDay    = getFirstDay(currentYear,currentMonth);

  const EventChip = ({ev}) => (
    <div className="event-chip" onClick={e=>{e.stopPropagation();openEdit(ev);}}
      style={{fontSize:9,padding:"2px 4px",borderRadius:3,marginBottom:2,background:cat(ev.category).color+"22",color:cat(ev.category).color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:2}}>
      {ev.recurring&&<span style={{opacity:.7}}>↻</span>}{ev.time} {ev.title}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0f0f13",fontFamily:"DM Sans,'Segoe UI',sans-serif",color:"#e8e8f0",display:"flex",flexDirection:"column"}}>
      <style>{`
        ${FONT} *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
        .day-cell:hover{background:#1e1e2a!important;cursor:pointer;}
        .event-chip:hover{opacity:.8;}
        .tab-btn,.filter-pill,.nav-btn{transition:all .15s;border:none;cursor:pointer;}
        .tab-btn:hover,.nav-btn:hover{opacity:.8;}
        .agenda-event:hover{background:#1e1e2a!important;cursor:pointer;}
        .modal-overlay{animation:fadeIn .15s ease;} .modal-box{animation:slideUp .2s ease;} .panel-anim{animation:slideUp .2s ease;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
        input:focus,select:focus,textarea:focus{border-color:#FF6B6B!important;outline:none;} input,select,textarea{outline:none;}
        .dow-pill{cursor:pointer;transition:all .15s;}
      `}</style>

      {/* Header */}
      <header style={{padding:"12px 20px",borderBottom:"1px solid #1e1e2a",display:"flex",alignItems:"center",gap:12,background:"#0f0f13",position:"sticky",top:0,zIndex:10}}>
        <div style={{flex:1}}>
          <Logo size={20}/>
          <div style={{fontSize:10,color:"#555",marginTop:1}}>{MONTHS_ES[currentMonth]} {currentYear} · {users.length} integrante{users.length!==1?"s":""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center"}}>
          {users.slice(0,6).map((u,i)=>(
            <div key={u.id} title={u.name} style={{width:26,height:26,borderRadius:"50%",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",border:u.id===activeUserId?"2px solid #fff":"2px solid #0f0f13",marginLeft:i===0?0:-6,opacity:u.id===activeUserId?1:.6,zIndex:u.id===activeUserId?2:1}}>{u.avatar}</div>
          ))}
          {users.length>6&&<div style={{fontSize:10,color:"#555",marginLeft:6}}>+{users.length-6}</div>}
        </div>
        <div onClick={()=>setShowUserPanel(p=>!p)} style={{display:"flex",alignItems:"center",gap:7,background:showUserPanel?"#1e1e2a":"#131318",border:`1px solid ${showUserPanel?"#3a3a4a":"#2a2a3a"}`,borderRadius:20,padding:"5px 12px 5px 5px",cursor:"pointer"}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:activeUser?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{activeUser?.avatar}</div>
          <span style={{fontSize:12,color:"#ccc",fontWeight:500,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeUser?.name}</span>
        </div>
        <button onClick={()=>openNew(null)} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nuevo</button>
      </header>

      {/* User panel */}
      {showUserPanel&&(
        <div className="panel-anim" style={{background:"#0d0d11",borderBottom:"1px solid #1e1e2a",padding:"12px 20px",display:"flex",gap:12,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:activeUser?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{activeUser?.avatar}</div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#e8e8f0"}}>{activeUser?.name}</div>
              <div style={{fontSize:11,color:"#555",marginTop:1}}>Conectad@ a Zoegenda</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={logout} style={{background:"#1e1e2a",color:"#aaa",border:"1px solid #2a2a3a",borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:12}}>Cerrar sesión</button>
            <button onClick={()=>{if(window.confirm("¿Eliminar tu cuenta? No se puede deshacer."))deleteAccount();}} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"6px 13px",cursor:"pointer",fontSize:12}}>Eliminar cuenta</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{padding:"10px 20px 0",display:"flex",gap:4}}>
        {[["calendar","📅 Mes"],["agenda","📋 Agenda"],["day","🗓 Día"]].map(([v,label])=>(
          <button key={v} className="tab-btn" onClick={()=>setView(v)} style={{background:view===v?"#1e1e2a":"transparent",color:view===v?"#fff":"#666",padding:"6px 13px",borderRadius:8,fontSize:12,fontWeight:view===v?600:400,border:view===v?"1px solid #2a2a3a":"1px solid transparent"}}>{label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{padding:"9px 20px",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:10,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Ver:</span>
        {[["all","Todos"],...users.map(u=>[u.id,u.name])].map(([id,label])=>{
          const u=users.find(x=>x.id===id); const on=filterUser===id;
          return <div key={id} className="filter-pill" onClick={()=>setFilterUser(id)} style={{padding:"3px 10px",borderRadius:20,fontSize:11,cursor:"pointer",background:on?(u?u.color+"33":"#2a2a3a"):"transparent",color:on?(u?u.color:"#fff"):"#555",border:`1px solid ${on?"#3a3a4a":"#1e1e2a"}`}}>{label}</div>;
        })}
        <div style={{width:1,height:13,background:"#2a2a3a",margin:"0 2px"}}/>
        {CATEGORIES.map(c=>(
          <div key={c.id} className="filter-pill" onClick={()=>setFilterCat(filterCat===c.id?"all":c.id)} style={{padding:"3px 10px",borderRadius:20,fontSize:11,cursor:"pointer",background:filterCat===c.id?c.color+"33":"transparent",color:filterCat===c.id?c.color:"#555",border:`1px solid ${filterCat===c.id?c.color+"44":"#1e1e2a"}`}}>{c.label}</div>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,padding:"0 20px 24px",overflow:"auto"}}>

        {view==="calendar"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <button className="nav-btn" onClick={prevMonth} style={{background:"#1a1a22",color:"#aaa",padding:"6px 12px",borderRadius:8,fontSize:16}}>‹</button>
              <span style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff",flex:1,textAlign:"center"}}>{MONTHS_ES[currentMonth]} {currentYear}</span>
              <button className="nav-btn" onClick={nextMonth} style={{background:"#1a1a22",color:"#aaa",padding:"6px 12px",borderRadius:8,fontSize:16}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
              {DAYS_ES.map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:1,padding:"4px 0"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1;
                const dateStr=`${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const dayEvs=eventsForDate(dateStr);
                const isToday=dateStr===fmt(today); const isSelected=dateStr===selectedDate;
                return (
                  <div key={day} className="day-cell" onClick={()=>{setSelectedDate(dateStr);setView("day");}}
                    style={{minHeight:72,padding:"6px 5px",borderRadius:8,background:isSelected?"#1a1a28":"#131318",border:isSelected?"1px solid #2a2a3a":"1px solid #1a1a22",boxShadow:isToday?"inset 0 0 0 1.5px #FF6B6B55":"none"}}>
                    <div style={{fontSize:11,fontWeight:isToday?700:400,color:isToday?"#FF6B6B":"#e8e8f0",marginBottom:3,display:"flex",justifyContent:"space-between"}}>
                      {day}{dayEvs.length>0&&<span style={{fontSize:8,color:"#555"}}>{dayEvs.length}</span>}
                    </div>
                    {dayEvs.slice(0,2).map(ev=><EventChip key={ev.id} ev={ev}/>)}
                    {dayEvs.length>2&&<div style={{fontSize:8,color:"#555"}}>+{dayEvs.length-2}</div>}
                    <div onClick={e=>{e.stopPropagation();openNew(dateStr);}} style={{fontSize:10,color:"#2a2a3a",textAlign:"right",cursor:"pointer",marginTop:2}}>+</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view==="agenda"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <button className="nav-btn" onClick={prevMonth} style={{background:"#1a1a22",color:"#aaa",padding:"6px 12px",borderRadius:8,fontSize:16}}>‹</button>
              <span style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff",flex:1,textAlign:"center"}}>{MONTHS_ES[currentMonth]} {currentYear}</span>
              <button className="nav-btn" onClick={nextMonth} style={{background:"#1a1a22",color:"#aaa",padding:"6px 12px",borderRadius:8,fontSize:16}}>›</button>
            </div>
            {agendaDates.length===0&&<div style={{textAlign:"center",color:"#444",padding:"50px 0",fontSize:14}}>No hay eventos este mes<div style={{marginTop:14}}><button onClick={()=>openNew(null)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12}}>+ Crear evento</button></div></div>}
            {agendaDates.map(dateStr=>{
              const d=parse(dateStr); const isToday=dateStr===fmt(today);
              return (
                <div key={dateStr} style={{marginBottom:18}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
                    <div style={{width:34,height:34,borderRadius:8,background:isToday?"#FF6B6B":"#1a1a22",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:13,fontWeight:700,color:"#fff",lineHeight:1}}>{d.getDate()}</span>
                      <span style={{fontSize:8,color:isToday?"#ffb3b3":"#555",textTransform:"uppercase"}}>{DAYS_ES[d.getDay()]}</span>
                    </div>
                    <div style={{flex:1,height:1,background:"#1e1e2a"}}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {eventsForDate(dateStr).map(ev=>(
                      <div key={ev.id} className="agenda-event" onClick={()=>openEdit(ev)}
                        style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:10,padding:"9px 13px",display:"flex",gap:10,alignItems:"flex-start",borderLeft:`3px solid ${cat(ev.category).color}`}}>
                        <div style={{color:"#888",fontSize:11,minWidth:36,paddingTop:2,fontWeight:500}}>{ev.time}</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:13,color:"#e8e8f0",display:"flex",alignItems:"center",gap:5}}>
                            {ev.title}{ev.recurring&&<span style={{fontSize:9,background:"#2a2a3a",color:"#888",padding:"1px 5px",borderRadius:4}}>↻</span>}
                          </div>
                          {ev.notes&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{ev.notes}</div>}
                          <div style={{display:"flex",gap:5,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                            <span style={{fontSize:9,padding:"1px 7px",borderRadius:20,background:cat(ev.category).color+"22",color:cat(ev.category).color}}>{cat(ev.category).label}</span>
                            {ev.attendees.map(uid=><div key={uid} title={user(uid).name} style={{width:14,height:14,borderRadius:"50%",background:user(uid).color,fontSize:6,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{user(uid).avatar}</div>)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view==="day"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <button className="nav-btn" onClick={()=>{const d=parse(selectedDate);d.setDate(d.getDate()-1);setSelectedDate(fmt(d));}} style={{background:"#1a1a22",color:"#aaa",padding:"6px 12px",borderRadius:8,fontSize:16}}>‹</button>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontFamily:"Fraunces,serif",fontSize:18,fontWeight:600,color:"#fff"}}>{parse(selectedDate).getDate()} de {MONTHS_ES[parse(selectedDate).getMonth()]}</div>
                <div style={{fontSize:11,color:"#555"}}>{DAYS_FULL[parse(selectedDate).getDay()]}</div>
              </div>
              <button className="nav-btn" onClick={()=>{const d=parse(selectedDate);d.setDate(d.getDate()+1);setSelectedDate(fmt(d));}} style={{background:"#1a1a22",color:"#aaa",padding:"6px 12px",borderRadius:8,fontSize:16}}>›</button>
            </div>
            {selectedDayEvents.length===0&&<div style={{textAlign:"center",color:"#444",padding:"50px 0",fontSize:14}}>Sin eventos<div style={{marginTop:14}}><button onClick={()=>openNew(selectedDate)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12}}>+ Agregar evento</button></div></div>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {selectedDayEvents.map(ev=>(
                <div key={ev.id} onClick={()=>openEdit(ev)} style={{background:"#131318",borderRadius:12,padding:"13px 17px",cursor:"pointer",border:"1px solid #1e1e2a",borderLeft:`4px solid ${cat(ev.category).color}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:17,fontWeight:700,color:cat(ev.category).color,fontFamily:"Fraunces,serif"}}>{ev.time}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600,color:"#e8e8f0",display:"flex",alignItems:"center",gap:6}}>
                        {ev.title}{ev.recurring&&<span style={{fontSize:9,background:"#2a2a3a",color:"#888",padding:"1px 5px",borderRadius:4,fontWeight:400}}>↻</span>}
                      </div>
                      <div style={{fontSize:11,color:cat(ev.category).color,marginTop:1}}>{cat(ev.category).label}</div>
                    </div>
                    <div style={{display:"flex",gap:3}}>
                      {ev.attendees.map(uid=><div key={uid} title={user(uid).name} style={{width:22,height:22,borderRadius:"50%",background:user(uid).color,fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{user(uid).avatar}</div>)}
                    </div>
                  </div>
                  {ev.notes&&<div style={{fontSize:12,color:"#666",marginTop:8,paddingTop:8,borderTop:"1px solid #1e1e2a"}}>{ev.notes}</div>}
                </div>
              ))}
            </div>
            <button onClick={()=>openNew(selectedDate)} style={{marginTop:12,width:"100%",padding:"11px",borderRadius:10,background:"transparent",border:"1px dashed #2a2a3a",color:"#555",cursor:"pointer",fontSize:13}}>+ Agregar evento</button>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showEventModal&&editingEvent&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal();}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div className="modal-box" style={{background:"#131318",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:520,padding:22,border:"1px solid #2a2a3a",maxHeight:"92vh",overflow:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:18,fontWeight:600,color:"#fff"}}>{editingEvent.id?"Editar evento":"Nuevo evento"}</h2>
              <button onClick={closeModal} style={{background:"#1e1e2a",border:"none",color:"#aaa",width:28,height:28,borderRadius:"50%",cursor:"pointer",fontSize:15}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:13}}>
              <input value={editingEvent.title} onChange={e=>setEditingEvent(ev=>({...ev,title:e.target.value}))} placeholder="Título del evento" style={inp}/>
              <div style={{background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px 13px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setEditingEvent(ev=>({...ev,recurring:!ev.recurring}))}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#e8e8f0"}}>↻ Evento rutinario</div>
                    <div style={{fontSize:11,color:"#555",marginTop:2}}>Se repite semanalmente</div>
                  </div>
                  <div style={{width:38,height:22,borderRadius:11,background:editingEvent.recurring?"#FF6B6B":"#2a2a3a",position:"relative",transition:"background .2s",flexShrink:0}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:editingEvent.recurring?19:3,transition:"left .2s"}}/>
                  </div>
                </div>
                {editingEvent.recurring&&(
                  <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #1e1e2a"}}>
                    <label style={lbl}>Días de la semana</label>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                      {DAYS_ES.map((d,i)=>{
                        const on=editingEvent.recurringDays?.includes(i);
                        return <div key={i} className="dow-pill" onClick={()=>toggleRecurringDay(i)} style={{padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:on?700:400,background:on?"#FF6B6B33":"#1a1a22",color:on?"#FF6B6B":"#555",border:`1px solid ${on?"#FF6B6B44":"#2a2a3a"}`}}>{d}</div>;
                      })}
                    </div>
                    <label style={lbl}>Fecha de fin (opcional)</label>
                    <input type="date" value={editingEvent.recurringEnd||""} onChange={e=>setEditingEvent(ev=>({...ev,recurringEnd:e.target.value}))} style={{...inp,width:"auto"}}/>
                    {!editingEvent.recurringEnd&&<div style={{fontSize:10,color:"#444",marginTop:4}}>Sin fecha de fin — se repite indefinidamente</div>}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:10}}>
                <div style={{flex:1}}>
                  <label style={lbl}>{editingEvent.recurring?"Fecha de inicio":"Fecha"}</label>
                  <input type="date" value={editingEvent.date} onChange={e=>setEditingEvent(ev=>({...ev,date:e.target.value}))} style={inp}/>
                </div>
                <div style={{width:105}}>
                  <label style={lbl}>Hora</label>
                  <input type="time" value={editingEvent.time} onChange={e=>setEditingEvent(ev=>({...ev,time:e.target.value}))} style={inp}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Categoría</label>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {CATEGORIES.map(c=><div key={c.id} onClick={()=>setEditingEvent(ev=>({...ev,category:c.id,color:c.color}))} style={{padding:"5px 10px",borderRadius:20,fontSize:11,cursor:"pointer",background:editingEvent.category===c.id?c.color+"33":"#1a1a22",color:editingEvent.category===c.id?c.color:"#666",border:`1px solid ${editingEvent.category===c.id?c.color+"44":"#2a2a3a"}`,fontWeight:editingEvent.category===c.id?600:400}}>{c.label}</div>)}
                </div>
              </div>
              <div>
                <label style={lbl}>Participantes</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {users.map(u=>(
                    <div key={u.id} onClick={()=>toggleAttendee(u.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,cursor:"pointer",background:editingEvent.attendees.includes(u.id)?u.color+"22":"#1a1a22",border:`1px solid ${editingEvent.attendees.includes(u.id)?u.color+"44":"#2a2a3a"}`}}>
                      <div style={{width:15,height:15,borderRadius:"50%",background:u.color,fontSize:7,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{u.avatar}</div>
                      <span style={{fontSize:11,color:editingEvent.attendees.includes(u.id)?u.color:"#666",fontWeight:editingEvent.attendees.includes(u.id)?600:400}}>{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Notas</label>
                <textarea value={editingEvent.notes} onChange={e=>setEditingEvent(ev=>({...ev,notes:e.target.value}))} placeholder="Detalles adicionales..." rows={2} style={{...inp,resize:"none"}}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:2}}>
                {editingEvent.id&&<button onClick={()=>{if(editingEvent.recurring)setDeleteDialog({baseId:editingEvent.id,isBase:true});else confirmDelete(editingEvent.id,null,null);}} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"9px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>Eliminar</button>}
                <button onClick={saveEvent} style={{flex:1,background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"11px",cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"DM Sans,sans-serif"}}>{editingEvent.id?"Guardar cambios":"Crear evento"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteDialog&&(
        <div className="modal-overlay" style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div className="modal-box" style={{background:"#131318",borderRadius:16,padding:24,maxWidth:340,width:"100%",border:"1px solid #2a2a3a"}}>
            <h3 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff",marginBottom:8}}>Eliminar evento rutinario</h3>
            <p style={{fontSize:13,color:"#888",marginBottom:20,lineHeight:1.6}}>¿Qué querés eliminar?</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {!deleteDialog.isBase&&<button onClick={()=>confirmDelete(deleteDialog.baseId,"one",deleteDialog.virtualDate)} style={{background:"#1e1e2a",color:"#e8e8f0",border:"1px solid #2a2a3a",borderRadius:10,padding:"11px",cursor:"pointer",fontSize:13,fontWeight:500,textAlign:"left"}}>Solo esta ocurrencia</button>}
              <button onClick={()=>confirmDelete(deleteDialog.baseId,"all",null)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"11px",cursor:"pointer",fontSize:13,fontWeight:600,textAlign:"left"}}>Toda la serie</button>
              <button onClick={()=>setDeleteDialog(null)} style={{background:"transparent",color:"#666",border:"none",borderRadius:10,padding:"9px",cursor:"pointer",fontSize:13}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
