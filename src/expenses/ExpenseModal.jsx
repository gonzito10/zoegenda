import { useState } from "react";
import { supabase } from "../supabase";
import { ICON_OPTIONS, inp, lbl, fmtMoney, loadExpenses, loadCustomCats, saveExpense, deleteExpense, saveCustomCat, loadTagRelations, saveTag, saveTagRelations } from "./helpers";

export default function ExpenseModal({ ctx }) {
  const { allCats, budgetColor, budgetRows, currentUserId, editExp, expenses, groupId, members, setCustomCats, setEditExp, setExpenses, setShowModal, setTagRelations, setTags, tagRelations, tags } = ctx;
  const isNew = !editExp?.id;
  const todayStr = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState(editExp || {
    description:"", amount:"", date:todayStr, category:"supermarket",
    paid_by: currentUserId, split_between: members.map(m=>m.id),
    installments:1, settled:false
  });
  const [installments, setInstallments] = useState(editExp?.installments>1);
  const [recurringOn,  setRecurringOn]  = useState(false);
  const [showAddCat,  setShowAddCat]  = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatIcon,  setNewCatIcon]  = useState("");
  const [saving,      setSaving]      = useState(false);
  // Tags
  const [selectedTags, setSelectedTags] = useState(() => {
    if(!editExp?.id) return [];
    return tagRelations.filter(r=>r.expense_id===editExp.id).map(r=>r.tag_id);
  });
  const [showNewTag,  setShowNewTag]  = useState(false);
  const [newTagName,  setNewTagName]  = useState("");

  async function handleAddTag(){
    if(!newTagName.trim()) return;
    const created = await saveTag(groupId, newTagName.trim());
    if(created){ setTags(t=>[...t,created]); setSelectedTags(s=>[...s,created.id]); }
    setNewTagName(""); setShowNewTag(false);
  }
  function toggleTag(id){
    setSelectedTags(s => s.includes(id) ? s.filter(x=>x!==id) : [...s,id]);
  }

  const perCuota = form.amount && form.installments > 1 ? Math.ceil(parseFloat(form.amount)/form.installments) : null;

  function toggleMember(uid){
    setForm(f=>({...f, split_between: f.split_between.includes(uid)
      ? f.split_between.filter(x=>x!==uid)
      : [...f.split_between, uid]
    }));
  }

  async function handleSave(){
    if(!form.description.trim() || !form.amount) return;
    if(!form.split_between?.length){ alert("Marcá al menos una persona entre quienes se divide el gasto."); return; }
    setSaving(true);
    const base = {
      ...form,
      amount: parseFloat(form.amount),
      installments: installments ? parseInt(form.installments)||1 : 1,
      group_id: groupId,
      created_by: currentUserId,
    };
    if(installments && base.installments > 1 && isNew){
      const groupInstId = crypto.randomUUID();
      const cuotaAmount = Math.ceil(base.amount / base.installments);
      const startDate = new Date(base.date + "T12:00:00");
      for(let i=0; i<base.installments; i++){
        const d = new Date(startDate);
        d.setMonth(d.getMonth()+i);
        const dateStr = d.toISOString().slice(0,10);
        const { data: saved } = await supabase.from("expenses").insert({
          ...base, id: undefined, amount: cuotaAmount, date: dateStr,
          installment_number: i+1, installment_group_id: groupInstId,
        }).select().single();
        if(saved && selectedTags.length > 0) await saveTagRelations(saved.id, selectedTags);
      }
    } else {
      if(base.id){
        await saveExpense(base);
        await saveTagRelations(base.id, selectedTags);
      } else {
        let recurringId = null;
        if(recurringOn){
          const { data: rule } = await supabase.from("recurring_expenses").insert({
            group_id: groupId, description: base.description.trim(), amount: base.amount, category: base.category,
            paid_by: base.paid_by, split_between: base.split_between, tag_ids: selectedTags,
            day_of_month: parseInt(base.date.slice(8,10)), start_date: base.date, created_by: currentUserId,
          }).select().single();
          recurringId = rule?.id || null;
        }
        const { data: saved } = await supabase.from("expenses").insert({ ...base, recurring_id: recurringId }).select().single();
        if(saved && selectedTags.length > 0) await saveTagRelations(saved.id, selectedTags);
        if(recurringId) await supabase.rpc("generate_recurring_expenses");
      }
    }
    const [exps, rels] = await Promise.all([loadExpenses(groupId), loadTagRelations(groupId)]);
    setExpenses(exps);
    setTagRelations(rels);
    setSaving(false);
    setShowModal(false);
    setEditExp(null);
  }

  async function handleDelete(){
    if(!editExp?.id) return;
    // If installment, delete all in group
    if(editExp.installment_group_id){
      await supabase.from("expenses").delete().eq("installment_group_id", editExp.installment_group_id);
    } else {
      await deleteExpense(editExp.id);
    }
    const exps = await loadExpenses(groupId);
    setExpenses(exps);
    setShowModal(false);
    setEditExp(null);
  }

  async function handleAddCat(){
    if(!newCatLabel.trim() || !newCatIcon) return;
    const cat = { group_id:groupId, label:newCatLabel.trim(), icon:newCatIcon, color:"#88AADD" };
    await saveCustomCat(cat);
    const cats = await loadCustomCats(groupId);
    setCustomCats(cats);
    setForm(f=>({...f, category: cats[cats.length-1]?.id || f.category}));
    setShowAddCat(false); setNewCatLabel(""); setNewCatIcon("");
  }

  return (
    <div onClick={e=>{if(e.target===e.currentTarget){setShowModal(false);setEditExp(null);}}}
      style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"var(--card)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid var(--border2)",maxHeight:"92vh",overflow:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)"}}>{isNew?"Nuevo gasto":"Editar gasto"}</h2>
          <button onClick={()=>{setShowModal(false);setEditExp(null);}} style={{background:"var(--border)",border:"none",color:"var(--ga)",width:26,height:26,borderRadius:"50%",fontSize:14}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Description */}
          <div>
            <label style={lbl}>Descripción</label>
            <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Ej: Supermercado, Expensas..." style={inp} autoFocus/>
          </div>

          {/* Amount + date */}
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1}}>
              <label style={lbl}>Monto total</label>
              <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="$0" style={inp}/>
            </div>
            <div style={{width:130}}>
              <label style={lbl}>Fecha</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/>
            </div>
          </div>

          {/* Installments toggle */}
          <div onClick={()=>{ setInstallments(v=>!v); setRecurringOn(false); }}
            style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>💳 Compra en cuotas</div>
              <div style={{fontSize:12,color:"var(--g5)",marginTop:1}}>Se genera un gasto automático por mes</div>
            </div>
            <div style={{width:36,height:20,borderRadius:10,background:installments?"#DDA0DD":"var(--border2)",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:installments?18:3,transition:"left .2s"}}/>
            </div>
          </div>

          {isNew && !installments && (
            <div onClick={()=>setRecurringOn(v=>!v)}
              style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>🔁 Se repite todos los meses</div>
                <div style={{fontSize:12,color:"var(--g5)",marginTop:1}}>
                  {recurringOn && form.date ? `Se carga solo el día ${parseInt(form.date.slice(8,10))} de cada mes` : "Alquiler, expensas, suscripciones…"}
                </div>
              </div>
              <div style={{width:36,height:20,borderRadius:10,background:recurringOn?"#4ECDC4":"var(--border2)",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:recurringOn?18:3,transition:"left .2s"}}/>
              </div>
            </div>
          )}

          {installments && (
            <div style={{background:"#DDA0DD11",border:"1px solid #DDA0DD33",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:10}}>
              <div>
                <label style={{...lbl,color:"#DDA0DD"}}>Cantidad de cuotas</label>
                <input type="number" value={form.installments} onChange={e=>setForm(f=>({...f,installments:e.target.value}))} placeholder="Ej: 12" min={2} max={60} style={{...inp,background:"var(--bg)"}}/>
              </div>
              {perCuota && (
                <div style={{background:"var(--bg)",border:"1px solid #DDA0DD33",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:12,color:"var(--g8)"}}>Monto por cuota</span>
                  <span style={{fontSize:18,fontWeight:700,fontFamily:"Fraunces,serif",color:"#DDA0DD"}}>{fmtMoney(perCuota)}</span>
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label style={lbl}>Categoría</label>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {allCats.map(c=>{
                const on = form.category===c.id;
                return (
                  <div key={c.id} onClick={()=>setForm(f=>({...f,category:c.id}))}
                    style={{padding:"4px 10px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:on?600:400,background:on?c.color+"33":"var(--card2)",color:on?c.color:"var(--g6)",border:`1px solid ${on?c.color+"44":"var(--border2)"}`}}>
                    {c.icon} {c.label}
                  </div>
                );
              })}
              <div onClick={()=>setShowAddCat(v=>!v)}
                style={{padding:"4px 10px",borderRadius:20,fontSize:12,cursor:"pointer",borderStyle:"dashed",border:"1px dashed var(--border2)",color:"var(--g4)"}}>
                + Nueva
              </div>
            </div>

            {(()=>{ const br = budgetRows.find(b=>b.category===form.category); if(!br) return null;
              const extra = parseFloat(form.amount)||0; const after = (br.spent + (isNew?extra:0)) / br.amount * 100; const col = budgetColor(after);
              return <div style={{marginTop:8,fontSize:13,color:col,background:`color-mix(in srgb, ${col} 12%, transparent)`,border:`1px solid color-mix(in srgb, ${col} 40%, transparent)`,borderRadius:8,padding:"6px 10px"}}>
                🎯 Presupuesto del mes: {fmtMoney(br.spent)}{isNew&&extra>0?` + ${fmtMoney(extra)}`:""} de {fmtMoney(br.amount)} ({Math.round(after)}%)
              </div>; })()}

            {/* Add custom category */}
            {showAddCat && (
              <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:12,padding:12,marginTop:8,display:"flex",flexDirection:"column",gap:10}}>
                <input value={newCatLabel} onChange={e=>setNewCatLabel(e.target.value)} placeholder="Nombre de la categoría" style={inp}/>
                <div>
                  <label style={lbl}>Elegí un ícono</label>
                  <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:180,overflowY:"auto"}}>
                    {ICON_OPTIONS.map(g=>(
                      <div key={g.group}>
                        <div style={{fontSize:12,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{g.group}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {g.icons.map(ico=>(
                            <div key={ico} onClick={()=>setNewCatIcon(ico)}
                              style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:18,cursor:"pointer",background:newCatIcon===ico?"#FF6B6B22":"var(--card2)",border:`1.5px solid ${newCatIcon===ico?"#FF6B6B":"transparent"}`}}>
                              {ico}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {newCatIcon && (
                  <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22}}>{newCatIcon}</span>
                    <span style={{fontSize:12,color:newCatLabel?"var(--text)":"var(--g5)"}}>{newCatLabel||"Sin nombre"}</span>
                  </div>
                )}
                <button onClick={handleAddCat} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:13,fontWeight:700}}>Agregar categoría</button>
              </div>
            )}
          </div>

          {/* Who paid */}
          <div>
            <label style={lbl}>¿Quién pagó?</label>
            <select value={form.paid_by} onChange={e=>setForm(f=>({...f,paid_by:e.target.value}))} style={{...inp,appearance:"none",WebkitAppearance:"none",cursor:"pointer"}}>
              {members.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          </div>

          {/* Split between */}
          <div>
            <label style={lbl}>Dividir entre</label>
            {members.map(m=>{
              const on = form.split_between?.includes(m.id);
              return (
                <div key={m.id} onClick={()=>toggleMember(m.id)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:on?"#FF6B6B11":"var(--bg)",border:`1px solid ${on?"#FF6B6B33":"var(--border)"}`,cursor:"pointer",marginBottom:5}}>
                  <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${on?"#FF6B6B":"var(--border2)"}`,background:on?"#FF6B6B":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",flexShrink:0}}>{on?"✓":""}</div>
                  <div style={{width:22,height:22,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff"}}>{m.avatar}</div>
                  <span style={{fontSize:13}}>{m.display_name}</span>
                </div>
              );
            })}
          </div>

          {/* Tags (optional) */}
          <div>
            <label style={lbl}>🏷 Etiquetas <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--g3)"}}>(opcional)</span></label>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
              {tags.map(t=>{
                const on = selectedTags.includes(t.id);
                return (
                  <div key={t.id} onClick={()=>toggleTag(t.id)}
                    style={{padding:"4px 10px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:on?700:400,background:on?"#DDA0DD33":"var(--card2)",color:on?"#DDA0DD":"var(--g5)",border:`1px solid ${on?"#DDA0DD44":"var(--border2)"}`}}>
                    {t.name}
                  </div>
                );
              })}
              <div onClick={()=>setShowNewTag(v=>!v)}
                style={{padding:"4px 10px",borderRadius:20,fontSize:12,cursor:"pointer",border:"1px dashed var(--border2)",color:"var(--g4)"}}>
                + Nueva
              </div>
            </div>
            {showNewTag && (
              <div style={{display:"flex",gap:6}}>
                <input value={newTagName} onChange={e=>setNewTagName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleAddTag()} placeholder="Nombre de etiqueta" style={{...inp,flex:1}}/>
                <button onClick={handleAddTag} style={{background:"#DDA0DD",color:"#fff",border:"none",borderRadius:10,padding:"0 14px",fontWeight:700,cursor:"pointer",flexShrink:0}}>+</button>
              </div>
            )}
          </div>

          {/* Save / Delete */}
          <button onClick={handleSave} disabled={saving}
            style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:11,fontSize:14,fontWeight:700,opacity:saving?.6:1}}>
            {saving?"Guardando...":(isNew?"Registrar gasto":"Guardar cambios")}
          </button>
          {!isNew && (
            <button onClick={handleDelete}
              style={{background:"transparent",color:"#FF6B6B55",border:"1px solid #FF6B6B22",borderRadius:10,padding:"9px",fontSize:13}}>
              {editExp?.installment_group_id ? "Eliminar todas las cuotas" : "Eliminar gasto"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
