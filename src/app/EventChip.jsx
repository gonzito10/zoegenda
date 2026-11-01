
export default function EventChip({ ctx, ev, dateStr }) {
  const { cat, setSelectedDate, setView } = ctx;
  const isBday = ev.category === "birthday";
  const icon = cat(ev.category).icon;
  return (
    <div className="event-chip" onClick={e=>{e.stopPropagation();if(dateStr){setSelectedDate(dateStr);setView("day");}}}
      style={{fontSize:9,padding:"2px 4px",borderRadius:3,marginBottom:2,background:cat(ev.category).color+"22",color:cat(ev.category).color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:500,display:"flex",alignItems:"center",gap:2,flexShrink:0}}>
      <span style={{flexShrink:0}}>{icon}</span>
      {isBday ? <span>{ev.title}</span> : <span>{ev.time} {ev.title}</span>}
      {ev.recurring&&!isBday&&<span style={{opacity:.7,flexShrink:0}}>↻</span>}
    </div>
  );
}
