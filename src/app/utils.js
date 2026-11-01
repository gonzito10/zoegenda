
// ── Utils ──────────────────────────────────────────────────────────────────
export function getDaysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
export function getFirstDay(y,m)   { return new Date(y,m,1).getDay(); }
export function fmt(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
export function parse(s){ const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); }
export function initials(n){ return n.trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2); }
export function randomCode(){ return Math.random().toString(36).substring(2,8).toUpperCase(); }

export function expandRecurring(ev, rangeStart, rangeEnd) {
  if (!ev.recurring) return [];
  const rStart = parse(rangeStart), rEnd = parse(rangeEnd);
  const origin = parse(ev.date);
  const exceptions = ev.exceptions || [];
  const instances = [];

  // Yearly (birthdays)
  if (ev.recurringYearly) {
    let year = rStart.getFullYear();
    while (year <= rEnd.getFullYear() + 1) {
      const d = new Date(year, origin.getMonth(), origin.getDate());
      const ds = fmt(d);
      if (d >= rStart && d <= rEnd && !exceptions.includes(ds))
        instances.push({...ev, id:`${ev.id}_${ds}`, date:ds, _recurringBase:ev.id, _virtual:true});
      year++;
    }
    return instances;
  }

  // Weekly
  const endDate = ev.recurringEnd ? parse(ev.recurringEnd) : new Date(rEnd.getFullYear()+2,0,1);
  (ev.recurringDays||[]).forEach(dow => {
    let d = new Date(origin);
    d.setDate(d.getDate() + (dow - d.getDay() + 7) % 7);
    while (d <= endDate && d <= rEnd) {
      const ds = fmt(d);
      if (d >= rStart && !exceptions.includes(ds))
        instances.push({...ev, id:`${ev.id}_${ds}`, date:ds, _recurringBase:ev.id, _virtual:true});
      d = new Date(d); d.setDate(d.getDate()+7);
    }
  });
  return instances;
}

// ── Supabase DB helpers ────────────────────────────────────────────────────
// Tables:
//   profiles      (id uuid PK refs auth.users, display_name, color, avatar)
//   groups        (id uuid PK, name, code text unique, created_by uuid)
//   group_members (group_id uuid, user_id uuid, PRIMARY KEY(group_id,user_id))
//   events        (id uuid PK, group_id uuid, data jsonb)

// Franja de color según quién asiste: un color si va una persona, tramos iguales si van varias.
export function personStripe(ids, member, fallback){
  const cols = (ids||[]).map(id => member(id).color).filter(Boolean);
  if(!cols.length) return fallback;
  if(cols.length===1) return cols[0];
  const step = 100/cols.length;
  return `linear-gradient(to bottom, ${cols.map((c,i)=>`${c} ${i*step}% ${(i+1)*step}%`).join(", ")})`;
}
