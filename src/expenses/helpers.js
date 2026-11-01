import { supabase } from "../supabase";

export const DEFAULT_CATS = [
  { id:"supermarket", label:"Supermercado",       icon:"🛒", color:"#FF6B6B" },
  { id:"home",        label:"Hogar",              icon:"🏠", color:"#4ECDC4" },
  { id:"services",    label:"Servicios",          icon:"⚡", color:"#FFEAA7" },
  { id:"outings",     label:"Salidas",            icon:"🍕", color:"#96CEB4" },
  { id:"electronics", label:"Electrónica",        icon:"📱", color:"#DDA0DD" },
  { id:"appliances",  label:"Electrodomésticos",  icon:"🫧", color:"#FFB347" },
];

export const ICON_OPTIONS = [
  { group:"Comida y hogar",    icons:["🍳","🥩","🥦","🧹","🪴","🛁","🛏","🪑","🔧","🏠","🍕","🥗","🍔","🍜","🥘","🧆","🍷","🥂","☕","🍰","🧺","🪣","🧻","🪟","🚪","🛋","🪞","🧴","🧼","🫙"] },
  { group:"Transporte",        icons:["🚗","🚌","🛵","✈️","🚂","⛽","🅿️","🛞","🚕","🚙","🛺","⛵","🚲","🛴","🚁","🚢","🗺️","🛣️","🏍️","🚦"] },
  { group:"Salud y bienestar", icons:["💊","🩺","🏋️","🧘","💆","🦷","🩻","🧬","🏥","💉","🩹","🧪","🫀","🧠","👁️","🛁","🌡️","🩼","🩴","💪"] },
  { group:"Ocio y cultura",    icons:["🎬","🎮","📚","🎵","🏖️","🎭","🎲","⚽","🎤","🎨","🎸","🎯","🏄","🎪","🎡","🎢","🏔️","🎾","🎳","🏊","🎹","🎻","🎺","🎷","🎰","🎟️","🏕️","🧩","🎠","🌄"] },
  { group:"Mascotas",          icons:["🐶","🐱","🐾","🦴","🐠","🐰","🐹","🐦","🦜","🐍","🐢","🐇","🦎","🐈","🐕","🐾","🏡","🛁","🪺","🦮"] },
  { group:"Educación",         icons:["📖","✏️","🎓","🏫","📐","📏","🔬","💻","📓","📝","🖊️","📌","📎","🗒️","📊","🖥️","⌨️","🖱️","📡","🔭"] },
  { group:"Ropa y belleza",    icons:["👗","👔","👟","👠","👜","💄","💍","💎","🧴","🪮","💅","🧣","🧤","🎩","🪭","👒","🕶️","⌚","🧢","🥿"] },
  { group:"Finanzas",          icons:["💰","💳","🏦","📈","📉","💵","🪙","💸","🧾","📑","🏧","💹","🤑","💱","📂","🗂️","📋","🔐","🏷️","🎁"] },
  { group:"Servicios del hogar",icons:["⚡","💧","🔥","📶","📺","📱","🖥️","🌐","📮","🗑️","🔑","🪛","🔨","🪚","🧲","💡","🔌","🪤","📡","🛠️"] },
  { group:"Otros",             icons:["⭐","🌟","✨","🎀","🪄","🌈","☀️","🌙","❄️","🌊","🍀","🌸","🌺","🌻","🦋","🐝","🕊️","🌍","🗺️","🎊"] },
];

