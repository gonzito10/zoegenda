// Barra de acción inferior: reemplaza al botón + flotante.
// Es parte del layout (no flota), así que la lista siempre termina arriba de la barra y nunca queda tapada.
const open = name => () => document.dispatchEvent(new CustomEvent(name));

export default function ActionBar({ ctx }) {
  const { mainTab, openNew, view } = ctx;
  let action = null;
  if (mainTab==="expenses") action = ["Nuevo gasto", open("openExpenseModal")];
  else if (mainTab==="lists") action = ["Nuevo listado", open("openListModal")];
  else if (mainTab==="notes") action = ["Nueva nota", open("openNoteModal")];
  else if (mainTab==="agenda" && view==="calendar") action = ["Nuevo evento", () => openNew(null)];
  if (!action) return null;
  const [label, onClick] = action;
  return (
    <div style={{flexShrink:0,background:"var(--bar)",borderTop:"1px solid var(--border)",padding:"12px 16px",display:"flex",justifyContent:"center",zIndex:50}}>
      <button onClick={onClick}
        style={{width:"100%",maxWidth:560,minHeight:52,borderRadius:16,border:"none",background:"#FF6B6B",color:"#1A0B0B",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        {label}
      </button>
    </div>
  );
}
