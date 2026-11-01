import { fmtMoney, fmtDay, isVisibleInHistory } from "./helpers";
import MonthSelect from "./MonthSelect";

export default function HistoryTab({ ctx }) {
  const { activeMonth, getCat, getMember, monthExpenses, setEditExp, setSelMonth, setShowModal, tagRelations, tags } = ctx;
  // Más reciente primero; las cuotas futuras se ocultan hasta que llegue su fecha
  const historyExpenses = monthExpenses
    .filter(isVisibleInHistory)
    .sort((a,b) => b.date.localeCompare(a.date) || (b.created_at||"").localeCompare(a.created_at||""));
  const historyTotal = historyExpenses.reduce((sum,e)=>sum+e.amount,0);
  return (
  <div>
    <MonthSelect ctx={ctx} value={activeMonth} onChange={v=>setSelMonth(v==="all"?null:v)}/>
    {historyExpenses.length === 0
      ? <div style={{textAlign:"center",color:"var(--g4)",padding:"50px 0",fontSize:14}}>No hay gastos este mes</div>
      : <>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",fontSize:12}}>
          <span style={{color:"var(--g5)"}}>Total del mes</span>
          <strong style={{color:"var(--text)"}}>{fmtMoney(historyTotal)}</strong>
        </div>
        {historyExpenses.map(e=>{
          const c = getCat(e.category);
          const payer = getMember(e.paid_by);
          const perPerson = e.amount / (e.split_between?.length || 1);
          return (
            <div key={e.id} onClick={()=>{ setEditExp(e); setShowModal(true); }}
              style={{background:e.settled?"var(--bg)":"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6,cursor:"pointer",opacity:e.settled?0.5:1}}>
              <div style={{width:34,height:34,borderRadius:9,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:e.settled?"line-through":"none"}}>{e.description}</div>
                <div style={{fontSize:11,color:"var(--g5)",marginTop:2,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:"#8a8a9a",fontWeight:600}}>📅 {fmtDay(e.date)}</span> · {payer.display_name} · {c.label}
                  {e.installments>1&&<span style={{background:"#DDA0DD22",color:"#DDA0DD",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>Cuota {e.installment_number}/{e.installments}</span>}
                  {e.recurring_id&&<span style={{background:"#4ECDC422",color:"#4ECDC4",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>🔁 Mensual</span>}
                  {e.settled&&<span style={{background:"#96CEB422",color:"#96CEB4",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>✓ Liquidado</span>}
                  {tagRelations.filter(r=>r.expense_id===e.id).map(r=>{
                    const tag = tags.find(t=>t.id===r.tag_id);
                    return tag ? <span key={r.tag_id} style={{background:"#DDA0DD22",color:"#DDA0DD",padding:"1px 6px",borderRadius:10,fontSize:9}}>🏷 {tag.name}</span> : null;
                  })}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700,color:e.installments>1?"#DDA0DD":"var(--text)",textDecoration:e.settled?"line-through":"none"}}>{fmtMoney(e.amount)}</div>
                <div style={{fontSize:10,color:"var(--g5)"}}>÷{e.split_between?.length||1} = {fmtMoney(perPerson)} c/u</div>
              </div>
            </div>
          );
        })}
      </>
    }
  </div>
  );
}