export const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const inp  = {background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:10,padding:"11px 13px",color:"var(--text)",fontSize:13,width:"100%",fontFamily:"DM Sans,sans-serif",outline:"none"};
export const lbl  = {fontSize:10,color:"var(--g5)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,display:"block",marginBottom:5};

// ── Helpers ────────────────────────────────────────────────────────────────
export function fmtMoney(n){ return "$" + Math.round(n).toLocaleString("es-AR"); }
export function monthKey(dateStr){ return dateStr.slice(0,7); } // "2026-03"
export function localToday(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
export function fmtDay(dateStr){ const [y,m,d] = dateStr.split("-"); return `${d}/${m}/${y}`; }
// Cuotas con fecha futura todavía no se muestran en el historial
export function isVisibleInHistory(e){ return !(e.installments>1 && e.date > localToday()); }
export function monthLabel(key){
  const [y,m] = key.split("-").map(Number);
  return `${MONTHS_ES[m-1]} ${y}`;
}

// ── DB helpers ─────────────────────────────────────────────────────────────
export async function loadExpenses(groupId){
  const { data } = await supabase.from("expenses").select("*").eq("group_id", groupId).order("date", { ascending:false });
  return data || [];
}
export async function loadCustomCats(groupId){
  const { data } = await supabase.from("custom_categories").select("*").eq("group_id", groupId);
  return data || [];
}
export async function loadRecurring(groupId){
  const { data } = await supabase.from("recurring_expenses").select("*").eq("group_id", groupId).order("created_at");
  return data || [];
}
export async function loadBudgets(groupId){
  const { data } = await supabase.from("category_budgets").select("*").eq("group_id", groupId);
  return data || [];
}
export async function loadSettlements(groupId){
  const { data } = await supabase.from("settlements").select("*").eq("group_id", groupId).order("date", { ascending:false });
  return data || [];
}
export async function saveExpense(exp){
  if(exp.id){
    const { error } = await supabase.from("expenses").update(exp).eq("id", exp.id);
    return error;
  }
  const { error } = await supabase.from("expenses").insert(exp);
  return error;
}
export async function deleteExpense(id){
  await supabase.from("expenses").delete().eq("id", id);
}
export async function saveCustomCat(cat){
  const { error } = await supabase.from("custom_categories").insert(cat);
  return error;
}
export async function saveSettlement(s){
  const { error } = await supabase.from("settlements").insert(s);
  return error;
}
export async function loadTags(groupId){
  const { data } = await supabase.from("expense_tags").select("*").eq("group_id", groupId).order("name");
  return data || [];
}
export async function loadTagRelations(groupId){
  // join via expenses to filter by group
  const { data } = await supabase.from("expense_tag_relations").select("expense_id, tag_id");
  return data || [];
}
export async function saveTag(groupId, name){
  const { data } = await supabase.from("expense_tags").insert({ group_id: groupId, name }).select().single();
  return data;
}
export async function saveTagRelations(expenseId, tagIds){
  // delete old relations for this expense
  await supabase.from("expense_tag_relations").delete().eq("expense_id", expenseId);
  if(tagIds.length === 0) return;
  await supabase.from("expense_tag_relations").insert(tagIds.map(tid => ({ expense_id: expenseId, tag_id: tid })));
}

// ── Balance calculator ─────────────────────────────────────────────────────
export function calcBalance(expenses, settlements, members) {
  const paid  = {};
  const share = {};
  members.forEach(m => { paid[m.id] = 0; share[m.id] = 0; });

  const todayMonth = localToday().slice(0, 7); // "2026-05"

  expenses.forEach(exp => {
    // Principio de devengado: incluir si el mes de la cuota ya llegó
    if (exp.date.slice(0, 7) > todayMonth) return;

    // Si no hay nadie en la división, el gasto es del que pagó (no genera deuda)
    const split = exp.split_between?.length ? exp.split_between : [exp.paid_by];
    const perPerson = exp.amount / split.length;
    if (paid[exp.paid_by] !== undefined) paid[exp.paid_by] += exp.amount;
    split.forEach(uid => {
      if (share[uid] !== undefined) share[uid] += perPerson;
    });
  });

  // Apply settlements
  settlements.forEach(s => {
    if (paid[s.from_user] !== undefined) paid[s.from_user] += s.amount;
    if (share[s.to_user]  !== undefined) share[s.to_user]  += s.amount;
  });

  const balance = {};
  members.forEach(m => { balance[m.id] = paid[m.id] - share[m.id]; });
  return balance;
}

export function calcDebts(balance, members) {
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

// ── Historial por categoría (para decidir presupuestos) ──────────────────
export function prevMonthKeys(currentKey, n){
  const [y,m] = currentKey.split("-").map(Number);
  const out = [];
  for(let i=n;i>=1;i--){ const d = new Date(y, m-1-i, 1); out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }
  return out;
}
// Últimos n meses COMPLETOS (sin el actual) desde el primer mes con datos; los meses sin gasto cuentan como 0
export function categoryHistory(expenses, catId, currentKey, n){
  const first = expenses.reduce((mn,e)=> (!mn || e.date<mn) ? e.date : mn, null)?.slice(0,7);
  const keys = prevMonthKeys(currentKey, n).filter(k => !first || k >= first);
  const totals = keys.map(k => ({ key:k, total: expenses.filter(e=>e.category===catId && e.date.slice(0,7)===k).reduce((s,e)=>s+e.amount,0) }));
  const sum = totals.reduce((s,t)=>s+t.total,0);
  const avg = totals.length ? sum/totals.length : 0;
  let max = null, min = null;
  totals.forEach(t => { if(!max || t.total>max.total) max=t; if(!min || t.total<min.total) min=t; });
  return { totals, avg, max, min, months: totals.length };
}
