import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const inp = {background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:10,padding:"11px 13px",color:"#e8e8f0",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const lbl = {fontSize:10,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};

async function loadNotes(groupId) {
  const { data } = await supabase.from("notes").select("*").eq("group_id", groupId).order("updated_at", { ascending: false });
  return data || [];
}
async function createNote(groupId, userId, title) {
  const { data } = await supabase.from("notes").insert({ group_id: groupId, created_by: userId, title, content: "" }).select().single();
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
  const saveTimer = useRef(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    loadNotes(groupId).then(ns => {
      setNotes(ns);
      if (ns.length > 0) { setActiveNote(ns[0].id); setContent(ns[0].content || ""); }
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
    const handler = () => { setNewTitle(""); setShowModal(true); };
    document.addEventListener("openNoteModal", handler);
    return () => document.removeEventListener("openNoteModal", handler);
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
    const created = await createNote(groupId, currentUserId, newTitle.trim());
    if (created) {
      setNotes(ns => [created, ...ns]);
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

  async function handleSaveTitle() {
    if (!titleDraft.trim() || !activeNote) return;
    await updateNote(activeNote, { title: titleDraft.trim() });
    setNotes(ns => ns.map(n => n.id === activeNote ? {...n, title: titleDraft.trim()} : n));
    setEditingTitle(false);
  }

  const currentNote = notes.find(n => n.id === activeNote);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("es-AR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";

  if (loading) return <div style={{textAlign:"center",color:"#555",padding:"50px 0"}}>Cargando notas...</div>;

  return (
    <div>
      {notes.length === 0 && (
        <div style={{textAlign:"center",color:"#444",padding:"60px 20px"}}>
          <div style={{fontSize:32,marginBottom:12}}>📓</div>
          <div style={{marginBottom:8,fontSize:14}}>No hay notas todavía</div>
          <div style={{fontSize:12,color:"#333",marginBottom:20}}>Tocá + para crear la primera</div>
        </div>
      )}
      {/* Selector de notas */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {notes.map(n => (
          <div key={n.id} onClick={()=>selectNote(n)}
            style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:activeNote===n.id?"#FF6B6B22":"#1a1a22",color:activeNote===n.id?"#FF6B6B":"#555",border:`1px solid ${activeNote===n.id?"#FF6B6B44":"#2a2a3a"}`}}>
            {n.title}
          </div>
        ))}
      </div>

      {/* Header nota activa */}
      {currentNote && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{flex:1,minWidth:0}}>
            {editingTitle ? (
              <div style={{display:"flex",gap:6}}>
                <input value={titleDraft} onChange={e=>setTitleDraft(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")handleSaveTitle();if(e.key==="Escape")setEditingTitle(false);}}
                  style={{...inp,fontSize:16,fontWeight:600,flex:1}} autoFocus/>
                <button onClick={handleSaveTitle} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:8,padding:"0 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>OK</button>
              </div>
            ) : (
              <div onClick={()=>{setTitleDraft(currentNote.title);setEditingTitle(true);}}
                style={{fontFamily:"Fraunces,serif",fontSize:20,fontWeight:600,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                {currentNote.title} <span style={{fontSize:12,color:"#333"}}>✎</span>
              </div>
            )}
            <div style={{fontSize:10,color:"#444",marginTop:2}}>
              Modificado {fmtDate(currentNote.updated_at)}
              {saving && <span style={{color:"#555",marginLeft:6}}>· Guardando...</span>}
            </div>
          </div>
          <button onClick={()=>setShowDelete(currentNote.id)}
            style={{background:"transparent",border:"none",color:"#2a2a3a",fontSize:18,cursor:"pointer",padding:"4px 8px",flexShrink:0}}>🗑</button>
        </div>
      )}

      {/* Textarea contenido */}
      {activeNote && (
        <textarea
          value={content}
          onChange={e=>setContent(e.target.value)}
          placeholder="Escribí tu nota acá..."
          style={{...inp, minHeight:320, resize:"none", lineHeight:1.6, fontSize:14}}
        />
      )}

      {/* Modal nueva nota */}
      {showModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"#131318",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid #2a2a3a"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff"}}>Nueva nota</h2>
              <button onClick={()=>setShowModal(false)} style={{background:"#1e1e2a",border:"none",color:"#aaa",width:26,height:26,borderRadius:"50%",fontSize:14,cursor:"pointer"}}>×</button>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Nombre</label>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleCreate()}
                placeholder="Ej: Ideas, Recetas, Plan de vacaciones..."
                style={inp} autoFocus/>
            </div>
            <button onClick={handleCreate}
              style={{width:"100%",background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              Crear nota
            </button>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {showDelete && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowDelete(null)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#131318",borderRadius:16,padding:24,width:"100%",maxWidth:340,border:"1px solid #2a2a3a"}}>
            <div style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff",marginBottom:8}}>Eliminar nota</div>
            <div style={{fontSize:13,color:"#666",marginBottom:20}}>Esta acción no se puede deshacer.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowDelete(null)} style={{flex:1,background:"#1e1e2a",color:"#aaa",border:"none",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>handleDeleteNote(showDelete)} style={{flex:1,background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
