import Icon from "../app/Icon";
import { useState, useRef } from "react";
import { supabase } from "../supabase";
import { inp, fmtMoney, monthLabel, loadBudgets, categoryHistory } from "./helpers";

const roundMoney = n => Math.round(n / 100) * 100;
const shortMonth = key => monthLabel(key).slice(0, 3);

export default function BudgetTab({ ctx }) {
  const { allCats, budgetColor, budgetRows, budgets, currentMonthKey, expenses, getCat, groupId, setBudgets } = ctx;
  const [cat, setCat] = useState("");
  const [amt, setAmt] = useState("");
  const [editId, setEditId] = useState(null);
  const [period, setPeriod] = useState(3);
  const [openId, setOpenId] = useState(null);
  const formRef = useRef(null);
  const free = allCats.filter(c => !budgets.some(b => b.category === c.id));
  const hist = id => categoryHistory(expenses, id, currentMonthKey, period);
  const catHist = cat ? { 3: categoryHistory(expenses, cat, currentMonthKey, 3), 6: categoryHistory(expenses, cat, currentMonthKey, 6), cur: hist(cat) } : null;
  const suggestions = free
    .map(c => ({ c, h: hist(c.id) }))
    .filter(x => x.h.avg > 0)
    .sort((a, b) => b.h.avg - a.h.avg)
    .slice(0, 6);

  // Total general: suma de límites vs. lo gastado en las categorías con límite (mes actual)
  const totalLimit = budgetRows.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetRows.reduce((s, b) => s + b.spent, 0);
  const totalPct = totalLimit > 0 ? totalSpent / totalLimit * 100 : 0;
  const totalCol = budgetColor(totalPct);
  const unbudgetedSpent = expenses
    .filter(e => e.date.slice(0, 7) === currentMonthKey && !budgets.some(b => b.category === e.category))
    .reduce((s, e) => s + e.amount, 0);

  function fillForm(catId, amount, editing) {
    setCat(catId); setAmt(amount ? String(amount) : ""); setEditId(editing || null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }
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
  const chip = on => ({whiteSpace:"nowrap",padding:"4px 11px",borderRadius:20,fontSize:12,fontWeight:on?700:500,cursor:"pointer",background:on?"#FF6B6B22":"var(--card2)",color:on?"var(--coral)":"var(--g6)",border:`1px solid ${on?"#FF6B6B55":"var(--border2)"}`});

  return (
    <div>
      <div style={{fontSize:12,color:"var(--g5)",lineHeight:1.5,marginBottom:10}}>
        Límite mensual por categoría ({monthLabel(currentMonthKey)}). Te avisamos al llegar al 80% y al superarlo.
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <span style={{fontSize:12,color:"var(--g5)",flex:"1 1 100%"}}><Icon name="chart" size={15}/> Comparar con el promedio de:</span>
        {[3,6,12].map(n => <div key={n} onClick={()=>setPeriod(n)} style={chip(period===n)}>{n} meses</div>)}
      </div>
      {budgetRows.length === 0 && (
        <div style={{textAlign:"center",color:"var(--g4)",padding:"24px 10px",fontSize:13}}>Todavía no definiste presupuestos.</div>
      )}
      {budgetRows.length > 0 && (
        <div style={{background:"var(--card)",border:`1px solid color-mix(in srgb, ${totalCol} 45%, transparent)`,borderRadius:16,padding:"14px 16px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8,marginBottom:4}}>
            <span style={{fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Presupuesto total del mes</span>
            <span style={{fontSize:13,fontWeight:700,color:totalCol}}>{totalPct>=100?"Superado":totalPct>=80?"Cerca del límite":"Va bien"} · {Math.round(totalPct)}%</span>
          </div>
          <div style={{fontSize:24,fontWeight:700,fontFamily:"Fraunces,serif",color:"var(--title)"}}>
            {totalSpent<=totalLimit ? `Quedan ${fmtMoney(totalLimit-totalSpent)}` : `Excedido ${fmtMoney(totalSpent-totalLimit)}`}
          </div>
          <div style={{height:10,borderRadius:6,background:"var(--border)",overflow:"hidden",margin:"10px 0 6px"}}>
            <div style={{width:`${Math.min(100,totalPct)}%`,height:"100%",background:totalCol,borderRadius:6,transition:"width .3s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--g5)"}}>
            <span>Gastado {fmtMoney(totalSpent)}</span>
            <span>Límite total {fmtMoney(totalLimit)}</span>
          </div>
          {unbudgetedSpent > 0 && (
            <div style={{fontSize:12,color:"var(--g5)",marginTop:8,paddingTop:8,borderTop:"1px solid var(--border)"}}>
              Además, gastaron {fmtMoney(unbudgetedSpent)} en categorías sin límite (no cuentan en este total).
            </div>
          )}
        </div>
      )}
      {budgetRows.map(b=>{
        const c = getCat(b.category); const col = budgetColor(b.pct);
        const h = hist(b.category); const isOpen = openId === b.id;
        const barMax = Math.max(b.amount, ...h.totals.map(t => t.total), 1);
        return (
          <div key={b.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"11px 13px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:18}}>{c.icon}</span>
              <span style={{flex:1,fontSize:13,fontWeight:600}}>{c.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:col}}>{b.pct>=100?"Superado":b.pct>=80?"Cerca del límite":"Va bien"} · {Math.round(b.pct)}%</span>
              <button onClick={()=>fillForm(b.category, b.amount, b.id)} style={{background:"transparent",border:"none",color:"var(--g8)",fontSize:14,cursor:"pointer",padding:"8px",display:"flex"}} aria-label="Editar límite"><Icon name="edit" size={17}/></button>
              <button onClick={()=>removeBudget(b)} style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:14,cursor:"pointer",padding:"8px",display:"flex"}} aria-label="Quitar límite"><Icon name="trash" size={17}/></button>
            </div>
            <div style={{height:10,borderRadius:6,background:"var(--border)",overflow:"hidden"}}>
              <div style={{width:`${Math.min(100,b.pct)}%`,height:"100%",background:col,borderRadius:6,transition:"width .3s"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--g5)",marginTop:6}}>
              <span>Gastado {fmtMoney(b.spent)}</span>
              <span>{b.spent<=b.amount?`Quedan ${fmtMoney(b.amount-b.spent)}`:`Excedido ${fmtMoney(b.spent-b.amount)}`} · Límite {fmtMoney(b.amount)}</span>
            </div>
            {h.months > 0 && (
              <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--border)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,fontSize:12,color:"var(--g8)"}}>
                  <span><Icon name="chart" size={14}/> Promedio {h.months} {h.months===1?"mes":"meses"}: <strong style={{color:"var(--text)"}}>{fmtMoney(h.avg)}</strong>{h.max && <span style={{color:"var(--g5)"}}> · máx {fmtMoney(h.max.total)}</span>}</span>
                  <span onClick={()=>setOpenId(isOpen?null:b.id)} style={{color:"var(--coral)",cursor:"pointer",whiteSpace:"nowrap",fontWeight:600}}>{isOpen?"ocultar ▴":"ver meses ▾"}</span>
                </div>
                <div style={{fontSize:12,color:b.amount<h.avg?"var(--warn)":"var(--g5)",marginTop:3}}>
                  {b.amount<h.avg ? `Tu límite está ${fmtMoney(h.avg-b.amount)} por debajo del promedio` : `Tu límite está ${fmtMoney(b.amount-h.avg)} por encima del promedio`}
                </div>
                {isOpen && (
                  <div style={{marginTop:10}}>
                    <div style={{position:"relative",display:"flex",alignItems:"flex-end",gap:4,height:84,paddingTop:4}}>
                      <div style={{position:"absolute",left:0,right:0,bottom:`${(b.amount/barMax)*72+16}px`,borderTop:"1px dashed #FF6B6B88"}}/>
                      <div style={{position:"absolute",left:0,right:0,bottom:`${(h.avg/barMax)*72+16}px`,borderTop:"1px dashed var(--g5)"}}/>
                      {h.totals.map(t=>(
                        <div key={t.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%",minWidth:0}}>
                          <div title={fmtMoney(t.total)} style={{width:"70%",maxWidth:22,height:`${Math.max(2,(t.total/barMax)*72)}px`,background:c.color,borderRadius:"3px 3px 0 0",opacity:.85}}/>
                          <div style={{fontSize:12,color:"var(--g5)",marginTop:3}}>{shortMonth(t.key)}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:12,fontSize:12,color:"var(--g5)",marginTop:6}}>
                      <span style={{color:"var(--coral)"}}>┄ Límite</span><span>┄ Promedio</span>
                      {h.min && <span style={{marginLeft:"auto"}}>mín {fmtMoney(h.min.total)} ({shortMonth(h.min.key)})</span>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div ref={formRef} style={{background:"var(--card)",border:"1px dashed var(--border2)",borderRadius:10,padding:12,marginTop:12}}>
        <div style={{fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{editId?"Editar límite":"Nuevo límite mensual"}</div>
        <div style={{display:"flex",gap:8}}>
          <select value={cat} onChange={e=>setCat(e.target.value)} disabled={!!editId} style={{...inp,flex:2,cursor:"pointer"}}>
            <option value="">Categoría…</option>
            {(editId ? allCats : free).map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <input value={amt} onChange={e=>setAmt(e.target.value)} inputMode="decimal" placeholder="Monto" style={{...inp,flex:1.3}}/>
          <button onClick={addBudget} style={{background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"0 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>OK</button>
        </div>
        {catHist && (
          <div style={{marginTop:10,background:"var(--bg)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 12px"}}>
            {catHist[3].months === 0 ? (
              <div style={{fontSize:12,color:"var(--g5)"}}>Todavía no hay meses anteriores con datos de esta categoría.</div>
            ) : <>
              <div style={{fontSize:12,color:"var(--g8)",marginBottom:6}}><Icon name="chart" size={14}/> Lo que gastaron en {getCat(cat).label}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {[3,6].map(n => catHist[n].months > 0 && (
                  <div key={n} style={{flex:"1 1 0",minWidth:90,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"7px 9px"}}>
                    <div style={{fontSize:12,color:"var(--g5)"}}>Promedio {catHist[n].months} {catHist[n].months===1?"mes":"meses"}</div>
                    <div style={{fontSize:14,fontWeight:700,fontFamily:"Fraunces,serif"}}>{fmtMoney(catHist[n].avg)}</div>
                    <div onClick={()=>setAmt(String(roundMoney(catHist[n].avg)))} style={{fontSize:12,color:"var(--coral)",cursor:"pointer",fontWeight:600,marginTop:3}}>Usar este promedio</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:12,color:"var(--g5)",marginTop:7,lineHeight:1.6}}>
                {catHist.cur.max && <>Mes más alto: <strong>{fmtMoney(catHist.cur.max.total)}</strong> ({monthLabel(catHist.cur.max.key)})</>}
                {catHist.cur.min && <><br/>Mes más bajo: <strong>{fmtMoney(catHist.cur.min.total)}</strong> ({monthLabel(catHist.cur.min.key)})</>}
              </div>
            </>}
          </div>
        )}
        {editId && <button onClick={()=>{setEditId(null);setCat("");setAmt("");}} style={{marginTop:8,background:"transparent",border:"none",color:"var(--g6)",fontSize:12,cursor:"pointer"}}>Cancelar edición</button>}
      </div>

      {suggestions.length > 0 && (
        <div style={{marginTop:16}}>
          <div style={{fontSize:12,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Categorías sin límite · promedio {period} meses</div>
          {suggestions.map(({c,h})=>(
            <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 12px",marginBottom:5}}>
              <span style={{fontSize:16}}>{c.icon}</span>
              <span style={{flex:1,fontSize:13,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.label}</span>
              <span style={{fontSize:13,fontWeight:700}}>{fmtMoney(h.avg)}</span>
              <button onClick={()=>fillForm(c.id, roundMoney(h.avg), null)} style={{background:"#FF6B6B22",color:"var(--coral)",border:"1px solid #FF6B6B44",borderRadius:10,padding:"4px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Fijar límite</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
