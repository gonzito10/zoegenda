import { useState } from "react";
import { supabase } from "../supabase";
import { inp, fmtMoney, loadRecurring } from "./helpers";

export default function RecurringTab({ ctx }) {
  const { allCats, currentMonthKey, expenses, getCat, getMember, groupId, members, recurring, setRecurring } = ctx;
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState(null);
  function startEdit(r){ setEditId(r.id); setF({ description:r.description, amount:String(r.amount), day_of_month:String(r.day_of_month), category:r.category, paid_by:r.paid_by, split_between:r.split_between||[] }); }
  async function saveEdit(){
    const amount = parseFloat(f.amount); const day = parseInt(f.day_of_month);
    if(!f.description.trim() || !(amount>0) || !(day>=1 && day<=31) || !f.split_between.length) return;
    await supabase.from("recurring_expenses").update({ description:f.description.trim(), amount, day_of_month:day, category:f.category, paid_by:f.paid_by, split_between:f.split_between }).eq("id", editId);
    setRecurring(await loadRecurring(groupId)); setEditId(null);
    await supabase.rpc("generate_recurring_expenses");
  }
  async function toggleActive(r){
    await supabase.from("recurring_expenses").update({ active: !r.active }).eq("id", r.id);
    setRecurring(await loadRecurring(groupId));
  }
  async function removeRule(r){
    if(!window.confirm(`¿Eliminar el gasto recurrente "${r.description}"? Los gastos ya cargados se mantienen.`)) return;
    await supabase.from("recurring_expenses").delete().eq("id", r.id);
    setRecurring(await loadRecurring(groupId));
  }
  if(recurring.length===0) return (
    <div style={{textAlign:"center",color:"var(--g4)",padding:"40px 20px",fontSize:13,lineHeight:1.6}}>
      Todavía no hay gastos recurrentes.<br/>Al crear un gasto, activá <b>🔁 Se repite todos los meses</b> y se cargará solo cada mes.
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:11,color:"var(--g5)",lineHeight:1.5}}>Se cargan solos el día indicado de cada mes. Si cambiás el monto, aplica desde el próximo mes.</div>
      {recurring.map(r=>{
        const c = getCat(r.category); const payer = getMember(r.paid_by);
        if(editId===r.id && f) return (
          <div key={r.id} style={{background:"var(--card)",border:"1px solid #4ECDC444",borderRadius:12,padding:12,display:"flex",flexDirection:"column",gap:8}}>
            <input value={f.description} onChange={e=>setF(x=>({...x,description:e.target.value}))} placeholder="Descripción" style={inp}/>
            <div style={{display:"flex",gap:8}}>
              <input value={f.amount} onChange={e=>setF(x=>({...x,amount:e.target.value}))} inputMode="decimal" placeholder="Monto" style={{...inp,flex:2}}/>
              <input value={f.day_of_month} onChange={e=>setF(x=>({...x,day_of_month:e.target.value}))} inputMode="numeric" placeholder="Día" style={{...inp,flex:1}}/>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {allCats.map(ct=>{ const on=f.category===ct.id; return (
                <div key={ct.id} onClick={()=>setF(x=>({...x,category:ct.id}))}
                  style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",fontWeight:on?600:400,background:on?ct.color+"33":"var(--card2)",color:on?ct.color:"var(--g6)",border:`1px solid ${on?ct.color+"66":"var(--border)"}`}}>{ct.icon} {ct.label}</div>
              );})}
            </div>
            <div style={{fontSize:10,color:"var(--g5)",fontWeight:600,textTransform:"uppercase"}}>Pagó</div>
            <div style={{display:"flex",gap:6}}>
              {members.map(m=>(
                <div key={m.id} onClick={()=>setF(x=>({...x,paid_by:m.id}))}
                  style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:f.paid_by===m.id?700:400,background:f.paid_by===m.id?m.color+"33":"var(--card2)",color:f.paid_by===m.id?m.color:"var(--g6)",border:`1px solid ${f.paid_by===m.id?m.color+"66":"var(--border)"}`}}>{m.display_name}</div>
              ))}
            </div>
            <div style={{fontSize:10,color:"var(--g5)",fontWeight:600,textTransform:"uppercase"}}>Dividir entre</div>
            <div style={{display:"flex",gap:6}}>
              {members.map(m=>{ const on=f.split_between.includes(m.id); return (
                <div key={m.id} onClick={()=>setF(x=>({...x,split_between:on?x.split_between.filter(u=>u!==m.id):[...x.split_between,m.id]}))}
                  style={{padding:"5px 12px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:on?700:400,background:on?m.color+"33":"var(--card2)",color:on?m.color:"var(--g6)",border:`1px solid ${on?m.color+"66":"var(--border)"}`}}>{m.display_name}</div>
              );})}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditId(null)} style={{flex:1,background:"var(--card2)",color:"var(--g8)",border:"1px solid var(--border2)",borderRadius:10,padding:"9px",fontSize:12,cursor:"pointer"}}>Cancelar</button>
              <button onClick={saveEdit} style={{flex:1,background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Guardar</button>
            </div>
          </div>
        );
        return (
          <div key={r.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"11px 13px",opacity:r.active?1:.55}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>{c.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.description}</div>
                <div style={{fontSize:11,color:"var(--g5)",marginTop:2,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                    <span>Día {r.day_of_month} de cada mes · {payer.display_name} · ÷{r.split_between?.length||1}{!r.active&&" · en pausa"}</span>
                    {r.active && <span style={{background:expenses.some(e=>e.recurring_id===r.id && e.date.slice(0,7)===currentMonthKey)?"#96CEB422":"var(--card2)",color:expenses.some(e=>e.recurring_id===r.id && e.date.slice(0,7)===currentMonthKey)?"#96CEB4":"var(--g5)",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>{expenses.some(e=>e.recurring_id===r.id && e.date.slice(0,7)===currentMonthKey)?"✓ Cargado este mes":"Pendiente"}</span>}
                  </div>
              </div>
              <div style={{fontSize:15,fontWeight:700,fontFamily:"Fraunces,serif"}}>{fmtMoney(r.amount)}</div>
            </div>
            <div style={{display:"flex",gap:6,marginTop:9,justifyContent:"flex-end"}}>
              <button onClick={()=>startEdit(r)} style={{background:"var(--card2)",color:"var(--g8)",border:"1px solid var(--border2)",borderRadius:8,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>✎ Editar</button>
              <button onClick={()=>toggleActive(r)} style={{background:"var(--card2)",color:"var(--g8)",border:"1px solid var(--border2)",borderRadius:8,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>{r.active?"⏸ Pausar":"▶ Reanudar"}</button>
              <button onClick={()=>removeRule(r)} style={{background:"#FF6B6B11",color:"#FF6B6B",border:"1px solid #FF6B6B33",borderRadius:8,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>🗑 Eliminar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
