import { DAYS_ES, MONTHS_ES } from "./constants";
import { fmt, parse } from "./utils";

export default function AgendaContent({ ctx }) {
  const { agendaDates, cat, currentMonth, currentYear, eventsForDate, member, nextMonth, openEdit, openNew, prevMonth, today } = ctx;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={prevMonth} style={{background:"var(--card2)",color:"var(--ga)",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>‹</button>
        <span style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"var(--title)",flex:1,textAlign:"center"}}>{MONTHS_ES[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} style={{background:"var(--card2)",color:"var(--ga)",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>›</button>
      </div>
      {agendaDates.length===0&&<div style={{textAlign:"center",color:"var(--g4)",padding:"50px 0",fontSize:14}}>No hay eventos este mes<div style={{marginTop:14}}><button onClick={()=>openNew(null)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12}}>+ Crear evento</button></div></div>}
      {agendaDates.map(dateStr=>{
        const d=parse(dateStr); const isToday=dateStr===fmt(today);
        return (
          <div key={dateStr} style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:32,height:32,borderRadius:8,background:isToday?"#FF6B6B":"var(--card2)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:12,fontWeight:700,color:"var(--title)",lineHeight:1}}>{d.getDate()}</span>
                <span style={{fontSize:8,color:isToday?"#ffb3b3":"var(--g5)",textTransform:"uppercase"}}>{DAYS_ES[d.getDay()]}</span>
              </div>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
            </div>
            {eventsForDate(dateStr).map(ev=>(
              <div key={ev.id} className="agenda-event" onClick={()=>openEdit(ev)}
                style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",display:"flex",gap:10,alignItems:"flex-start",borderLeft:`3px solid ${cat(ev.category).color}`,marginBottom:5}}>
                {ev.category!=="birthday"&&<div style={{color:"var(--g8)",fontSize:12,minWidth:34,paddingTop:1,fontWeight:500}}>{ev.time}{ev.timeEnd&&<span style={{color:"var(--g5)"}}>–{ev.timeEnd}</span>}</div>}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13,color:"var(--text)",display:"flex",alignItems:"center",gap:5}}>
                    {ev.title}{ev.recurring&&<span style={{fontSize:12,background:"var(--border2)",color:"var(--g8)",padding:"1px 5px",borderRadius:4}}>↻</span>}
                  </div>
                  {ev.notes&&<div style={{fontSize:12,color:"var(--g6)",marginTop:2}}>{ev.notes}</div>}
                  <div style={{display:"flex",gap:4,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:12,padding:"1px 6px",borderRadius:20,background:cat(ev.category).color+"22",color:cat(ev.category).color}}>{cat(ev.category).label}</span>
                    {ev.attendees?.map(uid=><div key={uid} title={member(uid).display_name} style={{width:13,height:13,borderRadius:"50%",background:member(uid).color,fontSize:6,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{member(uid).avatar}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
