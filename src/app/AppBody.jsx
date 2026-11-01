import Filters from "./Filters";
import CalendarContent from "./CalendarContent";
import DayContent from "./DayContent";
import Expenses from "../expenses/Expenses";
import Lists from "../Lists";
import Notes from "../Notes";
import HomeContent from "./HomeContent";

export default function AppBody({ ctx }) {
  const { activeGroup, authUser, groupMembers, mainTab } = ctx;
  return (
    <>
      {mainTab==="home" ? (
        <HomeContent ctx={ctx}/>
      ) : mainTab==="expenses" ? (
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 24px"}}>
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
        /* ── AGENDA: calendario con el detalle del día justo debajo ── */
        <div style={{flex:1,overflowY:"auto",padding:"12px 12px 24px"}}>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
            <Filters ctx={ctx}/>
          </div>
          <CalendarContent ctx={ctx}/>
          <div id="day-detail" style={{marginTop:16,paddingTop:16,borderTop:"1px solid var(--border)"}}>
            <DayContent ctx={ctx}/>
          </div>
        </div>
      )}
    </>
  );
}
