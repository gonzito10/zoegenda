import { useMemo } from "react";
import { fmtMoney, fmtDay } from "./helpers";

export default function BalanceTab({ ctx }) {
  const { balance, budgetColor, budgetRows, debts, expenses, getCat, getMember, handleDeleteSettlement, handleSettle, members, monthExpenses, monthTotal, setSubTab, settlements } = ctx;
  const totalHistorico = useMemo(() => expenses.reduce((s,e)=>s+e.amount,0), []);
  return (
  <div>
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:11,color:"var(--g5)",display:"flex",alignItems:"center",gap:6}}>
      <span>📊</span> Balance acumulado histórico — incluye todos los meses
    </div>
    {budgetRows.filter(b=>b.pct>=80).map(b=>{
      const c = getCat(b.category);
      return (
        <div key={b.id} onClick={()=>setSubTab("budget")}
          style={{background:budgetColor(b.pct)+"18",border:`1px solid ${budgetColor(b.pct)}55`,borderRadius:10,padding:"9px 13px",marginBottom:8,fontSize:12,display:"flex",alignItems:"center",gap:8,cursor:"pointer",color:budgetColor(b.pct)}}>
          <span>{b.pct>=100?"🚨":"⚠️"}</span>
          <span style={{flex:1}}><strong>{c.icon} {c.label}</strong>: {b.pct>=100?`superaste el presupuesto (${fmtMoney(b.spent)} de ${fmtMoney(b.amount)})`:`vas por el ${Math.round(b.pct)}% del presupuesto del mes`}</span>
        </div>
      );
    })}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {members.map(m=>{
        const b = balance[m.id] || 0;
        return (
          <div key={m.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12}}>
            <div style={{fontSize:11,color:"var(--g6)",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,fontWeight:700,color:"#fff"}}>{m.avatar}</div>
              {m.display_name}
            </div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"Fraunces,serif",color:b>0.01?"#96CEB4":b<-0.01?"#FF6B6B":"var(--g5)"}}>{fmtMoney(Math.abs(b))}</div>
            <div style={{fontSize:10,marginTop:3,color:b>0.01?"#96CEB4":b<-0.01?"#FF6B6B":"var(--g5)"}}>{b>0.01?"Le deben":b<-0.01?"Debe":"Al día ✓"}</div>
          </div>
        );
      })}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:12}}>
        <div style={{fontSize:11,color:"var(--g6)",marginBottom:4}}>💰 Total histórico</div>
        <div style={{fontSize:18,fontWeight:700,fontFamily:"Fraunces,serif",color:"var(--text)"}}>{fmtMoney(totalHistorico)}</div>
        <div style={{fontSize:10,color:"var(--g5)",marginTop:3}}>Todos los meses</div>
      </div>
    </div>

    {debts.length > 0 && <>
      <div style={{fontSize:10,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Quién le debe a quién</div>
      {debts.map((d,i)=>{
        const from = getMember(d.from), to = getMember(d.to);
        return (
          <div key={i} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:from.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{from.avatar}</div>
            <div style={{flex:1,fontSize:12}}>
              {from.display_name} → <strong style={{color:to.color}}>{to.display_name}</strong>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:"#FF6B6B",marginRight:8}}>{fmtMoney(d.amount)}</div>
            <button onClick={()=>handleSettle(d)}
              style={{background:"#96CEB422",color:"#96CEB4",border:"1px solid #96CEB444",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
              ✓ Saldar
            </button>
          </div>
        );
      })}
    </>}

    {debts.length === 0 && monthTotal > 0 && (
      <div style={{textAlign:"center",color:"#96CEB4",padding:"20px 0",fontSize:13}}>✓ Todo al día</div>
    )}


    {/* Historial de pagos */}
    {settlements.length > 0 && <>
      <div style={{fontSize:10,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"20px 0 8px"}}>Historial de pagos</div>
      {[...settlements].sort((a,b)=> b.date.localeCompare(a.date) || String(b.created_at||"").localeCompare(String(a.created_at||""))).map(st=>{
        const from = getMember(st.from_user), to = getMember(st.to_user);
        return (
          <div key={st.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:from.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff",flexShrink:0}}>{from.avatar}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12}}>{from.display_name} → <strong style={{color:to.color}}>{to.display_name}</strong></div>
              <div style={{fontSize:10,color:"var(--g5)",marginTop:1}}>📅 {fmtDay(st.date)}</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:"#96CEB4"}}>{fmtMoney(st.amount)}</div>
            <button onClick={()=>handleDeleteSettlement(st)} title="Eliminar pago"
              style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:14,cursor:"pointer",padding:"4px 6px"}}>🗑</button>
          </div>
        );
      })}
    </>}

    {/* Active installments this month */}
    {monthExpenses.filter(e=>e.installments>1).length > 0 && <>
      <div style={{fontSize:10,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 8px"}}>Cuotas activas</div>
      {monthExpenses.filter(e=>e.installments>1).map(e=>{
        const c = getCat(e.category);
        return (
          <div key={e.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{width:34,height:34,borderRadius:9,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.description}</div>
              <div style={{fontSize:11,color:"var(--g5)",marginTop:2,display:"flex",gap:5,alignItems:"center"}}>
                {getMember(e.paid_by).display_name}
                <span style={{background:"#DDA0DD22",color:"#DDA0DD",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>Cuota {e.installment_number}/{e.installments}</span>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:14,fontWeight:700,color:"#DDA0DD"}}>{fmtMoney(e.amount)}</div>
              <div style={{fontSize:10,color:"var(--g5)"}}>÷{e.split_between?.length||1} = {fmtMoney(e.amount/(e.split_between?.length||1))} c/u</div>
            </div>
          </div>
        );
      })}
    </>}
  </div>
  );
}
