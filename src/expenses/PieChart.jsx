export default function PieChart({ cats, total }) {
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
          fill={c.color} stroke="var(--bg)" strokeWidth={2}/>
      ))}
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
