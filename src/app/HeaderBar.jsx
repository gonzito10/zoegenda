import Icon from "./Icon";

export default function HeaderBar({ ctx }) {
  const { T, activeGroup, authUser, groupMembers, groups, notifications, profile, setMainTab, setScreen, setShowGroupPanel, setShowNotifPanel, setShowSearch, setView, showGroupPanel, showNotifPanel } = ctx;
  return (
    <>
      {/* ── TOP HEADER ── */}
      <header style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,background:T.gradient?"var(--bg)":T.bg,flexShrink:0,zIndex:10}}>
        <div onClick={()=>setScreen("groups")} className="clickable" style={{flex:1,display:"flex",alignItems:"center",gap:8,minWidth:0}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#FF6B6B22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#FF6B6B"}}><Icon name="calendar" size={16}/></div>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:"Fraunces,serif",fontSize:15,fontWeight:600,color:"var(--title)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{activeGroup?.name||"Zoegenda"}</div>
            <div style={{fontSize:12,color:"var(--g5)"}}>código: <span style={{color:"#FF6B6B",fontWeight:700,letterSpacing:1}}>{activeGroup?.code}</span> · {groupMembers.length} miembro{groupMembers.length!==1?"s":""}</div>
          </div>
          <span style={{color:"var(--g3)",fontSize:12,flexShrink:0}}>▼</span>
        </div>
        <div style={{display:"flex",alignItems:"center",flexShrink:0}}>
          {groupMembers.slice(0,4).map((m,i)=>(
            <div key={m.id} title={m.display_name} style={{width:24,height:24,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff",border:m.id===authUser?.id?"2px solid #fff":"2px solid var(--bg)",marginLeft:i===0?0:-5,opacity:m.id===authUser?.id?1:.65,zIndex:m.id===authUser?.id?2:1}}>{m.avatar}</div>
          ))}
          {groupMembers.length>4&&<div style={{fontSize:12,color:"var(--g5)",marginLeft:4}}>+{groupMembers.length-4}</div>}
        </div>
        <div onClick={()=>setShowGroupPanel(p=>!p)} className="clickable" style={{display:"flex",alignItems:"center",gap:6,background:showGroupPanel?"var(--border)":"var(--card)",border:`1px solid ${showGroupPanel?"var(--border3)":"var(--border2)"}`,borderRadius:20,padding:"4px 10px 4px 4px",flexShrink:0}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:profile?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff"}}>{profile?.avatar}</div>
          <span style={{fontSize:12,color:"var(--ga)",fontWeight:500,maxWidth:55,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{profile?.display_name}</span>
        </div>
          <button onClick={()=>setShowSearch(true)} title="Buscar" style={{background:"transparent",border:"1px solid var(--border2)",borderRadius:8,width:38,height:38,cursor:"pointer",color:"var(--ga)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}} aria-label="Buscar"><Icon name="search" size={18}/></button>
        {notifications.length>0&&(
          <button onClick={()=>{setMainTab("agenda");setView("agenda");setShowNotifPanel(p=>!p);setShowGroupPanel(false);}} style={{position:"relative",background:showNotifPanel?"#FFB34722":"transparent",border:`1px solid ${showNotifPanel?"#FFB34744":"var(--border2)"}`,borderRadius:9,padding:"7px 10px",fontSize:15,flexShrink:0,cursor:"pointer"}}>
            <Icon name="bell" size={18}/>
            <span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#FF6B6B",fontSize:9,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{notifications.length}</span>
          </button>
        )}
      </header>
    </>
  );
}
