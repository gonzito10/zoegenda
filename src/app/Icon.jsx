// Íconos de línea (mismo trazo en toda la app). Toman el color del texto (currentColor).
// Los íconos que eligen las personas para categorías y listados siguen siendo emojis.
const PATHS = {
  home: <><path d="M4 11l8-6.5 8 6.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="3.5" y="8" width="17" height="11.5" rx="3"/><circle cx="16.5" cy="13.75" r="1"/></>,
  list: <><path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M3.5 6.5l1.2 1.2 2.2-2.4M3.5 12l1.2 1.2 2.2-2.4M3.5 17.5l1.2 1.2 2.2-2.4"/></>,
  note: <><rect x="4.5" y="3.5" width="15" height="17" rx="3"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4"/></>,
  search: <><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></>,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  chevronLeft: <path d="M14.5 5.5L8 12l6.5 6.5"/>,
  chevronRight: <path d="M9.5 5.5L16 12l-6.5 6.5"/>,
  alert: <><path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.2v.1"/></>,
  alertCircle: <><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4.5M12 15.7v.1"/></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5"/>,
  checkCircle: <><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.5 2.5 4.5-5"/></>,
  trash: <path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7M10 11v5M14 11v5"/>,
  edit: <><path d="M4.5 19.5l1-4L16 5a2 2 0 0 1 3 3L8.5 18.5z"/><path d="M14.5 6.5l3 3"/></>,
  pin: <><path d="M9 4h6l-1 5 3 3v1.5H7V12l3-3z"/><path d="M12 13.5V20"/></>,
  chart: <><path d="M4 19.5V5M4 19.5h16"/><path d="M8 15l3.5-4 3 2.5L19 8"/></>,
  target: <><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></>,
  repeat: <><path d="M5 11V9.5A3.5 3.5 0 0 1 8.5 6H19M16 3l3 3-3 3"/><path d="M19 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5M8 21l-3-3 3-3"/></>,
  card: <><rect x="3" y="6" width="18" height="12.5" rx="3"/><path d="M3 10.5h18M7 15h3"/></>,
  tag: <><path d="M3.5 12.2V5.5a2 2 0 0 1 2-2h6.7l8.3 8.3a2 2 0 0 1 0 2.8l-6 6a2 2 0 0 1-2.8 0z"/><circle cx="8" cy="8" r="1.2"/></>,
  palette: <><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.5-2-.6-1.3.2-2.5 1.6-2.5H17a3.5 3.5 0 0 0 3.5-3.5C20.5 7 16.8 3.5 12 3.5z"/><circle cx="8" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/></>,
  pause: <path d="M9 5.5v13M15 5.5v13"/>,
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4"/>,
  chevronDown: <path d="M5.5 9.5L12 16l6.5-6.5"/>,
  chevronUp: <path d="M5.5 14.5L12 8l6.5 6.5"/>,
  play: <path d="M8 5.5v13l10-6.5z"/>,
};

export default function Icon({ name, size = 18, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{flexShrink:0,verticalAlign:"-0.2em",...style}}>
      {PATHS[name]}
    </svg>
  );
}
