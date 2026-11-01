import { DAYS_ES, MONTHS_ES } from "./constants";
import { fmt } from "./utils";
import EventChip from "./EventChip";

export default function CalendarContent({ ctx }) {
  const { currentMonth, currentYear, daysInMonth, eventsForDate, firstDay, nextMonth, prevMonth, selectedDate, setSelectedDate, setView, today } = ctx;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
        <button onClick={prevMonth} style={{background:"var(--card2)",color:"var(--ga)",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>‹</button>
        <span style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"var(--title)",flex:1,textAlign:"center"}}>{MONTHS_ES[currentMonth]} {currentYear}</span>
        <button onClick={nextMonth} style={{background:"var(--card2)",color:"var(--ga)",padding:"5px 11px",borderRadius:8,fontSize:16,border:"none"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
        {DAYS_ES.map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:600,color:"var(--g5)",textTransform:"uppercase",letterSpacing:1,padding:"4px 0"}}>{d}</div>)}
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
              style={{height:68,padding:"5px 4px",borderRadius:8,background:isSelected?"#1a1a28":"var(--card)",border:isSelected?"1px solid var(--border2)":"1px solid var(--card2)",boxShadow:isToday?"inset 0 0 0 1.5px #FF6B6B55":"none",overflow:"hidden",display:"flex",flexDirection:"column"}}>
              <div style={{fontSize:11,fontWeight:isToday?700:400,color:isToday?"#FF6B6B":"var(--text)",marginBottom:2,display:"flex",justifyContent:"space-between"}}>
                {day}{dayEvs.length>0&&<span style={{fontSize:8,color:"var(--g5)"}}>{dayEvs.length}</span>}
              </div>
              {dayEvs.slice(0,2).map(ev=><EventChip ctx={ctx} key={ev.id} ev={ev} dateStr={dateStr}/>)}
              {dayEvs.length>2&&<div style={{fontSize:8,color:"var(--g5)"}}>+{dayEvs.length-2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
