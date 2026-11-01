
export default function MainTabsBar({ ctx }) {
  const { mainTab, setMainTab } = ctx;
  return (
    <>
      {/* ── MAIN TABS (ocultas en la pantalla de inicio) ── */}
      {mainTab!=="home"&&(
        <div style={{display:"flex",background:"var(--bar)",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={()=>setMainTab("home")} title="Inicio"
            style={{padding:"10px 14px",fontSize:15,border:"none",borderBottom:"2px solid transparent",background:"transparent",color:"var(--g6)",cursor:"pointer"}}>🏠</button>
          {[["agenda","📅 Agenda"],["expenses","💸 Gastos"],["lists","📝 Listados"],["notes","📓 Notas"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMainTab(v)}
              style={{flex:1,padding:"10px 4px",fontSize:12,fontWeight:600,border:"none",borderBottom:`2px solid ${mainTab===v?"#FF6B6B":"transparent"}`,background:"transparent",color:mainTab===v?"#FF6B6B":"var(--g5)",cursor:"pointer"}}>
              {l}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
