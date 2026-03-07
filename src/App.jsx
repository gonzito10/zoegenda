import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";

// ── Constants ──────────────────────────────────────────────────────────────
const COLORS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#FFB347","#87CEEB"];

// Each theme: bg color, surface, border, text color, and an SVG pattern for the background
const THEMES = [
  {
    id:"default", label:"Oscuro", emoji:"🌑",
    bg:"#0f0f13", surface:"#131318", border:"#1e1e2a", text:"#e8e8f0",
    pattern:null
  },
  {
    id:"kids", label:"Infantil", emoji:"🎈",
    bg:"#1a0a2e", surface:"#2a1a3e", border:"#3a2a4e", text:"#ffe8ff",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><circle cx='20' cy='20' r='8' fill='%23ff6b9d22'/><circle cx='60' cy='10' r='5' fill='%23ffd93d22'/><circle cx='100' cy='25' r='7' fill='%236bcbff22'/><circle cx='10' cy='60' r='6' fill='%23a8ff7822'/><circle cx='50' cy='55' r='10' fill='%23ff6b9d18'/><circle cx='90' cy='50' r='5' fill='%23ffd93d22'/><circle cx='30' cy='90' r='7' fill='%236bcbff22'/><circle cx='70' cy='85' r='9' fill='%23ff6b9d18'/><circle cx='110' cy='75' r='6' fill='%23a8ff7822'/><text x='15' y='45' font-size='12' opacity='.15'>⭐</text><text x='55' y='100' font-size='10' opacity='.15'>🌙</text><text x='95' y='110' font-size='11' opacity='.12'>✨</text></svg>`
  },
  {
    id:"literary", label:"Literario", emoji:"📚",
    bg:"#1a1510", surface:"#251e16", border:"#35291e", text:"#f0e6d0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><line x1='0' y1='10' x2='80' y2='10' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='20' x2='80' y2='20' stroke='%23c8a96e12' stroke-width='1'/><line x1='0' y1='30' x2='80' y2='30' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='40' x2='80' y2='40' stroke='%23c8a96e12' stroke-width='1'/><line x1='0' y1='50' x2='80' y2='50' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='60' x2='80' y2='60' stroke='%23c8a96e12' stroke-width='1'/><line x1='0' y1='70' x2='80' y2='70' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='80' x2='80' y2='80' stroke='%23c8a96e12' stroke-width='1'/><line x1='20' y1='0' x2='20' y2='80' stroke='%23c8a96e08' stroke-width='1'/></svg>`
  },
  {
    id:"countryside", label:"Campestre", emoji:"🌾",
    bg:"#0f1a08", surface:"#162610", border:"#253d18", text:"#e8f5d0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><path d='M10 80 Q15 60 20 80' stroke='%2378a83a25' stroke-width='2' fill='none'/><path d='M25 75 Q30 50 35 75' stroke='%2378a83a20' stroke-width='2' fill='none'/><path d='M50 85 Q55 55 60 85' stroke='%2378a83a25' stroke-width='2' fill='none'/><path d='M70 78 Q75 58 80 78' stroke='%2378a83a20' stroke-width='2' fill='none'/><path d='M85 82 Q90 65 95 82' stroke='%2378a83a22' stroke-width='2' fill='none'/><circle cx='30' cy='20' r='12' fill='%2378a83a10'/><circle cx='70' cy='30' r='8' fill='%2378a83a10'/><circle cx='15' cy='35' r='6' fill='%2378a83a08'/></svg>`
  },
  {
    id:"ocean", label:"Marino", emoji:"🌊",
    bg:"#050e1a", surface:"#0a1828", border:"#102030", text:"#d0f0ff",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60'><path d='M0 30 Q25 10 50 30 Q75 50 100 30 Q125 10 150 30 Q175 50 200 30' stroke='%231a6fa830' stroke-width='2' fill='none'/><path d='M0 45 Q25 25 50 45 Q75 65 100 45 Q125 25 150 45 Q175 65 200 45' stroke='%231a6fa820' stroke-width='1.5' fill='none'/><path d='M0 15 Q25 0 50 15 Q75 30 100 15 Q125 0 150 15 Q175 30 200 15' stroke='%231a6fa818' stroke-width='1' fill='none'/></svg>`
  },
  {
    id:"cosmos", label:"Cosmos", emoji:"🔭",
    bg:"#02020f", surface:"#07071a", border:"#0f0f28", text:"#e0e8ff",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><circle cx='15' cy='20' r='1' fill='%23ffffff60'/><circle cx='45' cy='8' r='1.5' fill='%23ffffff40'/><circle cx='80' cy='15' r='1' fill='%23ffffff55'/><circle cx='120' cy='5' r='1' fill='%23ffffff50'/><circle cx='140' cy='25' r='1.5' fill='%23ffffff35'/><circle cx='5' cy='50' r='1' fill='%23ffffff45'/><circle cx='35' cy='45' r='2' fill='%23ffffff30'/><circle cx='65' cy='55' r='1' fill='%23ffffff55'/><circle cx='100' cy='40' r='1.5' fill='%23ffffff40'/><circle cx='130' cy='60' r='1' fill='%23ffffff50'/><circle cx='20' cy='80' r='1' fill='%23ffffff45'/><circle cx='55' cy='85' r='1.5' fill='%23ffffff35'/><circle cx='90' cy='75' r='1' fill='%23ffffff55'/><circle cx='125' cy='90' r='2' fill='%23ffffff30'/><circle cx='145' cy='80' r='1' fill='%23ffffff45'/><circle cx='10' cy='110' r='1.5' fill='%23ffffff40'/><circle cx='40' cy='120' r='1' fill='%23ffffff50'/><circle cx='75' cy='105' r='1' fill='%23ffffff45'/><circle cx='110' cy='115' r='1.5' fill='%23ffffff35'/><circle cx='140' cy='125' r='1' fill='%23ffffff55'/><circle cx='25' cy='140' r='1' fill='%23ffffff40'/><circle cx='60' cy='145' r='2' fill='%23ffffff30'/><circle cx='95' cy='135' r='1' fill='%23ffffff50'/><circle cx='130' cy='148' r='1.5' fill='%23ffffff40'/></svg>`
  },
  {
    id:"nordic", label:"Nórdico", emoji:"🌨️",
    bg:"#0d1520", surface:"#152030", border:"#1e3040", text:"#dce8f5",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><line x1='40' y1='5' x2='40' y2='35' stroke='%23a0c8f025' stroke-width='1'/><line x1='25' y1='12' x2='55' y2='28' stroke='%23a0c8f025' stroke-width='1'/><line x1='25' y1='28' x2='55' y2='12' stroke='%23a0c8f025' stroke-width='1'/><circle cx='40' cy='20' r='3' fill='%23a0c8f030'/><line x1='0' y1='60' x2='30' y2='60' stroke='%23a0c8f015' stroke-width='1'/><line x1='5' y1='50' x2='25' y2='70' stroke='%23a0c8f015' stroke-width='1'/><line x1='5' y1='70' x2='25' y2='50' stroke='%23a0c8f015' stroke-width='1'/><circle cx='15' cy='60' r='2' fill='%23a0c8f020'/><line x1='55' y1='55' x2='75' y2='55' stroke='%23a0c8f018' stroke-width='1'/><circle cx='65' cy='55' r='2' fill='%23a0c8f022'/></svg>`
  },
  {
    id:"retro", label:"Retro", emoji:"📺",
    bg:"#1a1208", surface:"#251c10", border:"#3a2c18", text:"#f5e8c0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect x='5' y='5' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a18' stroke-width='1'/><rect x='35' y='5' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a12' stroke-width='1'/><rect x='5' y='35' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a12' stroke-width='1'/><rect x='35' y='35' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a18' stroke-width='1'/><circle cx='15' cy='15' r='4' fill='%23d4a83a10'/><circle cx='45' cy='45' r='4' fill='%23d4a83a10'/></svg>`
  },
  {
    id:"zen", label:"Zen", emoji:"🍃",
    bg:"#0f1510", surface:"#181e18", border:"#252e25", text:"#e0ead8",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><circle cx='60' cy='60' r='40' fill='none' stroke='%2388aa6615' stroke-width='1'/><circle cx='60' cy='60' r='25' fill='none' stroke='%2388aa6612' stroke-width='1'/><circle cx='60' cy='60' r='10' fill='none' stroke='%2388aa6618' stroke-width='1'/><line x1='20' y1='60' x2='100' y2='60' stroke='%2388aa6610' stroke-width='1'/><line x1='60' y1='20' x2='60' y2='100' stroke='%2388aa6610' stroke-width='1'/></svg>`
  },
  {
    id:"urban", label:"Urbano", emoji:"🏙️",
    bg:"#0a0a0a", surface:"#141414", border:"#222222", text:"#e0e0e0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='120'><rect x='5' y='40' width='15' height='80' fill='none' stroke='%23ffffff08' stroke-width='1'/><rect x='25' y='20' width='15' height='100' fill='none' stroke='%23ffffff08' stroke-width='1'/><rect x='45' y='50' width='10' height='70' fill='none' stroke='%23ffffff06' stroke-width='1'/><rect x='60' y='30' width='18' height='90' fill='none' stroke='%23ffffff08' stroke-width='1'/><rect x='8' y='55' width='3' height='3' fill='%23ffffff10'/><rect x='28' y='35' width='3' height='3' fill='%23ffffff10'/><rect x='28' y='45' width='3' height='3' fill='%23ffffff08'/><rect x='63' y='45' width='3' height='3' fill='%23ffffff10'/><rect x='63' y='55' width='3' height='3' fill='%23ffffff08'/></svg>`
  },
  {
    id:"pastel", label:"Pastel", emoji:"🎨",
    bg:"#f8f0f8", surface:"#ffffff", border:"#e8d8e8", text:"#3a2a3a",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='20' cy='20' r='15' fill='%23ffb3c615'/><circle cx='60' cy='15' r='10' fill='%23b3d4ff15'/><circle cx='90' cy='30' r='12' fill='%23b3ffcc15'/><circle cx='10' cy='60' r='8' fill='%23ffd9b315'/><circle cx='50' cy='55' r='18' fill='%23e8b3ff12'/><circle cx='85' cy='65' r='10' fill='%23ffb3c612'/><circle cx='30' cy='85' r='12' fill='%23b3d4ff12'/><circle cx='70' cy='88' r='8' fill='%23b3ffcc15'/></svg>`
  },
  {
    id:"light", label:"Claro", emoji:"☀️",
    bg:"#f5f5f0", surface:"#ffffff", border:"#e0e0d8", text:"#1a1a1a",
    pattern:null
  },
];
function getTheme(id){ return THEMES.find(t=>t.id===id) || THEMES[0]; }
function themeBgStyle(t){
  if(!t.pattern) return {background:t.bg};
  const svg = `url("data:image/svg+xml,${t.pattern}")`;
  return {background:t.bg, backgroundImage:svg, backgroundRepeat:"repeat"};
}
const CATEGORIES = [
  { id:"work",     label:"Trabajo",    color:"#FF6B6B", icon:"💼" },
  { id:"personal", label:"Personal",   color:"#4ECDC4", icon:"🙂" },
  { id:"social",   label:"Social",     color:"#FFEAA7", icon:"🎉" },
  { id:"health",   label:"Salud",      color:"#96CEB4", icon:"🩺" },
  { id:"birthday", label:"Cumpleaños", color:"#FFB347", icon:"🎂" },
  { id:"other",    label:"Otro",       color:"#DDA0DD", icon:"📌" },
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
function randomCode(){ return Math.random().toString(36).substring(2,8).toUpperCase(); }

function expandRecurring(ev, rangeStart, rangeEnd) {
  if (!ev.recurring) return [];
  const rStart = parse(rangeStart), rEnd = parse(rangeEnd);
  const origin = parse(ev.date);
  const exceptions = ev.exceptions || [];
  const instances = [];

  // Yearly (birthdays)
  if (ev.recurringYearly) {
    let year = rStart.getFullYear();
    while (year <= rEnd.getFullYear() + 1) {
      const d = new Date(year, origin.getMonth(), origin.getDate());
      const ds = fmt(d);
      if (d >= rStart && d <= rEnd && !exceptions.includes(ds))
        instances.push({...ev, id:`${ev.id}_${ds}`, date:ds, _recurringBase:ev.id, _virtual:true});
      year++;
    }
    return instances;
  }

  // Weekly
  const endDate = ev.recurringEnd ? parse(ev.recurringEnd) : new Date(rEnd.getFullYear()+2,0,1);
  (ev.recurringDays||[]).forEach(dow => {
    let d = new Date(origin);
    d.setDate(d.getDate() + (dow - d.getDay() + 7) % 7);
    while (d <= endDate && d <= rEnd) {
      const ds = fmt(d);
      if (d >= rStart && !exceptions.includes(ds))
        instances.push({...ev, id:`${ev.id}_${ds}`, date:ds, _recurringBase:ev.id, _virtual:true});
      d = new Date(d); d.setDate(d.getDate()+7);
    }
  });
  return instances;
}

// ── Supabase DB helpers ────────────────────────────────────────────────────
// Tables:
//   profiles      (id uuid PK refs auth.users, display_name, color, avatar)
//   groups        (id uuid PK, name, code text unique, created_by uuid)
//   group_members (group_id uuid, user_id uuid, PRIMARY KEY(group_id,user_id))
//   events        (id uuid PK, group_id uuid, data jsonb)

async function getProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}
async function upsertProfile(profile) {
  await supabase.from("profiles").upsert(profile);
}
async function getMyGroups(userId) {
  const { data } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, code, created_by)")
    .eq("user_id", userId);
  return (data || []).map(r => r.groups).filter(Boolean);
}
async function getGroupMembers(groupId) {
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);
  if (!members || members.length === 0) return [];
  const ids = members.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, color, avatar")
    .in("id", ids);
  return profiles || [];
}
async function getGroupEvents(groupId) {
  const { data } = await supabase.from("events").select("data").eq("group_id", groupId).single();
  return data?.data || [];
}
async function saveGroupEvents(groupId, events) {
  await supabase.from("events").upsert({ group_id: groupId, data: events });
}
async function createGroup(name, userId) {
  const code = randomCode();
  const { data, error } = await supabase.from("groups").insert({ name, code, created_by: userId }).select().single();
  if (error) throw error;
  await supabase.from("group_members").insert({ group_id: data.id, user_id: userId });
  await supabase.from("events").insert({ group_id: data.id, data: [] });
  return data;
}
async function joinGroup(code, userId) {
  const { data: group, error } = await supabase.from("groups").select("*").eq("code", code.toUpperCase()).single();
  if (error || !group) throw new Error("Código inválido");
  const { data: existing } = await supabase.from("group_members").select("*").eq("group_id", group.id).eq("user_id", userId).single();
  if (existing) throw new Error("Ya sos miembro de este grupo");
  await supabase.from("group_members").insert({ group_id: group.id, user_id: userId });
  return group;
}

// ── Styles ─────────────────────────────────────────────────────────────────
const FONT = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap');`;
const BASE_CSS = `
  ${FONT} *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0f0f13;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
  input:focus,textarea:focus{border-color:#FF6B6B!important;outline:none;}
  input,textarea{outline:none;}
  .clickable:hover{opacity:.85;cursor:pointer;}
  .day-cell:hover{background:#1e1e2a!important;cursor:pointer;}
  .event-chip:hover{opacity:.8;cursor:pointer;}
  .agenda-event:hover{background:#1e1e2a!important;cursor:pointer;}
  .modal-overlay{animation:fadeIn .15s ease;}
  .modal-box{animation:slideUp .2s ease;}
  .panel-anim{animation:slideUp .15s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
  .dow-pill{cursor:pointer;transition:all .15s;}
  button{font-family:DM Sans,sans-serif;cursor:pointer;}
`;

const inp = {background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:10,padding:"11px 13px",color:"#e8e8f0",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const lbl = {fontSize:10,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};
const Logo = ({size=20}) => <span style={{fontFamily:"Fraunces,serif",fontSize:size,fontWeight:600,color:"#fff",letterSpacing:"-0.5px"}}>Zoe<span style={{color:"#FF6B6B"}}>genda</span></span>;

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();

  // Auth
  const [authUser,   setAuthUser]   = useState(null);
  const [profile,    setProfile]    = useState(null);
  const [screen,     setScreen]     = useState("loading"); // loading|login|register|setup|groups|app

  // Auth form
  const [authEmail,    setAuthEmail]    = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError,    setAuthError]    = useState("");
  const [authLoading,  setAuthLoading]  = useState(false);

  // Profile setup
  const [setupName,  setSetupName]  = useState("");
  const [setupColor, setSetupColor] = useState(COLORS[0]);
  const [setupError, setSetupError] = useState("");

  // Groups
  const [groups,       setGroups]      = useState([]);
  const [activeGroup,  setActiveGroup] = useState(null);
  const [groupMembers, setGroupMembers]= useState([]);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [notifications, setNotifications] = useState([]); // eventos de mañana
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const theme = getTheme(profile?.theme);
  const T = theme; // shorthand

  // Group create/join
  const [groupAction,   setGroupAction]   = useState(null); // "create"|"join"
  const [groupName,     setGroupName]     = useState("");
  const [groupCode,     setGroupCode]     = useState("");
  const [groupError,    setGroupError]    = useState("");
  const [groupLoading,  setGroupLoading]  = useState(false);

  // Calendar
  const [events,       setEvents]       = useState([]);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(fmt(today));
  const [view,         setView]         = useState("calendar");
  const [filterUser,   setFilterUser]   = useState("all");
  const [filterCat,    setFilterCat]    = useState("all");
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent,   setEditingEvent]   = useState(null);
  const [deleteDialog,   setDeleteDialog]   = useState(null);

  // ── Auth init ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleAuthUser(session.user);
      else setScreen("login");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) handleAuthUser(session.user);
      else { setAuthUser(null); setProfile(null); setScreen("login"); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleAuthUser(user) {
    setAuthUser(user);
    const p = await getProfile(user.id);
    if (!p) { setScreen("setup"); return; }
    setProfile(p);
    const g = await getMyGroups(user.id);
    setGroups(g);
    if (g.length === 0) setScreen("groups");
    else { setActiveGroup(g[0]); setScreen("app"); }
  }

  // ── Auth actions ─────────────────────────────────────────────────────────
  async function signUp() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  }
  async function signIn() {
    setAuthLoading(true); setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError("Email o contraseña incorrectos");
    setAuthLoading(false);
  }
  async function signOut() {
    await supabase.auth.signOut();
    setGroups([]); setActiveGroup(null); setEvents([]);
  }

  async function saveTheme(themeId) {
    const updated = { ...profile, theme: themeId };
    await upsertProfile(updated);
    setProfile(updated);
  }

  // ── Profile setup ────────────────────────────────────────────────────────
  async function saveProfile() {
    if (!setupName.trim()) { setSetupError("Ingresá tu nombre"); return; }
    const p = { id: authUser.id, display_name: setupName.trim(), color: setupColor, avatar: initials(setupName) };
    await upsertProfile(p);
    setProfile(p);
    const g = await getMyGroups(authUser.id);
    setGroups(g);
    setScreen(g.length === 0 ? "groups" : "app");
  }

  // ── Group actions ────────────────────────────────────────────────────────
  async function handleCreateGroup() {
    if (!groupName.trim()) { setGroupError("Ingresá un nombre"); return; }
    setGroupLoading(true); setGroupError("");
    try {
      const g = await createGroup(groupName.trim(), authUser.id);
      const updated = await getMyGroups(authUser.id);
      setGroups(updated);
      setActiveGroup(g);
      setGroupAction(null); setGroupName(""); setScreen("app");
    } catch(e) { setGroupError(e.message); }
    setGroupLoading(false);
  }
  async function handleJoinGroup() {
    if (!groupCode.trim()) { setGroupError("Ingresá el código"); return; }
    setGroupLoading(true); setGroupError("");
    try {
      const g = await joinGroup(groupCode.trim(), authUser.id);
      const updated = await getMyGroups(authUser.id);
      setGroups(updated);
      setActiveGroup(g);
      setGroupAction(null); setGroupCode(""); setScreen("app");
    } catch(e) { setGroupError(e.message); }
    setGroupLoading(false);
  }

  // ── Load events + members when group changes ─────────────────────────────
  useEffect(() => {
    if (!activeGroup) return;
    setFilterUser("all"); setFilterCat("all");
    getGroupEvents(activeGroup.id).then(setEvents);
    getGroupMembers(activeGroup.id).then(setGroupMembers);

    // Realtime
    const ch = supabase.channel(`events-${activeGroup.id}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"events", filter:`group_id=eq.${activeGroup.id}` }, payload => {
        setEvents(payload.new?.data || []);
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [activeGroup?.id]);

  // ── Notification check: events tomorrow ────────────────────────────────
  useEffect(() => {
    if (!events.length || !activeGroup) return;
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const tomorrowStr = fmt(tomorrow);
    // Check regular events
    const direct = events.filter(e => !e.recurring && e.date === tomorrowStr);
    // Check recurring events
    const recurring = events.filter(e => e.recurring).flatMap(e => {
      const instances = expandRecurring(e, tomorrowStr, tomorrowStr);
      return instances.length > 0 ? [e] : [];
    });
    const all = [...direct, ...recurring];
    if (all.length > 0) {
      setNotifications(all);
      setShowNotifPanel(true);
    } else {
      setNotifications([]);
      setShowNotifPanel(false);
    }
  }, [events, activeGroup?.id]);

  // ── Calendar helpers ─────────────────────────────────────────────────────
  const rangeStart = fmt(new Date(currentYear, currentMonth, 1));
  const rangeEnd   = fmt(new Date(currentYear, currentMonth+1, 0));

  function filterEvs(list) {
    return list.filter(e => {
      if (filterUser !== "all" && !e.attendees?.includes(filterUser)) return false;
      if (filterCat  !== "all" && e.category !== filterCat)           return false;
      return true;
    });
  }

  const monthEvents = useMemo(() => {
    const expanded = events.flatMap(ev => {
      if (ev.recurring) return expandRecurring(ev, rangeStart, rangeEnd);
      if (ev.date >= rangeStart && ev.date <= rangeEnd) return [ev];
      return [];
    });
    return filterEvs(expanded).sort((a,b) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
  // eslint-disable-next-line
  }, [events, currentMonth, currentYear, filterUser, filterCat]);

  function eventsForDate(dateStr) {
    const expanded = events.flatMap(ev => {
      if (ev.recurring) return expandRecurring(ev, dateStr, dateStr);
      return ev.date === dateStr ? [ev] : [];
    });
    return filterEvs(expanded).sort((a,b) => a.time.localeCompare(b.time));
  }

  const agendaDates       = [...new Set(monthEvents.map(e=>e.date))];
  const selectedDayEvents = eventsForDate(selectedDate);

  const member = id => groupMembers.find(m=>m.id===id) || {display_name:"?",avatar:"?",color:"#555"};
  const cat    = id => CATEGORIES.find(c=>c.id===id) || CATEGORIES[4];

  // ── Event CRUD ───────────────────────────────────────────────────────────
  function openNew(date) {
    const d = date ? parse(date) : parse(selectedDate);
    setEditingEvent({ id:null, title:"", date:date||selectedDate, time:"09:00", timeEnd:"", category:"work", attendees:[authUser.id], notes:"", color:"#FF6B6B", recurring:false, recurringDays:[d.getDay()], recurringEnd:"", birthdayPerson:"" });
    setShowEventModal(true);
  }
  function openEdit(ev) {
    if (ev._virtual) {
      const base = events.find(e=>e.id===ev._recurringBase);
      setEditingEvent(base ? {...base, _editingVirtualDate:ev.date} : {...ev});
    } else {
      setEditingEvent({...ev, recurringDays:ev.recurringDays||[], recurringEnd:ev.recurringEnd||"", timeEnd:ev.timeEnd||"", birthdayPerson:ev.birthdayPerson||""});
    }
    setShowEventModal(true);
  }
  function closeModal() { setShowEventModal(false); setEditingEvent(null); }

  async function saveEvent() {
    if (!editingEvent.title.trim()) return;
    const toSave = {...editingEvent};
    if (toSave.category === "birthday") {
      toSave.recurring = true;
      toSave.recurringYearly = true;
      toSave.recurringDays = [];
      toSave.title = toSave.birthdayPerson || toSave.title;
    }
    delete toSave._editingVirtualDate;
    if (!toSave.recurring) { toSave.recurringDays=[]; toSave.recurringEnd=""; }
    if (toSave.recurring && !toSave.recurringDays?.length) toSave.recurringDays=[parse(toSave.date).getDay()];
    const ne = toSave.id ? events.map(e=>e.id===toSave.id?toSave:e) : [...events, {...toSave, id:`e${Date.now()}`}];
    await saveGroupEvents(activeGroup.id, ne);
    setEvents(ne);
    closeModal();
  }

  async function confirmDelete(id, scope, virtualDate) {
    setDeleteDialog(null);
    let ne;
    if (scope===null||scope==="all") ne = events.filter(e=>e.id!==id);
    else if (scope==="one"&&virtualDate) ne = events.map(e=>e.id!==id?e:{...e,exceptions:[...(e.exceptions||[]),virtualDate]});
    await saveGroupEvents(activeGroup.id, ne);
    setEvents(ne);
    closeModal();
  }

  function toggleAttendee(uid) {
    setEditingEvent(ev=>({...ev, attendees:ev.attendees?.includes(uid)?ev.attendees.filter(x=>x!==uid):[...(ev.attendees||[]),uid]}));
  }
  function toggleRecurringDay(dow) {
    setEditingEvent(ev=>({...ev, recurringDays:ev.recurringDays?.includes(dow)?ev.recurringDays.filter(d=>d!==dow):[...(ev.recurringDays||[]),dow]}));
  }
  function prevMonth(){ if(currentMonth===0){setCurrentMonth(11);setCurrentYear(y=>y-1);}else setCurrentMonth(m=>m-1); }
  function nextMonth(){ if(currentMonth===11){setCurrentMonth(0);setCurrentYear(y=>y+1);}else setCurrentMonth(m=>m+1); }

  // ── SCREEN: loading ───────────────────────────────────────────────────────
  if (screen==="loading") return (
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{BASE_CSS}</style><Logo size={26}/>
    </div>
  );

  // ── SCREEN: login / register ──────────────────────────────────────────────
  if (screen==="login"||screen==="register") {
    const isReg = screen==="register";
    return (
      <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
        <style>{BASE_CSS}</style>
        <div style={{maxWidth:400,width:"100%"}}>
          <div style={{textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:44,marginBottom:12}}>📅</div>
            <Logo size={32}/>
            <p style={{color:"#555",fontSize:13,marginTop:8}}>Agenda compartida en tiempo real</p>
          </div>
          <div style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:16,padding:24}}>
            <div style={{display:"flex",gap:4,marginBottom:22,background:"#0f0f13",borderRadius:10,padding:4}}>
              {[["login","Entrar"],["register","Registrarse"]].map(([s,label])=>(
                <button key={s} onClick={()=>{setScreen(s);setAuthError("");}} style={{flex:1,padding:"8px",borderRadius:8,border:"none",background:screen===s?"#1e1e2a":"transparent",color:screen===s?"#fff":"#555",fontSize:13,fontWeight:screen===s?600:400}}>{label}</button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="tu@email.com" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Contraseña</label>
                <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(isReg?signUp():signIn())} placeholder="••••••••" style={inp}/>
              </div>
              {authError&&<div style={{fontSize:12,color:"#FF6B6B",background:"#FF6B6B11",padding:"8px 12px",borderRadius:8}}>{authError}</div>}
              {isReg&&<p style={{fontSize:11,color:"#555",lineHeight:1.5}}>Al registrarte vas a poder crear y unirte a múltiples grupos de agenda.</p>}
              <button onClick={isReg?signUp:signIn} disabled={authLoading} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,opacity:authLoading?.6:1}}>
                {authLoading?"Cargando...":(isReg?"Crear cuenta":"Entrar")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN: setup profile ─────────────────────────────────────────────────
  if (screen==="setup") return (
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{BASE_CSS}</style>
      <div style={{maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}><Logo size={28}/></div>
        <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"#fff",marginBottom:4,fontWeight:600}}>Completá tu perfil</h2>
        <p style={{color:"#555",fontSize:13,marginBottom:24}}>Elegí cómo te van a ver los demás</p>
        <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:setupColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#fff",boxShadow:`0 0 0 5px ${setupColor}33`,transition:"all .3s"}}>
            {setupName.trim()?initials(setupName):"?"}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={lbl}>Tu nombre</label>
            <input value={setupName} onChange={e=>{setSetupName(e.target.value);setSetupError("");}} placeholder="Ej: Laura García" maxLength={20} style={inp} autoFocus/>
            {setupError&&<div style={{fontSize:12,color:"#FF6B6B",marginTop:5}}>{setupError}</div>}
          </div>
          <div>
            <label style={lbl}>Tu color</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLORS.map(c=><div key={c} onClick={()=>setSetupColor(c)} style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:setupColor===c?"3px solid #fff":"3px solid transparent",boxShadow:setupColor===c?`0 0 0 2px ${c}`:"none",transition:"all .15s"}}/>)}
            </div>
          </div>
          <button onClick={saveProfile} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700}}>Guardar ✨</button>
        </div>
      </div>
    </div>
  );

  // ── SCREEN: groups manager ────────────────────────────────────────────────
  if (screen==="groups") return (
    <div style={{minHeight:"100vh",background:"#0f0f13",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{BASE_CSS}</style>
      <div style={{maxWidth:420,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}><Logo size={28}/></div>

        {!groupAction ? (
          <>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"#fff",marginBottom:4,fontWeight:600}}>Tus agendas</h2>
            <p style={{color:"#555",fontSize:13,marginBottom:20}}>Cada agenda es un grupo compartido</p>

            {groups.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                {groups.map(g=>(
                  <div key={g.id} onClick={()=>{setActiveGroup(g);setScreen("app");}} style={{display:"flex",alignItems:"center",gap:14,background:"#131318",border:"1px solid #1e1e2a",borderRadius:14,padding:"13px 16px",cursor:"pointer"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"#FF6B6B22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📅</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:600,color:"#e8e8f0"}}>{g.name}</div>
                      <div style={{fontSize:11,color:"#555",marginTop:2}}>Código: {g.code}</div>
                    </div>
                    <span style={{color:"#333",fontSize:20}}>›</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>{setGroupAction("create");setGroupError("");}} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700}}>+ Crear nueva agenda</button>
              <button onClick={()=>{setGroupAction("join");setGroupError("");}} style={{background:"transparent",color:"#666",border:"1px solid #2a2a3a",borderRadius:12,padding:"12px",fontSize:13}}>Unirme con código</button>
            </div>
            {groups.length>0&&<button onClick={()=>setScreen("app")} style={{background:"transparent",border:"none",color:"#444",fontSize:12,marginTop:16,width:"100%"}}>← Volver a la agenda</button>}
          </>
        ) : groupAction==="create" ? (
          <>
            <button onClick={()=>{setGroupAction(null);setGroupError("");}} style={{background:"transparent",border:"none",color:"#666",fontSize:13,marginBottom:18}}>← Volver</button>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"#fff",marginBottom:4,fontWeight:600}}>Nueva agenda</h2>
            <p style={{color:"#555",fontSize:13,marginBottom:22}}>Se generará un código para compartir con tu grupo</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={lbl}>Nombre de la agenda</label>
                <input value={groupName} onChange={e=>{setGroupName(e.target.value);setGroupError("");}} onKeyDown={e=>e.key==="Enter"&&handleCreateGroup()} placeholder="Ej: Familia, Trabajo, Amigos..." style={inp} autoFocus/>
              </div>
              {groupError&&<div style={{fontSize:12,color:"#FF6B6B",background:"#FF6B6B11",padding:"8px 12px",borderRadius:8}}>{groupError}</div>}
              <button onClick={handleCreateGroup} disabled={groupLoading} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,opacity:groupLoading?.6:1}}>
                {groupLoading?"Creando...":"Crear agenda"}
              </button>
            </div>
          </>
        ) : (
          <>
            <button onClick={()=>{setGroupAction(null);setGroupError("");}} style={{background:"transparent",border:"none",color:"#666",fontSize:13,marginBottom:18}}>← Volver</button>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"#fff",marginBottom:4,fontWeight:600}}>Unirme a una agenda</h2>
            <p style={{color:"#555",fontSize:13,marginBottom:22}}>Pedile el código al creador del grupo</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={lbl}>Código del grupo</label>
                <input value={groupCode} onChange={e=>{setGroupCode(e.target.value.toUpperCase());setGroupError("");}} onKeyDown={e=>e.key==="Enter"&&handleJoinGroup()} placeholder="Ej: AB12CD" maxLength={6} style={{...inp,textTransform:"uppercase",letterSpacing:4,fontSize:18,textAlign:"center"}} autoFocus/>
              </div>
              {groupError&&<div style={{fontSize:12,color:"#FF6B6B",background:"#FF6B6B11",padding:"8px 12px",borderRadius:8}}>{groupError}</div>}
              <button onClick={handleJoinGroup} disabled={groupLoading} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,opacity:groupLoading?.6:1}}>
                {groupLoading?"Buscando...":"Unirme"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── SCREEN: app ───────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay    = getFirstDay(currentYear, currentMonth);

  const EventChip = ({ev}) => {
    const isBday = ev.category === "birthday";
    const icon = cat(ev.category).icon;
    return (
      <div className="event-chip" onClick={e=>{e.stopPropagation();openEdit(ev);}}
        style={{fontSize:9,padding:"2px 4px",borderRadius:3,marginBottom:2,background:cat(ev.category).color+"22",color:cat(ev.category).color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:500,display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
        <span style={{flexShrink:0}}>{icon}</span>
        {isBday ? <span>{ev.title}</span> : <span>{ev.time} {ev.title}</span>}
        {ev.recurring&&!isBday&&<span style={{opacity:.7,flexShrink:0}}>↻</span>}
      </div>
    );
  };

  const Filters = () => (
    <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:9,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Ver:</span>
      {[["all","Todos"],...groupMembers.map(m=>[m.id,m.display_name])].map(([id,label])=>{
        const m=groupMembers.find(x=>x.id===id); const on=filterUser===id;
        return <div key={id} onClick={()=>setFilterUser(id)} style={{padding:"2px 9px",borderRadius:20,fontSize:10,cursor:"pointer",background:on?(m?m.color+"33":"#2a2a3a"):"transparent",color:on?(m?m.color:"#fff"):"#555",border:`1px solid ${on?"#3a3a4a":"#1e1e2a"}`}}>{label}</div>;
      })}
      <div style={{width:1,height:12,background:"#2a2a3a",margin:"0 2px"}}/>
      {CATEGORIES.map(c=>(
        <div key={c.id} onClick={()=>setFilterCat(filterCat===c.id?"all":c.id)} style={{padding:"2px 9px",borderRadius:20,fontSize:10,cursor:"pointer",background:filterCat===c.id?c.color+"33":"transparent",color:filterCat===c.id?c.color:"#555",border:`1px solid ${filterCat===c.id?c.color+"44":"#1e1e2a"}`}}>{c.label}</div>
      ))}
    </div>
  );

  const CalendarContent = () => (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={prevMonth} style={{background:"#1a1a22",color:"#aaa",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>‹</button>
        <span style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"#fff",flex:1,textAlign:"center"}}>{MONTHS_ES[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} style={{background:"#1a1a22",color:"#aaa",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>›</button>
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
              style={{height:68,padding:"5px 4px",borderRadius:8,background:isSelected?"#1a1a28":"#131318",border:isSelected?"1px solid #2a2a3a":"1px solid #1a1a22",boxShadow:isToday?"inset 0 0 0 1.5px #FF6B6B55":"none",overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{fontSize:11,fontWeight:isToday?700:400,color:isToday?"#FF6B6B":"#e8e8f0",marginBottom:2,display:"flex",justifyContent:"space-between"}}>
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
  );

  const AgendaContent = () => (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={prevMonth} style={{background:"#1a1a22",color:"#aaa",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>‹</button>
        <span style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"#fff",flex:1,textAlign:"center"}}>{MONTHS_ES[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} style={{background:"#1a1a22",color:"#aaa",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>›</button>
      </div>
      {agendaDates.length===0&&<div style={{textAlign:"center",color:"#444",padding:"50px 0",fontSize:14}}>No hay eventos este mes<div style={{marginTop:14}}><button onClick={()=>openNew(null)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12}}>+ Crear evento</button></div></div>}
      {agendaDates.map(dateStr=>{
        const d=parse(dateStr); const isToday=dateStr===fmt(today);
        return (
          <div key={dateStr} style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:32,height:32,borderRadius:8,background:isToday?"#FF6B6B":"#1a1a22",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1}}>{d.getDate()}</span>
                <span style={{fontSize:8,color:isToday?"#ffb3b3":"#555",textTransform:"uppercase"}}>{DAYS_ES[d.getDay()]}</span>
              </div>
              <div style={{flex:1,height:1,background:"#1e1e2a"}}/>
            </div>
            {eventsForDate(dateStr).map(ev=>(
              <div key={ev.id} className="agenda-event" onClick={()=>openEdit(ev)}
                style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:10,padding:"8px 12px",display:"flex",gap:10,alignItems:"flex-start",borderLeft:`3px solid ${cat(ev.category).color}`,marginBottom:5}}>
                {ev.category!=="birthday"&&<div style={{color:"#888",fontSize:11,minWidth:34,paddingTop:1,fontWeight:500}}>{ev.time}{ev.timeEnd&&<span style={{color:"#555"}}>–{ev.timeEnd}</span>}</div>}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13,color:"#e8e8f0",display:"flex",alignItems:"center",gap:5}}>
                    {ev.title}{ev.recurring&&<span style={{fontSize:9,background:"#2a2a3a",color:"#888",padding:"1px 5px",borderRadius:4}}>↻</span>}
                  </div>
                  {ev.notes&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{ev.notes}</div>}
                  <div style={{display:"flex",gap:4,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:9,padding:"1px 6px",borderRadius:20,background:cat(ev.category).color+"22",color:cat(ev.category).color}}>{cat(ev.category).label}</span>
                    {ev.attendees?.map(uid=><div key={uid} title={member(uid).display_name} style={{width:13,height:13,borderRadius:"50%",background:member(uid).color,fontSize:6,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{member(uid).avatar}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  const DayContent = () => (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={()=>{const d=parse(selectedDate);d.setDate(d.getDate()-1);setSelectedDate(fmt(d));}} style={{background:"#1a1a22",color:"#aaa",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>‹</button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff"}}>{parse(selectedDate).getDate()} de {MONTHS_ES[parse(selectedDate).getMonth()]}</div>
          <div style={{fontSize:11,color:"#555"}}>{DAYS_FULL[parse(selectedDate).getDay()]}</div>
        </div>
        <button onClick={()=>{const d=parse(selectedDate);d.setDate(d.getDate()+1);setSelectedDate(fmt(d));}} style={{background:"#1a1a22",color:"#aaa",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>›</button>
      </div>
      {selectedDayEvents.length===0&&<div style={{textAlign:"center",color:"#444",padding:"50px 0",fontSize:14}}>Sin eventos<div style={{marginTop:14}}><button onClick={()=>openNew(selectedDate)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12}}>+ Agregar</button></div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {selectedDayEvents.map(ev=>(
          <div key={ev.id} onClick={()=>openEdit(ev)} style={{background:"#131318",borderRadius:12,padding:"12px 16px",cursor:"pointer",border:"1px solid #1e1e2a",borderLeft:`4px solid ${cat(ev.category).color}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {ev.category!=="birthday"&&<div style={{fontSize:16,fontWeight:700,color:cat(ev.category).color,fontFamily:"Fraunces,serif"}}>{ev.time}{ev.timeEnd&&<span style={{fontSize:11,fontWeight:400,color:cat(ev.category).color,opacity:.7}}>–{ev.timeEnd}</span>}</div>}
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"#e8e8f0",display:"flex",alignItems:"center",gap:6}}>
                  {ev.title}{ev.recurring&&<span style={{fontSize:9,background:"#2a2a3a",color:"#888",padding:"1px 5px",borderRadius:4,fontWeight:400}}>↻</span>}
                </div>
                <div style={{fontSize:11,color:cat(ev.category).color,marginTop:1}}>{cat(ev.category).label}</div>
              </div>
              <div style={{display:"flex",gap:3}}>
                {ev.attendees?.map(uid=><div key={uid} title={member(uid).display_name} style={{width:20,height:20,borderRadius:"50%",background:member(uid).color,fontSize:7,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{member(uid).avatar}</div>)}
              </div>
            </div>
            {ev.notes&&<div style={{fontSize:12,color:"#666",marginTop:7,paddingTop:7,borderTop:"1px solid #1e1e2a"}}>{ev.notes}</div>}
          </div>
        ))}
      </div>
      <button onClick={()=>openNew(selectedDate)} style={{marginTop:12,width:"100%",padding:"11px",borderRadius:10,background:"transparent",border:"1px dashed #2a2a3a",color:"#555",cursor:"pointer",fontSize:13}}>+ Agregar evento</button>
    </div>
  );

  return (
    <div style={{height:"100vh",...themeBgStyle(T),fontFamily:"DM Sans,'Segoe UI',sans-serif",color:T.text,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{BASE_CSS}</style>

      {/* ── TOP HEADER ── */}
      <header style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,background:T.gradient?"#0f0f13":T.bg,flexShrink:0,zIndex:10}}>
        <div onClick={()=>setScreen("groups")} className="clickable" style={{flex:1,display:"flex",alignItems:"center",gap:8,minWidth:0}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#FF6B6B22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>📅</div>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:"Fraunces,serif",fontSize:15,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{activeGroup?.name||"Zoegenda"}</div>
            <div style={{fontSize:9,color:"#555"}}>código: <span style={{color:"#FF6B6B",fontWeight:700,letterSpacing:1}}>{activeGroup?.code}</span> · {groupMembers.length} miembro{groupMembers.length!==1?"s":""}</div>
          </div>
          <span style={{color:"#333",fontSize:12,flexShrink:0}}>▼</span>
        </div>
        <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
          {groupMembers.slice(0,4).map((m,i)=>(
            <div key={m.id} title={m.display_name} style={{width:24,height:24,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff",border:m.id===authUser?.id?"2px solid #fff":"2px solid #0f0f13",marginLeft:i===0?0:-5,opacity:m.id===authUser?.id?1:.65,zIndex:m.id===authUser?.id?2:1}}>{m.avatar}</div>
          ))}
          {groupMembers.length>4&&<div style={{fontSize:9,color:"#555",marginLeft:4}}>+{groupMembers.length-4}</div>}
        </div>
        <div onClick={()=>setShowGroupPanel(p=>!p)} className="clickable" style={{display:"flex",alignItems:"center",gap:6,background:showGroupPanel?"#1e1e2a":"#131318",border:`1px solid ${showGroupPanel?"#3a3a4a":"#2a2a3a"}`,borderRadius:20,padding:"4px 10px 4px 4px",flexShrink:0}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:profile?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff"}}>{profile?.avatar}</div>
          <span style={{fontSize:11,color:"#ccc",fontWeight:500,maxWidth:55,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.display_name}</span>
        </div>
        {notifications.length>0&&(
          <button onClick={()=>setShowNotifPanel(p=>!p)} style={{position:"relative",background:showNotifPanel?"#FFB34722":"transparent",border:`1px solid ${showNotifPanel?"#FFB34744":"#2a2a3a"}`,borderRadius:9,padding:"7px 10px",fontSize:15,flexShrink:0,cursor:"pointer"}}>
            🔔
            <span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#FF6B6B",fontSize:9,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{notifications.length}</span>
          </button>
        )}
        <button onClick={()=>openNew(null)} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:9,padding:"7px 12px",fontSize:12,fontWeight:700,flexShrink:0}}>+ Nuevo</button>
      </header>

      {/* Profile panel */}
      {showGroupPanel&&(
        <div className="panel-anim" style={{background:T.gradient?"#0d0d11":T.surface,borderBottom:`1px solid ${T.border}`,padding:"14px 16px",flexShrink:0}}>
          {/* User info + actions */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:profile?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{profile?.avatar}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{profile?.display_name}</div>
                <div style={{fontSize:11,color:"#555",marginTop:1}}>{authUser?.email}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>{setScreen("groups");setShowGroupPanel(false);}} style={{background:T.gradient?"#ffffff14":"#1e1e2a",color:"#aaa",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",fontSize:12}}>Mis agendas</button>
              <button onClick={signOut} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"6px 12px",fontSize:12}}>Cerrar sesión</button>
            </div>
          </div>
          {/* Theme selector */}
          <div>
            <div style={{fontSize:10,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🎨 Tema personal</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {THEMES.map(t=>{
                const active=profile?.theme===t.id||(!profile?.theme&&t.id==="default");
                return (
                  <div key={t.id} onClick={()=>saveTheme(t.id)} title={t.label}
                    style={{width:48,height:48,borderRadius:10,cursor:"pointer",border:active?"2px solid #FF6B6B":"2px solid transparent",boxShadow:active?"0 0 0 2px #FF6B6B44":"none",flexShrink:0,position:"relative",overflow:"hidden",...themeBgStyle(t),display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:18,filter:"drop-shadow(0 1px 2px #0008)"}}>{t.emoji}</span>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:11,color:"#888",marginTop:8}}>Tema actual: <span style={{color:"#FF6B6B",fontWeight:600}}>{getTheme(profile?.theme).label}</span></div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION PANEL ── */}
      {showNotifPanel&&notifications.length>0&&(
        <div className="panel-anim" style={{background:"#1a1200",borderBottom:"1px solid #3a2a00",padding:"12px 16px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:16}}>🔔</span>
              <span style={{fontSize:12,fontWeight:700,color:"#FFB347"}}>Mañana tenés {notifications.length} evento{notifications.length!==1?"s":""}</span>
            </div>
            <button onClick={()=>setShowNotifPanel(false)} style={{background:"transparent",border:"none",color:"#666",fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {notifications.map(ev=>(
              <div key={ev.id} onClick={()=>{openEdit(ev);setShowNotifPanel(false);}}
                style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"#ffffff08",cursor:"pointer",border:"1px solid #3a2a00"}}>
                <span style={{fontSize:14}}>{ev.category==="birthday"?"🎂":ev.category==="work"?"💼":ev.category==="health"?"💊":ev.category==="social"?"🎉":"📌"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#f5e0b0"}}>{ev.title}</div>
                  <div style={{fontSize:10,color:"#888"}}>{ev.time}{ev.timeEnd?` – ${ev.timeEnd}`:""} · {cat(ev.category).label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BODY: sidebar + content ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* SIDEBAR (desktop only) */}
        <aside className="sidebar" style={{width:220,flexShrink:0,background:"#0a0a0e",borderRight:"1px solid #1e1e2a",display:"flex",flexDirection:"column",padding:"16px 12px",gap:4,overflowY:"auto"}}>
          <div style={{fontSize:10,color:"#444",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6,paddingLeft:8}}>Vistas</div>
          {[["calendar","📅","Mes"],["agenda","📋","Agenda"],["day","🗓","Día"]].map(([v,icon,label])=>(
            <button key={v} onClick={()=>setView(v)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:8,border:"none",background:view===v?"#1e1e2a":"transparent",color:view===v?"#fff":"#555",fontSize:13,fontWeight:view===v?600:400,textAlign:"left",width:"100%"}}>
              <span style={{fontSize:15}}>{icon}</span>{label}
            </button>
          ))}
          <div style={{height:1,background:"#1e1e2a",margin:"10px 0"}}/>
          <div style={{fontSize:10,color:"#444",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6,paddingLeft:8}}>Filtros</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {[["all","Todos",null],...groupMembers.map(m=>[m.id,m.display_name,m])].map(([id,label,m])=>{
              const on=filterUser===id;
              return <div key={id} onClick={()=>setFilterUser(id)} style={{padding:"6px 10px",borderRadius:8,fontSize:12,cursor:"pointer",background:on?(m?m.color+"22":"#1e1e2a"):"transparent",color:on?(m?m.color:"#fff"):"#555",display:"flex",alignItems:"center",gap:7}}>
                {m&&<div style={{width:10,height:10,borderRadius:"50%",background:m.color,flexShrink:0}}/>}{label}
              </div>;
            })}
          </div>
          <div style={{height:1,background:"#1e1e2a",margin:"6px 0"}}/>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {CATEGORIES.map(c=>(
              <div key={c.id} onClick={()=>setFilterCat(filterCat===c.id?"all":c.id)} style={{padding:"6px 10px",borderRadius:8,fontSize:12,cursor:"pointer",background:filterCat===c.id?c.color+"22":"transparent",color:filterCat===c.id?c.color:"#555",display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0}}/>{c.label}
              </div>
            ))}
          </div>
          <div style={{flex:1}}/>
          <button onClick={()=>openNew(null)} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,marginTop:8}}>+ Nuevo evento</button>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          {/* Mobile tabs + filters - portrait only */}
          <div className="mobile-tabs" style={{display:"flex",flexDirection:"column",flexShrink:0}}>
            <div style={{padding:"8px 16px 0",display:"flex",gap:4}}>
              {[["calendar","📅 Mes"],["agenda","📋 Agenda"],["day","🗓 Día"]].map(([v,label])=>(
                <button key={v} onClick={()=>setView(v)} style={{background:view===v?"#1e1e2a":"transparent",color:view===v?"#fff":"#666",padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:view===v?600:400,border:view===v?"1px solid #2a2a3a":"1px solid transparent"}}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{padding:"6px 16px 8px",borderBottom:"1px solid #1a1a22",overflowX:"auto",display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
              <Filters/>
            </div>
          </div>
          {/* Desktop filters bar */}
          <div className="desktop-filters" style={{padding:"8px 16px",borderBottom:"1px solid #1a1a22",flexShrink:0,overflowX:"auto"}}>
            <Filters/>
          </div>

          {/* Scrollable content */}
          <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
            {view==="calendar"&&<CalendarContent/>}
            {view==="agenda"&&<AgendaContent/>}
            {view==="day"&&<DayContent/>}
          </div>
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile only) ── */}
      <nav className="bottom-nav">
        {[["calendar","📅","Mes"],["agenda","📋","Agenda"],["day","🗓","Día"]].map(([v,icon,label])=>(
          <button key={v} className="bottom-nav-item" onClick={()=>setView(v)} style={{color:view===v?"#FF6B6B":"#555"}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span style={{fontSize:9,fontWeight:view===v?700:400}}>{label}</span>
          </button>
        ))}
        <button className="bottom-nav-item" onClick={()=>openNew(null)}>
          <span style={{width:36,height:36,borderRadius:"50%",background:"#FF6B6B",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:24,lineHeight:1}}>+</span>
          <span style={{fontSize:9,fontWeight:600,color:"#FF6B6B"}}>Nuevo</span>
        </button>
      </nav>

      {/* ── EVENT MODAL ── */}
      {showEventModal&&editingEvent&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal();}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div className="modal-box" style={{background:"#131318",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid #2a2a3a",maxHeight:"92vh",overflow:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff"}}>{editingEvent.id?"Editar evento":"Nuevo evento"}</h2>
              <button onClick={closeModal} style={{background:"#1e1e2a",border:"none",color:"#aaa",width:26,height:26,borderRadius:"50%",fontSize:14}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {editingEvent.category==="birthday" ? (
                <div>
                  <label style={lbl}>🎂 Nombre de quien cumple</label>
                  <input value={editingEvent.birthdayPerson||""} onChange={e=>setEditingEvent(ev=>({...ev,birthdayPerson:e.target.value,title:e.target.value||""}))} placeholder="Ej: María" style={inp} autoFocus/>
                </div>
              ) : (
                <input value={editingEvent.title} onChange={e=>setEditingEvent(ev=>({...ev,title:e.target.value}))} placeholder="Título del evento" style={inp}/>
              )}
              {editingEvent.category==="birthday" ? (
                <div style={{background:"#FFB34711",border:"1px solid #FFB34733",borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>🎂</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#FFB347"}}>Se repite cada año</div>
                    <div style={{fontSize:11,color:"#7a6020",marginTop:1}}>El cumpleaños se agrega automáticamente para siempre</div>
                  </div>
                </div>
              ) : (
                <div style={{background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:10,padding:"9px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setEditingEvent(ev=>({...ev,recurring:!ev.recurring}))}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#e8e8f0"}}>↻ Evento rutinario</div>
                      <div style={{fontSize:11,color:"#555",marginTop:1}}>Se repite semanalmente</div>
                    </div>
                    <div style={{width:36,height:20,borderRadius:10,background:editingEvent.recurring?"#FF6B6B":"#2a2a3a",position:"relative",transition:"background .2s",flexShrink:0}}>
                      <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:editingEvent.recurring?18:3,transition:"left .2s"}}/>
                    </div>
                  </div>
                  {editingEvent.recurring&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #1e1e2a"}}>
                      <label style={lbl}>Días de la semana</label>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                        {DAYS_ES.map((d,i)=>{
                          const on=editingEvent.recurringDays?.includes(i);
                          return <div key={i} className="dow-pill" onClick={()=>toggleRecurringDay(i)} style={{padding:"4px 9px",borderRadius:8,fontSize:11,fontWeight:on?700:400,background:on?"#FF6B6B33":"#1a1a22",color:on?"#FF6B6B":"#555",border:`1px solid ${on?"#FF6B6B44":"#2a2a3a"}`}}>{d}</div>;
                        })}
                      </div>
                      <label style={lbl}>Fecha de fin (opcional)</label>
                      <input type="date" value={editingEvent.recurringEnd||""} onChange={e=>setEditingEvent(ev=>({...ev,recurringEnd:e.target.value}))} style={{...inp,width:"auto"}}/>
                      {!editingEvent.recurringEnd&&<div style={{fontSize:10,color:"#444",marginTop:3}}>Sin fecha de fin — se repite indefinidamente</div>}
                    </div>
                  )}
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <label style={lbl}>{editingEvent.recurring?"Fecha inicio":"Fecha"}</label>
                  <input type="date" value={editingEvent.date} onChange={e=>setEditingEvent(ev=>({...ev,date:e.target.value}))} style={inp}/>
                </div>
                {editingEvent.category!=="birthday"&&<div style={{width:100}}>
                  <label style={lbl}>Hora inicio</label>
                  <input type="time" value={editingEvent.time} onChange={e=>setEditingEvent(ev=>({...ev,time:e.target.value}))} style={inp}/>
                </div>}
                {editingEvent.category!=="birthday"&&<div style={{width:100}}>
                  <label style={lbl}>Hora fin <span style={{color:"#444",fontWeight:400}}>(opcional)</span></label>
                  <input type="time" value={editingEvent.timeEnd||""} onChange={e=>setEditingEvent(ev=>({...ev,timeEnd:e.target.value}))} style={inp}/>
                </div>}
              </div>
              <div>
                <label style={lbl}>Categoría</label>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {CATEGORIES.map(c=><div key={c.id} onClick={()=>setEditingEvent(ev=>({...ev,category:c.id,color:c.color}))} style={{padding:"4px 9px",borderRadius:20,fontSize:11,cursor:"pointer",background:editingEvent.category===c.id?c.color+"33":"#1a1a22",color:editingEvent.category===c.id?c.color:"#666",border:`1px solid ${editingEvent.category===c.id?c.color+"44":"#2a2a3a"}`,fontWeight:editingEvent.category===c.id?600:400}}>{c.icon} {c.label}</div>)}
                </div>
              </div>
              <div>
                <label style={lbl}>Participantes</label>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {groupMembers.map(m=>(
                    <div key={m.id} onClick={()=>toggleAttendee(m.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:20,cursor:"pointer",background:editingEvent.attendees?.includes(m.id)?m.color+"22":"#1a1a22",border:`1px solid ${editingEvent.attendees?.includes(m.id)?m.color+"44":"#2a2a3a"}`}}>
                      <div style={{width:14,height:14,borderRadius:"50%",background:m.color,fontSize:6,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{m.avatar}</div>
                      <span style={{fontSize:11,color:editingEvent.attendees?.includes(m.id)?m.color:"#666",fontWeight:editingEvent.attendees?.includes(m.id)?600:400}}>{m.display_name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Notas</label>
                <textarea value={editingEvent.notes} onChange={e=>setEditingEvent(ev=>({...ev,notes:e.target.value}))} placeholder="Detalles adicionales..." rows={2} style={{...inp,resize:"none"}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                {editingEvent.id&&<button onClick={()=>{if(editingEvent.recurring)setDeleteDialog({baseId:editingEvent.id,isBase:true});else confirmDelete(editingEvent.id,null,null);}} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"9px 12px",fontSize:12,fontWeight:600}}>Eliminar</button>}
                <button onClick={saveEvent} style={{flex:1,background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:700}}>{editingEvent.id?"Guardar":"Crear evento"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      {deleteDialog&&(
        <div className="modal-overlay" style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div className="modal-box" style={{background:"#131318",borderRadius:16,padding:22,maxWidth:320,width:"100%",border:"1px solid #2a2a3a"}}>
            <h3 style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"#fff",marginBottom:6}}>Eliminar evento rutinario</h3>
            <p style={{fontSize:12,color:"#888",marginBottom:16,lineHeight:1.6}}>¿Qué querés eliminar?</p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {!deleteDialog.isBase&&<button onClick={()=>confirmDelete(deleteDialog.baseId,"one",deleteDialog.virtualDate)} style={{background:"#1e1e2a",color:"#e8e8f0",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px",fontSize:13,fontWeight:500,textAlign:"left"}}>Solo esta ocurrencia</button>}
              <button onClick={()=>confirmDelete(deleteDialog.baseId,"all",null)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"10px",fontSize:13,fontWeight:600,textAlign:"left"}}>Toda la serie</button>
              <button onClick={()=>setDeleteDialog(null)} style={{background:"transparent",color:"#666",border:"none",borderRadius:10,padding:"8px",fontSize:13}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
