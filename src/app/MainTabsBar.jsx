import Icon from "./Icon";

export default function MainTabsBar({ ctx }) {
  const { mainTab, setMainTab } = ctx;
  return (
    <>
      {/* ── MAIN TABS (ocultas en la pantalla de inicio) ── */}
      {mainTab!=="home"&&(
        <div style={{display:"flex",background:"var(--bar)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={()=>setMainTab("home")} title="Inicio" aria-label="Inicio"
            style={{padding:"10px 14px",fontSize:15,border:"none",borderBottom:"2px solid transparent",background:"transparent",color:"var(--g6)",cursor:"pointer"}}><Icon name="home" size={20}/></button>
          {[["agenda","calendar","Agenda"],["expenses","wallet","Gastos"],["lists","list","Listados"],["notes","note","Notas"]].map(([v,ic,l])=>(
            <button key={v} onClick={()=>setMainTab(v)}
              style={{flex:1,padding:"12px 4px",fontSize:13,fontWeight:600,border:"none",borderBottom:`2px solid ${mainTab===v?"#FF6B6B":"transparent"}`,background:"transparent",color:mainTab===v?"#FF6B6B":"var(--g5)",cursor:"pointer"}}>
              <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6}}><Icon name={ic} size={16}/>{l}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
