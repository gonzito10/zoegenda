import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";
import Search from "./Search";
import { COLORS, resolveTheme, themeVars, storedTheme, themeBgStyle, CATEGORIES } from "./app/constants";
import { getDaysInMonth, getFirstDay, fmt, parse, initials, expandRecurring } from "./app/utils";
import { getProfile, upsertProfile, getMyGroups, getGroupMembers, getGroupEvents, saveGroupEvents, createGroup, joinGroup } from "./app/api";
import { BASE_CSS, Logo } from "./app/styles";
import HeaderBar from "./app/HeaderBar";
import ProfilePanel from "./app/ProfilePanel";
import MainTabsBar from "./app/MainTabsBar";
import NotifPanel from "./app/NotifPanel";
import AppBody from "./app/AppBody";
import ActionBar from "./app/ActionBar";
import EventModal from "./app/EventModal";
import DeleteDialog from "./app/DeleteDialog";
import LoginScreen from "./app/LoginScreen";
import SetupScreen from "./app/SetupScreen";
import GroupsScreen from "./app/GroupsScreen";
import { getPushState, enablePush, disablePush } from "./push.js";

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
  const [pushState, setPushState] = useState("off"); // on | off | denied | unsupported
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  function goTo(type, p) {
    setShowSearch(false);
    if (type === "event") {
      if (!p.date) return;
      const d = parse(p.date);
      setSelectedDate(p.date); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
      setMainTab("agenda"); setView("day"); return;
    }
    const tab = type === "expense" ? "expenses" : type === "list" ? "lists" : "notes";
    const detail = { type, ...p };
    window.__zgNav = detail;
    setMainTab(tab);
    setTimeout(() => document.dispatchEvent(new CustomEvent("zgNavigate", { detail })), 80);
  }

  const [systemLight, setSystemLight] = useState(()=>{ try{ return window.matchMedia("(prefers-color-scheme: light)").matches; }catch(e){ return false; } });
  useEffect(()=>{
    let mq; try{ mq = window.matchMedia("(prefers-color-scheme: light)"); }catch(e){ return; }
    const fn = e => setSystemLight(e.matches);
    mq.addEventListener ? mq.addEventListener("change",fn) : mq.addListener(fn);
    return ()=>{ mq.removeEventListener ? mq.removeEventListener("change",fn) : mq.removeListener(fn); };
  },[]);
  const themeId = profile?.theme || storedTheme() || "default";
  const theme = resolveTheme(themeId, systemLight);
  const T = theme; // shorthand
  useEffect(()=>{
    const vars = themeVars(T);
    const root = document.documentElement;
    Object.entries(vars).forEach(([k,v])=>root.style.setProperty(k,v));
    root.style.colorScheme = T.light ? "light" : "dark";
    document.body.style.background = T.bg;
    const m = document.querySelector('meta[name="theme-color"]'); if(m) m.setAttribute("content", T.bg);
    try{ localStorage.setItem("zg_theme", themeId); }catch(e){}
  },[T, themeId]);

  // Group create/join
  const [groupAction,   setGroupAction]   = useState(null); // "create"|"join"
  const [groupName,     setGroupName]     = useState("");
  const [groupCode,     setGroupCode]     = useState("");
  const [groupError,    setGroupError]    = useState("");
  const [groupLoading,  setGroupLoading]  = useState(false);

  // Calendar
  const [mainTab,      setMainTab]      = useState("home"); // home|agenda|expenses|lists|notes
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

  // ── Avisos push: estado y apertura desde la notificación ───────────────
  useEffect(() => { getPushState().then(setPushState); }, [authUser?.id]);
  useEffect(() => {
    function openDay(day) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) return;
      const d = parse(day);
      setSelectedDate(day); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear());
      setMainTab("agenda"); setView("day");
    }
    const fromUrl = new URLSearchParams(window.location.search).get("day");
    if (fromUrl && activeGroup) { openDay(fromUrl); window.history.replaceState({}, "", "/"); }
    const onMsg = e => {
      if (e.data?.type === "open-day") {
        try { openDay(new URL(e.data.url, window.location.origin).searchParams.get("day")); } catch (err) {}
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, [activeGroup?.id]);
  async function togglePush() {
    setPushBusy(true); setPushMsg("");
    try {
      if (pushState === "on") setPushState(await disablePush());
      else {
        const r = await enablePush(authUser.id);
        setPushState(r);
        if (r === "denied") setPushMsg("Permiso denegado. Habilitalo en los ajustes del navegador o del celular.");
      }
    } catch (e) { setPushMsg("No se pudo activar: " + (e.message || e)); }
    setPushBusy(false);
  }

  // ── Notification check: events with alarms ────────────────────────────
  useEffect(() => {
    if (!events.length || !activeGroup) return;
    const alarmed = [];
    events.forEach(ev => {
      // Rutinas sin alarma activada: ignorar por defecto
      if (ev.recurring && !ev.alarmDays) return;
      // Eventos sin alarma: ignorar
      if (!ev.alarmDays) return;
      const days = parseInt(ev.alarmDays); // 1, 2, o 7
      const target = new Date(today);
      target.setDate(target.getDate() + days);
      const targetStr = fmt(target);
      if (ev.recurring) {
        const instances = expandRecurring(ev, targetStr, targetStr);
        if (instances.length > 0) alarmed.push({...ev, _alarmDate: targetStr});
      } else {
        if (ev.date === targetStr) alarmed.push({...ev, _alarmDate: targetStr});
      }
    });
    setNotifications(alarmed);
    // No auto-abrir el panel — solo mostrar campana
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

  // Rutinas semanales: eventos con recurring=true y recurringYearly=false
  const weeklyRoutines = useMemo(() => {
    return events.filter(ev => ev.recurring && !ev.recurringYearly);
  }, [events]);

  const agendaDates       = [...new Set(monthEvents.map(e=>e.date))];
  const selectedDayEvents = eventsForDate(selectedDate);

  const member = id => groupMembers.find(m=>m.id===id) || {display_name:"?",avatar:"?",color:"var(--g5)"};
  const cat    = id => CATEGORIES.find(c=>c.id===id) || CATEGORIES[4];

  // ── Event CRUD ───────────────────────────────────────────────────────────
  function openNew(date) {
    const d = date ? parse(date) : parse(selectedDate);
    setEditingEvent({ id:null, title:"", date:date||selectedDate, time:"09:00", timeEnd:"", category:"work", attendees:[authUser.id], notes:"", color:"#FF6B6B", recurring:false, recurringDays:[d.getDay()], recurringEnd:"", birthdayPerson:"", alarmDays:"" });
    setShowEventModal(true);
  }
  function openEdit(ev) {
    if (ev._virtual) {
      const base = events.find(e=>e.id===ev._recurringBase);
      setEditingEvent(base ? {...base, _editingVirtualDate:ev.date} : {...ev});
    } else {
      setEditingEvent({...ev, recurringDays:ev.recurringDays||[], recurringEnd:ev.recurringEnd||"", timeEnd:ev.timeEnd||"", birthdayPerson:ev.birthdayPerson||"", alarmDays:ev.alarmDays||""});
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

  const ctxS = { T, activeGroup, agendaDates, authEmail, authError, authLoading, authPassword, authUser, cat, closeModal, confirmDelete, currentMonth, currentYear, deleteDialog, editingEvent, events, eventsForDate, filterCat, filterEvs, filterUser, goTo, groupAction, groupCode, groupError, groupLoading, groupMembers, groupName, groups, handleAuthUser, handleCreateGroup, handleJoinGroup, mainTab, member, monthEvents, nextMonth, notifications, openEdit, openNew, prevMonth, profile, pushBusy, pushMsg, pushState, rangeEnd, rangeStart, saveEvent, saveProfile, saveTheme, screen, selectedDate, selectedDayEvents, setActiveGroup, setAuthEmail, setAuthError, setAuthLoading, setAuthPassword, setAuthUser, setCurrentMonth, setCurrentYear, setDeleteDialog, setEditingEvent, setEvents, setFilterCat, setFilterUser, setGroupAction, setGroupCode, setGroupError, setGroupLoading, setGroupMembers, setGroupName, setGroups, setMainTab, setNotifications, setProfile, setPushBusy, setPushMsg, setPushState, setScreen, setSelectedDate, setSetupColor, setSetupError, setSetupName, setShowEventModal, setShowGroupPanel, setShowNotifPanel, setShowSearch, setShowThemePanel, setSystemLight, setView, setupColor, setupError, setupName, showEventModal, showGroupPanel, showNotifPanel, showSearch, showThemePanel, signIn, signOut, signUp, systemLight, theme, themeId, today, toggleAttendee, togglePush, toggleRecurringDay, view, weeklyRoutines };
  // ── SCREEN: loading ───────────────────────────────────────────────────────
  if (screen==="loading") return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{BASE_CSS}</style><Logo size={26}/>
    </div>
  );

  // ── SCREEN: login / register ──────────────────────────────────────────────
  if (screen==="login"||screen==="register") return <LoginScreen ctx={ctxS}/>;

  // ── SCREEN: setup profile ─────────────────────────────────────────────────
  if (screen==="setup") return <SetupScreen ctx={ctxS}/>;

  // ── SCREEN: groups manager ────────────────────────────────────────────────
  if (screen==="groups") return <GroupsScreen ctx={ctxS}/>;

  // ── SCREEN: app ───────────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay    = getFirstDay(currentYear, currentMonth);



  // ── Semana View (rutinas semanales estilo agenda) ──────────────────────




  const ctx = { T, activeGroup, agendaDates, authEmail, authError, authLoading, authPassword, authUser, cat, closeModal, confirmDelete, currentMonth, currentYear, daysInMonth, deleteDialog, editingEvent, events, eventsForDate, filterCat, filterEvs, filterUser, firstDay, goTo, groupAction, groupCode, groupError, groupLoading, groupMembers, groupName, groups, handleAuthUser, handleCreateGroup, handleJoinGroup, mainTab, member, monthEvents, nextMonth, notifications, openEdit, openNew, prevMonth, profile, pushBusy, pushMsg, pushState, rangeEnd, rangeStart, saveEvent, saveProfile, saveTheme, screen, selectedDate, selectedDayEvents, setActiveGroup, setAuthEmail, setAuthError, setAuthLoading, setAuthPassword, setAuthUser, setCurrentMonth, setCurrentYear, setDeleteDialog, setEditingEvent, setEvents, setFilterCat, setFilterUser, setGroupAction, setGroupCode, setGroupError, setGroupLoading, setGroupMembers, setGroupName, setGroups, setMainTab, setNotifications, setProfile, setPushBusy, setPushMsg, setPushState, setScreen, setSelectedDate, setSetupColor, setSetupError, setSetupName, setShowEventModal, setShowGroupPanel, setShowNotifPanel, setShowSearch, setShowThemePanel, setSystemLight, setView, setupColor, setupError, setupName, showEventModal, showGroupPanel, showNotifPanel, showSearch, showThemePanel, signIn, signOut, signUp, systemLight, theme, themeId, today, toggleAttendee, togglePush, toggleRecurringDay, view, weeklyRoutines };
  return (
    <div style={{height:"100vh",...themeBgStyle(T),fontFamily:"DM Sans,'Segoe UI',sans-serif",color:T.text,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{BASE_CSS}</style>

      <HeaderBar ctx={ctx}/>

      <ProfilePanel ctx={ctx}/>

      <MainTabsBar ctx={ctx}/>

      {/* ── NOTIFICATION PANEL — solo en sección agenda ── */}
      {showSearch && <Search groupId={activeGroup?.id} events={events} onGo={goTo} onClose={()=>setShowSearch(false)}/>}
      <NotifPanel ctx={ctx}/>

      {/* ── BODY ── */}
      <AppBody ctx={ctx}/>

      {/* ── BARRA DE ACCIÓN INFERIOR ── */}
      <ActionBar ctx={ctx}/>

      {/* ── EVENT MODAL ── */}
      <EventModal ctx={ctx}/>

      {/* Delete dialog */}
      <DeleteDialog ctx={ctx}/>
    </div>
  );
}
