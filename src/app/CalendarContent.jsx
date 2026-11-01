import { DAYS_ES, MONTHS_ES } from "./constants";
import { fmt } from "./utils";
import Icon from "./Icon";

// Calendario mensual: cada día muestra solo los íconos de sus eventos (sin texto ni horario).
// Al tocar un día se elige esa fecha y el detalle aparece justo debajo del calendario (DayContent).
const navBtn = {background:"var(--card2)",color:"var(--ga)",width:44,height:44,borderRadius:12,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"};
const MAX_ICONS = 5;

export default function CalendarContent({ ctx }) {
  const { cat, currentMonth, currentYear, daysInMonth, eventsForDate, firstDay, nextMonth, prevMonth, selectedDate, setSelectedDate, today } = ctx;
  function pick(dateStr){
    setSelectedDate(dateStr);
    setTimeout(()=>document.getElementById("day-detail")?.scrollIntoView({behavior:"smooth",block:"nearest"}), 50);
  }
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
          const shown = dayEvs.length>MAX_ICONS ? dayEvs.slice(0,MAX_ICONS-1) : dayEvs;
          const extra = dayEvs.length - shown.length;
          const label = `${day} de ${MONTHS_ES[currentMonth]}${dayEvs.length?`, ${dayEvs.length} ${dayEvs.length===1?"evento":"eventos"}`:""}`;
          return (
            <button key={day} type="button" className="day-cell" onClick={()=>pick(dateStr)} aria-label={label} aria-pressed={isSelected}
              style={{height:76,padding:"6px 3px",borderRadius:10,font:"inherit",color:"inherit",background:isSelected?"var(--card2)":"var(--card)",border:isSelected?"1.5px solid var(--g8)":"1px solid var(--card2)",overflow:"hidden",display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}}>
              <span style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:isToday?700:500,background:isToday?"#FF6B6B":"transparent",color:isToday?"#1A0B0B":"var(--text)",flexShrink:0}}>{day}</span>
              <span style={{display:"flex",flexWrap:"wrap",justifyContent:"center",alignContent:"flex-start",gap:1,fontSize:12,lineHeight:"15px",width:"100%"}}>
                {shown.map(ev=><span key={ev.id}>{cat(ev.category).icon}</span>)}
                {extra>0&&<span style={{fontSize:12,color:"var(--g8)",fontWeight:600}}>+{extra}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
