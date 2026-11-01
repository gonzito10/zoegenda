import { DAYS_FULL, MONTHS_ES } from "./constants";
import { fmt, parse, personStripe } from "./utils";
import Icon from "./Icon";

export default function DayContent({ ctx }) {
  const { cat, member, openEdit, openNew, selectedDate, selectedDayEvents, setCurrentMonth, setCurrentYear, setSelectedDate } = ctx;
  const arrow = {background:"var(--card2)",color:"var(--ga)",width:44,height:44,borderRadius:12,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"};
  const go = n => { const d=parse(selectedDate); d.setDate(d.getDate()+n); setSelectedDate(fmt(d)); setCurrentMonth(d.getMonth()); setCurrentYear(d.getFullYear()); };
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={()=>go(-1)} aria-label="Día anterior" style={arrow}><Icon name="chevronLeft" size={20}/></button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)"}}>{parse(selectedDate).getDate()} de {MONTHS_ES[parse(selectedDate).getMonth()]}</div>
          <div style={{fontSize:12,color:"var(--g5)"}}>{DAYS_FULL[parse(selectedDate).getDay()]}</div>
        </div>
        <button onClick={()=>go(1)} aria-label="Día siguiente" style={arrow}><Icon name="chevronRight" size={20}/></button>
      </div>
      {selectedDayEvents.length===0&&<div style={{textAlign:"center",color:"var(--g4)",padding:"20px 0",fontSize:14}}>Sin eventos<div style={{marginTop:14}}><button onClick={()=>openNew(selectedDate)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"7px 18px",cursor:"pointer",fontSize:12}}>+ Agregar</button></div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {selectedDayEvents.map(ev=>(
          <div key={ev.id} onClick={()=>openEdit(ev)} style={{position:"relative",overflow:"hidden",background:"var(--card)",borderRadius:12,padding:"12px 16px 12px 22px",cursor:"pointer",border:"1px solid var(--border)"}}>
            <div aria-hidden="true" style={{position:"absolute",left:0,top:0,bottom:0,width:6,background:personStripe(ev.attendees, member, cat(ev.category).color)}}/>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {ev.category!=="birthday"&&<div style={{fontSize:16,fontWeight:700,color:cat(ev.category).color,fontFamily:"Fraunces,serif"}}>{ev.time}{ev.timeEnd&&<span style={{fontSize:12,fontWeight:400,color:cat(ev.category).color,opacity:.7}}>–{ev.timeEnd}</span>}</div>}
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--text)",display:"flex",alignItems:"center",gap:6}}>
                  {ev.title}{ev.recurring&&<span style={{fontSize:12,background:"var(--border2)",color:"var(--g8)",padding:"1px 5px",borderRadius:4,fontWeight:400}}>↻</span>}
                </div>
                <div style={{fontSize:12,color:cat(ev.category).color,marginTop:1}}>{cat(ev.category).label}</div>
              </div>
              <div style={{display:"flex",gap:3}}>
                {ev.attendees?.map(uid=><div key={uid} title={member(uid).display_name} style={{width:20,height:20,borderRadius:"50%",background:member(uid).color,fontSize:7,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{member(uid).avatar}</div>)}
              </div>
            </div>
            {ev.notes&&<div style={{fontSize:12,color:"var(--g6)",marginTop:7,paddingTop:7,borderTop:"1px solid var(--border)"}}>{ev.notes}</div>}
          </div>
        ))}
      </div>
      <button onClick={()=>openNew(selectedDate)} style={{marginTop:12,width:"100%",padding:"11px",borderRadius:10,background:"transparent",border:"1px dashed var(--border2)",color:"var(--g5)",cursor:"pointer",fontSize:13}}>+ Agregar evento</button>
    </div>
  );
}
