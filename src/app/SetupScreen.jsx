import { COLORS } from "./constants";
import { initials } from "./utils";
import { BASE_CSS, inp, lbl, Logo } from "./styles";

export default function SetupScreen({ ctx }) {
  const { saveProfile, setSetupColor, setSetupError, setSetupName, setupColor, setupError, setupName } = ctx;
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:"DM Sans,sans-serif"}}>
      <style>{BASE_CSS}</style>
      <div style={{maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:28}}><Logo size={28}/></div>
        <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,color:"var(--title)",marginBottom:4,fontWeight:600}}>Completá tu perfil</h2>
        <p style={{color:"var(--g5)",fontSize:13,marginBottom:24}}>Elegí cómo te van a ver los demás</p>
        <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:setupColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#fff",boxShadow:`0 0 0 5px ${setupColor}33`,transition:"all .3s"}}>
            {setupName.trim()?initials(setupName):"?"}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={lbl}>Tu nombre</label>
            <input value={setupName} onChange={e=>{setSetupName(e.target.value);setSetupError("");}} placeholder="Ej: Laura García" maxLength={20} style={inp} autoFocus/>
            {setupError&&<div style={{fontSize:12,color:"var(--coral)",marginTop:5}}>{setupError}</div>}
          </div>
          <div>
            <label style={lbl}>Tu color</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {COLORS.map(c=><div key={c} onClick={()=>setSetupColor(c)} style={{width:30,height:30,borderRadius:"50%",background:c,cursor:"pointer",border:setupColor===c?"3px solid var(--title)":"3px solid transparent",boxShadow:setupColor===c?`0 0 0 2px ${c}`:"none",transition:"all .15s"}}/>)}
            </div>
          </div>
          <button onClick={saveProfile} style={{background:"#FF6B6B",color:"#1A0B0B",border:"none",borderRadius:10,padding:"12px",fontSize:14,fontWeight:700}}>Guardar ✨</button>
        </div>
      </div>
    </div>
  );
}
