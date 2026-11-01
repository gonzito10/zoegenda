import { inp, monthLabel } from "./helpers";

export default function MonthSelect({ ctx, value, onChange, includeAll }) {
  const { availableMonths, currentMonthKey } = ctx;
  return (
    <div style={{marginBottom:14,position:"relative"}}>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{...inp, paddingRight:36, appearance:"none", WebkitAppearance:"none", cursor:"pointer"}}>
        {includeAll && <option value="all">📅 Anual</option>}
        {availableMonths.length === 0
          ? <option value={currentMonthKey}>{monthLabel(currentMonthKey)}</option>
          : availableMonths.map(k=><option key={k} value={k}>{monthLabel(k)}</option>)
        }
      </select>
      <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"var(--g5)"}}>▾</div>
    </div>
  );
}
