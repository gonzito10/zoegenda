import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const inp = {background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:10,padding:"11px 13px",color:"#e8e8f0",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};

// ── DB helpers ─────────────────────────────────────────────────────────────
async function loadLists(groupId) {
  const { data } = await supabase.from("lists").select("*").eq("group_id", groupId).order("created_at");
  return data || [];
}
async function loadItems(listId) {
  const { data } = await supabase.from("list_items").select("*").eq("list_id", listId).order("created_at");
  return data || [];
}
async function createList(groupId, userId, name) {
  const { data } = await supabase.from("lists").insert({ group_id: groupId, created_by: userId, name }).select().single();
  return data;
}
async function deleteList(id) {
  await supabase.from("lists").delete().eq("id", id);
}
async function addItem(listId, userId, text) {
  const { data } = await supabase.from("list_items").insert({ list_id: listId, created_by: userId, text, checked: false }).select().single();
  return data;
}
async function toggleItem(id, checked) {
  await supabase.from("list_items").update({ checked }).eq("id", id);
}
async function deleteItem(id) {
  await supabase.from("list_items").delete().eq("id", id);
}
async function ensureShoppingList(groupId, userId, lists) {
  if (lists.some(l => l.name === "🛒 Compras")) return lists;
  const created = await createList(groupId, userId, "🛒 Compras");
  return created ? [...lists, created] : lists;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Lists({ groupId, currentUserId }) {
  const [lists,       setLists]       = useState([]);
  const [activeList,  setActiveList]  = useState(null); // id
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [showModal,   setShowModal]   = useState(false); // new list modal
  const [newListName, setNewListName] = useState("");
  const [showDelete,  setShowDelete]  = useState(null); // list id to confirm delete

  // Load lists on mount
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    loadLists(groupId).then(async ls => {
      const withShopping = await ensureShoppingList(groupId, currentUserId, ls);
      setLists(withShopping);
      if (withShopping.length > 0) setActiveList(withShopping[0].id);
      setLoading(false);
    });

    // Realtime lists
    const sub = supabase.channel(`lists-${groupId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"lists", filter:`group_id=eq.${groupId}` }, () =>
        loadLists(groupId).then(ls => setLists(ls)))
      .on("postgres_changes", { event:"*", schema:"public", table:"list_items" }, () => {
        if (activeList) loadItems(activeList).then(setItems);
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  // eslint-disable-next-line
  }, [groupId]);

  // Load items when active list changes
  useEffect(() => {
    if (!activeList) return;
    loadItems(activeList).then(setItems);
  }, [activeList]);

  // Listen for FAB
  useEffect(() => {
    const handler = () => setShowModal(true);
    document.addEventListener("openListModal", handler);
    return () => document.removeEventListener("openListModal", handler);
  }, []);

  async function handleCreateList() {
    if (!newListName.trim()) return;
    const created = await createList(groupId, currentUserId, newListName.trim());
    if (created) {
      setLists(ls => [...ls, created]);
      setActiveList(created.id);
    }
    setNewListName("");
    setShowModal(false);
  }

  async function handleDeleteList(id) {
    await deleteList(id);
    const updated = lists.filter(l => l.id !== id);
    setLists(updated);
    if (activeList === id) setActiveList(updated[0]?.id || null);
    setShowDelete(null);
  }

  async function handleAddItem(e) {
    e.preventDefault();
    if (!newItemText.trim() || !activeList) return;
    const item = await addItem(activeList, currentUserId, newItemText.trim());
    if (item) setItems(prev => [...prev, item]);
    setNewItemText("");
  }

  async function handleToggle(item) {
    await toggleItem(item.id, !item.checked);
    setItems(prev => prev.map(i => i.id === item.id ? {...i, checked: !i.checked} : i));
  }

  async function handleDeleteItem(id) {
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const currentList = lists.find(l => l.id === activeList);
  const unchecked = items.filter(i => !i.checked);
  const checked   = items.filter(i =>  i.checked);

  if (loading) return <div style={{textAlign:"center",color:"#555",padding:"50px 0"}}>Cargando listados...</div>;

  return (
    <div>
      {/* ── List selector ── */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        {lists.map(l => (
          <div key={l.id} style={{position:"relative"}}>
            <div onClick={()=>setActiveList(l.id)}
              style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:activeList===l.id?"#FF6B6B22":"#1a1a22",color:activeList===l.id?"#FF6B6B":"#555",border:`1px solid ${activeList===l.id?"#FF6B6B44":"#2a2a3a"}`}}>
              {l.name}
            </div>
          </div>
        ))}
      </div>

      {/* ── Current list header ── */}
      {currentList && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontFamily:"Fraunces,serif",fontSize:20,fontWeight:600,color:"#fff"}}>{currentList.name}</div>
          <button onClick={()=>setShowDelete(currentList.id)}
            style={{background:"transparent",border:"none",color:"#333",fontSize:18,cursor:"pointer",padding:"4px 8px"}}>🗑</button>
        </div>
      )}

      {/* ── Add item input ── */}
      {activeList && (
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input
            value={newItemText}
            onChange={e=>setNewItemText(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleAddItem(e)}
            placeholder="Agregar elemento..."
            style={{...inp,flex:1}}
          />
          <button onClick={handleAddItem}
            style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",fontSize:18,fontWeight:700,cursor:"pointer",flexShrink:0}}>+</button>
        </div>
      )}

      {/* ── Items ── */}
      {items.length === 0 && activeList && (
        <div style={{textAlign:"center",color:"#333",padding:"40px 0",fontSize:13}}>
          Lista vacía — agregá el primer elemento
        </div>
      )}

      {/* Pendientes */}
      {unchecked.map(item => (
        <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"#131318",border:"1px solid #1e1e2a",marginBottom:5}}>
          <div onClick={()=>handleToggle(item)}
            style={{width:20,height:20,borderRadius:"50%",border:"2px solid #2a2a3a",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          </div>
          <span style={{flex:1,fontSize:13,color:"#e8e8f0"}}>{item.text}</span>
          <button onClick={()=>handleDeleteItem(item.id)}
            style={{background:"transparent",border:"none",color:"#2a2a3a",fontSize:16,cursor:"pointer",padding:"2px 6px",lineHeight:1}}>×</button>
        </div>
      ))}

      {/* Completados */}
      {checked.length > 0 && (
        <>
          <div style={{fontSize:10,color:"#333",fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 8px"}}>
            Completados ({checked.length})
          </div>
          {checked.map(item => (
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"#0f0f13",border:"1px solid #1a1a22",marginBottom:5,opacity:.55}}>
              <div onClick={()=>handleToggle(item)}
                style={{width:20,height:20,borderRadius:"50%",background:"#96CEB4",border:"2px solid #96CEB4",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>✓</div>
              <span style={{flex:1,fontSize:13,color:"#555",textDecoration:"line-through"}}>{item.text}</span>
              <button onClick={()=>handleDeleteItem(item.id)}
                style={{background:"transparent",border:"none",color:"#2a2a3a",fontSize:16,cursor:"pointer",padding:"2px 6px",lineHeight:1}}>×</button>
            </div>
          ))}
        </>
      )}

      {/* ── Modal nuevo listado ── */}
      {showModal && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"#131318",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid #2a2a3a"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff"}}>Nuevo listado</h2>
              <button onClick={()=>setShowModal(false)} style={{background:"#1e1e2a",border:"none",color:"#aaa",width:26,height:26,borderRadius:"50%",fontSize:14,cursor:"pointer"}}>×</button>
            </div>
            <input
              value={newListName}
              onChange={e=>setNewListName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleCreateList()}
              placeholder="Ej: Arreglos, Lugares para visitar..."
              style={inp}
              autoFocus
            />
            <button onClick={handleCreateList}
              style={{marginTop:12,width:"100%",background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              Crear listado
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminar listado ── */}
      {showDelete && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowDelete(null)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#131318",borderRadius:16,padding:24,width:"100%",maxWidth:340,border:"1px solid #2a2a3a"}}>
            <div style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff",marginBottom:8}}>Eliminar listado</div>
            <div style={{fontSize:13,color:"#666",marginBottom:20}}>Se eliminarán también todos los elementos. Esta acción no se puede deshacer.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowDelete(null)}
                style={{flex:1,background:"#1e1e2a",color:"#aaa",border:"none",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>handleDeleteList(showDelete)}
                style={{flex:1,background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
