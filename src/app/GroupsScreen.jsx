import { useState } from "react";
import { BASE_CSS, inp, lbl, Logo } from "./styles";

export default function GroupsScreen({ ctx }) {
  const { authUser, handleLeaveGroup, handleDeleteGroup, groupAction, groupCode, groupError, groupLoading, groupName, groups, handleCreateGroup, handleJoinGroup, setActiveGroup, setGroupAction, setGroupCode, setGroupError, setGroupName, setMainTab, setScreen } = ctx;
  const [confirm, setConfirm] = useState(null); // { type: "leave" | "delete", g }
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const closeConfirm = () => { setConfirm(null); setTyped(""); setErr(""); };
  async function runConfirm() {
    setBusy(true); setErr("");
    try {
      if (confirm.type === "leave") await handleLeaveGroup(confirm.g);
      else await handleDeleteGroup(confirm.g);
      closeConfirm();
    } catch (e) { setErr(e.message || "No se pudo completar. Probá de nuevo."); }
    setBusy(false);
  }
  const deleteBlocked = confirm?.type === "delete" && typed.trim().toLowerCase() !== confirm.g.name.trim().toLowerCase();
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
                    <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                      <button onClick={e=>{e.stopPropagation();setConfirm({type:"leave",g});setTyped("");setErr("");}} style={{background:"transparent",border:"none",color:"var(--g6)",fontSize:12,padding:"2px 4px"}}>Salir</button>
                      {g.created_by===authUser?.id&&<button onClick={e=>{e.stopPropagation();setConfirm({type:"delete",g});setTyped("");setErr("");}} style={{background:"transparent",border:"none",color:"var(--danger)",fontSize:12,padding:"2px 4px"}}>Eliminar</button>}
                    </div>
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
      {confirm&&(
        <div className="modal-overlay" onClick={closeConfirm} style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div className="modal-box" onClick={e=>e.stopPropagation()} style={{background:"var(--card)",borderRadius:16,padding:22,maxWidth:340,width:"100%",border:"1px solid var(--border2)"}}>
            <h3 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"var(--title)",marginBottom:8}}>{confirm.type==="leave"?`Salir de "${confirm.g.name}"`:`Eliminar "${confirm.g.name}"`}</h3>
            {confirm.type==="leave"?(
              <p style={{fontSize:13,color:"var(--g8)",marginBottom:16,lineHeight:1.6}}>Dejás de ver esta agenda. Los demás miembros siguen con todos los datos y podés volver a entrar con el código <b>{confirm.g.code}</b>.</p>
            ):(
              <>
                <p style={{fontSize:13,color:"var(--g8)",marginBottom:12,lineHeight:1.6}}>Se borra la agenda para <b>todos los miembros</b>, con sus eventos, gastos, listados y notas. <b>No se puede deshacer.</b></p>
                <label style={lbl}>Para confirmar, escribí el nombre de la agenda</label>
                <input value={typed} onChange={e=>setTyped(e.target.value)} placeholder={confirm.g.name} style={{...inp,marginBottom:12}} autoFocus/>
              </>
            )}
            {err&&<div style={{fontSize:12,color:"var(--danger)",marginBottom:12}}>{err}</div>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={runConfirm} disabled={busy||deleteBlocked} style={{background:confirm.type==="delete"?"var(--danger)":"#FF6B6B",color:confirm.type==="delete"?"#fff":"#1A0B0B",border:"none",borderRadius:10,padding:"11px",fontSize:14,fontWeight:700,opacity:(busy||deleteBlocked)?.5:1}}>
                {busy?"Un momento...":confirm.type==="leave"?"Salir de la agenda":"Eliminar para siempre"}
              </button>
              <button onClick={closeConfirm} style={{background:"transparent",color:"var(--g6)",border:"none",padding:"8px",fontSize:13}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
