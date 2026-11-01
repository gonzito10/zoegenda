import Icon from "./app/Icon";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const inp = {background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"11px 13px",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const lbl = {fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};

const NOTE_COLORS = ["#FF6B6B","#FFB347","#FFEAA7","#96CEB4","#4ECDC4","#45B7D1","#DDA0DD"];

async function loadNotes(groupId) {
  const { data } = await supabase.from("notes").select("*").eq("group_id", groupId).order("updated_at", { ascending: false });
  return sortNotes(data || []);
}
function sortNotes(ns) {
  return [...ns].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || String(b.updated_at).localeCompare(String(a.updated_at)));
}
async function createNote(groupId, userId, title, kind, color) {
  const { data } = await supabase.from("notes").insert({ group_id: groupId, created_by: userId, title, content: "", kind: kind || "text", color: color || null }).select().single();
  return data;
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
  const saveTimer = useRef(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    loadNotes(groupId).then(ns => {
      setNotes(ns);
      const nav = window.__zgNav;
      const target = nav?.type === "note" ? ns.find(n => n.id === nav.id) : null;
      if (nav?.type === "note") window.__zgNav = null;
      const first = target || ns[0];
      if (first) { setActiveNote(first.id); setContent(first.content || ""); }
      setLoading(false);
    });

    const sub = supabase.channel(`notes-${groupId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"notes", filter:`group_id=eq.${groupId}` }, () =>
        loadNotes(groupId).then(ns => setNotes(ns)))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [groupId]);

  // FAB listener
  useEffect(() => {
    const handler = () => { setNewTitle(""); setNewKind("text"); setNewColor(null); setShowModal(true); };
    document.addEventListener("openNoteModal", handler);
    const nav = e => {
      if (e.detail?.type !== "note") return;
      setNotes(ns => { const n = ns.find(x => x.id === e.detail.id); if (n) { window.__zgNav = null; setActiveNote(n.id); setContent(n.content || ""); } return ns; });
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

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const created = await createNote(groupId, currentUserId, newTitle.trim(), newKind, newColor);
    if (created) {
      setNotes(ns => sortNotes([created, ...ns]));
      setActiveNote(created.id);
      setContent("");
    }
    setNewTitle(""); setShowModal(false);
  }

  async function handleDeleteNote(id) {
    await deleteNote(id);
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (activeNote === id) {
      setActiveNote(updated[0]?.id || null);
      setContent(updated[0]?.content || "");
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

  const currentNote = notes.find(n => n.id === activeNote);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";

  if (loading) return <div style={{textAlign:"center",color:"var(--g5)",padding:"50px 0"}}>Cargando notas...</div>;

  return (
    <div>
      {notes.length === 0 && (
        <div style={{textAlign:"center",color:"var(--g4)",padding:"60px 20px"}}>
          <div style={{marginBottom:12,color:"var(--g5)",display:"flex",justifyContent:"center"}}><Icon name="note" size={36}/></div>
          <div style={{marginBottom:8,fontSize:14}}>No hay notas todavía</div>
          <div style={{fontSize:12,color:"var(--g3)",marginBottom:20}}>Tocá + para crear la primera</div>
        </div>
      )}
      {/* Selector de notas */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        {notes.map(n => {
          const on = activeNote === n.id;
          const col = n.color || "#FF6B6B";
          const left = n.kind === "checklist" ? parseChecklist(n.content).filter(i => !i.done).length : null;
          return (
            <div key={n.id} onClick={()=>selectNote(n)}
              style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:on?col+"22":"var(--card2)",color:on?col:"var(--g5)",border:`1px solid ${on?col+"66":(n.color?col+"33":"var(--border2)")}`,display:"flex",alignItems:"center",gap:8}}>
              {n.pinned && <span style={{display:"flex",color:"var(--warn)"}}><Icon name="pin" size={13}/></span>}
              {n.color && !on && <span style={{width:7,height:7,borderRadius:"50%",background:col}}/>}
              {n.title}
              {left !== null && <span style={{fontSize:12,opacity:.7}}>☑ {left}</span>}
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
          placeholder="Escribí tu nota acá..."
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
            <div style={{marginBottom:14}}>
              <label style={lbl}>Tipo</label>
              <div style={{display:"flex",gap:8}}>
                {[["text","📝 Texto libre"],["checklist","☑ Checklist"]].map(([v,l])=>(
                  <div key={v} onClick={()=>setNewKind(v)}
                    style={{flex:1,textAlign:"center",padding:"9px",borderRadius:10,fontSize:12,fontWeight:newKind===v?700:500,cursor:"pointer",background:newKind===v?"#FF6B6B22":"var(--card2)",color:newKind===v?"var(--coral)":"var(--g6)",border:`1px solid ${newKind===v?"#FF6B6B55":"var(--border2)"}`}}>{l}</div>
                ))}
              </div>
            </div>
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
