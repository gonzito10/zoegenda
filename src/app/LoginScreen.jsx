import { BASE_CSS, inp, lbl, Logo } from "./styles";

export default function LoginScreen({ ctx }) {
  const { authEmail, authError, authLoading, authPassword, screen, setAuthEmail, setAuthError, setAuthPassword, setScreen, signIn, signUp } = ctx;
  const isReg = screen==="register";
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{BASE_CSS}</style>
      <div style={{maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:44,marginBottom:12}}>📅</div>
          <Logo size={32}/>
          <p style={{color:"var(--g5)",fontSize:13,marginTop:8}}>Agenda compartida en tiempo real</p>
        </div>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
          <div style={{display:"flex",gap:4,marginBottom:22,background:"var(--bg)",borderRadius:10,padding:4}}>
            {[["login","Entrar"],["register","Registrarse"]].map(([s,label])=>(
              <button key={s} onClick={()=>{setScreen(s);setAuthError("");}} style={{flex:1,padding:"8px",borderRadius:8,border:"none",background:screen===s?"var(--border)":"transparent",color:screen===s?"var(--title)":"var(--g5)",fontSize:13,fontWeight:screen===s?600:400}}>{label}</button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="tu@email.com" style={inp}/>
            </div>
            <div>
              <label style={lbl}>Contraseña</label>
              <input type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(isReg?signUp():signIn())} placeholder="••••••••" style={inp}/>
            </div>
            {authError&&<div style={{fontSize:12,color:"#FF6B6B",background:"#FF6B6B11",padding:"8px 12px",borderRadius:8}}>{authError}</div>}
            {isReg&&<p style={{fontSize:11,color:"var(--g5)",lineHeight:1.5}}>Al registrarte vas a poder crear y unirte a múltiples grupos de agenda.</p>}
            <button onClick={isReg?signUp:signIn} disabled={authLoading} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700,opacity:authLoading?.6:1}}>
              {authLoading?"Cargando...":(isReg?"Crear cuenta":"Entrar")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
