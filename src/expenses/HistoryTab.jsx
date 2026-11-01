import Icon from "../app/Icon";
import { fmtMoney, fmtDay, isVisibleInHistory, localToday, MONTHS_ES } from "./helpers";
import { DAYS_FULL } from "../app/constants";
import MonthSelect from "./MonthSelect";

export default function HistoryTab({ ctx }) {
  const { activeMonth, getCat, getMember, handleDeleteSettlement, settlements, monthExpenses, setEditExp, setSelMonth, setShowModal, tagRelations, tags } = ctx;
  // Más reciente primero; las cuotas futuras se ocultan hasta que llegue su fecha
  const historyExpenses = monthExpenses
    .filter(isVisibleInHistory)
    .sort((a,b) => b.date.localeCompare(a.date) || (b.created_at||"").localeCompare(a.created_at||""));
  const monthSettlements = settlements.filter(s=>s.date.slice(0,7)===activeMonth);
  const historyTotal = historyExpenses.reduce((sum,e)=>sum+e.amount,0);
  // Agrupado por día: "Hoy", "Ayer" y después el día de la semana con la fecha
  const todayStr = localToday();
  const yest = new Date(); yest.setDate(yest.getDate()-1);
  const yestStr = `${yest.getFullYear()}-${String(yest.getMonth()+1).padStart(2,"0")}-${String(yest.getDate()).padStart(2,"0")}`;
  function dayLabel(ds){
    if(ds===todayStr) return "Hoy";
    if(ds===yestStr) return "Ayer";
    const [y,m,d] = ds.split("-").map(Number);
    return `${DAYS_FULL[new Date(y,m-1,d).getDay()]} ${d} de ${MONTHS_ES[m-1].toLowerCase()}`;
  }
  const groups = [];
  historyExpenses.forEach(e => {
    const last = groups[groups.length-1];
    if(last && last.date===e.date){ last.items.push(e); last.total += e.amount; }
    else groups.push({ date:e.date, items:[e], total:e.amount });
  });
  return (
  <div>
    <MonthSelect ctx={ctx} value={activeMonth} onChange={v=>setSelMonth(v==="all"?null:v)}/>
    {historyExpenses.length === 0
      ? <div style={{textAlign:"center",color:"var(--g4)",padding:monthSettlements.length?"24px 0":"50px 0",fontSize:14}}>No hay gastos este mes</div>
      : <>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",fontSize:12}}>
          <span style={{color:"var(--g5)"}}>Total del mes</span>
          <strong style={{color:"var(--text)"}}>{fmtMoney(historyTotal)}</strong>
        </div>
        {groups.map(g=>(
          <div key={g.date}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",margin:"14px 0 6px"}}>
              <span style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"var(--title)"}}>{dayLabel(g.date)}</span>
              <span style={{fontSize:13,color:"var(--g6)"}}>{fmtMoney(g.total)}</span>
            </div>
        {g.items.map(e=>{
          const c = getCat(e.category);
          const payer = getMember(e.paid_by);
          const perPerson = e.amount / (e.split_between?.length || 1);
          return (
            <div key={e.id} onClick={()=>{ setEditExp(e); setShowModal(true); }}
              style={{background:e.settled?"var(--bg)":"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6,cursor:"pointer",opacity:e.settled?0.5:1}}>
              <div style={{width:34,height:34,borderRadius:9,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:e.settled?"line-through":"none"}}>{e.description}</div>
                <div style={{fontSize:12,color:"var(--g5)",marginTop:2,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <span>{payer.display_name} · {c.label}</span>
                  {e.installments>1&&<span style={{background:"#DDA0DD22",color:"#DDA0DD",padding:"1px 6px",borderRadius:10,fontSize:12,fontWeight:700}}>Cuota {e.installment_number}/{e.installments}</span>}
                  {e.recurring_id&&<span style={{background:"#4ECDC422",color:"#4ECDC4",padding:"1px 6px",borderRadius:10,fontSize:12,fontWeight:700}}><Icon name="repeat" size={12}/> Mensual</span>}
                  {e.settled&&<span style={{background:"#96CEB422",color:"#96CEB4",padding:"1px 6px",borderRadius:10,fontSize:12,fontWeight:700}}>✓ Liquidado</span>}
                  {tagRelations.filter(r=>r.expense_id===e.id).map(r=>{
                    const tag = tags.find(t=>t.id===r.tag_id);
                    return tag ? <span key={r.tag_id} style={{background:"#DDA0DD22",color:"#DDA0DD",padding:"1px 6px",borderRadius:10,fontSize:12}}><Icon name="tag" size={12}/> {tag.name}</span> : null;
                  })}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700,color:e.installments>1?"#DDA0DD":"var(--text)",textDecoration:e.settled?"line-through":"none"}}>{fmtMoney(e.amount)}</div>
                <div style={{fontSize:12,color:"var(--g5)"}}>÷{e.split_between?.length||1} = {fmtMoney(perPerson)} c/u</div>
              </div>
            </div>
          );
        })}
          </div>
        ))}
      </>
    }
    {monthSettlements.length > 0 && <>
      <div style={{fontSize:12,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"18px 0 8px"}}>Pagos</div>
      {[...monthSettlements].sort((a,b)=> b.date.localeCompare(a.date) || String(b.created_at||"").localeCompare(String(a.created_at||""))).map(st=>{
        const from = getMember(st.from_user), to = getMember(st.to_user);
        return (
          <div key={st.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:from.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff",flexShrink:0}}>{from.avatar}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12}}>{from.display_name} → <strong style={{color:to.color}}>{to.display_name}</strong></div>
              <div style={{fontSize:12,color:"var(--g5)",marginTop:1}}><Icon name="calendar" size={13}/> {fmtDay(st.date)}</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:"#96CEB4"}}>{fmtMoney(st.amount)}</div>
            <button onClick={()=>handleDeleteSettlement(st)} title="Eliminar pago"
              style={{background:"transparent",border:"none",color:"var(--g6)",cursor:"pointer",padding:"8px",display:"flex"}} aria-label="Eliminar pago"><Icon name="trash" size={17}/></button>
          </div>
        );
      })}
    </>}

  </div>
  );
}
