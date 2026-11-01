
export default function DeleteDialog({ ctx }) {
  const { confirmDelete, deleteDialog, setDeleteDialog } = ctx;
  return (
    <>
      {deleteDialog&&(
        <div className="modal-overlay" style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div className="modal-box" style={{background:"var(--card)",borderRadius:16,padding:22,maxWidth:320,width:"100%",border:"1px solid var(--border2)"}}>
            <h3 style={{fontFamily:"Fraunces,serif",fontSize:16,fontWeight:600,color:"var(--title)",marginBottom:6}}>Eliminar evento rutinario</h3>
            <p style={{fontSize:12,color:"var(--g8)",marginBottom:16,lineHeight:1.6}}>¿Qué querés eliminar?</p>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {!deleteDialog.isBase&&<button onClick={()=>confirmDelete(deleteDialog.baseId,"one",deleteDialog.virtualDate)} style={{background:"var(--border)",color:"var(--text)",border:"1px solid var(--border2)",borderRadius:10,padding:"10px",fontSize:13,fontWeight:500,textAlign:"left"}}>Solo esta ocurrencia</button>}
              <button onClick={()=>confirmDelete(deleteDialog.baseId,"all",null)} style={{background:"#FF6B6B22",color:"#FF6B6B",border:"1px solid #FF6B6B44",borderRadius:10,padding:"10px",fontSize:13,fontWeight:600,textAlign:"left"}}>Toda la serie</button>
              <button onClick={()=>setDeleteDialog(null)} style={{background:"transparent",color:"var(--g6)",border:"none",borderRadius:10,padding:"8px",fontSize:13}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
