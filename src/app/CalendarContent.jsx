import { DAYS_ES, MONTHS_ES } from "./constants";
import { fmt } from "./utils";
import EventChip from "./EventChip";
import Icon from "./Icon";

// Calendario mensual. En celular cada día muestra hasta 3 puntos de color (uno por evento, color de su categoría);
// en pantallas anchas se mantienen los chips con texto. El detalle se ve al tocar el día.
const navBtn = {background:"var(--card2)",color:"var(--ga)",width:44,height:44,borderRadius:12,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"};

export default function CalendarContent({ ctx }) {
  const { cat, currentMonth, currentYear, daysInMonth, eventsForDate, firstDay, nextMonth, prevMonth, selectedDate, setSelectedDate, setView, today } = ctx;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={prevMonth} aria-label="Mes anterior" style={navBtn}><Icon name="chevronLeft" size={20}/></button>
        <span style={{fontFamily:"Fraunces,serif",fontSize:18,fontWeight:600,color:"var(--title)",flex:1,textAlign:"center"}}>{MONTHS_ES[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} aria-label="Mes siguiente" style={navBtn}><Icon name="chevronRight" size={20}/></button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
        {DAYS_ES.map(d=><div key={d} style={{textAlign:"center",fontSize:12,fontWeight:600,color:"var(--g5)",textTransform:"uppercase",letterSpacing:0.5,padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const day=i+1;
          const dateStr=`${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayEvs=eventsForDate(dateStr);
          const isToday=dateStr===fmt(today); const isSelected=dateStr===selectedDate;
          return (
            <div key={day} className="day-cell" onClick={()=>{setSelectedDate(dateStr);setView("day");}}
              style={{height:64,padding:"6px 3px",borderRadius:10,background:isSelected?"var(--card2)":"var(--card)",border:isSelected?"1px solid var(--border3)":"1px solid var(--card2)",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:isToday?700:500,background:isToday?"#FF6B6B":"transparent",color:isToday?"#1A0B0B":"var(--text)",flexShrink:0}}>{day}</div>
              <div className="cal-dots" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,minHeight:8}}>
                {dayEvs.slice(0,3).map(ev=><span key={ev.id} style={{width:8,height:8,borderRadius:"50%",background:cat(ev.category).color,flexShrink:0}}/>)}
                {dayEvs.length>3&&<span style={{fontSize:12,color:"var(--g8)",lineHeight:1}}>+{dayEvs.length-3}</span>}
              </div>
              <div className="cal-chips" style={{width:"100%"}}>
                {dayEvs.slice(0,2).map(ev=><EventChip ctx={ctx} key={ev.id} ev={ev} dateStr={dateStr}/>)}
                {dayEvs.length>2&&<div style={{fontSize:8,color:"var(--g5)"}}>+{dayEvs.length-2}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
