import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const inp = {background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"11px 13px",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const lbl = {fontSize:10,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};

const LIST_ICONS = [
  // Hogar y compras
  "🛒","🏠","🔧","🧹","🪣","🛁","🛋","🪑","🛏","🪟","🚪","🔑","💡","🔌","🧺","🪴","🌿","🧴","🧼","🫙",
  // Comida y cocina
  "🍕","🍔","🥗","🍳","🥘","🍷","☕","🧃","🥦","🥩","🍰","🧁","🫙","🥫","🍜","🍣","🥐","🧇","🥚","🫕",
  // Salud y bienestar
  "💊","🏥","🩺","🧘","🏋️","🚴","🧬","🩹","💉","🦷","🧠","❤️","🫀","🩻","🌡️","🛁","💆","🧖","🏃","🤸",
  // Transporte y viajes
  "✈️","🚗","🚌","🛵","🚂","⛵","🚲","🏍️","🛺","🚁","🗺️","🧳","🏖️","🏔️","🌍","🗼","🏕️","⛺","🎡","🎢",
  // Trabajo y educación
  "💼","📚","✏️","🎓","🏫","📐","💻","🖥️","⌨️","📊","📈","📝","🗂️","📌","📎","🖊️","📋","🗒️","🔬","🔭",
  // Entretenimiento
  "🎮","🎬","🎵","🎸","🎨","🎭","🎲","⚽","🏊","🎾","🎯","🎳","🎪","🎠","🎤","🎹","🎺","🎷","🥊","🏄",
  // Mascotas y naturaleza
  "🐶","🐱","🐾","🦴","🐠","🐰","🐹","🦜","🌸","🌻","🌺","🍀","🌈","☀️","🌙","❄️","🌊","🦋","🐝","🌵",
  // Finanzas y misc
  "💰","💳","🏦","📈","🎁","⭐","✨","🎀","🪄","🔐","🏷️","📦","🗑️","♻️","🧲","🪛","🔨","🪚","🛠️","⚙️",
];

// Tipos de listado: cambian los títulos y las opciones disponibles
const LIST_TYPES = {
  shopping: {
    label:"Compras", icon:"🛒", desc:"Elementos a comprar, con cantidad y unidad", hasQty:true,
    selectedTitle:"A comprar", catalogTitle:"Elementos",
    clearText:"Vaciar comprados", doneText:"comprados",
    emptySelected:"Nada para comprar todavía. Tocá un elemento guardado para agregarlo.",
  },
  tasks: {
    label:"Tareas", icon:"✅", desc:"Tareas a realizar y completar", hasQty:false,
    selectedTitle:"A completar", catalogTitle:"Elementos",
    clearText:"Vaciar completadas", doneText:"completadas",
    emptySelected:"No hay tareas pendientes. Tocá una tarea guardada para agregarla.",
  },
  general: {
    label:"Otro", icon:"📋", desc:"Lugares, ideas o cualquier otra lista", hasQty:false,
    selectedTitle:"Seleccionados", catalogTitle:"Elementos",
    clearText:"Vaciar hechos", doneText:"hechos",
    emptySelected:"Todavía no seleccionaste nada. Tocá un elemento guardado.",
  },
};
const UNITS = ["unid","kg","g","L","ml","paq","caja","docena"];

// ── DB helpers ─────────────────────────────────────────────────────────────
async function loadLists(groupId) {
  const { data } = await supabase.from("lists").select("*").eq("group_id", groupId).order("created_at");
  return data || [];
}
async function loadItems(listId) {
  const { data } = await supabase.from("list_items").select("*").eq("list_id", listId).order("created_at");
  return data || [];
}
async function createList(groupId, userId, name, icon, type) {
  const { data } = await supabase.from("lists").insert({ group_id: groupId, created_by: userId, name, icon, type }).select().single();
  return data;
}
async function updateList(id, fields) {
  await supabase.from("lists").update(fields).eq("id", id);
}
async function deleteList(id) {
  await supabase.from("lists").delete().eq("id", id);
}
async function insertItem(listId, userId, text) {
  const { data } = await supabase.from("list_items").insert({ list_id: listId, created_by: userId, text, selected: false, checked: false }).select().single();
  return data;
}
async function deleteItem(id) {
  await supabase.from("list_items").delete().eq("id", id);
}
// El listado de compras por defecto se crea una sola vez por grupo (y se puede eliminar)
async function ensureShoppingList(groupId, userId, lists) {
  const key = `zg_lists_seeded_${groupId}`;
  try {
    if (lists.length > 0) { localStorage.setItem(key, "1"); return lists; }
    if (localStorage.getItem(key)) return lists;
  } catch (e) { if (lists.length > 0) return lists; }
  const created = await createList(groupId, userId, "Compras", "🛒", "shopping");
  try { localStorage.setItem(key, "1"); } catch (e) {}
  return created ? [created] : lists;
}
const fmtQty = (q) => String(Number(q));

// ── Component ──────────────────────────────────────────────────────────────
export default function Lists({ groupId, currentUserId }) {
  const [lists,       setLists]       = useState([]);
  const [activeList,  setActiveList]  = useState(null);
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [query,       setQuery]       = useState("");

  // Modal nuevo/editar listado
  const [showModal,   setShowModal]   = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [modalName,   setModalName]   = useState("");
  const [modalIcon,   setModalIcon]   = useState("🛒");
  const [modalType,   setModalType]   = useState("shopping");
  const [iconTouched, setIconTouched] = useState(false);
  const [showDelete,  setShowDelete]  = useState(null);

  // Edición de cantidad/unidad de un elemento seleccionado
  const [qtyEditId,   setQtyEditId]   = useState(null);
  const [qtyDraft,    setQtyDraft]    = useState("");
  const [unitDraft,   setUnitDraft]   = useState("unid");

  const activeRef = useRef(null);
  activeRef.current = activeList;

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    loadLists(groupId).then(async ls => {
      const withDefault = await ensureShoppingList(groupId, currentUserId, ls);
      setLists(withDefault);
      if (withDefault.length > 0) setActiveList(withDefault[0].id);
      setLoading(false);
    });
    const sub = supabase.channel(`lists-${groupId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"lists", filter:`group_id=eq.${groupId}` }, () =>
        loadLists(groupId).then(ls => {
          setLists(ls);
          if (activeRef.current && !ls.some(l => l.id === activeRef.current)) setActiveList(ls[0]?.id || null);
        }))
      .on("postgres_changes", { event:"*", schema:"public", table:"list_items" }, () => {
        if (activeRef.current) loadItems(activeRef.current).then(setItems);
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  // eslint-disable-next-line
  }, [groupId]);

  useEffect(() => {
    setQuery(""); setQtyEditId(null);
    if (!activeList) { setItems([]); return; }
    loadItems(activeList).then(setItems);
  }, [activeList]);

  // Botón + flotante: nuevo listado
  useEffect(() => {
    const handler = () => openNewModal();
    document.addEventListener("openListModal", handler);
    return () => document.removeEventListener("openListModal", handler);
  // eslint-disable-next-line
  }, []);

  function openNewModal() {
    setEditingList(null); setModalName(""); setModalType("shopping");
    setModalIcon(LIST_TYPES.shopping.icon); setIconTouched(false);
    setShowModal(true);
  }
  function openEditModal(list) {
    setEditingList(list); setModalName(list.name);
    setModalType(list.type || "general"); setModalIcon(list.icon || "📋"); setIconTouched(true);
    setShowModal(true);
  }
  function pickType(t) {
    setModalType(t);
    if (!iconTouched && !editingList) setModalIcon(LIST_TYPES[t].icon);
  }

  async function handleSaveList() {
    if (!modalName.trim()) return;
    const fields = { name: modalName.trim(), icon: modalIcon, type: modalType };
    if (editingList) {
      await updateList(editingList.id, fields);
      setLists(ls => ls.map(l => l.id === editingList.id ? { ...l, ...fields } : l));
    } else {
      const created = await createList(groupId, currentUserId, fields.name, fields.icon, fields.type);
      if (created) { setLists(ls => [...ls, created]); setActiveList(created.id); }
    }
    setShowModal(false); setEditingList(null);
  }

  async function handleDeleteList(id) {
    await deleteList(id);
    const updated = lists.filter(l => l.id !== id);
    setLists(updated);
    if (activeList === id) setActiveList(updated[0]?.id || null);
    setShowDelete(null);
  }

  // ── Elementos ──
  async function patchItem(id, fields) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i));
    await supabase.from("list_items").update(fields).eq("id", id);
  }

  async function handleCreateItem() {
    const text = query.trim();
    if (!text || !activeList) return;
    const existing = items.find(i => i.text.toLowerCase() === text.toLowerCase());
    if (existing) {
      if (!existing.selected) await patchItem(existing.id, { selected: true, checked: false });
      setQuery(""); return;
    }
    const item = await insertItem(activeList, currentUserId, text);
    if (item) setItems(prev => [...prev, item]);
    setQuery("");
  }

  async function handleDeleteItem(item) {
    if (!window.confirm(`¿Eliminar "${item.text}" del listado?`)) return;
    setItems(prev => prev.filter(i => i.id !== item.id));
    await deleteItem(item.id);
  }

  async function handleClearDone() {
    const ids = items.filter(i => i.selected && i.checked).map(i => i.id);
    if (ids.length === 0) return;
    setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, selected: false, checked: false } : i));
    await supabase.from("list_items").update({ selected: false, checked: false }).in("id", ids);
  }

  function openQtyEditor(item) {
    if (qtyEditId === item.id) { setQtyEditId(null); return; }
    setQtyEditId(item.id);
    setQtyDraft(item.quantity != null ? fmtQty(item.quantity) : "");
    setUnitDraft(item.unit || "unid");
  }
  async function saveQty(item) {
    const n = parseFloat(String(qtyDraft).replace(",", "."));
    const hasQty = !isNaN(n) && n > 0;
    await patchItem(item.id, hasQty ? { quantity: n, unit: unitDraft } : { quantity: null, unit: null });
    setQtyEditId(null);
  }

  const currentList = lists.find(l => l.id === activeList);
  const T = LIST_TYPES[currentList?.type] || LIST_TYPES.general;

  const q = query.trim().toLowerCase();
  const selectedItems = items.filter(i => i.selected).sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1));
  const doneCount = selectedItems.filter(i => i.checked).length;
  const catalog = items
    .filter(i => !i.selected)
    .sort((a, b) => a.text.localeCompare(b.text, "es"));
  const matches = q
    ? items.filter(i => i.text.toLowerCase().includes(q)).sort((a, b) => a.text.localeCompare(b.text, "es"))
    : [];
  const exactMatch = items.some(i => i.text.toLowerCase() === q);

  if (loading) return <div style={{textAlign:"center",color:"var(--g5)",padding:"50px 0"}}>Cargando listados...</div>;

  return (
    <div>
      {lists.length === 0 && (
        <div style={{textAlign:"center",color:"var(--g4)",padding:"60px 20px"}}>
          <div style={{fontSize:32,marginBottom:12}}>📝</div>
          <div style={{marginBottom:8,fontSize:14}}>No hay listados todavía</div>
          <div style={{fontSize:12,color:"var(--g3)"}}>Tocá + para crear el primero</div>
        </div>
      )}

      {/* Selector de listados */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {lists.map(l => (
          <div key={l.id} onClick={()=>setActiveList(l.id)}
            style={{padding:"6px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:activeList===l.id?"#FF6B6B22":"var(--card2)",color:activeList===l.id?"#FF6B6B":"var(--g5)",border:`1px solid ${activeList===l.id?"#FF6B6B44":"var(--border2)"}`,display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:15}}>{l.icon||"📋"}</span>{l.name}
          </div>
        ))}
      </div>

      {currentList && (<>
        {/* Cabecera del listado activo */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <span style={{fontSize:24}}>{currentList.icon||"📋"}</span>
            <div style={{minWidth:0}}>
              <div style={{fontFamily:"Fraunces,serif",fontSize:20,fontWeight:600,color:"var(--title)"}}>{currentList.name}</div>
              <div style={{fontSize:10,color:"var(--g5)",marginTop:1}}>Listado de {T.label.toLowerCase()}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <button onClick={()=>openEditModal(currentList)} style={{background:"transparent",border:"none",color:"var(--g5)",fontSize:16,cursor:"pointer",padding:"4px 8px"}}>✎</button>
            <button onClick={()=>setShowDelete(currentList.id)} style={{background:"transparent",border:"none",color:"var(--border2)",fontSize:18,cursor:"pointer",padding:"4px 8px"}}>🗑</button>
          </div>
        </div>

        {/* Buscar o crear elemento (los resultados se despliegan en el mismo buscador) */}
        <div style={{position:"relative",marginBottom:6}}>
          <div style={{display:"flex",gap:8}}>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleCreateItem(); if(e.key==="Escape") setQuery(""); }}
              placeholder="Buscar o crear elemento (ej: Azúcar)" style={{...inp,flex:1}}/>
            <button onClick={handleCreateItem}
              style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",fontSize:18,fontWeight:700,cursor:"pointer",flexShrink:0}}>+</button>
          </div>
          {q && (
            <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:20,maxHeight:260,overflowY:"auto",background:"var(--card)",border:"1px solid var(--border2)",borderRadius:10,boxShadow:"0 8px 24px #0006"}}>
              {matches.map(item => (
                <div key={item.id}
                  onClick={()=>{ if(!item.selected) patchItem(item.id,{selected:true,checked:false}); setQuery(""); }}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderBottom:"1px solid var(--border)",cursor:item.selected?"default":"pointer",opacity:item.selected?.5:1}}>
                  <span style={{color:item.selected?"#96CEB4":"#FF6B6B",fontWeight:700,fontSize:15,lineHeight:1}}>{item.selected?"✓":"+"}</span>
                  <span style={{flex:1,fontSize:13,color:"var(--text)",minWidth:0,overflow:"hidden",textOverflow:"ellipsis"}}>{item.text}</span>
                  {item.selected && <span style={{fontSize:10,color:"var(--g5)",flexShrink:0}}>ya en {T.selectedTitle.toLowerCase()}</span>}
                </div>
              ))}
              {!exactMatch && (
                <div onClick={handleCreateItem}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",color:"#FF6B6B",fontSize:13,cursor:"pointer",background:"#FF6B6B11"}}>
                  <span style={{fontWeight:700}}>+</span> Crear “{query.trim()}”
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{fontSize:10,color:"var(--g4)",marginBottom:16}}>Los elementos que crees quedan guardados para volver a usarlos.</div>

        {/* Seleccionados: a comprar / a completar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",margin:"4px 0 8px"}}>
          <div style={{fontSize:10,color:"var(--g8)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
            {T.selectedTitle} {selectedItems.length>0&&<span style={{color:"var(--g5)",fontWeight:500}}>· {doneCount}/{selectedItems.length} {T.doneText}</span>}
          </div>
          {doneCount>0&&(
            <button onClick={handleClearDone}
              style={{background:"#96CEB422",color:"#96CEB4",border:"1px solid #96CEB444",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{T.clearText}</button>
          )}
        </div>
        {selectedItems.length===0 && (
          <div style={{textAlign:"center",color:"var(--border3)",padding:"18px 10px",fontSize:12,background:"var(--bg)",border:"1px dashed var(--border)",borderRadius:10,marginBottom:6}}>{T.emptySelected}</div>
        )}
        {selectedItems.map(item => (
          <div key={item.id} style={{marginBottom:5}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:qtyEditId===item.id?"10px 10px 0 0":10,background:item.checked?"var(--bg)":"var(--card)",border:"1px solid var(--border)",opacity:item.checked?.6:1}}>
              <div onClick={()=>patchItem(item.id,{checked:!item.checked})}
                style={{width:22,height:22,borderRadius:"50%",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",fontWeight:700,background:item.checked?"#96CEB4":"transparent",border:`2px solid ${item.checked?"#96CEB4":"var(--border2)"}`}}>{item.checked?"✓":""}</div>
              <span style={{flex:1,fontSize:14,color:item.checked?"var(--g5)":"var(--text)",textDecoration:item.checked?"line-through":"none",minWidth:0,overflow:"hidden",textOverflow:"ellipsis"}}>{item.text}</span>
              {T.hasQty && (
                <button onClick={()=>openQtyEditor(item)}
                  style={{background:item.quantity!=null?"#FFB34722":"transparent",color:item.quantity!=null?"#FFB347":"var(--g4)",border:`1px ${item.quantity!=null?"solid":"dashed"} ${item.quantity!=null?"#FFB34744":"var(--border2)"}`,borderRadius:8,padding:"3px 9px",fontSize:11,fontWeight:600,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
                  {item.quantity!=null ? `${fmtQty(item.quantity)} ${item.unit||""}` : "+ cantidad"}
                </button>
              )}
              <button onClick={()=>patchItem(item.id,{selected:false,checked:false})} title="Devolver a guardados"
                style={{background:"transparent",border:"none",color:"var(--border3)",fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</button>
            </div>
            {T.hasQty && qtyEditId===item.id && (
              <div style={{display:"flex",gap:6,padding:"10px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderTop:"none",borderRadius:"0 0 10px 10px"}}>
                <input value={qtyDraft} onChange={e=>setQtyDraft(e.target.value)} inputMode="decimal" placeholder="Cantidad" autoFocus
                  onKeyDown={e=>e.key==="Enter"&&saveQty(item)} style={{...inp,flex:1,padding:"8px 11px"}}/>
                <select value={unitDraft} onChange={e=>setUnitDraft(e.target.value)}
                  style={{...inp,width:92,padding:"8px 8px",cursor:"pointer"}}>
                  {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
                <button onClick={()=>saveQty(item)}
                  style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"0 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>OK</button>
              </div>
            )}
          </div>
        ))}

        {/* Catálogo de elementos guardados */}
        <div style={{fontSize:10,color:"var(--g8)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 8px"}}>
          {T.catalogTitle} <span style={{color:"var(--g5)",fontWeight:500}}>· tocá para agregar</span>
        </div>
        {catalog.length===0 && (
          <div style={{textAlign:"center",color:"var(--border3)",padding:"18px 10px",fontSize:12}}>
            {items.length===0 ? "Todavía no creaste elementos. Escribí un nombre arriba y tocá +." : "Todos los elementos están seleccionados."}
          </div>
        )}
        {catalog.map(item => (
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <div onClick={()=>patchItem(item.id,{selected:true,checked:false})}
              style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:"var(--card)",border:"1px solid var(--border)",cursor:"pointer",minWidth:0}}>
              <span style={{color:"#FF6B6B",fontWeight:700,fontSize:15,lineHeight:1}}>+</span>
              <span style={{flex:1,fontSize:13,color:"var(--text)",minWidth:0,overflow:"hidden",textOverflow:"ellipsis"}}>{item.text}</span>
              {T.hasQty && item.quantity!=null && <span style={{fontSize:10,color:"var(--g5)",flexShrink:0}}>{fmtQty(item.quantity)} {item.unit||""}</span>}
            </div>
            <button onClick={()=>handleDeleteItem(item)} title="Eliminar elemento"
              style={{background:"transparent",border:"none",color:"var(--border3)",fontSize:15,cursor:"pointer",padding:"6px 8px",flexShrink:0}}>🗑</button>
          </div>
        ))}
      </>)}

      {/* Modal nuevo/editar listado */}
      {showModal && (
        <div onClick={e=>{if(e.target===e.currentTarget){setShowModal(false);setEditingList(null);}}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"var(--card)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid var(--border2)",maxHeight:"88vh",overflow:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)"}}>{editingList?"Editar listado":"Nuevo listado"}</h2>
              <button onClick={()=>{setShowModal(false);setEditingList(null);}} style={{background:"var(--border)",border:"none",color:"var(--ga)",width:26,height:26,borderRadius:"50%",fontSize:14,cursor:"pointer"}}>×</button>
            </div>

            <div style={{marginBottom:14}}>
              <label style={lbl}>Tipo de listado</label>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {Object.entries(LIST_TYPES).map(([k,t])=>{
                  const on = modalType===k;
                  return (
                    <div key={k} onClick={()=>pickType(k)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,cursor:"pointer",background:on?"#FF6B6B11":"var(--bg)",border:`1px solid ${on?"#FF6B6B55":"var(--border)"}`}}>
                      <span style={{fontSize:20}}>{t.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:on?"#FF6B6B":"var(--text)"}}>{t.label}</div>
                        <div style={{fontSize:10,color:"var(--g5)",marginTop:1}}>{t.desc}</div>
                      </div>
                      {on && <span style={{color:"#FF6B6B",fontSize:14}}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{marginBottom:14}}>
              <label style={lbl}>Nombre</label>
              <input value={modalName} onChange={e=>setModalName(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleSaveList()}
                placeholder="Ej: Supermercado, Arreglos, Lugares para visitar..." style={inp} autoFocus/>
            </div>

            <div style={{marginBottom:16}}>
              <label style={lbl}>Ícono</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:170,overflowY:"auto"}}>
                {LIST_ICONS.map((ico,idx)=>(
                  <div key={ico+idx} onClick={()=>{setModalIcon(ico);setIconTouched(true);}}
                    style={{width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:10,fontSize:20,cursor:"pointer",background:modalIcon===ico?"#FF6B6B22":"var(--card2)",border:`1.5px solid ${modalIcon===ico?"#FF6B6B":"transparent"}`}}>
                    {ico}
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <span style={{fontSize:22}}>{modalIcon}</span>
              <span style={{fontSize:14,fontWeight:600,color:modalName?"var(--text)":"var(--g4)"}}>{modalName||"Sin nombre"}</span>
            </div>
            <button onClick={handleSaveList}
              style={{width:"100%",background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
              {editingList?"Guardar cambios":"Crear listado"}
            </button>
          </div>
        </div>
      )}

      {/* Confirmar eliminar listado */}
      {showDelete && (
        <div onClick={e=>{if(e.target===e.currentTarget)setShowDelete(null)}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--card)",borderRadius:16,padding:24,width:"100%",maxWidth:340,border:"1px solid var(--border2)"}}>
            <div style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)",marginBottom:8}}>Eliminar listado</div>
            <div style={{fontSize:13,color:"var(--g6)",marginBottom:20}}>Se eliminarán también todos los elementos guardados. Esta acción no se puede deshacer.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowDelete(null)} style={{flex:1,background:"var(--border)",color:"var(--ga)",border:"none",borderRadius:10,padding:"10px",fontSize:13,cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>handleDeleteList(showDelete)} style={{flex:1,background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
