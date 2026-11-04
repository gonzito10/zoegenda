import Icon from "./app/Icon";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { fmt, parse } from "./app/utils";

const inp = {background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"11px 13px",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const lbl = {fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};

const NOTE_COLORS = ["#FF6B6B","#FFB347","#FFEAA7","#96CEB4","#4ECDC4","#45B7D1","#DDA0DD"];

// Tipos de anotador: cada tipo trae su plantilla inicial
const NOTE_LIST_TYPES = {
  notes: {
    label:"Notas", icon:"📝", desc:"Notas de texto libre o checklists",
    kindChoice:true, kind:"text", template:"", placeholder:"Escribí tu nota acá...",
    emptyText:"No hay notas en este anotador todavía",
  },
  recipe: {
    label:"Receta", icon:"🍳", desc:"Cada nota es una receta, con ingredientes y pasos",
    kindChoice:false, kind:"text", template:"Ingredientes\n- \n\nPasos\n1. \n", placeholder:"Ingredientes y pasos de la receta...",
    emptyText:"No hay recetas en este anotador todavía",
  },
  reminders: {
    label:"Recordatorios", icon:"⏰", desc:"Cosas para recordar, con fecha opcional",
    kindChoice:false, kind:"checklist", template:"", placeholder:"",
    emptyText:"No hay recordatorios en este anotador todavía", hasDate:true,
  },
};
const LIST_ICON_CHOICES = ["📝","🍳","⏰","📚","🏠","✈️","💡","🎁","🛒","💼","❤️","⭐","🍰","🥗","💊","🎓"];

async function loadNoteLists(groupId) {
  const { data } = await supabase.from("note_lists").select("*").eq("group_id", groupId).order("created_at");
  return data || [];
}
async function createNoteList(groupId, userId, name, icon, type) {
  const { data } = await supabase.from("note_lists").insert({ group_id: groupId, created_by: userId, name, icon, type }).select().single();
  return data;
}
async function updateNoteList(id, fields) {
  await supabase.from("note_lists").update(fields).eq("id", id);
}
async function deleteNoteList(id) {
  await supabase.from("note_lists").delete().eq("id", id);
}

async function loadNotes(groupId) {
  const { data } = await supabase.from("notes").select("*").eq("group_id", groupId).order("updated_at", { ascending: false });
  return sortNotes(data || []);
}
function sortNotes(ns) {
  return [...ns].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.updated_at).localeCompare(String(a.updated_at)));
}
// En los listados de recordatorios se ordena por fecha (los que no tienen fecha, al final)
function sortReminders(ns) {
  return [...ns].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    || (a.remind_on ? 0 : 1) - (b.remind_on ? 0 : 1)
    || String(a.remind_on || "").localeCompare(String(b.remind_on || ""))
    || String(b.updated_at).localeCompare(String(a.updated_at)));
}
async function createNote(groupId, userId, title, kind, color, listId, content) {
  const { data } = await supabase.from("notes").insert({ group_id: groupId, created_by: userId, title, content: content || "", kind: kind || "text", color: color || null, list_id: listId || null }).select().single();
  return data;
}
// Estado de la fecha de un recordatorio: texto y color
function remindStatus(d) {
  if (!d) return null;
  const today = fmt(new Date());
  const diff = Math.round((parse(d) - parse(today)) / 86400000);
  if (diff < 0) return { text: diff === -1 ? "Venció ayer" : `Venció hace ${-diff} días`, color: "var(--danger)" };
  if (diff === 0) return { text: "Hoy", color: "var(--warn)" };
  if (diff === 1) return { text: "Mañana", color: "var(--warn)" };
  return { text: parse(d).toLocaleDateString("es-AR", { day:"numeric", month:"short" }), color: "var(--g5)" };
}

// Checklist: se guarda como texto, una línea por ítem: "- [ ] algo" / "- [x] algo"
function parseChecklist(text) {
  return (text || "").split("\n").filter(l => l.trim()).map(l => {
    const m = l.match(/^- \[( |x)\] ?(.*)$/);
    return m ? { done: m[1] === "x", text: m[2] } : { done: false, text: l };
  });
}
function serializeChecklist(items) {
  return items.map(i => `- [${i.done ? "x" : " "}] ${i.text}`).join("\n");
}
async function updateNote(id, fields) {
  await supabase.from("notes").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
}
async function deleteNote(id) {
  await supabase.from("notes").delete().eq("id", id);
}

