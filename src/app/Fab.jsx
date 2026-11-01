
export default function Fab({ ctx }) {
  const { mainTab, openNew, view } = ctx;
  return (
    <>
      {mainTab==="expenses"
        ? <button onClick={()=>{ document.dispatchEvent(new CustomEvent("openExpenseModal")); }}
            style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:"50%",background:"#FF6B6B",border:"none",color:"#fff",fontSize:26,cursor:"pointer",boxShadow:"0 4px 20px #FF6B6B44",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        : mainTab==="lists"
        ? <button onClick={()=>{ document.dispatchEvent(new CustomEvent("openListModal")); }}
            style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:"50%",background:"#FF6B6B",border:"none",color:"#fff",fontSize:26,cursor:"pointer",boxShadow:"0 4px 20px #FF6B6B44",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        : mainTab==="notes"
        ? <button onClick={()=>{ document.dispatchEvent(new CustomEvent("openNoteModal")); }}
            style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:"50%",background:"#FF6B6B",border:"none",color:"#fff",fontSize:26,cursor:"pointer",boxShadow:"0 4px 20px #FF6B6B44",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        : mainTab==="agenda"&&view==="calendar"
        ? <button onClick={()=>openNew(null)}
            style={{position:"fixed",bottom:20,right:20,width:52,height:52,borderRadius:"50%",background:"#FF6B6B",border:"none",color:"#fff",fontSize:26,cursor:"pointer",boxShadow:"0 4px 20px #FF6B6B44",zIndex:50,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
        : null
      }
    </>
  );
}
