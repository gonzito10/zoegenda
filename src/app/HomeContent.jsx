import Icon from "./Icon";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { DAYS_FULL, MONTHS_ES } from "./constants";
import { fmt, personStripe } from "./utils";
import { DEFAULT_CATS, fmtMoney, localToday, loadExpenses, loadCustomCats, loadSettlements, loadBudgets, calcBalance, calcDebts } from "../expenses/helpers";

// Pantalla de inicio: resumen del día + las 4 secciones con su dato en vivo.
export default function HomeContent({ ctx }) {
  const { activeGroup, cat, eventsForDate, groupMembers, member, profile, setMainTab } = ctx;
  const groupId = activeGroup?.id;
  const [sum, setSum] = useState(null); // null = todavía cargando

  useEffect(() => {
    if (!groupId) return;
    let alive = true;
    (async () => {
      const [exps, customCats, setts, buds, listsRes, notesRes] = await Promise.all([
        loadExpenses(groupId), loadCustomCats(groupId), loadSettlements(groupId), loadBudgets(groupId),
        supabase.from("lists").select("id,type").eq("group_id", groupId),
        supabase.from("notes").select("id,pinned").eq("group_id", groupId),
      ]);
      // Deudas: mismo cálculo que la pestaña Balance (acumulado, cuotas por devengado)
      const debts = calcDebts(calcBalance(exps, setts, groupMembers), groupMembers);
      // Presupuestos del mes: el que más se acerca (o se pasa)
      const mk = localToday().slice(0, 7);
      const spend = {};
      exps.forEach(e => { if (e.date.slice(0, 7) === mk) spend[e.category] = (spend[e.category] || 0) + e.amount; });
      const allCats = [...DEFAULT_CATS, ...customCats];
      const top = buds
        .map(b => ({ ...b, pct: (spend[b.category] || 0) / b.amount * 100 }))
        .filter(b => b.pct >= 80)
        .sort((a, b) => b.pct - a.pct)[0];
      const alert = top ? { label: allCats.find(c => c.id === top.category)?.label || top.category, pct: top.pct } : null;
      // Listados: elementos pendientes (a comprar / a completar)
      const lists = listsRes.data || [];
      let toBuy = 0, tasks = 0;
      if (lists.length) {
        const { data: items } = await supabase.from("list_items").select("id,list_id").in("list_id", lists.map(l => l.id)).eq("selected", true).eq("checked", false);
        const typeOf = Object.fromEntries(lists.map(l => [l.id, l.type]));
        (items || []).forEach(it => { if (typeOf[it.list_id] === "tasks") tasks++; else toBuy++; });
      }
      const notes = notesRes.data || [];
      if (alive) setSum({ debts, alert, toBuy, tasks, notes: notes.length, pinned: notes.filter(n => n.pinned).length });
    })();
    return () => { alive = false; };
  }, [groupId, groupMembers]);

  // Agenda: eventos de hoy y de los próximos 7 días
  const now = new Date();
  const todayEvents = eventsForDate(fmt(now));
  let weekCount = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(now); d.setDate(d.getDate() + i); weekCount += eventsForDate(fmt(d)).length; }
  const dateLabel = `${DAYS_FULL[now.getDay()]} ${now.getDate()} de ${MONTHS_ES[now.getMonth()].toLowerCase()}`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  const debt = sum?.debts?.[0];
  const debtTotal = sum ? sum.debts.reduce((s, d) => s + d.amount, 0) : 0;
  const alertColor = sum?.alert?.pct >= 100 ? "var(--danger)" : "var(--warn)";

  const cards = [
    ["agenda", "calendar", "Agenda", plural(weekCount, "evento", "eventos"), "próximos 7 días", "#FF6B6B", "var(--text)"],
    ["expenses", "wallet", "Gastos", !sum ? "…" : debt ? fmtMoney(debtTotal) : "Al día", !sum ? "" : debt ? `${member(debt.from).display_name} le debe a ${member(debt.to).display_name}${sum.debts.length > 1 ? " y más" : ""}` : "sin deudas pendientes", "#96CEB4", debt ? "var(--warn)" : "var(--ok)"],
    ["lists", "list", "Listados", !sum ? "…" : `${sum.toBuy} para comprar`, !sum ? "" : plural(sum.tasks, "tarea pendiente", "tareas pendientes"), "#FFB347", "var(--text)"],
    ["notes", "note", "Notas", !sum ? "…" : plural(sum.notes, "nota", "notas"), !sum ? "" : plural(sum.pinned, "fijada", "fijadas"), "#DDA0DD", "var(--text)"],
  ];

  return (
    <div style={{flex:1,overflowY:"auto",padding:"20px 16px 28px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{width:"100%",maxWidth:560,display:"flex",flexDirection:"column",gap:16}}>

        <div>
          <div style={{fontFamily:"Fraunces,serif",fontSize:26,fontWeight:600,color:"var(--title)"}}>Hola{profile?.display_name ? `, ${profile.display_name}` : ""}</div>
          <div style={{fontSize:13,fontWeight:600,letterSpacing:1,textTransform:"uppercase",color:"var(--g6)",marginTop:4}}>{dateLabel}</div>
        </div>

        {/* Hoy */}
        <section style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:"16px 16px 6px"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:8}}>
            <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,fontWeight:600,color:"var(--title)"}}>Hoy</h2>
            <span style={{fontSize:13,color:"var(--g6)"}}>{todayEvents.length === 0 ? "sin eventos" : plural(todayEvents.length, "evento", "eventos")}</span>
          </div>
          {todayEvents.length === 0 && <div style={{fontSize:15,color:"var(--g8)",padding:"6px 0 14px"}}>No hay nada en la agenda para hoy.</div>}
          {todayEvents.slice(0, 3).map(ev => (
            <button key={ev.id} onClick={() => setMainTab("agenda")}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,minHeight:56,background:"transparent",border:"none",borderTop:"1px solid var(--border)",color:"var(--text)",textAlign:"left",cursor:"pointer",padding:0}}>
              <span style={{width:48,fontSize:15,fontWeight:600,color:"var(--title)",fontVariantNumeric:"tabular-nums"}}>{ev.time || "—"}</span>
              <span style={{width:4,height:30,borderRadius:2,background:personStripe(ev.attendees, member, cat(ev.category).color),flexShrink:0}}/>
              <span style={{display:"flex",flexDirection:"column",minWidth:0}}>
                <span style={{fontSize:15,fontWeight:600,color:"var(--title)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</span>
                {ev.attendees?.length > 0 && <span style={{fontSize:13,color:"var(--g6)"}}>{ev.attendees.map(id => member(id).display_name).join(" y ")}</span>}
              </span>
            </button>
          ))}
          {todayEvents.length > 3 && <div style={{fontSize:13,color:"var(--g6)",padding:"8px 0 12px",borderTop:"1px solid var(--border)"}}>y {todayEvents.length - 3} más</div>}
        </section>

        {/* Alerta de presupuesto */}
        {sum?.alert && (
          <button onClick={() => setMainTab("expenses")}
            style={{display:"flex",alignItems:"center",gap:12,minHeight:60,padding:"10px 14px",borderRadius:16,textAlign:"left",cursor:"pointer",color:"var(--text)",background:`color-mix(in srgb, ${alertColor} 12%, transparent)`,border:`1px solid color-mix(in srgb, ${alertColor} 45%, transparent)`}}>
            <span style={{display:"flex",color:alertColor}}><Icon name={sum.alert.pct >= 100 ? "alertCircle" : "alert"} size={24}/></span>
            <span style={{display:"flex",flexDirection:"column",flex:1,minWidth:0}}>
              <span style={{fontSize:15,fontWeight:600,color:"var(--title)"}}>{sum.alert.pct >= 100 ? `${sum.alert.label}: superaste el límite` : `${sum.alert.label} al ${Math.round(sum.alert.pct)}%`}</span>
              <span style={{fontSize:13,color:"var(--g8)"}}>del presupuesto de {MONTHS_ES[now.getMonth()].toLowerCase()}</span>
            </span>
            <span style={{color:"var(--g6)",display:"flex"}}><Icon name="chevronRight" size={20}/></span>
          </button>
        )}

        <h2 style={{fontFamily:"Fraunces,serif",fontSize:22,fontWeight:600,color:"var(--title)",margin:"4px 0 -4px"}}>Secciones</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {cards.map(([v, icon, title, datum, sub, color, datumColor]) => (
            <button key={v} onClick={() => setMainTab(v)}
              style={{minHeight:172,borderRadius:20,border:`1px solid ${color}44`,background:`linear-gradient(145deg, ${color}22, var(--card) 70%)`,color:"var(--text)",cursor:"pointer",display:"flex",flexDirection:"column",gap:12,padding:16,textAlign:"left"}}>
              <span style={{width:44,height:44,borderRadius:14,background:`${color}33`,display:"flex",alignItems:"center",justifyContent:"center",color:`color-mix(in srgb, ${color} 70%, var(--title))`}}><Icon name={icon} size={24}/></span>
              <span style={{marginTop:"auto",display:"flex",flexDirection:"column",gap:2}}>
                <span style={{fontFamily:"Fraunces,serif",fontSize:20,fontWeight:600,color:"var(--title)"}}>{title}</span>
                <span style={{fontSize:15,fontWeight:600,color:datumColor}}>{datum}</span>
                <span style={{fontSize:13,color:"var(--g6)",lineHeight:1.3,minHeight:17}}>{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
