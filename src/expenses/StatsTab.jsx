import Icon from "../app/Icon";
import { useState } from "react";
import { fmtMoney } from "./helpers";
import MonthSelect from "./MonthSelect";
import PieChart from "./PieChart";

export default function StatsTab({ ctx }) {
  const { activeMonth, annualStats, annualTotal, expenses, getMember, monthExpenses, monthTotal, setEditExp, setSelMonth, setShowModal, statsByCat, statsByTag, tagRelations, tags } = ctx;
  const [statsView,    setStatsView]    = useState("month");
  const [openCat,      setOpenCat]      = useState(null); // cat key currently expanded
  const [openTagCat,   setOpenTagCat]   = useState({}); // {tagId: catKey}

  const cats  = statsView==="annual" ? annualStats : statsByCat;
  const total = statsView==="annual" ? annualTotal : monthTotal;
  const max   = cats.length > 0 ? cats[0].amount : 1;

  // Get expenses for a category (filtered by month/annual)
  function expsForCat(catId) {
    const base = statsView==="annual" ? expenses : monthExpenses;
    return base.filter(e => e.category === catId);
  }
  // Get expenses for a category within a tag
  function expsForTagCat(tagId, catId) {
    const tagExpIds = new Set(tagRelations.filter(r=>r.tag_id===tagId).map(r=>r.expense_id));
    return expenses.filter(e => tagExpIds.has(e.id) && e.category === catId);
  }

  // Reusable: bar row with accordion
  const CatRow = ({ c, total: rowTotal, max: rowMax, isOpen, onToggle, expsList }) => {
    const pct  = ((c.amount / rowTotal) * 100).toFixed(1);
    const barW = ((c.amount / rowMax) * 100).toFixed(1);
    return (
      <div style={{marginBottom:6}}>
        <div onClick={onToggle} style={{cursor:"pointer",padding:"10px 12px",borderRadius:isOpen?"10px 10px 0 0":10,background:isOpen?c.color+"22":"var(--card)",border:`1px solid ${isOpen?c.color+"44":"var(--border)"}`,borderBottom:isOpen?"none":""}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:17}}>{c.icon}</span>{c.label}
              <span style={{fontSize:12,color:"var(--g5)",marginLeft:4}}>{isOpen?"▲":"▼"}</span>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:700,fontFamily:"Fraunces,serif",color:c.color}}>{fmtMoney(c.amount)}</div>
              <div style={{fontSize:12,color:"var(--g5)"}}>{pct}% del total</div>
            </div>
          </div>
          <div style={{height:7,background:"var(--card2)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${barW}%`,background:c.color+"55",border:`1px solid ${c.color}66`,borderRadius:4}}/>
          </div>
        </div>
        {isOpen && (
          <div style={{background:"var(--bg)",border:`1px solid ${c.color}33`,borderTop:"none",borderRadius:"0 0 10px 10px",padding:"8px 10px",display:"flex",flexDirection:"column",gap:4}}>
            {expsList.length === 0
              ? <div style={{fontSize:12,color:"var(--g4)",padding:"8px 0",textAlign:"center"}}>Sin gastos</div>
              : expsList.map(e => {
                const payer = getMember(e.paid_by);
                return (
                  <div key={e.id} onClick={()=>{setEditExp(e);setShowModal(true);}}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:10,background:"var(--card)",border:"1px solid var(--card2)",cursor:"pointer"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.description}</div>
                      <div style={{fontSize:12,color:"var(--g5)",marginTop:1}}>{e.date} · {payer.display_name}{e.installments>1?` · Cuota ${e.installment_number}/${e.installments}`:""}</div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:c.color,flexShrink:0}}>{fmtMoney(e.amount)}</div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Sub-view tabs */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["month","Este mes"],["annual","Anual"],...(tags.length>0?[["tags","Por etiqueta"]]:[])]
          .map(([v,l])=>(
            <button key={v} onClick={()=>{setStatsView(v);setOpenCat(null);setOpenTagCat({});}}
              style={{padding:"5px 14px",borderRadius:10,fontSize:12,fontWeight:600,border:"1px solid",borderColor:statsView===v?"var(--border2)":"transparent",background:statsView===v?"var(--border)":"transparent",color:statsView===v?"var(--title)":"var(--g5)",cursor:"pointer"}}>
              {l}
            </button>
          ))
        }
      </div>
      {statsView==="month" && <MonthSelect ctx={ctx} value={activeMonth} onChange={v=>{setSelMonth(v==="all"?null:v);setOpenCat(null);}}/>}

      {/* ── Vista por etiqueta ── */}
      {statsView==="tags" && (
        statsByTag.length === 0
          ? <div style={{textAlign:"center",color:"var(--g4)",padding:"50px 0",fontSize:14}}>No hay etiquetas con gastos</div>
          : statsByTag.map(({tag, cats:tCats, total:tTotal}) => {
            const tMax = tCats.length > 0 ? tCats[0].amount : 1;
            return (
              <div key={tag.id} style={{marginBottom:24}}>
                {/* Tag header */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{background:"#DDA0DD22",color:"var(--violet)",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}><Icon name="tag" size={13}/> {tag.name}</div>
                  <div style={{fontSize:12,color:"var(--g5)"}}>{fmtMoney(tTotal)}</div>
                </div>
                {/* Pie + leyenda */}
                <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:16,marginBottom:10,display:"flex",alignItems:"center",gap:16}}>
                  <PieChart cats={tCats} total={tTotal}/>
                  <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
                    {tCats.map(c=>(
                      <div key={c.id||c.label} style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0}}/>
                        <div style={{flex:1,fontSize:12,color:"var(--ga)"}}>{c.icon} {c.label}</div>
                        <div style={{fontSize:12,fontWeight:700,color:c.color}}>{((c.amount/tTotal)*100).toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Barras con acordeón */}
                {tCats.map(c => {
                  const key = c.id||c.label;
                  const isOpen = openTagCat[tag.id] === key;
                  return (
                    <CatRow key={key} c={c} total={tTotal} max={tMax}
                      isOpen={isOpen}
                      onToggle={()=>setOpenTagCat(prev=>({...prev, [tag.id]: isOpen ? null : key}))}
                      expsList={expsForTagCat(tag.id, c.id)}
                    />
                  );
                })}
              </div>
            );
          })
      )}

      {/* ── Vista mes/anual ── */}
      {statsView!=="tags" && (cats.length === 0
        ? <div style={{textAlign:"center",color:"var(--g4)",padding:"50px 0",fontSize:14}}>Sin datos para mostrar</div>
        : <>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:14,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"var(--g5)",marginBottom:4}}>{statsView==="annual"?"Total anual":"Total del mes"}</div>
              <div style={{fontFamily:"Fraunces,serif",fontSize:22,fontWeight:700}}>{fmtMoney(total)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,color:"var(--g5)",marginBottom:4}}>Categorías</div>
              <div style={{fontFamily:"Fraunces,serif",fontSize:22,fontWeight:700}}>{cats.length}</div>
            </div>
          </div>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:16,marginBottom:14,display:"flex",alignItems:"center",gap:16}}>
            <PieChart cats={cats} total={total}/>
            <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
              {cats.map(c=>(
                <div key={c.id||c.label} style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:12,color:"var(--ga)"}}>{c.icon} {c.label}</div>
                  <div style={{fontSize:12,fontWeight:700,color:c.color}}>{((c.amount/total)*100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            {cats.map(c => {
              const key = c.id||c.label;
              const isOpen = openCat === key;
              return (
                <CatRow key={key} c={c} total={total} max={max}
                  isOpen={isOpen}
                  onToggle={()=>setOpenCat(isOpen ? null : key)}
                  expsList={expsForCat(c.id)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
