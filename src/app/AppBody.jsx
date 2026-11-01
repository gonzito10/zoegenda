import Filters from "./Filters";
import CalendarContent from "./CalendarContent";
import DayContent from "./DayContent";
import Expenses from "../expenses/Expenses";
import Lists from "../Lists";
import Notes from "../Notes";
import HomeContent from "./HomeContent";

export default function AppBody({ ctx }) {
  const { activeGroup, authUser, groupMembers, mainTab, setView, view } = ctx;
  return (
    <>
      {mainTab==="home" ? (
        <HomeContent ctx={ctx}/>
      ) : mainTab==="expenses" ? (
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 24px"}}>
          <div style={{marginBottom:4,fontFamily:"Fraunces,serif",fontSize:18,fontWeight:600,color:"var(--title)"}}>Gastos compartidos</div>
          <div style={{fontSize:12,color:"var(--g5)",marginBottom:14}}>{activeGroup?.name}</div>
          <Expenses groupId={activeGroup?.id} members={groupMembers} currentUserId={authUser?.id}/>
        </div>
      ) : mainTab==="lists" ? (
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 24px"}}>
          <Lists groupId={activeGroup?.id} currentUserId={authUser?.id}/>
        </div>
      ) : mainTab==="notes" ? (
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 24px"}}>
          <Notes groupId={activeGroup?.id} currentUserId={authUser?.id}/>
        </div>
      ) : (
        /* ── AGENDA: solo calendario + día ── */
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {view==="day" ? (
            <div style={{flex:1,overflowY:"auto",padding:"16px 16px 24px"}}>
              {/* Back button */}
              <button onClick={()=>setView("calendar")}
                style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",color:"var(--g6)",fontSize:13,cursor:"pointer",marginBottom:12,padding:0}}>
                ← Volver al calendario
              </button>
              <DayContent ctx={ctx} ctx={ctx}/>
            </div>
          ) : (
            <div style={{flex:1,overflowY:"auto",padding:"12px 12px 24px"}}>
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
