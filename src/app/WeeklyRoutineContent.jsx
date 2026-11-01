import { useMemo } from "react";
import { fmt, expandRecurring } from "./utils";

export default function WeeklyRoutineContent({ ctx }) {
  const { cat, events, filterCat, filterEvs, filterUser, member, openEdit, openNew, today } = ctx;
  const DAYS_FULL_ES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

  // Calcular el lunes de la semana actual
  const weekStart = useMemo(() => {
    const d = new Date(today);
    const day = d.getDay(); // 0=dom
    const diff = day === 0 ? -6 : 1 - day; // ajustar a lunes
    d.setDate(d.getDate() + diff);
    d.setHours(0,0,0,0);
    return d;
  // eslint-disable-next-line
  }, []);

  // Generar los 7 días de la semana (lun→dom)
  const weekDays = useMemo(() => {
    return Array.from({length:7}, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return { dow: d.getDay(), dateStr: fmt(d), date: d };
    });
  }, [weekStart]);

  // Para cada día: eventos puntuales + rutinas
  const byDay = useMemo(() => {
    const map = {};
    weekDays.forEach(({dow, dateStr}) => {
      const evs = events.flatMap(ev => {
        if (ev.recurring) return expandRecurring(ev, dateStr, dateStr);
        return ev.date === dateStr ? [ev] : [];
      });
      map[dateStr] = filterEvs(evs).sort((a,b) => (a.time||"").localeCompare(b.time||""));
    });
    return map;
  // eslint-disable-next-line
  }, [events, weekDays, filterUser, filterCat]);

  const hasAny = weekDays.some(({dateStr}) => byDay[dateStr]?.length > 0);

  if (!hasAny) return (
    <div style={{textAlign:"center",color:"var(--g4)",padding:"60px 20px",fontSize:14}}>
      <div style={{fontSize:32,marginBottom:12}}>📅</div>
      <div style={{marginBottom:8}}>No hay actividades esta semana</div>
      <button onClick={()=>openNew(null)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"8px 20px",cursor:"pointer",fontSize:13}}>+ Agregar</button>
    </div>
  );

  return (
    <div style={{padding:"16px 16px 24px"}}>
      {weekDays.map(({dow, dateStr, date}) => {
        const dayEvs = byDay[dateStr] || [];
        if (dayEvs.length === 0) return null;
        const isToday = dateStr === fmt(today);
        return (
          <div key={dateStr} style={{marginBottom:18}}>
            {/* Cabecera del día */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:38,height:38,borderRadius:9,background:isToday?"#FF6B6B":"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:700,color:isToday?"var(--title)":"var(--ga)",textTransform:"uppercase"}}>{DAYS_FULL_ES[dow].slice(0,3)}</span>
              </div>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
            </div>
            {/* Actividades del día */}
            {dayEvs.map(ev => (
              <div key={ev.id} className="agenda-event" onClick={()=>openEdit(ev)}
                style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"8px 12px",display:"flex",gap:10,alignItems:"flex-start",borderLeft:`3px solid ${cat(ev.category).color}`,marginBottom:5}}>
                {ev.category!=="birthday" && <div style={{color:"var(--g8)",fontSize:11,minWidth:34,paddingTop:1,fontWeight:500}}>
                  {ev.time}{ev.timeEnd&&<span style={{color:"var(--g5)"}}>–{ev.timeEnd}</span>}
                </div>}
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13,color:"var(--text)",display:"flex",alignItems:"center",gap:5}}>
                    {cat(ev.category).icon} {ev.title}
                    {ev.recurring&&<span style={{fontSize:9,background:"var(--border2)",color:"var(--g8)",padding:"1px 5px",borderRadius:4}}>↻</span>}
                  </div>
                  {ev.notes&&<div style={{fontSize:11,color:"var(--g6)",marginTop:2}}>{ev.notes}</div>}
                  <div style={{display:"flex",gap:4,marginTop:4,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:9,padding:"1px 6px",borderRadius:20,background:cat(ev.category).color+"22",color:cat(ev.category).color}}>{cat(ev.category).label}</span>
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
