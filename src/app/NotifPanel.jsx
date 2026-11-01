import Icon from "./Icon";

export default function NotifPanel({ ctx }) {
  const { cat, mainTab, notifications, setCurrentMonth, setCurrentYear, setSelectedDate, setShowNotifPanel, setView, showNotifPanel } = ctx;
  return (
    <>
      {showNotifPanel&&notifications.length>0&&mainTab==="agenda"&&(
        <div className="panel-anim" style={{background:"#1a1200",borderBottom:"1px solid #3a2a00",padding:"12px 16px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <Icon name="bell" size={18}/>
              <span style={{fontSize:12,fontWeight:700,color:"#FFB347"}}>{notifications.length} alarma{notifications.length!==1?"s":""} próxima{notifications.length!==1?"s":""}</span>
            </div>
            <button onClick={()=>setShowNotifPanel(false)} style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:16,cursor:"pointer",lineHeight:1}}>×</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {notifications.map(ev=>{
              const daysLabel = ev.alarmDays==="1"?"mañana":ev.alarmDays==="2"?"en 2 días":"en 1 semana";
              return (
                <div key={ev.id} onClick={()=>{
                  const d = ev._alarmDate || ev.date;
                  setSelectedDate(d); setCurrentMonth(Number(d.slice(5,7))-1); setCurrentYear(Number(d.slice(0,4))); setView("day"); setShowNotifPanel(false);
                }}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:"#ffffff08",cursor:"pointer",border:"1px solid #3a2a00"}}>
                  <span style={{fontSize:14}}>{cat(ev.category).icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#f5e0b0"}}>{ev.title}</div>
                    <div style={{fontSize:12,color:"var(--g8)"}}>{ev.time}{ev.timeEnd?` – ${ev.timeEnd}`:""} · {daysLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
