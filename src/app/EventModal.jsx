import Icon from "./Icon";
import { CATEGORIES, DAYS_ES } from "./constants";
import { inp, lbl } from "./styles";

export default function EventModal({ ctx }) {
  const { closeModal, confirmDelete, editingEvent, groupMembers, saveEvent, setDeleteDialog, setEditingEvent, showEventModal, toggleAttendee, toggleRecurringDay } = ctx;
  return (
    <>
      {showEventModal&&editingEvent&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)closeModal();}}
          style={{position:"fixed",inset:0,background:"#000000d0",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div className="modal-box" style={{background:"var(--card)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid var(--border2)",maxHeight:"92vh",overflow:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)"}}>{editingEvent.id?"Editar evento":"Nuevo evento"}</h2>
              <button onClick={closeModal} style={{background:"var(--border)",border:"none",color:"var(--ga)",width:26,height:26,borderRadius:"50%",fontSize:14}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {editingEvent.category==="birthday" ? (
                <div>
                  <label style={lbl}>🎂 Nombre de quien cumple</label>
                  <input value={editingEvent.birthdayPerson||""} onChange={e=>setEditingEvent(ev=>({...ev,birthdayPerson:e.target.value,title:e.target.value||""}))} placeholder="Ej: María" style={inp} autoFocus/>
                </div>
              ) : (
                <input value={editingEvent.title} onChange={e=>setEditingEvent(ev=>({...ev,title:e.target.value}))} placeholder="Título del evento" style={inp}/>
              )}
              {editingEvent.category==="birthday" ? (
                <div style={{background:"#FFB34711",border:"1px solid #FFB34733",borderRadius:10,padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>🎂</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#FFB347"}}>Se repite cada año</div>
                    <div style={{fontSize:12,color:"#7a6020",marginTop:1}}>El cumpleaños se agrega automáticamente para siempre</div>
                  </div>
                </div>
              ) : (
                <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"9px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setEditingEvent(ev=>({...ev,recurring:!ev.recurring}))}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>↻ Evento rutinario</div>
                      <div style={{fontSize:12,color:"var(--g5)",marginTop:1}}>Se repite semanalmente</div>
                    </div>
                    <div style={{width:36,height:20,borderRadius:10,background:editingEvent.recurring?"#FF6B6B":"var(--border2)",position:"relative",transition:"background .2s",flexShrink:0}}>
                      <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:editingEvent.recurring?18:3,transition:"left .2s"}}/>
                    </div>
                  </div>
                  {editingEvent.recurring&&(
                    <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid var(--border)"}}>
                      <label style={lbl}>Días de la semana</label>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                        {DAYS_ES.map((d,i)=>{
                          const on=editingEvent.recurringDays?.includes(i);
                          return <div key={i} className="dow-pill" onClick={()=>toggleRecurringDay(i)} style={{padding:"4px 9px",borderRadius:8,fontSize:12,fontWeight:on?700:400,background:on?"#FF6B6B33":"var(--card2)",color:on?"#FF6B6B":"var(--g5)",border:`1px solid ${on?"#FF6B6B44":"var(--border2)"}`}}>{d}</div>;
                        })}
                      </div>
                      <label style={lbl}>Fecha de fin (opcional)</label>
                      <input type="date" value={editingEvent.recurringEnd||""} onChange={e=>setEditingEvent(ev=>({...ev,recurringEnd:e.target.value}))} style={{...inp,width:"auto"}}/>
                      {!editingEvent.recurringEnd&&<div style={{fontSize:12,color:"var(--g4)",marginTop:3}}>Sin fecha de fin — se repite indefinidamente</div>}
                    </div>
                  )}
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <label style={lbl}>{editingEvent.recurring?"Fecha inicio":"Fecha"}</label>
                  <input type="date" value={editingEvent.date} onChange={e=>setEditingEvent(ev=>({...ev,date:e.target.value}))} style={inp}/>
                </div>
                {editingEvent.category!=="birthday"&&<div style={{width:100}}>
                  <label style={lbl}>Hora inicio</label>
                  <input type="time" value={editingEvent.time} onChange={e=>setEditingEvent(ev=>({...ev,time:e.target.value}))} style={inp}/>
                </div>}
                {editingEvent.category!=="birthday"&&<div style={{width:100}}>
                  <label style={lbl}>Hora fin <span style={{color:"var(--g4)",fontWeight:400}}>(opcional)</span></label>
                  <input type="time" value={editingEvent.timeEnd||""} onChange={e=>setEditingEvent(ev=>({...ev,timeEnd:e.target.value}))} style={inp}/>
                </div>}
              </div>
              <div>
                <label style={lbl}>Categoría</label>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {CATEGORIES.map(c=><div key={c.id} onClick={()=>setEditingEvent(ev=>({...ev,category:c.id,color:c.color}))} style={{padding:"4px 9px",borderRadius:20,fontSize:12,cursor:"pointer",background:editingEvent.category===c.id?c.color+"33":"var(--card2)",color:editingEvent.category===c.id?c.color:"var(--g6)",border:`1px solid ${editingEvent.category===c.id?c.color+"44":"var(--border2)"}`,fontWeight:editingEvent.category===c.id?600:400}}>{c.icon} {c.label}</div>)}
                </div>
              </div>
              <div>
                <label style={lbl}>Participantes</label>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {groupMembers.map(m=>(
                    <div key={m.id} onClick={()=>toggleAttendee(m.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:20,cursor:"pointer",background:editingEvent.attendees?.includes(m.id)?m.color+"22":"var(--card2)",border:`1px solid ${editingEvent.attendees?.includes(m.id)?m.color+"44":"var(--border2)"}`}}>
                      <div style={{width:14,height:14,borderRadius:"50%",background:m.color,fontSize:6,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>{m.avatar}</div>
                      <span style={{fontSize:12,color:editingEvent.attendees?.includes(m.id)?m.color:"var(--g6)",fontWeight:editingEvent.attendees?.includes(m.id)?600:400}}>{m.display_name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>Notas</label>
                <textarea value={editingEvent.notes} onChange={e=>setEditingEvent(ev=>({...ev,notes:e.target.value}))} placeholder="Detalles adicionales..." rows={2} style={{...inp,resize:"none"}}/>
              </div>
              {/* Alarma — desactivada por defecto en rutinarios */}
              {editingEvent.category!=="birthday"&&(
                <div style={{background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px 13px"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:7,display:"flex",alignItems:"center",gap:6}}><Icon name="bell" size={14}/> Alarma <span style={{fontSize:12,color:"var(--g4)",fontWeight:400}}>{editingEvent.recurring?"(desactivada por defecto en rutinarios)":""}</span></div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {[["","Sin alarma"],["1","1 día antes"],["2","2 días antes"],["7","1 semana antes"]].map(([v,l])=>(
                      <div key={v} onClick={()=>setEditingEvent(ev=>({...ev,alarmDays:v}))}
                        style={{padding:"4px 10px",borderRadius:20,fontSize:12,cursor:"pointer",fontWeight:editingEvent.alarmDays===v?700:400,background:editingEvent.alarmDays===v?"#FFB34733":"var(--card2)",color:editingEvent.alarmDays===v?"#FFB347":"var(--g5)",border:`1px solid ${editingEvent.alarmDays===v?"#FFB34744":"var(--border2)"}`}}>
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8}}>
                {editingEvent.id&&<button onClick={()=>{if(editingEvent.recurring)setDeleteDialog({baseId:editingEvent.id,isBase:true});else confirmDelete(editingEvent.id,null,null);}} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"9px 12px",fontSize:12,fontWeight:600}}>Eliminar</button>}
                <button onClick={saveEvent} style={{flex:1,background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontSize:14,fontWeight:700}}>{editingEvent.id?"Guardar":"Crear evento"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
