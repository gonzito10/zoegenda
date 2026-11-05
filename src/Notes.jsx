import Icon from "./app/Icon";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const inp = {background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"11px 13px",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const lbl = {fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};

const NOTE_COLORS = ["#FF6B6B","#FFB347","#FFEAA7","#96CEB4","#4ECDC4","#45B7D1","#DDA0DD"];

// Anotadores fijos: Notas y Recetas (no se crean, editan ni eliminan desde la app)
const NOTE_LIST_TYPES = {
  notes: {
    label:"Notas", icon:"📝", desc:"Notas de texto libre",
    kind:"text", template:"", placeholder:"Escribí tu nota acá...",
    emptyText:"No hay notas todavía",
  },
  recipe: {
    label:"Receta", icon:"🍳", desc:"Cada nota es una receta, con ingredientes y pasos",
    kind:"text", template:"Ingredientes\n- \n\nPasos\n1. \n", placeholder:"Ingredientes y pasos de la receta...",
    emptyText:"No hay recetas todavía",
  },
};
const TABS = ["notes","recipe"];

// A qué solapa pertenece una nota: si su anotador es de tipo receta va a Recetas, el resto a Notas
function tabOf(note, lists) {
  const l = lists.find(x => x.id === note.list_id);
  return l?.type === "recipe" ? "recipe" : "notes";
}

async function loadNoteLists(groupId) {
  const { data } = await supabase.from("note_lists").select("*").eq("group_id", groupId).order("created_at");
  return data || [];
}
async function createNoteList(groupId, userId, name, icon, type) {
  const { data } = await supabase.from("note_lists").insert({ group_id: groupId, created_by: userId, name, icon, type }).select().single();
  return data;
}

async function loadNotes(groupId) {
  const { data } = await supabase.from("notes").select("*").eq("group_id", groupId).order("updated_at", { ascending: false });
  return sortNotes(data || []);
}
function sortNotes(ns) {
  // Fijadas primero; después orden alfabético por título (sin distinguir mayúsculas ni tildes).
  // No depende de la fecha de modificación, así una nota no cambia de lugar al tocarla o guardarla.
  return [...ns].sort((a, b) =>
    (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
    String(a.title || "").localeCompare(String(b.title || ""), "es", { sensitivity: "base", numeric: true }) ||
    String(a.id).localeCompare(String(b.id)));
}
async function createNote(groupId, userId, title, kind, color, listId, content) {
  const { data } = await supabase.from("notes").insert({ group_id: groupId, created_by: userId, title, content: content || "", kind: kind || "text", color: color || null, list_id: listId || null }).select().single();
  return data;
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
  const [newColor,    setNewColor]    = useState(null);

  // Solapas fijas: Notas y Recetas
  const [noteLists,   setNoteLists]   = useState([]);
  const [activeTab,   setActiveTab]   = useState("notes"); // "notes" | "recipe"
  const [newTab,      setNewTab]      = useState("notes"); // solapa elegida al crear una nota

  const saveTimer = useRef(null);
  const contentRef = useRef(content);
  contentRef.current = content;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const noteListsRef = useRef(noteLists);
  noteListsRef.current = noteLists;

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    Promise.all([loadNotes(groupId), loadNoteLists(groupId)]).then(([ns, ls]) => {
      setNotes(ns);
      setNoteLists(ls);
      const nav = window.__zgNav;
      const target = nav?.type === "note" ? ns.find(n => n.id === nav.id) : null;
      if (nav?.type === "note") window.__zgNav = null;
      const tab = target ? tabOf(target, ls) : "notes";
      setActiveTab(tab);
      const inTab = ns.filter(n => tabOf(n, ls) === tab);
      const first = target || inTab[0];
      if (first) { setActiveNote(first.id); setContent(first.content || ""); }
      setLoading(false);
    });

    const sub = supabase.channel(`notes-${groupId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"notes", filter:`group_id=eq.${groupId}` }, () =>
        loadNotes(groupId).then(ns => setNotes(ns)))
      .on("postgres_changes", { event:"*", schema:"public", table:"note_lists", filter:`group_id=eq.${groupId}` }, () =>
        loadNoteLists(groupId).then(ls => setNoteLists(ls)))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [groupId]);

  // Listener de la barra de acción ("Nueva nota") y del buscador
  useEffect(() => {
    const handler = () => {
      setNewTitle(""); setNewColor(null);
      setNewTab(activeTabRef.current);
      setShowModal(true);
    };
    document.addEventListener("openNoteModal", handler);
    const nav = e => {
      if (e.detail?.type !== "note") return;
      setNotes(ns => { const n = ns.find(x => x.id === e.detail.id); if (n) { window.__zgNav = null; setActiveTab(tabOf(n, noteListsRef.current)); setActiveNote(n.id); setContent(n.content || ""); } return ns; });
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

  // Tipo elegido al crear una nota (define la plantilla inicial)
  const newType = NOTE_LIST_TYPES[newTab];

  async function handleCreate() {
    if (!newTitle.trim()) return;
    // Anotador que corresponde a la solapa elegida; si todavía no existe el de Recetas, se crea una sola vez
    let list = noteLists.find(l => l.type === newTab);
    if (!list && newTab === "recipe") {
      list = await createNoteList(groupId, currentUserId, "Recetas", NOTE_LIST_TYPES.recipe.icon, "recipe");
      if (list) setNoteLists(ls => [...ls, list]);
    }
    const created = await createNote(groupId, currentUserId, newTitle.trim(), "text", newColor, list?.id || null, newType.template);
    if (created) {
      setNotes(ns => sortNotes([created, ...ns]));
      // Si estás mirando la otra solapa, pasá a la de la nota nueva para que la veas
      setActiveTab(newTab);
      setActiveNote(created.id);
      setContent(created.content || "");
    }
    setNewTitle(""); setShowModal(false);
  }

  function pickTab(t) {
    if (activeNote && saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveContent(activeNote, contentRef.current);
    }
    setActiveTab(t);
    const first = notes.find(n => tabOf(n, noteLists) === t);
    setActiveNote(first ? first.id : null);
    setContent(first ? (first.content || "") : "");
  }

  async function handleDeleteNote(id) {
    await deleteNote(id);
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    if (activeNote === id) {
      const inView = updated.filter(n => tabOf(n, noteLists) === activeTabRef.current);
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

  async function handleSaveTitle() {
    if (!titleDraft.trim() || !activeNote) return;
    await updateNote(activeNote, { title: titleDraft.trim() });
    setNotes(ns => sortNotes(ns.map(n => n.id === activeNote ? {...n, title: titleDraft.trim()} : n)));
    setEditingTitle(false);
  }

  const visibleNotes = notes.filter(n => tabOf(n, noteLists) === activeTab);
  const currentNote = notes.find(n => n.id === activeNote);
  const noteType = NOTE_LIST_TYPES[currentNote ? tabOf(currentNote, noteLists) : activeTab];
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";

  if (loading) return <div style={{textAlign:"center",color:"var(--g5)",padding:"50px 0"}}>Cargando notas...</div>;

  return (
    <div>
      {/* Solapas fijas: Notas y Recetas */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {TABS.map(t => {
          const on = activeTab === t;
          const ty = NOTE_LIST_TYPES[t];
          return (
            <div key={t} onClick={()=>pickTab(t)}
              style={{padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:on?"#DDA0DD22":"var(--card2)",color:on?"var(--violet)":"var(--g5)",border:`1px solid ${on?"#DDA0DD66":"var(--border2)"}`,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:15}}>{ty.icon}</span>{t==="recipe"?"Recetas":"Notas"}
            </div>
          );
        })}
      </div>

      {visibleNotes.length === 0 && (
        <div style={{textAlign:"center",color:"var(--g4)",padding:"40px 20px"}}>
          <div style={{marginBottom:12,color:"var(--g5)",display:"flex",justifyContent:"center"}}><Icon name="note" size={36}/></div>
          <div style={{marginBottom:8,fontSize:14}}>{NOTE_LIST_TYPES[activeTab].emptyText}</div>
          <div style={{fontSize:12,color:"var(--g3)",marginBottom:20}}>Tocá "Nueva nota" para crear {activeTab==="recipe"?"la primera receta":"la primera"}</div>
        </div>
      )}

      {/* Selector de notas */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        {visibleNotes.map(n => {
          const on = activeNote === n.id;
          const col = n.color || "#FF6B6B";
          return (
            <div key={n.id} onClick={()=>selectNote(n)}
              style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:on?col+"22":"var(--card2)",color:on?col:"var(--g5)",border:`1px solid ${on?col+"66":(n.color?col+"33":"var(--border2)")}`,display:"flex",alignItems:"center",gap:8}}>
              {n.pinned && <span style={{display:"flex",color:"var(--warn)"}}><Icon name="pin" size={13}/></span>}
              {n.color && !on && <span style={{width:7,height:7,borderRadius:"50%",background:col}}/>}
              {n.title}
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
      {activeNote && (
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
                placeholder={newTab==="recipe"?"Ej: Milanesas al horno...":"Ej: Ideas, Plan de vacaciones..."}
                style={inp} autoFocus/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Guardar en</label>
              <div style={{display:"flex",gap:8}}>
                {TABS.map(t => {
                  const on = newTab === t;
                  return (
                    <div key={t} onClick={()=>setNewTab(t)}
                      style={{flex:1,padding:"10px 12px",borderRadius:10,cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:600,background:on?"#DDA0DD11":"var(--bg)",color:on?"var(--violet)":"var(--text)",border:`1px solid ${on?"#DDA0DD66":"var(--border)"}`}}>
                      {NOTE_LIST_TYPES[t].icon} {t==="recipe"?"Recetas":"Notas"}
                    </div>
                  );
                })}
              </div>
            </div>
            {newTab==="recipe" && (
              <div style={{marginBottom:14,fontSize:12,color:"var(--g5)"}}>
                Arranca con Ingredientes y Pasos.
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