export default function Notes({ groupId, currentUserId }) {
  const [notes,       setNotes]       = useState([]);
  const [activeNote,  setActiveNote]  = useState(null); // id
  const [content,     setContent]     = useState("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [newTitle,    setNewTitle]    = useState("");
  const [showDelete,  setShowDelete]  = useState(null);
  const [editingTitle,setEditingTitle]= useState(false);
  const [titleDraft,  setTitleDraft]  = useState("");
  const [newKind,     setNewKind]     = useState("text");
  const [newColor,    setNewColor]    = useState(null);
  const [newItem,     setNewItem]     = useState("");

  // Anotadores (listas de notas)
  const [noteLists,   setNoteLists]   = useState([]);
  const [activeListId,setActiveListId]= useState("none"); // "none" (notas sin anotador) | id del anotador
  const [newListId,   setNewListId]   = useState("");    // listado elegido al crear una nota ("" = sin listado)
  const [showListModal,setShowListModal]= useState(false);
  const [editingList, setEditingList] = useState(null);
  const [listName,    setListName]    = useState("");
  const [listType,    setListType]    = useState("notes");
  const [listIcon,    setListIcon]    = useState("📝");
  const [showDeleteList,setShowDeleteList]= useState(null);

  const saveTimer = useRef(null);
  const contentRef = useRef(content);
  contentRef.current = content;
  const activeListRef = useRef(activeListId);
  activeListRef.current = activeListId;

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    Promise.all([loadNotes(groupId), loadNoteLists(groupId)]).then(([ns, ls]) => {
      setNotes(ns);
      setNoteLists(ls);
      const nav = window.__zgNav;
      const target = nav?.type === "note" ? ns.find(n => n.id === nav.id) : null;
      if (nav?.type === "note") window.__zgNav = null;
      const listId = target ? (target.list_id || "none") : (ls[0]?.id || "none");
      setActiveListId(listId);
      const inList = ns.filter(n => listId === "none" ? !n.list_id : n.list_id === listId);
      const first = target || inList[0];
      if (first) { setActiveNote(first.id); setContent(first.content || ""); }
      setLoading(false);
    });

    const sub = supabase.channel(`notes-${groupId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"notes", filter:`group_id=eq.${groupId}` }, () =>
        loadNotes(groupId).then(ns => setNotes(ns)))
      .on("postgres_changes", { event:"*", schema:"public", table:"note_lists", filter:`group_id=eq.${groupId}` }, () =>
        loadNoteLists(groupId).then(ls => {
          setNoteLists(ls);
          const cur = activeListRef.current;
          if (cur !== "none" && !ls.some(l => l.id === cur)) setActiveListId(ls[0]?.id || "none");
        }))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [groupId]);

  // Listener de la barra de acción ("Nueva nota") y del buscador
  useEffect(() => {
    const handler = () => {
      const cur = activeListRef.current;
      setNewTitle(""); setNewKind("text"); setNewColor(null);
      setNewListId(cur !== "none" ? cur : "");
      setShowModal(true);
    };
    document.addEventListener("openNoteModal", handler);
    const nav = e => {
      if (e.detail?.type !== "note") return;
      setNotes(ns => { const n = ns.find(x => x.id === e.detail.id); if (n) { window.__zgNav = null; setActiveListId(n.list_id || "none"); setActiveNote(n.id); setContent(n.content || ""); } return ns; });
    };
    document.addEventListener("zgNavigate", nav);
    return () => { document.removeEventListener("openNoteModal", handler); document.removeEventListener("zgNavigate", nav); };
  }, []);

  // Auto-save on content change (debounced 1.5s)
  // Also saves on visibilitychange so content persists when switching apps
  const saveContent = useCallback(async (id, text) => {
    if (!id) return;
    setSaving(true);
    await updateNote(id, { content: text });
    setSaving(false);
  }, []);

  useEffect(() => {
    if (!activeNote) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveContent(activeNote, content), 1500);
    return () => clearTimeout(saveTimer.current);
  }, [content, activeNote, saveContent]);

  // Save immediately when app goes to background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && activeNote) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveContent(activeNote, contentRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [activeNote, saveContent]);

  function selectNote(note) {
    // Save current before switching
    if (activeNote && saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveContent(activeNote, contentRef.current);
    }
    setActiveNote(note.id);
    setContent(note.content || "");
  }

  // Tipo del listado elegido al crear una nota (si no hay listado, se comporta como "Notas")
  const newListObj = noteLists.find(l => l.id === newListId);
  const newType = NOTE_LIST_TYPES[newListObj?.type] || NOTE_LIST_TYPES.notes;

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const kind = newType.kindChoice ? newKind : newType.kind;
    const created = await createNote(groupId, currentUserId, newTitle.trim(), kind, newColor, newListObj?.id || null, newType.template);
    if (created) {
      setNotes(ns => sortNotes([created, ...ns]));
      // Si estás mirando otro listado, pasá al de la nota nueva para que la veas
      const cur = activeListRef.current;
      if (cur !== (created.list_id || "none")) setActiveListId(created.list_id || "none");
      setActiveNote(created.id);
      setContent(created.content || "");
    }
    setNewTitle(""); setShowModal(false);
  }

  // ── Listados de notas ──
  function pickList(id) {
    if (activeNote && saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveContent(activeNote, contentRef.current);
    }
    setActiveListId(id);
    const vis = notes.filter(n => id === "none" ? !n.list_id : n.list_id === id);
    const lt = noteLists.find(l => l.id === id)?.type;
    const ordered = lt === "reminders" ? sortReminders(vis) : vis;
    const first = ordered[0];
    setActiveNote(first ? first.id : null);
    setContent(first ? (first.content || "") : "");
  }
  function openNewListModal() {
    setEditingList(null); setListName(""); setListType("notes");
    setListIcon(NOTE_LIST_TYPES.notes.icon); setShowListModal(true);
  }
  function openEditListModal(l) {
    setEditingList(l); setListName(l.name); setListType(l.type || "notes");
    setListIcon(l.icon || NOTE_LIST_TYPES[l.type]?.icon || "📝"); setShowListModal(true);
  }
  function pickListType(t) {
    // Si el ícono todavía es el del tipo anterior, pasa al ícono del tipo nuevo
    if (listIcon === NOTE_LIST_TYPES[listType]?.icon) setListIcon(NOTE_LIST_TYPES[t].icon);
    setListType(t);
  }
  async function handleSaveList() {
    if (!listName.trim()) return;
    const fields = { name: listName.trim(), icon: listIcon, type: listType };
    if (editingList) {
      await updateNoteList(editingList.id, fields);
      setNoteLists(ls => ls.map(l => l.id === editingList.id ? { ...l, ...fields } : l));
    } else {
      const created = await createNoteList(groupId, currentUserId, fields.name, fields.icon, fields.type);
      if (created) { setNoteLists(ls => [...ls, created]); pickList(created.id); }
    }
    setShowListModal(false); setEditingList(null);
  }
  async function handleDeleteList(id) {
    await deleteNoteList(id);
    // Las notas del listado se borran junto con él
    const left = notes.filter(n => n.list_id !== id);
    setNotes(left);
    const remaining = noteLists.filter(l => l.id !== id);
    setNoteLists(remaining);
    const nextId = remaining[0]?.id || "none";
    setActiveListId(nextId);
    const first = left.find(n => nextId === "none" ? !n.list_id : n.list_id === nextId);
    setActiveNote(first ? first.id : null);
    setContent(first ? (first.content || "") : "");
    setShowDeleteList(null);
  }

  async function handleDeleteNote(id) {
    await deleteNote(id);
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (activeNote === id) {
      const cur = activeListRef.current;
      const inView = updated.filter(n => cur === "none" ? !n.list_id : n.list_id === cur);
      setActiveNote(inView[0]?.id || null);
      setContent(inView[0]?.content || "");
    }
    setShowDelete(null);
  }

  async function patchNote(fields) {
    if (!activeNote) return;
    await updateNote(activeNote, fields);
    setNotes(ns => sortNotes(ns.map(n => n.id === activeNote ? { ...n, ...fields } : n)));
  }

  const checklistItems = parseChecklist(content);
  function setChecklist(items) { setContent(serializeChecklist(items)); }
  function addChecklistItem() {
    const t = newItem.trim(); if (!t) return;
    setChecklist([...checklistItems, { done: false, text: t }]); setNewItem("");
  }

  async function handleSaveTitle() {
    if (!titleDraft.trim() || !activeNote) return;
    await updateNote(activeNote, { title: titleDraft.trim() });
    setNotes(ns => ns.map(n => n.id === activeNote ? {...n, title: titleDraft.trim()} : n));
    setEditingTitle(false);
  }

  const curList = noteLists.find(l => l.id === activeListId) || null;
  const looseCount = notes.filter(n => !n.list_id).length;
  const baseNotes = activeListId === "none" ? notes.filter(n => !n.list_id) : notes.filter(n => n.list_id === activeListId);
  const visibleNotes = curList?.type === "reminders" ? sortReminders(baseNotes) : baseNotes;
  const currentNote = notes.find(n => n.id === activeNote);
  const currentNoteList = noteLists.find(l => l.id === currentNote?.list_id);
  const noteType = NOTE_LIST_TYPES[currentNoteList?.type] || NOTE_LIST_TYPES.notes;
  const status = noteType.hasDate ? remindStatus(currentNote?.remind_on) : null;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";

  if (loading) return <div style={{textAlign:"center",color:"var(--g5)",padding:"50px 0"}}>Cargando notas...</div>;

  return (
    <div>
      {/* Selector de anotadores */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {[...(looseCount>0 ? [["none","Sin anotador",null]] : []), ...noteLists.map(l => [l.id, l.name, l.icon || NOTE_LIST_TYPES[l.type]?.icon || "📝"])].map(([id, name, ico]) => {
          const on = activeListId === id;
          return (
            <div key={id} onClick={()=>pickList(id)}
              style={{padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:on?"#DDA0DD22":"var(--card2)",color:on?"var(--violet)":"var(--g5)",border:`1px solid ${on?"#DDA0DD66":"var(--border2)"}`,display:"flex",alignItems:"center",gap:8}}>
              {ico && <span style={{fontSize:15}}>{ico}</span>}{name}
            </div>
          );
        })}
        <div onClick={openNewListModal}
          style={{padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:"transparent",color:"var(--g5)",border:"1px dashed var(--border2)",display:"flex",alignItems:"center",gap:4}}>
          <Icon name="plus" size={13}/> Nuevo anotador
        </div>
        {curList && (
          <>
            <button onClick={()=>openEditListModal(curList)} style={{background:"transparent",border:"none",color:"var(--g5)",cursor:"pointer",padding:"6px",display:"flex"}} aria-label="Editar anotador"><Icon name="edit" size={16}/></button>
            <button onClick={()=>setShowDeleteList(curList.id)} style={{background:"transparent",border:"none",color:"var(--g8)",cursor:"pointer",padding:"6px",display:"flex"}} aria-label="Eliminar anotador"><Icon name="trash" size={16}/></button>
          </>
        )}
      </div>

      {visibleNotes.length === 0 && (
        <div style={{textAlign:"center",color:"var(--g4)",padding:"40px 20px"}}>
          <div style={{marginBottom:12,color:"var(--g5)",display:"flex",justifyContent:"center"}}><Icon name="note" size={36}/></div>
          <div style={{marginBottom:8,fontSize:14}}>{curList ? NOTE_LIST_TYPES[curList.type]?.emptyText : "No hay notas todavía"}</div>
          <div style={{fontSize:12,color:"var(--g3)",marginBottom:20}}>Tocá "Nueva nota" para crear la primera</div>
        </div>
      )}

      {/* Selector de notas */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        {visibleNotes.map(n => {
          const on = activeNote === n.id;
          const col = n.color || "#FF6B6B";
          const left = n.kind === "checklist" ? parseChecklist(n.content).filter(i => !i.done).length : null;
          const nList = noteLists.find(l => l.id === n.list_id);
          const st = nList?.type === "reminders" ? remindStatus(n.remind_on) : null;
          return (
            <div key={n.id} onClick={()=>selectNote(n)}
              style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:on?col+"22":"var(--card2)",color:on?col:"var(--g5)",border:`1px solid ${on?col+"66":(n.color?col+"33":"var(--border2)")}`,display:"flex",alignItems:"center",gap:8}}>
              {n.pinned && <span style={{display:"flex",color:"var(--warn)"}}><Icon name="pin" size={13}/></span>}
              {n.color && !on && <span style={{width:7,height:7,borderRadius:"50%",background:col}}/>}
              {n.title}
              {left !== null && <span style={{fontSize:12,opacity:.7}}>☑ {left}</span>}
              {st && <span style={{fontSize:12,color:st.color,fontWeight:700}}>· {st.text}</span>}
            </div>
          );
        })}
      </div>

      {/* Header nota activa */}
      {currentNote && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{flex:1,minWidth:0}}>
            {editingTitle ? (
              <div style={{display:"flex",gap:8}}>
                <input value={titleDraft} onChange={e=>setTitleDraft(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")handleSaveTitle();if(e.key==="Escape")setEditingTitle(false);}}
                  style={{...inp,fontSize:16,fontWeight:600,flex:1}} autoFocus/>
                <button onClick={handleSaveTitle} style={{background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"0 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>OK</button>
              </div>
            ) : (
              <div onClick={()=>{setTitleDraft(currentNote.title);setEditingTitle(true);}}
                style={{fontFamily:"Fraunces,serif",fontSize:20,fontWeight:600,color:"var(--title)",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                {currentNote.title} <span style={{color:"var(--g5)"}}><Icon name="edit" size={13}/></span>
              </div>
            )}
            <div style={{fontSize:12,color:"var(--g4)",marginTop:2}}>
              Modificado {fmtDate(currentNote.updated_at)}
              {saving && <span style={{color:"var(--g5)",marginLeft:6}}>· Guardando...</span>}
            </div>
          </div>
          <button onClick={()=>patchNote({pinned:!currentNote.pinned})} title={currentNote.pinned?"Quitar fijado":"Fijar nota"}
            style={{background:currentNote.pinned?"#FFB34722":"transparent",border:`1px solid ${currentNote.pinned?"#FFB34755":"var(--border2)"}`,color:currentNote.pinned?"var(--warn)":"var(--g8)",borderRadius:10,cursor:"pointer",padding:"8px 10px",flexShrink:0,marginLeft:8,display:"flex"}}><Icon name="pin" size={17}/></button>
          <button onClick={()=>setShowDelete(currentNote.id)}
            title="Eliminar nota" style={{background:"#FF6B6B11",border:"1px solid #FF6B6B33",color:"var(--coral)",borderRadius:10,fontSize:13,cursor:"pointer",padding:"8px 10px",flexShrink:0,marginLeft:8,display:"flex",alignItems:"center",gap:8}}><Icon name="trash" size={16}/> Eliminar</button>
        </div>
      )}

      {/* Fecha del recordatorio (solo en listados de recordatorios) */}
      {currentNote && noteType.hasDate && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          <label style={{...lbl,marginBottom:0}}>Fecha</label>
          <input type="date" value={currentNote.remind_on || ""} onChange={e=>patchNote({remind_on:e.target.value || null})}
            style={{...inp,width:"auto",fontSize:16,padding:"7px 10px"}}/>
          {currentNote.remind_on && (
            <button onClick={()=>patchNote({remind_on:null})} style={{background:"transparent",border:"none",color:"var(--g5)",fontSize:12,cursor:"pointer",padding:"6px"}}>Quitar fecha</button>
          )}
          {status && <span style={{fontSize:12,fontWeight:700,color:status.color}}>{status.text}</span>}
        </div>
      )}

      {/* Color de la nota */}
      {currentNote && (
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div onClick={()=>patchNote({color:null})} title="Sin color"
            style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${!currentNote.color?"var(--title)":"var(--border2)"}`,cursor:"pointer",fontSize:10,color:"var(--g6)",display:"flex",alignItems:"center",justifyContent:"center"}}>∅</div>
          {NOTE_COLORS.map(c=>(
            <div key={c} onClick={()=>patchNote({color:c})}
              style={{width:20,height:20,borderRadius:"50%",background:c,cursor:"pointer",border:`2px solid ${currentNote.color===c?"var(--title)":"transparent"}`}}/>
          ))}
        </div>
      )}

      {/* Contenido */}
      {activeNote && currentNote?.kind === "checklist" ? (
        <div style={{background:"var(--card)",border:`1px solid ${currentNote.color?currentNote.color+"55":"var(--border)"}`,borderRadius:10,padding:12}}>
          {checklistItems.length === 0 && <div style={{textAlign:"center",color:"var(--g4)",fontSize:12,padding:"10px 0"}}>Agregá el primer ítem abajo</div>}
          {checklistItems.map((it, idx) => (
            <div key={idx} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 2px",borderBottom:"1px solid var(--border)"}}>
              <div onClick={()=>setChecklist(checklistItems.map((x,i)=>i===idx?{...x,done:!x.done}:x))}
                style={{width:20,height:20,borderRadius:6,flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700,background:it.done?(currentNote.color||"#96CEB4"):"transparent",border:`2px solid ${it.done?(currentNote.color||"#96CEB4"):"var(--border3)"}`}}>{it.done?"✓":""}</div>
              <input value={it.text} onChange={e=>setChecklist(checklistItems.map((x,i)=>i===idx?{...x,text:e.target.value}:x))}
                style={{flex:1,background:"transparent",border:"none",outline:"none",color:it.done?"var(--g5)":"var(--text)",textDecoration:it.done?"line-through":"none",fontSize:14,fontFamily:"DM Sans,sans-serif",minWidth:0}}/>
              <button onClick={()=>setChecklist(checklistItems.filter((_,i)=>i!==idx))}
                style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:18,cursor:"pointer",lineHeight:1,padding:"0 4px"}}>×</button>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <input value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addChecklistItem()}
              placeholder="Nuevo ítem..." style={{...inp,flex:1,padding:"9px 12px"}}/>
            <button onClick={addChecklistItem} style={{background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"0 16px",fontSize:18,fontWeight:700,cursor:"pointer"}}>+</button>
          </div>
          {checklistItems.some(i=>i.done) && (
            <button onClick={()=>setChecklist(checklistItems.filter(i=>!i.done))}
              style={{marginTop:10,background:"#96CEB422",color:"var(--ok)",border:"1px solid #96CEB444",borderRadius:10,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Quitar completados</button>
          )}
        </div>
      ) : activeNote && (
        <textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          placeholder={noteType.placeholder}
          style={{...inp, minHeight:320, resize:"none", lineHeight:1.6, fontSize:14, borderColor:currentNote?.color?currentNote.color+"55":undefined}}
        />
      )}

      {/* Modal nueva nota */}
      {showModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"var(--card)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid var(--border2)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)"}}>Nueva nota</h2>
              <button onClick={()=>setShowModal(false)} style={{background:"var(--border)",border:"none",color:"var(--ga)",width:26,height:26,borderRadius:"50%",fontSize:14,cursor:"pointer"}}>×</button>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Nombre</label>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleCreate()}
                placeholder="Ej: Ideas, Recetas, Plan de vacaciones..."
                style={inp} autoFocus/>
            </div>
            {noteLists.length > 0 && (
              <div style={{marginBottom:14}}>
                <label style={lbl}>Anotador</label>
                <select value={newListId} onChange={e=>setNewListId(e.target.value)}
                  style={{...inp,fontSize:16,cursor:"pointer"}}>
                  <option value="">Sin anotador</option>
                  {noteLists.map(l => <option key={l.id} value={l.id}>{(l.icon || NOTE_LIST_TYPES[l.type]?.icon)} {l.name} · {NOTE_LIST_TYPES[l.type]?.label}</option>)}
                </select>
              </div>
            )}
            {newType.kindChoice ? (
              <div style={{marginBottom:14}}>
                <label style={lbl}>Tipo</label>
                <div style={{display:"flex",gap:8}}>
                  {[["text","📝 Texto libre"],["checklist","☑ Checklist"]].map(([v,l])=>(
                    <div key={v} onClick={()=>setNewKind(v)}
                      style={{flex:1,textAlign:"center",padding:"9px",borderRadius:10,fontSize:12,fontWeight:newKind===v?700:500,cursor:"pointer",background:newKind===v?"#FF6B6B22":"var(--card2)",color:newKind===v?"var(--coral)":"var(--g6)",border:`1px solid ${newKind===v?"#FF6B6B55":"var(--border2)"}`}}>{l}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{marginBottom:14,fontSize:12,color:"var(--g5)"}}>
                {newType.icon} {newType.label}: {newListObj?.type==="recipe" ? "arranca con Ingredientes y Pasos." : "se arma como checklist, y le podés poner fecha."}
              </div>
            )}
            <div style={{marginBottom:16}}>
              <label style={lbl}>Color</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div onClick={()=>setNewColor(null)} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${!newColor?"var(--title)":"var(--border2)"}`,cursor:"pointer",fontSize:11,color:"var(--g6)",display:"flex",alignItems:"center",justifyContent:"center"}}>∅</div>
                {NOTE_COLORS.map(c=>(
                  <div key={c} onClick={()=>setNewColor(c)} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:`2px solid ${newColor===c?"var(--title)":"transparent"}`}}/>
                ))}
              </div>
            </div>
            <button onClick={handleCreate}
              style={{width:"100%",background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              Crear nota
            </button>
          </div>
        </div>
      )}

      {/* Modal nuevo/editar anotador */}
      {showListModal && (
        <div onClick={e=>{if(e.target===e.currentTarget){setShowListModal(false);setEditingList(null);}}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"var(--card)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid var(--border2)",maxHeight:"88vh",overflow:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)"}}>{editingList?"Editar anotador":"Nuevo anotador"}</h2>
              <button onClick={()=>{setShowListModal(false);setEditingList(null);}} style={{background:"var(--border)",border:"none",color:"var(--ga)",width:26,height:26,borderRadius:"50%",fontSize:14,cursor:"pointer"}}>×</button>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Tipo de anotador</label>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {Object.entries(NOTE_LIST_TYPES).map(([k,t])=>{
                  const on = listType===k;
                  return (
                    <div key={k} onClick={()=>pickListType(k)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"9px 12px",borderRadius:10,cursor:"pointer",background:on?"#DDA0DD11":"var(--bg)",border:`1px solid ${on?"#DDA0DD66":"var(--border)"}`}}>
                      <span style={{fontSize:20}}>{t.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:on?"var(--violet)":"var(--text)"}}>{t.label}</div>
                        <div style={{fontSize:12,color:"var(--g5)",marginTop:1}}>{t.desc}</div>
                      </div>
                      {on && <span style={{color:"var(--violet)",fontSize:14}}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Nombre</label>
              <input value={listName} onChange={e=>setListName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleSaveList()}
                placeholder="Ej: Recetas de la abuela, Para el viaje, Trámites..." style={inp} autoFocus/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>Ícono</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {LIST_ICON_CHOICES.map(ico=>(
                  <div key={ico} onClick={()=>setListIcon(ico)}
                    style={{width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,fontSize:20,cursor:"pointer",background:listIcon===ico?"#DDA0DD22":"var(--card2)",border:`1.5px solid ${listIcon===ico?"#DDA0DD":"transparent"}`}}>{ico}</div>
                ))}
              </div>
            </div>
            <button onClick={handleSaveList}
              style={{width:"100%",background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              {editingList?"Guardar cambios":"Crear anotador"}
            </button>
          </div>
        </div>
      )}

      {/* Confirmar eliminar anotador */}
      {showDeleteList && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowDeleteList(null)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--card)",borderRadius:16,padding:24,width:"100%",maxWidth:340,border:"1px solid var(--border2)"}}>
            <div style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)",marginBottom:8}}>Eliminar anotador</div>
            <div style={{fontSize:13,color:"var(--g6)",marginBottom:20}}>Se eliminarán también todas las notas que están adentro. Esta acción no se puede deshacer.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowDeleteList(null)} style={{flex:1,background:"var(--border)",color:"var(--ga)",border:"none",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>handleDeleteList(showDeleteList)} style={{flex:1,background:"#FF6B6B22",color:"var(--coral)",border:"1px solid #FF6B6B44",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {showDelete && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowDelete(null)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--card)",borderRadius:16,padding:24,width:"100%",maxWidth:340,border:"1px solid var(--border2)"}}>
            <div style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)",marginBottom:8}}>Eliminar nota</div>
            <div style={{fontSize:13,color:"var(--g6)",marginBottom:20}}>Esta acción no se puede deshacer.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowDelete(null)} style={{flex:1,background:"var(--border)",color:"var(--ga)",border:"none",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>handleDeleteNote(showDelete)} style={{flex:1,background:"#FF6B6B22",color:"var(--coral)",border:"1px solid #FF6B6B44",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
