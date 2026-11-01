import { useState } from "react";
import { CATEGORIES } from "./constants";
import Icon from "./Icon";

// Filtros plegables: un botón "Filtrar" (con la cantidad de filtros activos) que despliega personas y categorías.
export default function Filters({ ctx }) {
  const { filterCat, filterUser, groupMembers, setFilterCat, setFilterUser } = ctx;
  const [open, setOpen] = useState(false);
  const active = (filterUser!=="all"?1:0) + (filterCat!=="all"?1:0);
  const chip = (on, color) => ({minHeight:36,display:"inline-flex",alignItems:"center",padding:"0 14px",borderRadius:20,fontSize:13,fontWeight:on?700:500,cursor:"pointer",background:on?(color?color+"33":"var(--border2)"):"transparent",color:on?(color||"var(--title)"):"var(--g8)",border:`1px solid ${on?(color?color+"88":"var(--border3)"):"var(--border2)"}`});
  const label = {fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6};
  return (
    <div style={{width:"100%"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={()=>setOpen(o=>!o)} aria-expanded={open}
          style={{minHeight:40,display:"inline-flex",alignItems:"center",gap:8,padding:"0 14px",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",background:open||active?"var(--card2)":"var(--card)",color:"var(--text)",border:`1px solid ${active?"var(--g8)":"var(--border2)"}`}}>
          <Icon name="filter" size={16}/> Filtrar
          {active>0&&<span style={{minWidth:20,height:20,padding:"0 6px",borderRadius:10,background:"#FF6B6B",color:"#1A0B0B",fontSize:12,fontWeight:700,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{active}</span>}
          <Icon name={open?"chevronUp":"chevronDown"} size={14}/>
        </button>
        {active>0&&<button onClick={()=>{setFilterUser("all");setFilterCat("all");}} style={{minHeight:40,padding:"0 10px",background:"transparent",border:"none",color:"var(--g8)",fontSize:13,cursor:"pointer",textDecoration:"underline"}}>Limpiar</button>}
      </div>
      {open&&(
        <div className="panel-anim" style={{marginTop:10,background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:"12px 14px",display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={label}>Personas</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[["all","Todos"],...groupMembers.map(m=>[m.id,m.display_name])].map(([id,text])=>{
                const m=groupMembers.find(x=>x.id===id);
                return <button key={id} onClick={()=>setFilterUser(id)} style={chip(filterUser===id, m?.color)}>{text}</button>;
              })}
            </div>
          </div>
          <div>
            <div style={label}>Categorías</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {CATEGORIES.map(c=>(
                <button key={c.id} onClick={()=>setFilterCat(filterCat===c.id?"all":c.id)} style={chip(filterCat===c.id, c.color)}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
