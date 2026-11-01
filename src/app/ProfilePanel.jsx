import { isStandalone, isIOS } from "../push.js";
import { THEMES, getTheme, themeBgStyle } from "./constants";

export default function ProfilePanel({ ctx }) {
  const { T, authUser, groups, profile, pushBusy, pushMsg, pushState, saveTheme, setScreen, setShowGroupPanel, showGroupPanel, signOut, themeId, togglePush } = ctx;
  return (
    <>
      {/* Profile panel */}
      {showGroupPanel&&(
        <div className="panel-anim" style={{background:T.gradient?"var(--bar)":T.surface,borderBottom:`1px solid ${T.border}`,padding:"14px 16px",flexShrink:0}}>
          {/* User info + actions */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:profile?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{profile?.avatar}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T.text}}>{profile?.display_name}</div>
                <div style={{fontSize:12,color:"var(--g5)",marginTop:1}}>{authUser?.email}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>{setScreen("groups");setShowGroupPanel(false);}} style={{background:T.gradient?"#ffffff14":"var(--border)",color:"var(--ga)",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 12px",fontSize:12}}>Mis agendas</button>
              <button onClick={signOut} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:8,padding:"6px 12px",fontSize:12}}>Cerrar sesión</button>
            </div>
          </div>
          {/* Avisos en el celular */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🔔 Avisos en este dispositivo</div>
            {pushState==="unsupported" || (isIOS() && !isStandalone()) ? (
              <div style={{fontSize:12,color:"var(--g8)",lineHeight:1.5}}>
                {isIOS() && !isStandalone()
                  ? "En iPhone, primero instalá la app: en Safari tocá Compartir → “Agregar a pantalla de inicio”, abrila desde ahí y activá los avisos."
                  : "Este navegador no admite avisos push."}
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <button onClick={togglePush} disabled={pushBusy||pushState==="denied"}
                  style={{background:pushState==="on"?"#96CEB422":"#FF6B6B",color:pushState==="on"?"#96CEB4":"#fff",border:pushState==="on"?"1px solid #96CEB444":"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",opacity:pushBusy?.6:1}}>
                  {pushState==="on" ? "✓ Avisos activados · desactivar" : "Activar avisos"}
                </button>
                <span style={{fontSize:12,color:"var(--g8)"}}>{pushState==="denied" ? "Bloqueados en el navegador" : "Te avisamos de los eventos con alarma, a las 9:00."}</span>
              </div>
            )}
            {pushMsg && <div style={{fontSize:12,color:"#FF6B6B",marginTop:6}}>{pushMsg}</div>}
          </div>
          {/* Theme selector */}
          <div>
            <div style={{fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🎨 Tema personal</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {THEMES.map(t=>{
                const active=themeId===t.id;
                return (
                  <div key={t.id} onClick={()=>saveTheme(t.id)} title={t.label}
                    style={{width:48,height:48,borderRadius:10,cursor:"pointer",border:active?"2px solid #FF6B6B":"2px solid transparent",boxShadow:active?"0 0 0 2px #FF6B6B44":"none",flexShrink:0,position:"relative",overflow:"hidden",...themeBgStyle(t),display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:18,filter:"drop-shadow(0 1px 2px #0008)"}}>{t.emoji}</span>
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:12,color:"var(--g8)",marginTop:8}}>Tema actual: <span style={{color:"#FF6B6B",fontWeight:600}}>{getTheme(themeId).label}</span></div>
          </div>
        </div>
      )}
    </>
  );
}
