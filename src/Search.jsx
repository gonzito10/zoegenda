import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const inp = {background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"12px 14px",color:"var(--text)",fontSize:14,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const fmtDay = d => { const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const fmtMoney = n => "$" + Math.round(n).toLocaleString("es-AR");
const esc = q => q.replace(/[%_,()]/g, " ").trim();

function snippet(text, q) {
  const t = (text || "").replace(/\s+/g, " ");
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return t.slice(0, 70);
  const start = Math.max(0, i - 25);
  return (start > 0 ? "…" : "") + t.slice(start, start + 80) + (start + 80 < t.length ? "…" : "");
}

export default function Search({ groupId, events, onGo, onClose }) {
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const term = esc(q);
    if (term.length < 2) { setRes(null); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      const like = `%${term}%`;
      const lower = term.toLowerCase();
      const { data: lists } = await supabase.from("lists").select("id,name,icon").eq("group_id", groupId);
      const listIds = (lists || []).map(l => l.id);
      const [ex, nt, it] = await Promise.all([
        supabase.from("expenses").select("id,description,amount,date,category").eq("group_id", groupId).ilike("description", like).order("date", { ascending: false }).limit(15),
        supabase.from("notes").select("id,title,content,kind").eq("group_id", groupId).or(`title.ilike.${like},content.ilike.${like}`).limit(15),
        listIds.length ? supabase.from("list_items").select("id,text,list_id,selected").in("list_id", listIds).ilike("text", like).limit(20) : Promise.resolve({ data: [] }),
      ]);
      const evs = (events || []).filter(e => (e.title || "").toLowerCase().includes(lower) || (e.notes || "").toLowerCase().includes(lower))
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 15);
      const listMatches = (lists || []).filter(l => l.name.toLowerCase().includes(lower));
      setRes({
        events: evs, expenses: ex.data || [], notes: nt.data || [],
        items: (it.data || []).map(i => ({ ...i, list: (lists || []).find(l => l.id === i.list_id) })),
        lists: listMatches,
      });
      setBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, groupId, events]);

  const total = res ? res.events.length + res.expenses.length + res.notes.length + res.items.length + res.lists.length : 0;
  const Section = ({ title, children }) => (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:"var(--g5)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"4px 0 6px"}}>{title}</div>
      {children}
    </div>
  );
  const Row = ({ icon, title, sub, right, onClick }) => (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,marginBottom:5,cursor:"pointer"}}>
      <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</div>
        {sub && <div style={{fontSize:11,color:"var(--g5)",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</div>}
      </div>
      {right && <div style={{fontSize:12,fontWeight:700,color:"var(--g8)",flexShrink:0}}>{right}</div>}
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"var(--bg)",zIndex:300,display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",gap:8,padding:"12px 14px",borderBottom:"1px solid var(--border)",alignItems:"center"}}>
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en gastos, notas, eventos y listados…" style={inp}
          onKeyDown={e => e.key === "Escape" && onClose()}/>
        <button onClick={onClose} style={{background:"var(--border)",border:"none",color:"var(--ga)",width:34,height:34,borderRadius:"50%",fontSize:16,cursor:"pointer",flexShrink:0}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 40px",maxWidth:600,width:"100%",margin:"0 auto"}}>
        {!res && <div style={{textAlign:"center",color:"var(--g4)",fontSize:13,padding:"40px 10px"}}>{busy ? "Buscando…" : "Escribí al menos 2 letras."}</div>}
        {res && total === 0 && <div style={{textAlign:"center",color:"var(--g4)",fontSize:13,padding:"40px 10px"}}>{busy ? "Buscando…" : `Sin resultados para “${q.trim()}”.`}</div>}
        {res && res.events.length > 0 && <Section title="📅 Eventos">
          {res.events.map(e => <Row key={e.id} icon="📅" title={e.title} sub={`${e.date ? fmtDay(e.date) : ""}${e.time ? " · " + e.time : ""}${e.recurring ? " · 🔁 rutina" : ""}`} onClick={() => onGo("event", { date: e.date })}/>)}
        </Section>}
        {res && res.expenses.length > 0 && <Section title="💸 Gastos">
          {res.expenses.map(e => <Row key={e.id} icon="💸" title={e.description} sub={`📅 ${fmtDay(e.date)}`} right={fmtMoney(e.amount)} onClick={() => onGo("expense", { date: e.date })}/>)}
        </Section>}
        {res && (res.items.length > 0 || res.lists.length > 0) && <Section title="📝 Listados">
          {res.lists.map(l => <Row key={l.id} icon={l.icon || "📋"} title={l.name} sub="Listado" onClick={() => onGo("list", { id: l.id })}/>)}
          {res.items.map(i => <Row key={i.id} icon="•" title={i.text} sub={`${i.list?.icon || ""} ${i.list?.name || ""}${i.selected ? " · seleccionado" : ""}`} onClick={() => onGo("list", { id: i.list_id })}/>)}
        </Section>}
        {res && res.notes.length > 0 && <Section title="📓 Notas">
          {res.notes.map(n => <Row key={n.id} icon={n.kind === "checklist" ? "☑" : "📓"} title={n.title} sub={snippet(n.content, q.trim())} onClick={() => onGo("note", { id: n.id })}/>)}
        </Section>}
      </div>
    </div>
  );
}
