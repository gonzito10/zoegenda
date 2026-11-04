import Icon from "./Icon";
import { isStandalone, isIOS } from "../push.js";
import { THEMES, getTheme, themeBgStyle } from "./constants";

const sectionTitle = { fontSize: 12, color: "var(--g5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 };

export default function ProfilePanel({ ctx }) {
  const { T, activeGroup, authUser, groupMembers, profile, pushBusy, pushMsg, pushState, saveTheme, setScreen, setShowGroupPanel, setShowSettings, showGroupPanel, showSettings, signOut, themeId, togglePush } = ctx;

  const closeMenu = () => setShowGroupPanel(false);
  const row = { display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 44, padding: "8px 14px", background: "transparent", border: "none", color: "var(--text)", fontSize: 14, textAlign: "left", cursor: "pointer" };

  return (
    <>
      {/* Menú chico del perfil */}
      {showGroupPanel && (
        <>
          <div onClick={closeMenu} style={{ position: "fixed", inset: 0, zIndex: 59 }} />
          <div className="panel-anim" role="menu" style={{ position: "fixed", top: 60, right: 12, zIndex: 60, width: 232, background: "var(--card)", border: "1px solid var(--border2)", borderRadius: 16, boxShadow: "0 8px 24px #0006", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--title)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.display_name}</div>
              <div style={{ fontSize: 12, color: "var(--g5)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{authUser?.email}</div>
            </div>
            <div style={{ padding: "4px 0" }}>
              <button role="menuitem" onClick={() => { closeMenu(); setShowSettings(true); }} style={row}>
                <Icon name="settings" size={18} style={{ color: "var(--g6)" }} />
                <span>Configuración</span>
              </button>
              <button role="menuitem" onClick={() => { closeMenu(); setScreen("groups"); }} style={row}>
                <Icon name="swap" size={18} style={{ color: "var(--g6)" }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block" }}>Cambiar agenda</span>
                  {activeGroup?.name && <span style={{ display: "block", fontSize: 12, color: "var(--g5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeGroup.name}</span>}
                </span>
              </button>
            </div>
            <div style={{ padding: "4px 0", borderTop: "1px solid var(--border)" }}>
              <button role="menuitem" onClick={() => { closeMenu(); signOut(); }} style={{ ...row, color: "var(--coral)" }}>
                <Icon name="logout" size={18} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Configuración: tema y avisos */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)} style={{ position: "fixed", inset: 0, background: "#000000d0", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ background: "var(--card)", borderRadius: 16, padding: 20, maxWidth: 380, width: "100%", maxHeight: "85vh", overflowY: "auto", border: "1px solid var(--border2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "Fraunces,serif", fontSize: 18, fontWeight: 600, color: "var(--title)" }}>Configuración</h3>
              <button onClick={() => setShowSettings(false)} aria-label="Cerrar" style={{ background: "transparent", border: "none", color: "var(--g6)", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Tema */}
            <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
              <div style={sectionTitle}><Icon name="palette" size={14} /> Tema</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {THEMES.map(t => {
                  const active = themeId === t.id;
                  return (
                    <div key={t.id} onClick={() => saveTheme(t.id)} title={t.label}
                      style={{ width: 48, height: 48, borderRadius: 10, cursor: "pointer", border: active ? "2px solid #FF6B6B" : "2px solid transparent", boxShadow: active ? "0 0 0 2px #FF6B6B44" : "none", flexShrink: 0, position: "relative", overflow: "hidden", ...themeBgStyle(t), display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 18, filter: "drop-shadow(0 1px 2px #0008)" }}>{t.emoji}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: "var(--g8)", marginTop: 8 }}>Tema actual: <span style={{ color: "var(--coral)", fontWeight: 600 }}>{getTheme(themeId).label}</span></div>
            </div>

            {/* Avisos */}
            <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
              <div style={sectionTitle}><Icon name="bell" size={14} /> Avisos en este dispositivo</div>
              {pushState === "unsupported" || (isIOS() && !isStandalone()) ? (
                <div style={{ fontSize: 12, color: "var(--g8)", lineHeight: 1.5 }}>
                  {isIOS() && !isStandalone()
                    ? "En iPhone, primero instalá la app: en Safari tocá Compartir → “Agregar a pantalla de inicio”, abrila desde ahí y activá los avisos."
                    : "Este navegador no admite avisos push."}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <button onClick={togglePush} disabled={pushBusy || pushState === "denied"}
                    style={{ background: pushState === "on" ? "#96CEB422" : "#FF6B6B", color: pushState === "on" ? "var(--ok)" : "#fff", border: pushState === "on" ? "1px solid #96CEB444" : "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: pushBusy ? .6 : 1 }}>
                    {pushState === "on" ? "✓ Avisos activados · desactivar" : "Activar avisos"}
                  </button>
                  <span style={{ fontSize: 12, color: "var(--g8)" }}>{pushState === "denied" ? "Bloqueados en el navegador" : "Te avisamos de los eventos con alarma, a las 9:00."}</span>
                </div>
              )}
              {pushMsg && <div style={{ fontSize: 12, color: "var(--coral)", marginTop: 6 }}>{pushMsg}</div>}
            </div>

            {/* Agenda compartida: código y miembros */}
            <div>
              <div style={sectionTitle}>Agenda compartida</div>
              <div style={{ fontFamily: "Fraunces,serif", fontSize: 16, fontWeight: 600, color: "var(--title)" }}>{activeGroup?.name}</div>
              <div style={{ fontSize: 13, color: "var(--g6)", marginTop: 2 }}>Código para invitar: <span style={{ color: "var(--coral)", fontWeight: 700, letterSpacing: 1 }}>{activeGroup?.code}</span></div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                {(groupMembers || []).map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>{m.avatar}</div>
                    <span style={{ fontSize: 13, color: "var(--ga)" }}>{m.display_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
