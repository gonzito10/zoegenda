import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabase";

// ── Constants ─────────────────────────────────────────────────────────────
const DEFAULT_CATS = [
  { id:"supermarket", label:"Supermercado",       icon:"🛒", color:"#FF6B6B" },
  { id:"home",        label:"Hogar",              icon:"🏠", color:"#4ECDC4" },
  { id:"services",    label:"Servicios",          icon:"⚡", color:"#FFEAA7" },
  { id:"outings",     label:"Salidas",            icon:"🍕", color:"#96CEB4" },
  { id:"electronics", label:"Electrónica",        icon:"📱", color:"#DDA0DD" },
  { id:"appliances",  label:"Electrodomésticos",  icon:"🫧", color:"#FFB347" },
];

const ICON_OPTIONS = [
  { group:"Comida y hogar",    icons:["🍳","🥩","🥦","🧹","🪴","🛁","🛏","🪑","🔧","🏠"] },
  { group:"Transporte",        icons:["🚗","🚌","🛵","✈️","🚂","⛽","🅿️","🛞"] },
  { group:"Salud",             icons:["💊","🩺","🏋️","🧘","💆","🦷","🩻","🧬"] },
  { group:"Ocio",              icons:["🎬","🎮","📚","🎵","🏖️","🎭","🎲","⚽","🎤","🎨"] },
  { group:"Mascotas",          icons:["🐶","🐱","🐾","🦴","🐠","🐰"] },
  { group:"Otros",             icons:["🎁","💰","📦","📎","✨","🛍️","💳","📱","🖥️","📷"] },
];

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const inp  = {background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:10,padding:"11px 13px",color:"#e8e8f0",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
const lbl  = {fontSize:10,color:"#555",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtMoney(n){ return "$" + Math.round(n).toLocaleString("es-AR"); }
function monthKey(dateStr){ return dateStr.slice(0,7); } // "2026-03"
function monthLabel(key){
  const [y,m] = key.split("-").map(Number);
  return `${MONTHS_ES[m-1]} ${y}`;
}

// ── DB helpers ─────────────────────────────────────────────────────────────
async function loadExpenses(groupId){
  const { data } = await supabase.from("expenses").select("*").eq("group_id", groupId).order("date", { ascending:false });
  return data || [];
}
async function loadCustomCats(groupId){
  const { data } = await supabase.from("custom_categories").select("*").eq("group_id", groupId);
  return data || [];
}
async function loadSettlements(groupId){
  const { data } = await supabase.from("settlements").select("*").eq("group_id", groupId).order("date", { ascending:false });
  return data || [];
}
async function saveExpense(exp){
  if(exp.id){
    const { error } = await supabase.from("expenses").update(exp).eq("id", exp.id);
    return error;
  }
  const { error } = await supabase.from("expenses").insert(exp);
  return error;
}
async function deleteExpense(id){
  await supabase.from("expenses").delete().eq("id", id);
}
async function saveCustomCat(cat){
  const { error } = await supabase.from("custom_categories").insert(cat);
  return error;
}
async function saveSettlement(s){
  const { error } = await supabase.from("settlements").insert(s);
  return error;
}

// ── Balance calculator ─────────────────────────────────────────────────────
function calcBalance(expenses, settlements, members, monthFilter) {
  // paid[uid] = total paid by uid; owed[uid] = total owed by uid
  const paid  = {};
  const share = {};
  members.forEach(m => { paid[m.id] = 0; share[m.id] = 0; });

  const filtered = monthFilter
    ? expenses.filter(e => monthKey(e.date) === monthFilter)
    : expenses;

  filtered.forEach(exp => {
    const n = exp.split_between?.length || 1;
    const perPerson = exp.amount / n;
    if(paid[exp.paid_by] !== undefined) paid[exp.paid_by] += exp.amount;
    exp.split_between?.forEach(uid => {
      if(share[uid] !== undefined) share[uid] += perPerson;
    });
  });

  // Apply settlements
  const settFiltered = monthFilter
    ? settlements.filter(s => monthKey(s.date) === monthFilter)
    : settlements;
  settFiltered.forEach(s => {
    if(paid[s.from_user] !== undefined) paid[s.from_user] += s.amount;
    if(share[s.to_user]  !== undefined) share[s.to_user]  += s.amount;
  });

  const balance = {};
  members.forEach(m => { balance[m.id] = paid[m.id] - share[m.id]; });
  return balance;
}

function calcDebts(balance, members) {
  // Simplified debt calculation: who owes whom
  const pos = members.filter(m => balance[m.id] > 0.01).sort((a,b)=>balance[b.id]-balance[a.id]);
  const neg = members.filter(m => balance[m.id] < -0.01).sort((a,b)=>balance[a.id]-balance[b.id]);
  const debts = [];
  const rem = {};
  members.forEach(m => { rem[m.id] = Math.abs(balance[m.id]); });

  let pi = 0, ni = 0;
  while(pi < pos.length && ni < neg.length){
    const creditor = pos[pi], debtor = neg[ni];
    const amount = Math.min(rem[creditor.id], rem[debtor.id]);
    if(amount > 0.01) debts.push({ from: debtor.id, to: creditor.id, amount });
    rem[creditor.id] -= amount;
    rem[debtor.id]   -= amount;
    if(rem[creditor.id] < 0.01) pi++;
    if(rem[debtor.id]   < 0.01) ni++;
  }
  return debts;
}

// ── Pie chart ──────────────────────────────────────────────────────────────
function PieChart({ cats, total }) {
  const sorted = [...cats].sort((a,b)=>b.amount-a.amount);
  let angle = -Math.PI/2;
  const slices = sorted.map(c => {
    const slice = (c.amount/total)*2*Math.PI;
    const x1 = 100 + 80*Math.cos(angle);
    const y1 = 100 + 80*Math.sin(angle);
    angle += slice;
    const x2 = 100 + 80*Math.cos(angle);
    const y2 = 100 + 80*Math.sin(angle);
    const large = slice > Math.PI ? 1 : 0;
    return { c, x1, y1, x2, y2, large };
  });
  return (
    <svg viewBox="0 0 200 200" width={130} height={130} style={{flexShrink:0}}>
      {slices.map(({c,x1,y1,x2,y2,large},i)=>(
        <path key={i}
          d={`M100,100 L${x1.toFixed(1)},${y1.toFixed(1)} A80,80 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`}
          fill={c.color} stroke="#0f0f13" strokeWidth={2}/>
      ))}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function Expenses({ groupId, members, currentUserId }) {
  const [expenses,    setExpenses]    = useState([]);
  const [customCats,  setCustomCats]  = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [subTab,      setSubTab]      = useState("balance"); // balance|history|stats
  const [selMonth,    setSelMonth]    = useState(null); // null = current month
  const [showModal,   setShowModal]   = useState(false);
  const [editExp,     setEditExp]     = useState(null);
  const [loading,     setLoading]     = useState(true);

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

  // Listen for FAB click from parent
  useEffect(() => {
    const handler = () => { setEditExp(null); setShowModal(true); };
    document.addEventListener("openExpenseModal", handler);
    return () => document.removeEventListener("openExpenseModal", handler);
  }, []);

  // Load data
  useEffect(() => {
    if(!groupId) return;
    setLoading(true);
    Promise.all([loadExpenses(groupId), loadCustomCats(groupId), loadSettlements(groupId)])
      .then(([exps, cats, setts]) => {
        setExpenses(exps);
        setCustomCats(cats);
        setSettlements(setts);
        setLoading(false);
      });

    // Realtime
    const sub = supabase.channel(`expenses-${groupId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"expenses",    filter:`group_id=eq.${groupId}` }, () => loadExpenses(groupId).then(setExpenses))
      .on("postgres_changes", { event:"*", schema:"public", table:"settlements", filter:`group_id=eq.${groupId}` }, () => loadSettlements(groupId).then(setSettlements))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [groupId]);

  // Available months from expenses
  const availableMonths = useMemo(() => {
    const keys = [...new Set(expenses.map(e => monthKey(e.date)))].sort().reverse();
    return keys;
  }, [expenses]);

  const activeMonth = selMonth || currentMonthKey;

  // All cats (default + custom)
  const allCats = useMemo(() => [
    ...DEFAULT_CATS,
    ...customCats.map(c => ({ id:c.id, label:c.label, icon:c.icon, color:c.color }))
  ], [customCats]);

  function getCat(id){ return allCats.find(c=>c.id===id) || { label:id, icon:"📌", color:"#888" }; }
  function getMember(id){ return members.find(m=>m.id===id) || { display_name:"?", color:"#888", avatar:"?" }; }

  // Filtered expenses for active month
  const monthExpenses = useMemo(() => expenses.filter(e => monthKey(e.date) === activeMonth), [expenses, activeMonth]);
  const monthTotal    = useMemo(() => monthExpenses.reduce((s,e)=>s+e.amount,0), [monthExpenses]);

  // Balance
  const balance = useMemo(() => calcBalance(expenses, settlements, members, activeMonth), [expenses, settlements, members, activeMonth]);
  const debts   = useMemo(() => calcDebts(balance, members), [balance, members]);

  // Stats by category
  const statsByCat = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => {
      const c = getCat(e.category);
      if(!map[e.category]) map[e.category] = { ...c, amount:0 };
      map[e.category].amount += e.amount;
    });
    return Object.values(map).sort((a,b)=>b.amount-a.amount);
  }, [monthExpenses, allCats]);

  // Annual stats
  const annualStats = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const c = getCat(e.category);
      if(!map[e.category]) map[e.category] = { ...c, amount:0 };
      map[e.category].amount += e.amount;
    });
    return Object.values(map).sort((a,b)=>b.amount-a.amount);
  }, [expenses, allCats]);
  const annualTotal = useMemo(() => expenses.reduce((s,e)=>s+e.amount,0), [expenses]);

  // ── settle debt ────────────────────────────────────────────────────────
  async function handleSettle(debt){
    await saveSettlement({
      group_id: groupId,
      from_user: debt.from,
      to_user: debt.to,
      amount: debt.amount,
      date: new Date().toISOString().slice(0,10),
    });
    const setts = await loadSettlements(groupId);
    setSettlements(setts);
  }

  // ── Month selector ─────────────────────────────────────────────────────
  const MonthSelect = ({ value, onChange, includeAll }) => (
    <div style={{marginBottom:14,position:"relative"}}>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{...inp, paddingRight:36, appearance:"none", WebkitAppearance:"none", cursor:"pointer"}}>
        {includeAll && <option value="all">📅 Anual</option>}
        {availableMonths.length === 0
          ? <option value={currentMonthKey}>{monthLabel(currentMonthKey)}</option>
          : availableMonths.map(k=><option key={k} value={k}>{monthLabel(k)}</option>)
        }
      </select>
      <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"#555"}}>▾</div>
    </div>
  );

  // ── Balance tab ────────────────────────────────────────────────────────
  const BalanceTab = () => (
    <div>
      <MonthSelect value={activeMonth} onChange={v=>{setSelMonth(v==="all"?null:v)}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {members.map(m=>{
          const b = balance[m.id] || 0;
          return (
            <div key={m.id} style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:12,padding:12}}>
              <div style={{fontSize:11,color:"#666",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:16,height:16,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,fontWeight:700,color:"#fff"}}>{m.avatar}</div>
                {m.display_name}
              </div>
              <div style={{fontSize:20,fontWeight:700,fontFamily:"Fraunces,serif",color:b>0.01?"#96CEB4":b<-0.01?"#FF6B6B":"#555"}}>{fmtMoney(Math.abs(b))}</div>
              <div style={{fontSize:10,marginTop:3,color:b>0.01?"#96CEB4":b<-0.01?"#FF6B6B":"#555"}}>{b>0.01?"Le deben":b<-0.01?"Debe":"Al día ✓"}</div>
            </div>
          );
        })}
        <div style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:12,padding:12}}>
          <div style={{fontSize:11,color:"#666",marginBottom:4}}>💰 Total</div>
          <div style={{fontSize:18,fontWeight:700,fontFamily:"Fraunces,serif",color:"#e8e8f0"}}>{fmtMoney(monthTotal)}</div>
          <div style={{fontSize:10,color:"#555",marginTop:3}}>{monthLabel(activeMonth)}</div>
        </div>
      </div>

      {debts.length > 0 && <>
        <div style={{fontSize:10,color:"#444",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Quién le debe a quién</div>
        {debts.map((d,i)=>{
          const from = getMember(d.from), to = getMember(d.to);
          return (
            <div key={i} style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:from.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{from.avatar}</div>
              <div style={{flex:1,fontSize:12}}>
                {from.display_name} → <strong style={{color:to.color}}>{to.display_name}</strong>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:"#FF6B6B",marginRight:8}}>{fmtMoney(d.amount)}</div>
              <button onClick={()=>handleSettle(d)}
                style={{background:"#96CEB422",color:"#96CEB4",border:"1px solid #96CEB444",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>
                ✓ Pagar
              </button>
            </div>
          );
        })}
      </>}

      {debts.length === 0 && monthTotal > 0 && (
        <div style={{textAlign:"center",color:"#96CEB4",padding:"20px 0",fontSize:13}}>✓ Todo al día</div>
      )}

      {/* Active installments this month */}
      {monthExpenses.filter(e=>e.installments>1).length > 0 && <>
        <div style={{fontSize:10,color:"#444",fontWeight:600,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 8px"}}>Cuotas activas</div>
        {monthExpenses.filter(e=>e.installments>1).map(e=>{
          const c = getCat(e.category);
          return (
            <div key={e.id} style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <div style={{width:34,height:34,borderRadius:9,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.description}</div>
                <div style={{fontSize:11,color:"#555",marginTop:2,display:"flex",gap:5,alignItems:"center"}}>
                  {getMember(e.paid_by).display_name}
                  <span style={{background:"#DDA0DD22",color:"#DDA0DD",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>Cuota {e.installment_number}/{e.installments}</span>
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:14,fontWeight:700,color:"#DDA0DD"}}>{fmtMoney(e.amount)}</div>
                <div style={{fontSize:10,color:"#555"}}>÷{e.split_between?.length||1} = {fmtMoney(e.amount/(e.split_between?.length||1))} c/u</div>
              </div>
            </div>
          );
        })}
      </>}
    </div>
  );

  // ── History tab ────────────────────────────────────────────────────────
  const HistoryTab = () => (
    <div>
      <MonthSelect value={activeMonth} onChange={v=>setSelMonth(v==="all"?null:v)}/>
      {monthExpenses.length === 0
        ? <div style={{textAlign:"center",color:"#444",padding:"50px 0",fontSize:14}}>No hay gastos este mes</div>
        : <>
          <div style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",fontSize:12}}>
            <span style={{color:"#555"}}>Total del mes</span>
            <strong style={{color:"#e8e8f0"}}>{fmtMoney(monthTotal)}</strong>
          </div>
          {monthExpenses.map(e=>{
            const c = getCat(e.category);
            const payer = getMember(e.paid_by);
            const perPerson = e.amount / (e.split_between?.length || 1);
            return (
              <div key={e.id} onClick={()=>{ setEditExp(e); setShowModal(true); }}
                style={{background:e.settled?"#0f0f13":"#131318",border:"1px solid #1e1e2a",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:6,cursor:"pointer",opacity:e.settled?0.5:1}}>
                <div style={{width:34,height:34,borderRadius:9,background:c.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:e.settled?"line-through":"none"}}>{e.description}</div>
                  <div style={{fontSize:11,color:"#555",marginTop:2,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                    {payer.display_name} · {c.label}
                    {e.installments>1&&<span style={{background:"#DDA0DD22",color:"#DDA0DD",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>Cuota {e.installment_number}/{e.installments}</span>}
                    {e.settled&&<span style={{background:"#96CEB422",color:"#96CEB4",padding:"1px 6px",borderRadius:10,fontSize:9,fontWeight:700}}>✓ Liquidado</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:e.installments>1?"#DDA0DD":"#e8e8f0",textDecoration:e.settled?"line-through":"none"}}>{fmtMoney(e.amount)}</div>
                  <div style={{fontSize:10,color:"#555"}}>÷{e.split_between?.length||1} = {fmtMoney(perPerson)} c/u</div>
                </div>
              </div>
            );
          })}
        </>
      }
    </div>
  );

  // ── Stats tab ──────────────────────────────────────────────────────────
  const StatsTab = () => {
    const [statsView, setStatsView] = useState("month"); // month|annual
    const cats   = statsView==="annual" ? annualStats : statsByCat;
    const total  = statsView==="annual" ? annualTotal : monthTotal;
    const max    = cats.length > 0 ? cats[0].amount : 1;

    return (
      <div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[["month","Este mes"],["annual","Anual"]].map(([v,l])=>(
            <button key={v} onClick={()=>setStatsView(v)}
              style={{padding:"5px 14px",borderRadius:8,fontSize:11,fontWeight:600,border:"1px solid",borderColor:statsView===v?"#2a2a3a":"transparent",background:statsView===v?"#1e1e2a":"transparent",color:statsView===v?"#fff":"#555",cursor:"pointer"}}>
              {l}
            </button>
          ))}
        </div>
        {statsView==="month" && <MonthSelect value={activeMonth} onChange={v=>setSelMonth(v==="all"?null:v)}/>}

        {cats.length === 0
          ? <div style={{textAlign:"center",color:"#444",padding:"50px 0",fontSize:14}}>Sin datos para mostrar</div>
          : <>
            {/* Summary */}
            <div style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:12,padding:14,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,color:"#555",marginBottom:4}}>{statsView==="annual"?"Total anual":"Total del mes"}</div>
                <div style={{fontFamily:"Fraunces,serif",fontSize:22,fontWeight:700}}>{fmtMoney(total)}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:"#555",marginBottom:4}}>Categorías</div>
                <div style={{fontFamily:"Fraunces,serif",fontSize:22,fontWeight:700}}>{cats.length}</div>
              </div>
            </div>

            {/* Pie + legend */}
            <div style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:12,padding:16,marginBottom:14,display:"flex",alignItems:"center",gap:16}}>
              <PieChart cats={cats} total={total}/>
              <div style={{display:"flex",flexDirection:"column",gap:7,flex:1}}>
                {cats.map(c=>(
                  <div key={c.id||c.label} style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:10,height:10,borderRadius:3,background:c.color,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:11,color:"#aaa"}}>{c.icon} {c.label}</div>
                    <div style={{fontSize:11,fontWeight:700,color:c.color}}>{((c.amount/total)*100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bars */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {cats.map(c=>{
                const pct = ((c.amount/total)*100).toFixed(1);
                const barW = ((c.amount/max)*100).toFixed(1);
                return (
                  <div key={c.id||c.label}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
                      <div style={{fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{c.icon}</span>{c.label}</div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:13,fontWeight:700,fontFamily:"Fraunces,serif",color:c.color}}>{fmtMoney(c.amount)}</div>
                        <div style={{fontSize:10,color:"#555"}}>{pct}% del total</div>
                      </div>
                    </div>
                    <div style={{height:8,background:"#1a1a22",borderRadius:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${barW}%`,background:c.color+"44",border:`1px solid ${c.color}66`,borderRadius:4,transition:"width .4s ease"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        }
      </div>
    );
  };

  // ── Expense Modal ──────────────────────────────────────────────────────
  const ExpenseModal = () => {
    const isNew = !editExp?.id;
    const todayStr = new Date().toISOString().slice(0,10);
    const [form, setForm] = useState(editExp || {
      description:"", amount:"", date:todayStr, category:"supermarket",
      paid_by: currentUserId, split_between: members.map(m=>m.id),
      installments:1, settled:false
    });
    const [installments, setInstallments] = useState(editExp?.installments>1);
    const [showAddCat,  setShowAddCat]  = useState(false);
    const [newCatLabel, setNewCatLabel] = useState("");
    const [newCatIcon,  setNewCatIcon]  = useState("");
    const [saving,      setSaving]      = useState(false);

    const perCuota = form.amount && form.installments > 1 ? Math.ceil(parseFloat(form.amount)/form.installments) : null;

    function toggleMember(uid){
      setForm(f=>({...f, split_between: f.split_between.includes(uid)
        ? f.split_between.filter(x=>x!==uid)
        : [...f.split_between, uid]
      }));
    }

    async function handleSave(){
      if(!form.description.trim() || !form.amount) return;
      setSaving(true);
      const base = {
        ...form,
        amount: parseFloat(form.amount),
        installments: installments ? parseInt(form.installments)||1 : 1,
        group_id: groupId,
        created_by: currentUserId,
      };
      if(installments && base.installments > 1 && isNew){
        // Generate one expense per installment
        const groupInstId = crypto.randomUUID();
        const cuotaAmount = Math.ceil(base.amount / base.installments);
        const startDate = new Date(base.date + "T12:00:00");
        for(let i=0; i<base.installments; i++){
          const d = new Date(startDate);
          d.setMonth(d.getMonth()+i);
          const dateStr = d.toISOString().slice(0,10);
          await saveExpense({
            ...base,
            id: undefined,
            amount: cuotaAmount,
            date: dateStr,
            installment_number: i+1,
            installment_group_id: groupInstId,
          });
        }
      } else {
        await saveExpense(base);
      }
      const exps = await loadExpenses(groupId);
      setExpenses(exps);
      setSaving(false);
      setShowModal(false);
      setEditExp(null);
    }

    async function handleDelete(){
      if(!editExp?.id) return;
      // If installment, delete all in group
      if(editExp.installment_group_id){
        await supabase.from("expenses").delete().eq("installment_group_id", editExp.installment_group_id);
      } else {
        await deleteExpense(editExp.id);
      }
      const exps = await loadExpenses(groupId);
      setExpenses(exps);
      setShowModal(false);
      setEditExp(null);
    }

    async function handleAddCat(){
      if(!newCatLabel.trim() || !newCatIcon) return;
      const cat = { group_id:groupId, label:newCatLabel.trim(), icon:newCatIcon, color:"#88AADD" };
      await saveCustomCat(cat);
      const cats = await loadCustomCats(groupId);
      setCustomCats(cats);
      setForm(f=>({...f, category: cats[cats.length-1]?.id || f.category}));
      setShowAddCat(false); setNewCatLabel(""); setNewCatIcon("");
    }

    return (
      <div onClick={e=>{if(e.target===e.currentTarget){setShowModal(false);setEditExp(null);}}}
        style={{position:"fixed",inset:0,background:"#000000d0",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
        <div style={{background:"#131318",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,padding:20,border:"1px solid #2a2a3a",maxHeight:"92vh",overflow:"auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:17,fontWeight:600,color:"#fff"}}>{isNew?"Nuevo gasto":"Editar gasto"}</h2>
            <button onClick={()=>{setShowModal(false);setEditExp(null);}} style={{background:"#1e1e2a",border:"none",color:"#aaa",width:26,height:26,borderRadius:"50%",fontSize:14}}>×</button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Description */}
            <div>
              <label style={lbl}>Descripción</label>
              <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Ej: Supermercado, Expensas..." style={inp} autoFocus/>
            </div>

            {/* Amount + date */}
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <label style={lbl}>Monto total</label>
                <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="$0" style={inp}/>
              </div>
              <div style={{width:130}}>
                <label style={lbl}>Fecha</label>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/>
              </div>
            </div>

            {/* Installments toggle */}
            <div onClick={()=>setInstallments(v=>!v)}
              style={{background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#e8e8f0"}}>💳 Compra en cuotas</div>
                <div style={{fontSize:11,color:"#555",marginTop:1}}>Se genera un gasto automático por mes</div>
              </div>
              <div style={{width:36,height:20,borderRadius:10,background:installments?"#DDA0DD":"#2a2a3a",position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:installments?18:3,transition:"left .2s"}}/>
              </div>
            </div>

            {installments && (
              <div style={{background:"#DDA0DD11",border:"1px solid #DDA0DD33",borderRadius:10,padding:12,display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <label style={{...lbl,color:"#DDA0DD"}}>Cantidad de cuotas</label>
                  <input type="number" value={form.installments} onChange={e=>setForm(f=>({...f,installments:e.target.value}))} placeholder="Ej: 12" min={2} max={60} style={{...inp,background:"#0f0f13"}}/>
                </div>
                {perCuota && (
                  <div style={{background:"#0f0f13",border:"1px solid #DDA0DD33",borderRadius:10,padding:"10px 13px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,color:"#888"}}>Monto por cuota</span>
                    <span style={{fontSize:18,fontWeight:700,fontFamily:"Fraunces,serif",color:"#DDA0DD"}}>{fmtMoney(perCuota)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Category */}
            <div>
              <label style={lbl}>Categoría</label>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {allCats.map(c=>{
                  const on = form.category===c.id;
                  return (
                    <div key={c.id} onClick={()=>setForm(f=>({...f,category:c.id}))}
                      style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",fontWeight:on?600:400,background:on?c.color+"33":"#1a1a22",color:on?c.color:"#666",border:`1px solid ${on?c.color+"44":"#2a2a3a"}`}}>
                      {c.icon} {c.label}
                    </div>
                  );
                })}
                <div onClick={()=>setShowAddCat(v=>!v)}
                  style={{padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",borderStyle:"dashed",border:"1px dashed #2a2a3a",color:"#444"}}>
                  + Nueva
                </div>
              </div>

              {/* Add custom category */}
              {showAddCat && (
                <div style={{background:"#0f0f13",border:"1px solid #2a2a3a",borderRadius:12,padding:12,marginTop:8,display:"flex",flexDirection:"column",gap:10}}>
                  <input value={newCatLabel} onChange={e=>setNewCatLabel(e.target.value)} placeholder="Nombre de la categoría" style={inp}/>
                  <div>
                    <label style={lbl}>Elegí un ícono</label>
                    <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:180,overflowY:"auto"}}>
                      {ICON_OPTIONS.map(g=>(
                        <div key={g.group}>
                          <div style={{fontSize:9,color:"#444",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{g.group}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {g.icons.map(ico=>(
                              <div key={ico} onClick={()=>setNewCatIcon(ico)}
                                style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:18,cursor:"pointer",background:newCatIcon===ico?"#FF6B6B22":"#1a1a22",border:`1.5px solid ${newCatIcon===ico?"#FF6B6B":"transparent"}`}}>
                                {ico}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {newCatIcon && (
                    <div style={{background:"#131318",border:"1px solid #1e1e2a",borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:22}}>{newCatIcon}</span>
                      <span style={{fontSize:12,color:newCatLabel?"#e8e8f0":"#555"}}>{newCatLabel||"Sin nombre"}</span>
                    </div>
                  )}
                  <button onClick={handleAddCat} style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:"9px",fontSize:13,fontWeight:700}}>Agregar categoría</button>
                </div>
              )}
            </div>

            {/* Who paid */}
            <div>
              <label style={lbl}>¿Quién pagó?</label>
              <select value={form.paid_by} onChange={e=>setForm(f=>({...f,paid_by:e.target.value}))} style={{...inp,appearance:"none",WebkitAppearance:"none",cursor:"pointer"}}>
                {members.map(m=><option key={m.id} value={m.id}>{m.display_name}</option>)}
              </select>
            </div>

            {/* Split between */}
            <div>
              <label style={lbl}>Dividir entre</label>
              {members.map(m=>{
                const on = form.split_between?.includes(m.id);
                return (
                  <div key={m.id} onClick={()=>toggleMember(m.id)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:on?"#FF6B6B11":"#0f0f13",border:`1px solid ${on?"#FF6B6B33":"#1e1e2a"}`,cursor:"pointer",marginBottom:5}}>
                    <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${on?"#FF6B6B":"#2a2a3a"}`,background:on?"#FF6B6B":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{on?"✓":""}</div>
                    <div style={{width:22,height:22,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:"#fff"}}>{m.avatar}</div>
                    <span style={{fontSize:13}}>{m.display_name}</span>
                  </div>
                );
              })}
            </div>

            {/* Save / Delete */}
            <button onClick={handleSave} disabled={saving}
              style={{background:"#FF6B6B",color:"#fff",border:"none",borderRadius:10,padding:11,fontSize:14,fontWeight:700,opacity:saving?.6:1}}>
              {saving?"Guardando...":(isNew?"Registrar gasto":"Guardar cambios")}
            </button>
            {!isNew && (
              <button onClick={handleDelete}
                style={{background:"transparent",color:"#FF6B6B55",border:"1px solid #FF6B6B22",borderRadius:10,padding:"9px",fontSize:13}}>
                {editExp?.installment_group_id ? "Eliminar todas las cuotas" : "Eliminar gasto"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if(loading) return <div style={{textAlign:"center",color:"#555",padding:"50px 0"}}>Cargando gastos...</div>;

  return (
    <div style={{paddingBottom:80}}>
      {/* Sub tabs */}
      <div style={{display:"flex",gap:4,marginBottom:14}}>
        {[["balance","⚖️ Balance"],["history","📋 Historial"],["stats","📊 Estadísticas"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSubTab(v)}
            style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${subTab===v?"#2a2a3a":"transparent"}`,background:subTab===v?"#1e1e2a":"transparent",color:subTab===v?"#fff":"#555",cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>

      {subTab==="balance" && <BalanceTab/>}
      {subTab==="history" && <HistoryTab/>}
      {subTab==="stats"   && <StatsTab/>}

      {showModal && <ExpenseModal/>}
    </div>
  );
}
