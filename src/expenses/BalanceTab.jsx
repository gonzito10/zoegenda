import Icon from "../app/Icon";
import { useMemo } from "react";
import { fmtMoney, fmtDay } from "./helpers";
import RecurringTab from "./RecurringTab";

export default function BalanceTab({ ctx }) {
  const { balance, budgetColor, budgetRows, currentMonthKey, debts, expenses, getCat, getMember, handleSettle, members, monthExpenses, monthTotal, recurring, setSubTab } = ctx;
  const totalHistorico = useMemo(() => expenses.reduce((s,e)=>s+e.amount,0), []);
  return (
  <div>
    {/* Saldo como protagonista: una tarjeta grande por cada deuda, con el botón Saldar */}
    {debts.map((d,i)=>{
      const from = getMember(d.from), to = getMember(d.to);
      return (
        <div key={i} style={{background:"var(--card)",border:"1px solid color-mix(in srgb, var(--warn) 45%, transparent)",borderRadius:20,padding:"16px 18px",marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
          <div style={{fontSize:13,color:"var(--g8)"}}>Saldo acumulado</div>
          <div style={{fontFamily:"Fraunces,serif",fontSize:40,fontWeight:600,lineHeight:1.05,color:"var(--warn)"}}>{fmtMoney(d.amount)}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:15,color:"var(--title)"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:from.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{from.avatar}</div>
            <span>{from.display_name} le debe a <strong>{to.display_name}</strong></span>
            <div style={{width:28,height:28,borderRadius:"50%",background:to.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{to.avatar}</div>
          </div>
          <button onClick={()=>handleSettle(d)}
            style={{marginTop:4,minHeight:48,borderRadius:16,border:"1.5px solid var(--warn)",background:"transparent",color:"var(--warn)",fontSize:15,fontWeight:700,cursor:"pointer"}}>
            Saldar
          </button>
        </div>
      );
    })}
    <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:13,color:"var(--g5)",display:"flex",alignItems:"center",gap:8}}>
      <Icon name="chart" size={16}/> Balance acumulado histórico — incluye todos los meses
    </div>
    {budgetRows.filter(b=>b.pct>=80).map(b=>{
      const c = getCat(b.category);
      return (
        <div key={b.id} onClick={()=>setSubTab("budget")}
          style={{background:`color-mix(in srgb, ${budgetColor(b.pct)} 14%, transparent)`,border:`1px solid color-mix(in srgb, ${budgetColor(b.pct)} 45%, transparent)`,borderRadius:10,padding:"10px 13px",marginBottom:8,fontSize:13,display:"flex",alignItems:"center",gap:8,cursor:"pointer",color:budgetColor(b.pct),minHeight:44}}>
          <Icon name={b.pct>=100?"alertCircle":"alert"} size={18}/>
          <span style={{flex:1}}><strong>{c.icon} {c.label}</strong>: {b.pct>=100?`superaste el presupuesto (${fmtMoney(b.spent)} de ${fmtMoney(b.amount)})`:`vas por el ${Math.round(b.pct)}% del presupuesto del mes`}</span>
        </div>
      );
    })}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {members.map(m=>{
        const b = balance[m.id] || 0;
        return (
          <div key={m.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:12}}>
            <div style={{fontSize:12,color:"var(--g6)",marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,fontWeight:700,color:"#fff"}}>{m.avatar}</div>
              {m.display_name}
            </div>
            <div style={{fontSize:20,fontWeight:700,fontFamily:"Fraunces,serif",color:b>0.01?"var(--ok)":b<-0.01?"var(--warn)":"var(--g5)"}}>{fmtMoney(Math.abs(b))}</div>
            <div style={{fontSize:13,marginTop:3,color:b>0.01?"var(--ok)":b<-0.01?"var(--warn)":"var(--g5)"}}>{b>0.01?"Le deben":b<-0.01?"Debe":"Al día ✓"}</div>
          </div>
        );
      })}
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:12}}>
        <div style={{fontSize:12,color:"var(--g6)",marginBottom:4}}><Icon name="wallet" size={15}/> Total histórico</div>
        <div style={{fontSize:18,fontWeight:700,fontFamily:"Fraunces,serif",color:"var(--text)"}}>{fmtMoney(totalHistorico)}</div>
        <div style={{fontSize:12,color:"var(--g5)",marginTop:3}}>Todos los meses</div>
      </div>
    </div>

    {debts.length === 0 && monthTotal > 0 && (
      <div style={{textAlign:"center",color:"var(--ok)",padding:"20px 0",fontSize:15,fontWeight:600}}><Icon name="check" size={18}/> Todo al día</div>
    )}


    {/* Active installments this month */}
    {monthExpenses.filter(e=>e.installments>1).length > 0 && <>
      <div style={{fontSize:12,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 8px"}}>Cuotas activas</div>
      {monthExpenses.filter(e=>e.installments>1).map(e=>{
        const c = getCat(e.category);
        return (
          <div key={e.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <div style={{width:34,height:34,borderRadius:10,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.description}</div>
              <div style={{fontSize:12,color:"var(--g5)",marginTop:2,display:"flex",gap:8,alignItems:"center"}}>
                {getMember(e.paid_by).display_name}
                <span style={{background:"#DDA0DD22",color:"var(--violet)",padding:"1px 6px",borderRadius:10,fontSize:12,fontWeight:700}}>Cuota {e.installment_number}/{e.installments}</span>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--violet)"}}>{fmtMoney(e.amount)}</div>
              <div style={{fontSize:12,color:"var(--g5)"}}>÷{e.split_between?.length||1} = {fmtMoney(e.amount/(e.split_between?.length||1))} c/u</div>
            </div>
          </div>
        );
      })}
    </>}
    {/* Gastos recurrentes (con edición, pausa y eliminación) */}
    {recurring.length > 0 && <>
      <div style={{fontSize:12,color:"var(--g4)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 8px"}}>Gastos recurrentes</div>
      <RecurringTab ctx={ctx}/>
    </>}
  </div>
  );
}
