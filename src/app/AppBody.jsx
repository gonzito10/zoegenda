import Filters from "./Filters";
import CalendarContent from "./CalendarContent";
import DayContent from "./DayContent";
import Expenses from "../expenses/Expenses";
import Lists from "../Lists";
import Notes from "../Notes";

export default function AppBody({ ctx }) {
  const { activeGroup, authUser, groupMembers, mainTab, profile, setMainTab, setView, view } = ctx;
  return (
    <>
      {mainTab==="home" ? (
        <div style={{flex:1,overflowY:"auto",padding:"24px 16px 40px",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{width:"100%",maxWidth:560}}>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontFamily:"Fraunces,serif",fontSize:24,fontWeight:600,color:"var(--title)"}}>Hola{profile?.display_name?`, ${profile.display_name}`:""}</div>
              <div style={{fontSize:12,color:"var(--g6)",marginTop:4}}>{activeGroup?.name} · ¿A dónde querés ir?</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                ["agenda","📅","Agenda","Eventos, rutinas y cumpleaños","#FF6B6B"],
                ["expenses","💸","Gastos compartidos","Balance, cuotas y estadísticas","#96CEB4"],
                ["lists","📝","Listados","Compras, arreglos y más","#FFB347"],
                ["notes","📓","Notas","Texto libre con nombre","#DDA0DD"],
              ].map(([v,icon,title,desc,color])=>(
                <button key={v} onClick={()=>setMainTab(v)}
                  style={{aspectRatio:"1 / 1",minHeight:150,borderRadius:18,border:`1px solid ${color}44`,background:`linear-gradient(145deg, ${color}22, var(--card) 70%)`,color:"var(--text)",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:14,textAlign:"center"}}>
                  <span style={{fontSize:46,lineHeight:1}}>{icon}</span>
                  <span style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"var(--title)"}}>{title}</span>
                  <span style={{fontSize:11,color:"var(--g8)",lineHeight:1.3}}>{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : mainTab==="expenses" ? (
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
          <div style={{marginBottom:4,fontFamily:"Fraunces,serif",fontSize:18,fontWeight:600,color:"var(--title)"}}>Gastos compartidos</div>
          <div style={{fontSize:12,color:"var(--g5)",marginBottom:14}}>{activeGroup?.name}</div>
          <Expenses groupId={activeGroup?.id} members={groupMembers} currentUserId={authUser?.id}/>
        </div>
      ) : mainTab==="lists" ? (
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
          <Lists groupId={activeGroup?.id} currentUserId={authUser?.id}/>
        </div>
      ) : mainTab==="notes" ? (
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
          <Notes groupId={activeGroup?.id} currentUserId={authUser?.id}/>
        </div>
      ) : (
        /* ── AGENDA: solo calendario + día ── */
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {view==="day" ? (
            <div style={{flex:1,overflowY:"auto",padding:"16px 16px 80px"}}>
              {/* Back button */}
              <button onClick={()=>setView("calendar")}
                style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",color:"var(--g6)",fontSize:13,cursor:"pointer",marginBottom:12,padding:0}}>
                ← Volver al calendario
              </button>
              <DayContent ctx={ctx} ctx={ctx}/>
            </div>
          ) : (
            <div style={{flex:1,overflowY:"auto",padding:"12px 12px 80px"}}>
              {/* Filtros compactos */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
                <Filters ctx={ctx} ctx={ctx}/>
              </div>
              <CalendarContent ctx={ctx} ctx={ctx}/>
            </div>
          )}
        </div>
      )}
    </>
  );
}
