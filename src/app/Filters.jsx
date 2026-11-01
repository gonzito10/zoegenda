import { CATEGORIES } from "./constants";

export default function Filters({ ctx }) {
  const { filterCat, filterUser, groupMembers, setFilterCat, setFilterUser } = ctx;
  return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:9,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>Ver:</span>
      {[["all","Todos"],...groupMembers.map(m=>[m.id,m.display_name])].map(([id,label])=>{
        const m=groupMembers.find(x=>x.id===id); const on=filterUser===id;
        return <div key={id} onClick={()=>setFilterUser(id)} style={{padding:"2px 9px",borderRadius:20,fontSize:10,cursor:"pointer",background:on?(m?m.color+"33":"var(--border2)"):"transparent",color:on?(m?m.color:"var(--title)"):"var(--g5)",border:`1px solid ${on?"var(--border3)":"var(--border)"}`}}>{label}</div>;
      })}
      <div style={{width:1,height:12,background:"var(--border2)",margin:"0 2px"}}/>
      {CATEGORIES.map(c=>(
        <div key={c.id} onClick={()=>setFilterCat(filterCat===c.id?"all":c.id)} style={{padding:"2px 9px",borderRadius:20,fontSize:10,cursor:"pointer",background:filterCat===c.id?c.color+"33":"transparent",color:filterCat===c.id?c.color:"var(--g5)",border:`1px solid ${filterCat===c.id?c.color+"44":"var(--border)"}`}}>{c.label}</div>
      ))}
    </div>
  );
}
