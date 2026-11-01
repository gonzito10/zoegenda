import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";
import { DEFAULT_CATS, fmtMoney, monthKey, localToday, isVisibleInHistory, loadExpenses, loadCustomCats, loadRecurring, loadBudgets, loadSettlements, saveSettlement, loadTags, loadTagRelations, calcBalance, calcDebts } from "./helpers";
import BalanceTab from "./BalanceTab";
import HistoryTab from "./HistoryTab";
import StatsTab from "./StatsTab";
import RecurringTab from "./RecurringTab";
import BudgetTab from "./BudgetTab";
import ExpenseModal from "./ExpenseModal";

export default function Expenses({ groupId, members, currentUserId }) {
  const [expenses,     setExpenses]     = useState([]);
  const [customCats,   setCustomCats]   = useState([]);
  const [settlements,  setSettlements]  = useState([]);
  const [tags,         setTags]         = useState([]);
  const [tagRelations, setTagRelations] = useState([]); // [{expense_id, tag_id}]
  const [recurring,    setRecurring]    = useState([]);
  const [budgets,      setBudgets]      = useState([]);
  const [subTab,       setSubTab]       = useState("balance");
  const [selMonth,     setSelMonth]     = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [editExp,     setEditExp]     = useState(null);
  const [loading,     setLoading]     = useState(true);

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

  // Navegación desde el buscador general
  useEffect(() => {
    const apply = d => { if (d?.type === "expense" && d.date) { window.__zgNav = null; setSubTab("history"); setSelMonth(d.date.slice(0,7)); } };
    apply(window.__zgNav);
    const h = ev => apply(ev.detail);
    document.addEventListener("zgNavigate", h);
    return () => document.removeEventListener("zgNavigate", h);
  }, []);

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
    Promise.all([loadExpenses(groupId), loadCustomCats(groupId), loadSettlements(groupId), loadTags(groupId), loadTagRelations(groupId), loadRecurring(groupId), loadBudgets(groupId)])
      .then(([exps, cats, setts, tgs, rels, recs, buds]) => {
        setBudgets(buds);
        setRecurring(recs);
        setExpenses(exps);
        setCustomCats(cats);
        setSettlements(setts);
        setTags(tgs);
        setTagRelations(rels);
        setLoading(false);
        // Ponerse al día con los gastos recurrentes (también corre solo cada noche)
        supabase.rpc("generate_recurring_expenses").then(({ data }) => {
          if (data > 0) Promise.all([loadExpenses(groupId), loadTagRelations(groupId)]).then(([e2, r2]) => { setExpenses(e2); setTagRelations(r2); });
        });
      });

    // Realtime
    const sub = supabase.channel(`expenses-${groupId}`)
      .on("postgres_changes", { event:"*", schema:"public", table:"expenses",    filter:`group_id=eq.${groupId}` }, () => loadExpenses(groupId).then(setExpenses))
      .on("postgres_changes", { event:"*", schema:"public", table:"settlements", filter:`group_id=eq.${groupId}` }, () => loadSettlements(groupId).then(setSettlements))
      .on("postgres_changes", { event:"*", schema:"public", table:"category_budgets", filter:`group_id=eq.${groupId}` }, () => loadBudgets(groupId).then(setBudgets))
      .on("postgres_changes", { event:"*", schema:"public", table:"recurring_expenses", filter:`group_id=eq.${groupId}` }, () => loadRecurring(groupId).then(setRecurring))
      .on("postgres_changes", { event:"*", schema:"public", table:"expense_tags", filter:`group_id=eq.${groupId}` }, () => loadTags(groupId).then(setTags))
      .on("postgres_changes", { event:"*", schema:"public", table:"expense_tag_relations" }, () => loadTagRelations(groupId).then(setTagRelations))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [groupId]);

  // Available months from expenses
  const availableMonths = useMemo(() => {
    const keys = [...new Set(expenses.filter(isVisibleInHistory).map(e => monthKey(e.date)))].sort().reverse();
    return keys;
  }, [expenses]);

  const activeMonth = selMonth || currentMonthKey;

  // All cats (default + custom)
  const allCats = useMemo(() => [
    ...DEFAULT_CATS,
    ...customCats.map(c => ({ id:c.id, label:c.label, icon:c.icon, color:c.color }))
  ], [customCats]);

  // Gasto del mes actual por categoría + estado de presupuesto
  const monthSpend = useMemo(() => {
    const m = {};
    expenses.forEach(e => { if (e.date.slice(0,7) === currentMonthKey) m[e.category] = (m[e.category]||0) + e.amount; });
    return m;
  }, [expenses, currentMonthKey]);
  const budgetRows = useMemo(() => budgets.map(b => {
    const spent = monthSpend[b.category] || 0;
    return { ...b, spent, pct: spent / b.amount * 100 };
  }).sort((a,b) => b.pct - a.pct), [budgets, monthSpend]);
  const budgetColor = pct => pct >= 100 ? "#FF6B6B" : pct >= 80 ? "#FFB347" : "#96CEB4";

  function getCat(id){ return allCats.find(c=>c.id===id) || { label:id, icon:"📌", color:"var(--g8)" }; }
  function getMember(id){ return members.find(m=>m.id===id) || { display_name:"?", color:"var(--g8)", avatar:"?" }; }

  // Filtered expenses for active month
  const monthExpenses = useMemo(() => expenses.filter(e => monthKey(e.date) === activeMonth), [expenses, activeMonth]);
  const monthTotal    = useMemo(() => monthExpenses.reduce((s,e)=>s+e.amount,0), [monthExpenses]);

  // Balance siempre acumulado histórico total (solo cuotas devengadas)
  const balance = useMemo(() => calcBalance(expenses, settlements, members), [expenses, settlements, members]);
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
    const from = getMember(debt.from), to = getMember(debt.to);
    if(!window.confirm(`¿Registrar que ${from.display_name} le pagó ${fmtMoney(debt.amount)} a ${to.display_name}? El balance quedará en cero.`)) return;
    await saveSettlement({
      group_id: groupId,
      from_user: debt.from,
      to_user: debt.to,
      amount: debt.amount,
      date: localToday(),
    });
    const setts = await loadSettlements(groupId);
    setSettlements(setts);
  }
  async function handleDeleteSettlement(st){
    const from = getMember(st.from_user), to = getMember(st.to_user);
    if(!window.confirm(`¿Eliminar el pago de ${fmtMoney(st.amount)} de ${from.display_name} a ${to.display_name}? La deuda volverá a aparecer.`)) return;
    await supabase.from("settlements").delete().eq("id", st.id);
    setSettlements(await loadSettlements(groupId));
  }

  // ── Month selector ─────────────────────────────────────────────────────

  // ── Balance tab ────────────────────────────────────────────────────────

  // ── History tab ────────────────────────────────────────────────────────

  // Stats by tag (for tag pie charts)
  const statsByTag = useMemo(() => {
    if(tags.length === 0) return [];
    return tags.map(tag => {
      const tagExpenseIds = new Set(tagRelations.filter(r=>r.tag_id===tag.id).map(r=>r.expense_id));
      const tagExps = expenses.filter(e => tagExpenseIds.has(e.id));
      if(tagExps.length === 0) return null;
      // group by category within this tag
      const map = {};
      tagExps.forEach(e => {
        const c = getCat(e.category);
        if(!map[e.category]) map[e.category] = { ...c, amount:0 };
        map[e.category].amount += e.amount;
      });
      const cats = Object.values(map).sort((a,b)=>b.amount-a.amount);
      const total = tagExps.reduce((s,e)=>s+e.amount,0);
      return { tag, cats, total };
    }).filter(Boolean);
  // eslint-disable-next-line
  }, [tags, tagRelations, expenses, allCats]);

  // ── Stats tab ──────────────────────────────────────────────────────────

  // ── Recurrentes ───────────────────────────────────────────────────────

  // ── Presupuesto ───────────────────────────────────────────────────────

  // ── Expense Modal ──────────────────────────────────────────────────────

  const ctx = { activeMonth, allCats, annualStats, annualTotal, availableMonths, balance, budgetColor, budgetRows, budgets, currentMonthKey, customCats, debts, editExp, expenses, getCat, getMember, handleDeleteSettlement, handleSettle, loading, monthExpenses, monthSpend, monthTotal, recurring, selMonth, setBudgets, setCustomCats, setEditExp, setExpenses, setLoading, setRecurring, setSelMonth, setSettlements, setShowModal, setSubTab, setTagRelations, setTags, settlements, showModal, statsByCat, statsByTag, subTab, tagRelations, tags, today, groupId, members, currentUserId };
  // ── Render ─────────────────────────────────────────────────────────────
  if(loading) return <div style={{textAlign:"center",color:"var(--g5)",padding:"50px 0"}}>Cargando gastos...</div>;

  return (
    <div style={{paddingBottom:80}}>
      {/* Sub tabs */}
      <div style={{display:"flex",gap:4,marginBottom:14}}>
        {[["balance","⚖️ Balance"],["history","📋 Historial"],["stats","📊 Estadísticas"],["recurring","🔁 Recurrentes"],["budget","🎯 Presupuesto"]].map(([v,l])=>(
          <button key={v} onClick={()=>setSubTab(v)}
            style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:600,border:`1px solid ${subTab===v?"var(--border2)":"transparent"}`,background:subTab===v?"var(--border)":"transparent",color:subTab===v?"var(--title)":"var(--g5)",cursor:"pointer"}}>
            {l}
          </button>
        ))}
      </div>

      {subTab==="balance" && <BalanceTab ctx={ctx}/>}
      {subTab==="history" && <HistoryTab ctx={ctx}/>}
      {subTab==="stats"   && <StatsTab ctx={ctx}/>}
      {subTab==="recurring" && <RecurringTab ctx={ctx}/>}
      {subTab==="budget" && <BudgetTab ctx={ctx}/>}

      {showModal && <ExpenseModal ctx={ctx}/>}
    </div>
  );
}

