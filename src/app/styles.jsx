// ── Styles ─────────────────────────────────────────────────────────────────
export const FONT = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Fraunces:opsz,wght@9..144,300;9..144,600&display=swap');`;
export const BASE_CSS = `
  ${FONT} *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:var(--g3);border-radius:2px;}
  input:focus,textarea:focus{border-color:#FF6B6B!important;outline:none;}
  input,textarea{outline:none;}
  .clickable:hover{opacity:.85;cursor:pointer;}
  .day-cell:hover{background:var(--border)!important;cursor:pointer;}
  .event-chip:hover{opacity:.8;cursor:pointer;}
  .agenda-event:hover{background:var(--border)!important;cursor:pointer;}
  .modal-overlay{animation:fadeIn .15s ease;}
  .modal-box{animation:slideUp .2s ease;}
  .panel-anim{animation:slideUp .15s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
  .dow-pill{cursor:pointer;transition:all .15s;}
  button{font-family:DM Sans,sans-serif;cursor:pointer;}
`;

export const inp = {background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"11px 13px",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
export const lbl = {fontSize:12,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};
export const Logo = ({size=20}) => <span style={{fontFamily:"Fraunces,serif",fontSize:size,fontWeight:600,color:"var(--title)",letterSpacing:"-0.5px"}}>Zoe<span style={{color:"#FF6B6B"}}>Gens</span></span>;

// ── App ────────────────────────────────────────────────────────────────────
