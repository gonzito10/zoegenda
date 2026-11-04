import Icon from "./Icon";
import { Logo } from "./styles";

const TITLES = { agenda: "Agenda", expenses: "Gastos", lists: "Listados", notes: "Notas" };

export default function HeaderBar({ ctx }) {
  const { T, mainTab, notifications, profile, setMainTab, setShowGroupPanel, setShowNotifPanel, setShowSearch, setView, showGroupPanel, showNotifPanel } = ctx;
  const isHome = mainTab === "home";
  const iconBtn = { background: "transparent", border: "1px solid var(--border2)", borderRadius: 10, width: 44, height: 44, cursor: "pointer", color: "var(--ga)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, position: "relative" };
  return (
    <>
      <header style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8,background:T.gradient?"var(--bg)":T.bg,flexShrink:0,zIndex:10}}>
        <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:4}}>
          {isHome ? (
            <Logo size={22}/>
          ) : (
            <>
              <button onClick={()=>{setMainTab("home");setShowGroupPanel(false);setShowNotifPanel(false);}} aria-label="Volver al inicio" style={{...iconBtn,border:"none",marginLeft:-10}}><Icon name="chevronLeft" size={22}/></button>
              <div style={{fontFamily:"Fraunces,serif",fontSize:20,fontWeight:600,color:"var(--title)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{TITLES[mainTab]||""}</div>
            </>
          )}
        </div>
        <button onClick={()=>setShowSearch(true)} title="Buscar" style={iconBtn} aria-label="Buscar"><Icon name="search" size={18}/></button>
        {notifications.length>0&&(
          <button onClick={()=>{setMainTab("agenda");setView("agenda");setShowNotifPanel(p=>!p);setShowGroupPanel(false);}} aria-label="Avisos" style={{...iconBtn,background:showNotifPanel?"color-mix(in srgb, var(--warn) 14%, transparent)":"transparent",border:`1px solid ${showNotifPanel?"var(--warn)":"var(--border2)"}`}}>
            <Icon name="bell" size={18}/>
            <span style={{position:"absolute",top:-4,right:-4,minWidth:18,height:18,borderRadius:9,background:"#FF6B6B",fontSize:11,fontWeight:700,color:"#1A0B0B",display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{notifications.length}</span>
          </button>
        )}
        <button onClick={()=>setShowGroupPanel(p=>!p)} aria-label="Menú de perfil" aria-haspopup="menu" aria-expanded={!!showGroupPanel} style={{width:44,height:44,borderRadius:"50%",background:"transparent",border:"none",cursor:"pointer",padding:0,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{width:36,height:36,borderRadius:"50%",background:profile?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",boxShadow:showGroupPanel?"0 0 0 2px var(--coral)":"none"}}>{profile?.avatar}</span>
        </button>
      </header>
    </>
  );
}
