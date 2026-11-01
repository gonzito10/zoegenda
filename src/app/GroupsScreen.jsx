import { BASE_CSS, inp, lbl, Logo } from "./styles";

export default function GroupsScreen({ ctx }) {
  const { groupAction, groupCode, groupError, groupLoading, groupName, groups, handleCreateGroup, handleJoinGroup, setActiveGroup, setGroupAction, setGroupCode, setGroupError, setGroupName, setMainTab, setScreen } = ctx;
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{BASE_CSS}</style>
      <div style={{maxWidth:420,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}><Logo size={28}/></div>

        {!groupAction ? (
          <>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"var(--title)",marginBottom:4,fontWeight:600}}>Tus agendas</h2>
            <p style={{color:"var(--g5)",fontSize:13,marginBottom:20}}>Cada agenda es un grupo compartido</p>

            {groups.length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
                {groups.map(g=>(
                  <div key={g.id} onClick={()=>{setActiveGroup(g);setMainTab("home");setScreen("app");}} style={{display:"flex",alignItems:"center",gap:16,background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"13px 16px",cursor:"pointer"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:"#FF6B6B22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📅</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:600,color:"var(--text)"}}>{g.name}</div>
                      <div style={{fontSize:12,color:"var(--g5)",marginTop:2}}>Código: {g.code}</div>
                    </div>
                    <span style={{color:"var(--g3)",fontSize:20}}>›</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>{setGroupAction("create");setGroupError("");}} style={{background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700}}>+ Crear nueva agenda</button>
              <button onClick={()=>{setGroupAction("join");setGroupError("");}} style={{background:"transparent",color:"var(--g6)",border:"1px solid var(--border2)",borderRadius:10,padding:"12px",fontSize:13}}>Unirme con código</button>
            </div>
            {groups.length>0&&<button onClick={()=>setScreen("app")} style={{background:"transparent",border:"none",color:"var(--g4)",fontSize:12,marginTop:16,width:"100%"}}>← Volver a la agenda</button>}
          </>
        ) : groupAction==="create" ? (
          <>
            <button onClick={()=>{setGroupAction(null);setGroupError("");}} style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:13,marginBottom:18}}>← Volver</button>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"var(--title)",marginBottom:4,fontWeight:600}}>Nueva agenda</h2>
            <p style={{color:"var(--g5)",fontSize:13,marginBottom:22}}>Se generará un código para compartir con tu grupo</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={lbl}>Nombre de la agenda</label>
                <input value={groupName} onChange={e=>{setGroupName(e.target.value);setGroupError("");}} onKeyDown={e=>e.key==="Enter"&&handleCreateGroup()} placeholder="Ej: Familia, Trabajo, Amigos..." style={inp} autoFocus/>
              </div>
              {groupError&&<div style={{fontSize:12,color:"var(--coral)",background:"#FF6B6B11",padding:"8px 12px",borderRadius:10}}>{groupError}</div>}
              <button onClick={handleCreateGroup} disabled={groupLoading} style={{background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,opacity:groupLoading?.6:1}}>
                {groupLoading?"Creando...":"Crear agenda"}
              </button>
            </div>
          </>
        ) : (
          <>
            <button onClick={()=>{setGroupAction(null);setGroupError("");}} style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:13,marginBottom:18}}>← Volver</button>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"var(--title)",marginBottom:4,fontWeight:600}}>Unirme a una agenda</h2>
            <p style={{color:"var(--g5)",fontSize:13,marginBottom:22}}>Pedile el código al creador del grupo</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={lbl}>Código del grupo</label>
                <input value={groupCode} onChange={e=>{setGroupCode(e.target.value.toUpperCase());setGroupError("");}} onKeyDown={e=>e.key==="Enter"&&handleJoinGroup()} placeholder="Ej: AB12CD" maxLength={6} style={{...inp,textTransform:"uppercase",letterSpacing:4,fontSize:18,textAlign:"center"}} autoFocus/>
              </div>
              {groupError&&<div style={{fontSize:12,color:"var(--coral)",background:"#FF6B6B11",padding:"8px 12px",borderRadius:10}}>{groupError}</div>}
              <button onClick={handleJoinGroup} disabled={groupLoading} style={{background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,opacity:groupLoading?.6:1}}>
                {groupLoading?"Buscando...":"Unirme"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
