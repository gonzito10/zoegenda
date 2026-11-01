export const COLORS = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#FFB347","#87CEEB"];

// Each theme: bg color, surface, border, text color, and an SVG pattern for the background
export const THEMES = [
  {
    id:"default", label:"Oscuro", emoji:"🌑",
    bg:"#0f0f13", surface:"#131318", border:"#1e1e2a", text:"#e8e8f0",
    pattern:null
  },
  {
    id:"auto", label:"Automático", emoji:"🌗",
    bg:"#0f0f13", surface:"#131318", border:"#1e1e2a", text:"#e8e8f0",
    pattern:null
  },
  {
    id:"kids", label:"Infantil", emoji:"🎈",
    bg:"#1a0a2e", surface:"#2a1a3e", border:"#3a2a4e", text:"#ffe8ff",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><circle cx='20' cy='20' r='8' fill='%23ff6b9d22'/><circle cx='60' cy='10' r='5' fill='%23ffd93d22'/><circle cx='100' cy='25' r='7' fill='%236bcbff22'/><circle cx='10' cy='60' r='6' fill='%23a8ff7822'/><circle cx='50' cy='55' r='10' fill='%23ff6b9d18'/><circle cx='90' cy='50' r='5' fill='%23ffd93d22'/><circle cx='30' cy='90' r='7' fill='%236bcbff22'/><circle cx='70' cy='85' r='9' fill='%23ff6b9d18'/><circle cx='110' cy='75' r='6' fill='%23a8ff7822'/><text x='15' y='45' font-size='12' opacity='.15'>⭐</text><text x='55' y='100' font-size='10' opacity='.15'>🌙</text><text x='95' y='110' font-size='11' opacity='.12'>✨</text></svg>`
  },
  {
    id:"literary", label:"Literario", emoji:"📚",
    bg:"#1a1510", surface:"#251e16", border:"#35291e", text:"#f0e6d0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><line x1='0' y1='10' x2='80' y2='10' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='20' x2='80' y2='20' stroke='%23c8a96e12' stroke-width='1'/><line x1='0' y1='30' x2='80' y2='30' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='40' x2='80' y2='40' stroke='%23c8a96e12' stroke-width='1'/><line x1='0' y1='50' x2='80' y2='50' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='60' x2='80' y2='60' stroke='%23c8a96e12' stroke-width='1'/><line x1='0' y1='70' x2='80' y2='70' stroke='%23c8a96e18' stroke-width='1'/><line x1='0' y1='80' x2='80' y2='80' stroke='%23c8a96e12' stroke-width='1'/><line x1='20' y1='0' x2='20' y2='80' stroke='%23c8a96e08' stroke-width='1'/></svg>`
  },
  {
    id:"countryside", label:"Campestre", emoji:"🌾",
    bg:"#0f1a08", surface:"#162610", border:"#253d18", text:"#e8f5d0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><path d='M10 80 Q15 60 20 80' stroke='%2378a83a25' stroke-width='2' fill='none'/><path d='M25 75 Q30 50 35 75' stroke='%2378a83a20' stroke-width='2' fill='none'/><path d='M50 85 Q55 55 60 85' stroke='%2378a83a25' stroke-width='2' fill='none'/><path d='M70 78 Q75 58 80 78' stroke='%2378a83a20' stroke-width='2' fill='none'/><path d='M85 82 Q90 65 95 82' stroke='%2378a83a22' stroke-width='2' fill='none'/><circle cx='30' cy='20' r='12' fill='%2378a83a10'/><circle cx='70' cy='30' r='8' fill='%2378a83a10'/><circle cx='15' cy='35' r='6' fill='%2378a83a08'/></svg>`
  },
  {
    id:"ocean", label:"Marino", emoji:"🌊",
    bg:"#050e1a", surface:"#0a1828", border:"#102030", text:"#d0f0ff",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='60'><path d='M0 30 Q25 10 50 30 Q75 50 100 30 Q125 10 150 30 Q175 50 200 30' stroke='%231a6fa830' stroke-width='2' fill='none'/><path d='M0 45 Q25 25 50 45 Q75 65 100 45 Q125 25 150 45 Q175 65 200 45' stroke='%231a6fa820' stroke-width='1.5' fill='none'/><path d='M0 15 Q25 0 50 15 Q75 30 100 15 Q125 0 150 15 Q175 30 200 15' stroke='%231a6fa818' stroke-width='1' fill='none'/></svg>`
  },
  {
    id:"cosmos", label:"Cosmos", emoji:"🔭",
    bg:"#02020f", surface:"#07071a", border:"#0f0f28", text:"#e0e8ff",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><circle cx='15' cy='20' r='1' fill='%23ffffff60'/><circle cx='45' cy='8' r='1.5' fill='%23ffffff40'/><circle cx='80' cy='15' r='1' fill='%23ffffff55'/><circle cx='120' cy='5' r='1' fill='%23ffffff50'/><circle cx='140' cy='25' r='1.5' fill='%23ffffff35'/><circle cx='5' cy='50' r='1' fill='%23ffffff45'/><circle cx='35' cy='45' r='2' fill='%23ffffff30'/><circle cx='65' cy='55' r='1' fill='%23ffffff55'/><circle cx='100' cy='40' r='1.5' fill='%23ffffff40'/><circle cx='130' cy='60' r='1' fill='%23ffffff50'/><circle cx='20' cy='80' r='1' fill='%23ffffff45'/><circle cx='55' cy='85' r='1.5' fill='%23ffffff35'/><circle cx='90' cy='75' r='1' fill='%23ffffff55'/><circle cx='125' cy='90' r='2' fill='%23ffffff30'/><circle cx='145' cy='80' r='1' fill='%23ffffff45'/><circle cx='10' cy='110' r='1.5' fill='%23ffffff40'/><circle cx='40' cy='120' r='1' fill='%23ffffff50'/><circle cx='75' cy='105' r='1' fill='%23ffffff45'/><circle cx='110' cy='115' r='1.5' fill='%23ffffff35'/><circle cx='140' cy='125' r='1' fill='%23ffffff55'/><circle cx='25' cy='140' r='1' fill='%23ffffff40'/><circle cx='60' cy='145' r='2' fill='%23ffffff30'/><circle cx='95' cy='135' r='1' fill='%23ffffff50'/><circle cx='130' cy='148' r='1.5' fill='%23ffffff40'/></svg>`
  },
  {
    id:"nordic", label:"Nórdico", emoji:"🌨️",
    bg:"#0d1520", surface:"#152030", border:"#1e3040", text:"#dce8f5",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><line x1='40' y1='5' x2='40' y2='35' stroke='%23a0c8f025' stroke-width='1'/><line x1='25' y1='12' x2='55' y2='28' stroke='%23a0c8f025' stroke-width='1'/><line x1='25' y1='28' x2='55' y2='12' stroke='%23a0c8f025' stroke-width='1'/><circle cx='40' cy='20' r='3' fill='%23a0c8f030'/><line x1='0' y1='60' x2='30' y2='60' stroke='%23a0c8f015' stroke-width='1'/><line x1='5' y1='50' x2='25' y2='70' stroke='%23a0c8f015' stroke-width='1'/><line x1='5' y1='70' x2='25' y2='50' stroke='%23a0c8f015' stroke-width='1'/><circle cx='15' cy='60' r='2' fill='%23a0c8f020'/><line x1='55' y1='55' x2='75' y2='55' stroke='%23a0c8f018' stroke-width='1'/><circle cx='65' cy='55' r='2' fill='%23a0c8f022'/></svg>`
  },
  {
    id:"retro", label:"Retro", emoji:"📺",
    bg:"#1a1208", surface:"#251c10", border:"#3a2c18", text:"#f5e8c0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect x='5' y='5' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a18' stroke-width='1'/><rect x='35' y='5' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a12' stroke-width='1'/><rect x='5' y='35' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a12' stroke-width='1'/><rect x='35' y='35' width='20' height='20' rx='2' fill='none' stroke='%23d4a83a18' stroke-width='1'/><circle cx='15' cy='15' r='4' fill='%23d4a83a10'/><circle cx='45' cy='45' r='4' fill='%23d4a83a10'/></svg>`
  },
  {
    id:"zen", label:"Zen", emoji:"🍃",
    bg:"#0f1510", surface:"#181e18", border:"#252e25", text:"#e0ead8",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><circle cx='60' cy='60' r='40' fill='none' stroke='%2388aa6615' stroke-width='1'/><circle cx='60' cy='60' r='25' fill='none' stroke='%2388aa6612' stroke-width='1'/><circle cx='60' cy='60' r='10' fill='none' stroke='%2388aa6618' stroke-width='1'/><line x1='20' y1='60' x2='100' y2='60' stroke='%2388aa6610' stroke-width='1'/><line x1='60' y1='20' x2='60' y2='100' stroke='%2388aa6610' stroke-width='1'/></svg>`
  },
  {
    id:"urban", label:"Urbano", emoji:"🏙️",
    bg:"#0a0a0a", surface:"#141414", border:"#222222", text:"#e0e0e0",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='120'><rect x='5' y='40' width='15' height='80' fill='none' stroke='%23ffffff08' stroke-width='1'/><rect x='25' y='20' width='15' height='100' fill='none' stroke='%23ffffff08' stroke-width='1'/><rect x='45' y='50' width='10' height='70' fill='none' stroke='%23ffffff06' stroke-width='1'/><rect x='60' y='30' width='18' height='90' fill='none' stroke='%23ffffff08' stroke-width='1'/><rect x='8' y='55' width='3' height='3' fill='%23ffffff10'/><rect x='28' y='35' width='3' height='3' fill='%23ffffff10'/><rect x='28' y='45' width='3' height='3' fill='%23ffffff08'/><rect x='63' y='45' width='3' height='3' fill='%23ffffff10'/><rect x='63' y='55' width='3' height='3' fill='%23ffffff08'/></svg>`
  },
  {
    id:"pastel", label:"Pastel", emoji:"🎨", light:true,
    bg:"#f8f0f8", surface:"#ffffff", border:"#e8d8e8", text:"#3a2a3a",
    pattern:`<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><circle cx='20' cy='20' r='15' fill='%23ffb3c615'/><circle cx='60' cy='15' r='10' fill='%23b3d4ff15'/><circle cx='90' cy='30' r='12' fill='%23b3ffcc15'/><circle cx='10' cy='60' r='8' fill='%23ffd9b315'/><circle cx='50' cy='55' r='18' fill='%23e8b3ff12'/><circle cx='85' cy='65' r='10' fill='%23ffb3c612'/><circle cx='30' cy='85' r='12' fill='%23b3d4ff12'/><circle cx='70' cy='88' r='8' fill='%23b3ffcc15'/></svg>`
  },
  {
    id:"light", label:"Claro", emoji:"☀️", light:true,
    bg:"#f5f5f0", surface:"#ffffff", border:"#e0e0d8", text:"#1a1a1a",
    pattern:null
  },
];
// Grises de texto con contraste suficiente (≥4,5:1) y colores de estado: --ok (bien), --warn (deuda / cerca del límite), --danger (superado)
export const DARK_VARS = {"--bg":"#0f0f13","--card":"#131318","--card2":"#1a1a22","--border":"#1e1e2a","--border2":"#2a2a3a","--border3":"#3a3a4a","--text":"#e8e8f0","--title":"#ffffff","--bar":"#0a0a0e","--g3":"#333","--g4":"#80808c","--g5":"#8e8e9a","--g6":"#9c9ca8","--g8":"#b0b0bb","--ga":"#c6c6d0","--ok":"#5CCB8B","--warn":"#F2B84B","--danger":"#F0605A"};
export const LIGHT_VARS = {"--bg":"#f5f5f0","--card":"#ffffff","--card2":"#f0f0ea","--border":"#e0e0d8","--border2":"#cfcfc6","--border3":"#bdbdb3","--text":"#1a1a1a","--title":"#111111","--bar":"#ebebe4","--g3":"#c4c4bb","--g4":"#6e6e66","--g5":"#66665e","--g6":"#5e5e56","--g8":"#4e4e47","--ga":"#3e3e39","--ok":"#1F7A4A","--warn":"#9A5B00","--danger":"#C0392B"};
export function resolveTheme(id, systemLight){
  if(id==="auto") return THEMES.find(t=>t.id===(systemLight?"light":"default"));
  return THEMES.find(t=>t.id===id) || THEMES[0];
}
export function themeVars(t){
  return {...(t.light?LIGHT_VARS:DARK_VARS),"--bg":t.bg,"--card":t.surface,"--border":t.border,"--text":t.text};
}
export function storedTheme(){ try{ return localStorage.getItem("zg_theme"); }catch(e){ return null; } }
export function getTheme(id){ return THEMES.find(t=>t.id===id) || THEMES[0]; }
export function themeBgStyle(t){
  if(!t.pattern) return {background:t.bg};
  const svg = `url("data:image/svg+xml,${t.pattern}")`;
  return {background:t.bg, backgroundImage:svg, backgroundRepeat:"repeat"};
}
export const CATEGORIES = [
  { id:"work",     label:"Trabajo",    color:"#FF6B6B", icon:"💼" },
  { id:"personal", label:"Personal",   color:"#4ECDC4", icon:"🙂" },
  { id:"social",   label:"Social",     color:"#FFEAA7", icon:"🎉" },
  { id:"health",   label:"Salud",      color:"#96CEB4", icon:"🩺" },
  { id:"birthday", label:"Cumpleaños", color:"#FFB347", icon:"🎂" },
  { id:"other",    label:"Otro",       color:"#DDA0DD", icon:"📌" },
];
export const DAYS_ES   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
export const DAYS_FULL = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
export const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
