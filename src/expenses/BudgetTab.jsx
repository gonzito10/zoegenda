import { useState } from "react";
import { supabase } from "../supabase";
import { inp, fmtMoney, monthLabel, loadBudgets } from "./helpers";

export default function BudgetTab({ ctx }) {
  const { allCats, budgetColor, budgetRows, budgets, currentMonthKey, getCat, groupId, setBudgets } = ctx;
  const [cat, setCat] = useState("");
  const [amt, setAmt] = useState("");
  const [editId, setEditId] = useState(null);
  const free = allCats.filter(c => !budgets.some(b => b.category === c.id));
  async function addBudget(){
    const amount = parseFloat(String(amt).replace(",", "."));
    if(!cat || !(amount>0)) return;
    await supabase.from("category_budgets").upsert({ group_id: groupId, category: cat, amount }, { onConflict: "group_id,category" });
    setBudgets(await loadBudgets(groupId)); setCat(""); setAmt(""); setEditId(null);
  }
  async function removeBudget(b){
    if(!window.confirm("¿Quitar el presupuesto de esta categoría?")) return;
    await supabase.from("category_budgets").delete().eq("id", b.id);
    setBudgets(await loadBudgets(groupId));
  }
  return (
    <div>
      <div style={{fontSize:11,color:"var(--g5)",lineHeight:1.5,marginBottom:12}}>
        Límite mensual por categoría ({monthLabel(currentMonthKey)}). Te avisamos al llegar al 80% y al superarlo.
      </div>
      {budgetRows.length === 0 && (
        <div style={{textAlign:"center",color:"var(--g4)",padding:"24px 10px",fontSize:13}}>Todavía no definiste presupuestos.</div>
      )}
      {budgetRows.map(b=>{
        const c = getCat(b.category); const col = budgetColor(b.pct);
        return (
          <div key={b.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"11px 13px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:18}}>{c.icon}</span>
              <span style={{flex:1,fontSize:13,fontWeight:600}}>{c.label}</span>
              <span style={{fontSize:12,fontWeight:700,color:col}}>{Math.round(b.pct)}%</span>
              <button onClick={()=>{setEditId(b.id);setCat(b.category);setAmt(String(b.amount));}} style={{background:"transparent",border:"none",color:"var(--g8)",fontSize:14,cursor:"pointer",padding:"2px 5px"}}>✎</button>
              <button onClick={()=>removeBudget(b)} style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:14,cursor:"pointer",padding:"2px 5px"}}>🗑</button>
            </div>
            <div style={{height:8,borderRadius:6,background:"var(--border)",overflow:"hidden"}}>
              <div style={{width:`${Math.min(100,b.pct)}%`,height:"100%",background:col,borderRadius:6,transition:"width .3s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--g5)",marginTop:6}}>
              <span>Gastado {fmtMoney(b.spent)}</span>
              <span>{b.spent<=b.amount?`Quedan ${fmtMoney(b.amount-b.spent)}`:`Excedido ${fmtMoney(b.spent-b.amount)}`} · Límite {fmtMoney(b.amount)}</span>
            </div>
          </div>
        );
      })}
      <div style={{background:"var(--card)",border:"1px dashed var(--border2)",borderRadius:12,padding:12,marginTop:12}}>
        <div style={{fontSize:10,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{editId?"Editar límite":"Nuevo límite mensual"}</div>
        <div style={{display:"flex",gap:8}}>
          <select value={cat} onChange={e=>setCat(e.target.value)} disabled={!!editId} style={{...inp,flex:2,cursor:"pointer"}}>
            <option value="">Categoría…</option>
            {(editId ? allCats : free).map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <input value={amt} onChange={e=>setAmt(e.target.value)} inputMode="decimal" placeholder="Monto" style={{...inp,flex:1.3}}/>
          <button onClick={addBudget} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>OK</button>
        </div>
        {editId && <button onClick={()=>{setEditId(null);setCat("");setAmt("");}} style={{marginTop:8,background:"transparent",border:"none",color:"var(--g6)",fontSize:11,cursor:"pointer"}}>Cancelar edición</button>}
      </div>
    </div>
  );
}
