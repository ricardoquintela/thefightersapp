const SUPABASE_URL = "https://iwjpunazbezxqwftcned.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3anB1bmF6YmV6eHF3ZnRjbmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjMzNjAsImV4cCI6MjA5NjMzOTM2MH0.Ip0ccSaud0dcMFyD8WA2VsfY9vvle2EG6bZvQwfscls";

const db = {
  async get(table, filters = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
    Object.entries(filters).forEach(([k, v]) => url += `&${k}=eq.${v}`);
    const r = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  async update(table, id, data) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  }
};

const { useState, useEffect } = React;

const GOLD = "#C9A84C";
const GOLD_DIM = "#8a6f2e";
const BG = "#0a0a0a";
const BG2 = "#141414";
const BG3 = "#1c1c1c";
const BG4 = "#242424";
const BORDER = "#2a2a2a";
const BORDER_GOLD = "#3a2e10";
const TEXT = "#f0f0f0";
const TEXT2 = "#888";
const TEXT3 = "#555";

const MODALITIES = {
  Kickboxing: ["K1", "Low Kick", "Full Contact", "Kick Light", "Light Contact"],
  "Muay Thai": ["Muay Thai"],
};
const LEVELS = ["Amador", "Neo-Profissional", "Profissional"];
const METHODS = ["KO/TKO", "Decisão Unânime", "Decisão Dividida", "Submissão", "Desqualificação", "Desistência"];
const EMPTY_FIGHT = { opponent: "", opponent_team: "", result: "V", method: "KO/TKO", event: "", date: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", weight: "" };
const EMPTY_EVENT = { name: "", local: "", city: "", country: "Portugal", organization: "", date: "" };
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function emailToUsername(email) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}
// Sanitização: trim + limite de caracteres
function san(val, max = 200) {
  if (typeof val !== "string") return val;
  return val.trim().slice(0, max);
}

const inp = { padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: BG3, color: TEXT, fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" };
const lbl = { fontSize: 11, color: TEXT3, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" };
const btnGold = { padding: "9px 22px", borderRadius: 6, border: "none", background: GOLD, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 12 };
const btnOutline = { padding: "6px 14px", borderRadius: 6, border: `1px solid ${GOLD_DIM}`, background: "transparent", cursor: "pointer", fontSize: 13, color: GOLD, fontWeight: 600 };
const btnRed = { padding: "6px 14px", borderRadius: 6, border: `1px solid #e0555566`, background: "transparent", cursor: "pointer", fontSize: 13, color: "#e05555", fontWeight: 600 };
const btnGreen = { padding: "6px 14px", borderRadius: 6, border: `1px solid #4caf7d66`, background: "transparent", cursor: "pointer", fontSize: 13, color: "#4caf7d", fontWeight: 600 };

// LOGO: usa norteforte.svg + mantém "The Fighters App"
function Logo() {
  return React.createElement("div", { style: { textAlign: "center", marginBottom: 6 } },
    React.createElement("div", { style: { fontSize: 10, color: "#aaa", letterSpacing: 5, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" } }, "The Fighters App"),
    React.createElement("img", { src: "norteforte.svg", alt: "Norte Forte", style: { height: 110, width: "auto", display: "block", margin: "0 auto", mixBlendMode: "screen" } })
  );
}

function GoldDivider() {
  return React.createElement("div", { style: { height: 1, background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, transparent)`, margin: "14px 0" } });
}

function Avatar({ name, size = 44, photo }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (photo) return React.createElement("div", { style: { width: size, height: size * 1.4, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: `1px solid ${GOLD_DIM}` } },
    React.createElement("img", { src: photo, alt: name, style: { width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" } })
  );
  return React.createElement("div", { style: { width: size, height: size * 1.4, borderRadius: 8, background: `linear-gradient(135deg, ${GOLD_DIM}, ${GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.32, color: "#000", flexShrink: 0, border: `1px solid ${GOLD_DIM}` } }, initials);
}

function Badge({ children, type = "default" }) {
  const s = { default: [BG4, GOLD], green: ["#0a1a0e", "#4caf7d"], blue: ["#0a0f1a", "#5b8fd4"], gold: ["#1a1200", GOLD], orange: ["#1a0f00", "#d4844c"], red: ["#1a0a0a", "#e05555"] }[type] || [BG4, GOLD];
  return React.createElement("span", { style: { background: s[0], color: s[1], fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap", border: `1px solid ${s[1]}22` } }, children);
}

function ResultBadge({ r }) {
  const c = r === "V" ? ["#0a1a0e", "#4caf7d"] : r === "D" ? ["#1a0a0a", "#e05555"] : [BG4, TEXT3];
  return React.createElement("span", { style: { background: c[0], color: c[1], border: `1px solid ${c[1]}44`, fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 4, display: "inline-block", minWidth: 32, textAlign: "center" } }, r);
}

function Card({ children, style = {}, gold = false }) {
  return React.createElement("div", { style: { background: BG2, border: `1px solid ${gold ? BORDER_GOLD : BORDER}`, borderRadius: 10, padding: "14px 16px", ...style } }, children);
}

function StatBox({ label, value, color, sub }) {
  return React.createElement("div", { style: { background: BG3, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px", textAlign: "center", flex: 1 } },
    React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color } }, value),
    React.createElement("div", { style: { fontSize: 11, color: TEXT3, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" } }, label),
    sub && React.createElement("div", { style: { fontSize: 10, color, marginTop: 2, fontWeight: 600, opacity: 0.8 } }, sub)
  );
}

function Header({ onLogout, user, currentPage, setPage, pendingCount = 0 }) {
  return React.createElement("div", { style: { textAlign: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${BORDER}`, position: "relative" } },
    React.createElement(Logo),
    user && React.createElement("div", { style: { position: "absolute", right: 0, top: 0, display: "flex", alignItems: "center", gap: 8 } },
      React.createElement("div", { style: { textAlign: "right" } },
        React.createElement("div", { style: { fontSize: 12, color: TEXT, fontWeight: 600 } }, user.name),
        React.createElement("div", { style: { fontSize: 11, color: user.role === "admin" ? GOLD : TEXT2 } }, user.role === "admin" ? "Admin" : "Atleta")
      ),
      React.createElement("button", { onClick: onLogout, style: { padding: "5px 10px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT2, cursor: "pointer", fontSize: 12 } }, "Sair")
    ),
    user && setPage && React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" } },
      user.role === "admin" && React.createElement("button", { onClick: () => setPage("fighters"), style: { ...btnOutline, fontSize: 11, padding: "4px 12px", background: currentPage === "fighters" ? GOLD_DIM : "transparent", color: currentPage === "fighters" ? "#fff" : GOLD } }, "Lutadores"),
      user.role === "admin" && React.createElement("button", { onClick: () => setPage("pending"), style: { ...btnOutline, fontSize: 11, padding: "4px 12px", background: currentPage === "pending" ? GOLD_DIM : "transparent", color: currentPage === "pending" ? "#fff" : GOLD, position: "relative" } },
        "Pedidos",
        pendingCount > 0 && React.createElement("span", { style: { position: "absolute", top: -7, right: -7, background: "#e05555", color: "#fff", borderRadius: "50%", width: 17, height: 17, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 } }, pendingCount > 9 ? "9+" : pendingCount)
      ),
      user.role === "admin" && React.createElement("button", { onClick: () => setPage("teams"), style: { ...btnOutline, fontSize: 11, padding: "4px 12px", background: currentPage === "teams" ? GOLD_DIM : "transparent", color: currentPage === "teams" ? "#fff" : GOLD } }, "Equipas"),
      React.createElement("button", { onClick: () => setPage("calendar"), style: { ...btnOutline, fontSize: 11, padding: "4px 12px", background: currentPage === "calendar" ? GOLD_DIM : "transparent", color: currentPage === "calendar" ? "#fff" : GOLD } }, "📅 Calendário")
    )
  );
}

function FightForm({ val, set }) {
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Adversário"), React.createElement("input", { style: inp, value: val.opponent || "", onChange: e => set({ ...val, opponent: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Equipa Adversário"), React.createElement("input", { style: inp, value: val.opponent_team || "", onChange: e => set({ ...val, opponent_team: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: val.date || "", onChange: e => set({ ...val, date: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Peso no combate (kg)"), React.createElement("input", { type: "number", style: inp, value: val.weight || "", onChange: e => set({ ...val, weight: e.target.value }), placeholder: "ex: 70" })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Resultado"),
      React.createElement("select", { style: inp, value: val.result || "V", onChange: e => set({ ...val, result: e.target.value }) },
        ["V","D","E"].map(r => React.createElement("option", { key: r }, r))
      )
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Método"),
      React.createElement("select", { style: inp, value: val.method || "KO/TKO", onChange: e => set({ ...val, method: e.target.value }) },
        METHODS.map(m => React.createElement("option", { key: m }, m))
      )
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"),
      React.createElement("select", { style: inp, value: val.modality || "Kickboxing", onChange: e => set({ ...val, modality: e.target.value, sub_modality: MODALITIES[e.target.value][0] }) },
        Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
      )
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Disciplina"),
      React.createElement("select", { style: inp, value: val.sub_modality || "K1", onChange: e => set({ ...val, sub_modality: e.target.value }) },
        (MODALITIES[val.modality] || MODALITIES["Kickboxing"]).map(s => React.createElement("option", { key: s }, s))
      )
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"),
      React.createElement("select", { style: inp, value: val.level || "Amador", onChange: e => set({ ...val, level: e.target.value }) },
        LEVELS.map(l => React.createElement("option", { key: l }, l))
      )
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Evento"), React.createElement("input", { style: inp, value: val.event || "", onChange: e => set({ ...val, event: e.target.value }) }))
  );
}

function EventForm({ val, set }) {
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
    React.createElement("div", { style: { gridColumn: "1 / -1" } },
      React.createElement("label", { style: { ...lbl, color: GOLD } }, "Nome da Prova"),
      React.createElement("input", { style: { ...inp, borderColor: GOLD_DIM }, value: val.name || "", onChange: e => set({ ...val, name: e.target.value }), placeholder: "ex: Norte Forte Fight Night" })
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: val.date || "", onChange: e => set({ ...val, date: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Organização"), React.createElement("input", { style: inp, value: val.organization || "", onChange: e => set({ ...val, organization: e.target.value }), placeholder: "ex: WAKO Portugal" })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Local / Recinto"), React.createElement("input", { style: inp, value: val.local || "", onChange: e => set({ ...val, local: e.target.value }), placeholder: "ex: Pavilhão Municipal" })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Cidade"), React.createElement("input", { style: inp, value: val.city || "", onChange: e => set({ ...val, city: e.target.value }), placeholder: "ex: Porto" })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "País"), React.createElement("input", { style: inp, value: val.country || "", onChange: e => set({ ...val, country: e.target.value }), placeholder: "ex: Portugal" }))
  );
}

function CalendarPage({ onLogout, user, setPage, pendingCount }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [delEventId, setDelEventId] = useState(null);
  const [ne, setNe] = useState({ ...EMPTY_EVENT });
  const isAdmin = user && user.role === "admin";

  useEffect(() => {
    async function load() {
      const all = await db.get("events");
      setEvents(all.sort((a, b) => new Date(a.date) - new Date(b.date)));
      setLoading(false);
    }
    load();
  }, []);

  async function saveEvent() {
    if (!ne.name.trim() || !ne.date) return;
    const ev = { ...ne, name: san(ne.name), local: san(ne.local), city: san(ne.city), organization: san(ne.organization), id: `ev${Date.now()}`, created_at: new Date().toISOString() };
    await db.insert("events", ev);
    setEvents(p => [...p, ev].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setShowForm(false); setNe({ ...EMPTY_EVENT });
  }

  async function saveEditEvent() {
    await db.update("events", editEvent.id, { name: san(editEvent.name), date: editEvent.date, local: san(editEvent.local), city: san(editEvent.city), country: san(editEvent.country), organization: san(editEvent.organization) });
    setEvents(p => p.map(x => x.id === editEvent.id ? { ...editEvent } : x).sort((a, b) => new Date(a.date) - new Date(b.date)));
    setEditEvent(null);
  }

  async function deleteEvent(id) {
    await db.delete("events", id);
    setEvents(p => p.filter(x => x.id !== id));
    setDelEventId(null);
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = events.filter(e => new Date(e.date) >= today);
  const past = events.filter(e => new Date(e.date) < today).reverse();

  function EventCard({ ev }) {
    const days = daysUntil(ev.date);
    const isPast = days !== null && days < 0;
    return React.createElement(Card, { style: { marginBottom: 8, border: `1px solid ${isPast ? BORDER : BORDER_GOLD}` } },
      editEvent && editEvent.id === ev.id
        ? React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Editar Prova"),
            React.createElement(EventForm, { val: editEvent, set: setEditEvent }),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
              React.createElement("button", { onClick: saveEditEvent, style: { ...btnGold, marginTop: 0 } }, "Guardar"),
              React.createElement("button", { onClick: () => setEditEvent(null), style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
            )
          )
        : React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-start" } },
            React.createElement("div", { style: { background: BG3, border: `1px solid ${isPast ? BORDER : GOLD_DIM}`, borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 52, flexShrink: 0 } },
              React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: isPast ? TEXT3 : GOLD } }, ev.date?.slice(8, 10)),
              React.createElement("div", { style: { fontSize: 10, color: TEXT3 } }, ev.date ? `${ev.date.slice(5,7)}/${ev.date.slice(0,4)}` : "")
            ),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: isPast ? TEXT2 : TEXT } }, ev.name),
              ev.organization && React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 600, marginTop: 2 } }, ev.organization),
              React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 2 } }, [ev.local, ev.city, ev.country].filter(Boolean).join(" · ")),
              delEventId === ev.id && React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 8, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 13, color: "#e05555" } }, "Tens a certeza?"),
                React.createElement("button", { onClick: () => deleteEvent(ev.id), style: { ...btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: "#e05555" } }, "Eliminar"),
                React.createElement("button", { onClick: () => setDelEventId(null), style: { ...btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 } },
              !isPast && days !== null && React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: days <= 7 ? "#e05555" : days <= 30 ? GOLD : "#4caf7d" } }, days),
                React.createElement("div", { style: { fontSize: 9, color: TEXT3, textTransform: "uppercase" } }, "dias")
              ),
              isPast && React.createElement(Badge, { type: "default" }, "Realizado"),
              isAdmin && React.createElement("div", { style: { display: "flex", gap: 6 } },
                React.createElement("button", { onClick: () => { setEditEvent({ ...ev }); setShowForm(false); }, style: { ...btnOutline, padding: "3px 10px", fontSize: 11 } }, "Editar"),
                React.createElement("button", { onClick: () => setDelEventId(ev.id), style: { ...btnRed, padding: "3px 10px", fontSize: 11 } }, "Eliminar")
              )
            )
          )
    );
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "calendar", setPage, pendingCount }),
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: TEXT, textTransform: "uppercase", letterSpacing: 1 } }, "Calendário de Provas"),
        isAdmin && React.createElement("button", { onClick: () => { setShowForm(p => !p); setEditEvent(null); }, style: btnOutline }, "+ Nova Prova")
      ),
      showForm && React.createElement(Card, { gold: true, style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" } }, "Nova Prova"),
        React.createElement(EventForm, { val: ne, set: setNe }),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveEvent, style: { ...btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => { setShowForm(false); setNe({ ...EMPTY_EVENT }); }, style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
        )
      ),
      loading && React.createElement("div", { style: { color: TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      upcoming.length > 0 && React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 11, color: GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 } }, `Próximas · ${upcoming.length}`),
        upcoming.map(ev => React.createElement(EventCard, { key: ev.id, ev }))
      ),
      upcoming.length === 0 && !loading && React.createElement(Card, { style: { marginBottom: 16 } },
        React.createElement("div", { style: { color: TEXT3, textAlign: "center", padding: "16px 0" } }, "Nenhuma prova agendada.")
      ),
      past.length > 0 && React.createElement("div", { style: { marginTop: 20 } },
        React.createElement(GoldDivider),
        React.createElement("div", { style: { fontSize: 11, color: TEXT3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 } }, `Realizadas · ${past.length}`),
        past.map(ev => React.createElement(EventCard, { key: ev.id, ev }))
      )
    )
  );
}

function RegisterPage() {
  const [f, setF] = useState({ name: "", weight: "", category: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", contact: "", email: "", team: "Norte Forte" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function handleRegister() {
    if (!f.name.trim()) return setErr("Nome obrigatório.");
    if (!f.email.includes("@")) return setErr("E-mail válido obrigatório.");
    setSaving(true);
    const existing = await db.get("fighters", { email: san(f.email, 100) });
    if (existing.length > 0) { setSaving(false); return setErr("Este e-mail já está registado."); }
    const id = Date.now();
    await db.insert("fighters", { name: san(f.name, 100), weight: Number(f.weight) || 0, category: san(f.category), modality: f.modality, sub_modality: f.sub_modality, level: f.level, contact: san(f.contact, 50), email: san(f.email, 100), team: san(f.team, 100), id, available: false, status: "pending", registration_date: new Date().toISOString() });
    setSaving(false); setDone(true);
  }

  if (done) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement("div", { style: { textAlign: "center", maxWidth: 400 } },
      React.createElement(Logo),
      React.createElement("div", { style: { marginTop: 24, padding: 24, background: BG2, borderRadius: 10, border: `1px solid ${GOLD_DIM}` } },
        React.createElement("div", { style: { fontSize: 32, marginBottom: 12 } }, "✅"),
        React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 8 } }, "Pedido enviado!"),
        React.createElement("div", { style: { fontSize: 14, color: TEXT2, marginBottom: 16 } }, "O teu pedido foi enviado ao administrador. Receberás as tuas credenciais após aprovação."),
        React.createElement("a", { href: "/", style: { fontSize: 13, color: GOLD_DIM, textDecoration: "none" } }, "← Ir para o login")
      )
    )
  );

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement("div", { style: { width: "100%", maxWidth: 500 } },
      React.createElement("div", { style: { marginBottom: 24 } }, React.createElement(Logo)),
      React.createElement("div", { style: { fontSize: 14, color: TEXT2, textAlign: "center", marginBottom: 20 } }, "Preenche os teus dados para te juntares à Norte Forte Fighters App"),
      React.createElement(Card, null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          [["Nome completo", "name"], ["Peso (kg)", "weight"], ["Escalão", "category"], ["Contacto", "contact"]].map(([l, k]) =>
            React.createElement("div", { key: k }, React.createElement("label", { style: lbl }, l), React.createElement("input", { style: inp, value: f[k], onChange: e => upd(k, e.target.value) }))
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { ...lbl, color: GOLD } }, "E-mail"),
            React.createElement("input", { style: { ...inp, borderColor: GOLD_DIM }, value: f.email, onChange: e => upd("email", e.target.value), placeholder: "o teu e-mail" })
          ),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"), React.createElement("select", { style: inp, value: f.modality, onChange: e => upd("modality", e.target.value) }, Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"), React.createElement("select", { style: inp, value: f.level, onChange: e => upd("level", e.target.value) }, LEVELS.map(l => React.createElement("option", { key: l }, l))))
        ),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginTop: 10 } }, err),
        React.createElement("button", { onClick: handleRegister, disabled: saving, style: { ...btnGold, width: "100%", marginTop: 16, opacity: saving ? 0.7 : 1 } }, saving ? "A enviar..." : "Enviar Pedido de Registo")
      )
    )
  );
}

function PendingPage({ onLogout, user, setPage, setUsers, users, pendingCount }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await db.get("fighters");
      setPending(all.filter(f => f.status === "pending"));
      setLoading(false);
    }
    load();
  }, []);

  async function approve(fighter) {
    let username = emailToUsername(fighter.email);
    const existingUsers = await db.get("users");
    let base = username; let i = 2;
    while (existingUsers.map(u => u.username).includes(username)) { username = base + i; i++; }
    const password = generatePassword();
    const newUser = { id: `user_${fighter.id}`, name: fighter.name, role: "athlete", fighter_id: fighter.id, username, password, email: fighter.email };
    await db.update("fighters", fighter.id, { status: "approved" });
    await db.insert("users", newUser);
    setUsers(p => [...p, newUser]);
    setPending(p => p.filter(f => f.id !== fighter.id));
    alert(`✅ Aprovado!\n\nUsername: ${username}\nPassword: ${password}\n\nEnvia estas credenciais ao atleta: ${fighter.email}`);
  }

  async function reject(fighterId) {
    await db.update("fighters", fighterId, { status: "rejected" });
    setPending(p => p.filter(f => f.id !== fighterId));
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "pending", setPage, pendingCount }),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 } }, `Pedidos Pendentes · ${pending.length}`),
      loading && React.createElement("div", { style: { color: TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      pending.length === 0 && !loading && React.createElement(Card, null, React.createElement("div", { style: { color: TEXT3, textAlign: "center", padding: "24px 0" } }, "Nenhum pedido pendente.")),
      pending.map(f => React.createElement(Card, { key: f.id, style: { marginBottom: 8 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          React.createElement(Avatar, { name: f.name, size: 36 }),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: TEXT } }, f.name),
            React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 2 } }, `${f.email} · ${f.modality} · ${f.level} · ${f.weight}kg`),
            React.createElement("div", { style: { fontSize: 11, color: TEXT3, marginTop: 2 } }, `Pedido: ${f.registration_date ? new Date(f.registration_date).toLocaleDateString("pt-PT") : "—"}`)
          ),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement("button", { onClick: () => approve(f), style: { ...btnGreen, padding: "5px 14px", fontSize: 12 } }, "✓ Aprovar"),
            React.createElement("button", { onClick: () => reject(f.id), style: { ...btnRed, padding: "5px 14px", fontSize: 12 } }, "✕ Rejeitar")
          )
        )
      ))
    )
  );
}

function TeamsPage({ onLogout, user, setPage, pendingCount }) {
  const [teams, setTeams] = useState([]);
  const [allFighters, setAllFighters] = useState([]);
  const [allFights, setAllFights] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selFighter, setSelFighter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [fighters, fights] = await Promise.all([db.get("fighters"), db.get("fights")]);
      const approved = fighters.filter(f => f.status !== "pending" && f.status !== "rejected");
      setAllFighters(approved); setAllFights(fights);
      const teamMap = {};
      approved.forEach(f => { const t = f.team || "Sem Equipa"; if (!teamMap[t]) teamMap[t] = []; teamMap[t].push(f); });
      setTeams(Object.entries(teamMap).map(([name, fighters]) => ({ name, fighters })));
      setLoading(false);
    }
    load();
  }, []);

  function getRecord(fighterId) {
    const fights = allFights.filter(f => f.fighter_id === fighterId);
    return { wins: fights.filter(x => x.result === "V").length, losses: fights.filter(x => x.result === "D").length, draws: fights.filter(x => x.result === "E").length, kos: fights.filter(x => x.result === "V" && x.method === "KO/TKO").length, total: fights.length };
  }

  if (selFighter) {
    const rec = getRecord(selFighter.id);
    const wr = rec.total > 0 ? Math.round(rec.wins / rec.total * 100) : 0;
    const fighterFights = allFights.filter(f => f.fighter_id === selFighter.id);
    return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
      React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
        React.createElement(Header, { onLogout, user, currentPage: "teams", setPage, pendingCount }),
        React.createElement("button", { onClick: () => setSelFighter(null), style: { fontSize: 13, color: TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, `← Voltar a ${selFighter.team}`),
        React.createElement(Card, { gold: true, style: { marginBottom: 14 } },
          React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 } },
            React.createElement(Avatar, { name: selFighter.name, size: 70, photo: selFighter.photo }),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8 } }, selFighter.name),
              React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                React.createElement(Badge, { type: "gold" }, selFighter.team),
                React.createElement(Badge, null, selFighter.modality),
                selFighter.sub_modality && React.createElement(Badge, { type: "gold" }, selFighter.sub_modality),
                React.createElement(Badge, { type: "blue" }, selFighter.level),
                React.createElement(Badge, null, `${selFighter.weight}kg`)
              )
            )
          ),
          React.createElement(GoldDivider),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement(StatBox, { label: "Vitórias", value: rec.wins, color: "#4caf7d", sub: rec.kos > 0 ? `${rec.kos} KO` : null }),
            React.createElement(StatBox, { label: "Derrotas", value: rec.losses, color: "#e05555" }),
            React.createElement(StatBox, { label: "Empates", value: rec.draws, color: TEXT3 }),
            React.createElement(StatBox, { label: "Win Rate", value: wr + "%", color: GOLD })
          )
        ),
        React.createElement("div", { style: { fontSize: 12, color: TEXT3, textAlign: "center", marginBottom: 16, padding: "8px", background: BG2, borderRadius: 6, border: `1px solid ${BORDER}` } }, "🔒 Apenas records públicos. Contactos não disponíveis."),
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: TEXT2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 } }, `Histórico · ${fighterFights.length} combates`),
        fighterFights.length === 0
          ? React.createElement(Card, null, React.createElement("div", { style: { color: TEXT3, textAlign: "center", padding: "16px 0" } }, "Sem combates registados."))
          : fighterFights.map((fight, i) => React.createElement(Card, { key: i, style: { marginBottom: 8 } },
              React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
                React.createElement(ResultBadge, { r: fight.result }),
                React.createElement("div", { style: { flex: 1 } },
                  React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: TEXT } }, `vs. ${fight.opponent}`, fight.opponent_team && React.createElement("span", { style: { fontSize: 12, color: TEXT3, marginLeft: 6 } }, `(${fight.opponent_team})`)),
                  React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 2 } }, `${fight.event || ""} · ${fight.date || ""}`),
                  React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
                    React.createElement(Badge, null, fight.modality),
                    fight.sub_modality && React.createElement(Badge, { type: "gold" }, fight.sub_modality),
                    React.createElement(Badge, { type: "blue" }, fight.level),
                    React.createElement(Badge, null, fight.method),
                    fight.weight && React.createElement(Badge, null, `${fight.weight}kg`)
                  )
                )
              )
            ))
      )
    );
  }

  if (selected) {
    const teamFighters = allFighters.filter(f => (f.team || "Sem Equipa") === selected);
    return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
      React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
        React.createElement(Header, { onLogout, user, currentPage: "teams", setPage, pendingCount }),
        React.createElement("button", { onClick: () => setSelected(null), style: { fontSize: 13, color: TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Equipas"),
        React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: GOLD, marginBottom: 4, textTransform: "uppercase", letterSpacing: 2 } }, selected),
        React.createElement("div", { style: { fontSize: 13, color: TEXT2, marginBottom: 16 } }, `${teamFighters.length} atleta${teamFighters.length !== 1 ? "s" : ""}`),
        React.createElement(GoldDivider),
        teamFighters.map(f => {
          const rec = getRecord(f.id);
          return React.createElement("div", { key: f.id, style: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }, onMouseEnter: e => e.currentTarget.style.borderColor = GOLD_DIM, onMouseLeave: e => e.currentTarget.style.borderColor = BORDER, onClick: () => setSelFighter(f) },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
              React.createElement(Avatar, { name: f.name, size: 36, photo: f.photo }),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 4 } }, f.name),
                React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 } },
                  React.createElement(Badge, null, f.modality), f.sub_modality && React.createElement(Badge, { type: "gold" }, f.sub_modality),
                  React.createElement(Badge, { type: "blue" }, f.level), React.createElement(Badge, null, `${f.weight}kg`)
                ),
                React.createElement("div", { style: { display: "flex", gap: 12, fontSize: 13 } },
                  React.createElement("span", { style: { color: "#4caf7d", fontWeight: 700 } }, `${rec.wins}V`),
                  React.createElement("span", { style: { color: "#e05555", fontWeight: 700 } }, `${rec.losses}D`),
                  React.createElement("span", { style: { color: TEXT3, fontWeight: 700 } }, `${rec.draws}E`),
                  rec.kos > 0 && React.createElement("span", { style: { color: GOLD, fontSize: 11 } }, `· ${rec.kos} KO`)
                )
              ),
              React.createElement("div", { style: { fontSize: 20, color: TEXT3 } }, "›")
            )
          );
        })
      )
    );
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "teams", setPage, pendingCount }),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 } }, `Equipas · ${teams.length}`),
      loading && React.createElement("div", { style: { color: TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      teams.map(t => {
        const totalFights = t.fighters.reduce((acc, f) => acc + allFights.filter(x => x.fighter_id === f.id).length, 0);
        const totalWins = t.fighters.reduce((acc, f) => acc + allFights.filter(x => x.fighter_id === f.id && x.result === "V").length, 0);
        return React.createElement("div", { key: t.name, style: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px", marginBottom: 8, cursor: "pointer" }, onMouseEnter: e => e.currentTarget.style.borderColor = GOLD_DIM, onMouseLeave: e => e.currentTarget.style.borderColor = BORDER, onClick: () => setSelected(t.name) },
          React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: GOLD, marginBottom: 4 } }, t.name),
              React.createElement("div", { style: { fontSize: 13, color: TEXT2 } },
                `${t.fighters.length} atleta${t.fighters.length !== 1 ? "s" : ""}`,
                totalFights > 0 && React.createElement("span", { style: { color: TEXT3, marginLeft: 8 } }, `· ${totalWins}V / ${totalFights - totalWins}D em ${totalFights} combates`)
              )
            ),
            React.createElement("div", { style: { fontSize: 20, color: TEXT3 } }, "›")
          )
        );
      })
    )
  );
}

// LOGIN com rate limiting + esqueci password
function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [newPassword, setNewPassword] = useState(null);

  async function doLogin() {
    if (blocked || loading) return;
    if (attempts >= 5) {
      setBlocked(true);
      setErr("Demasiadas tentativas. Aguarda 30 segundos.");
      setTimeout(() => { setBlocked(false); setAttempts(0); setErr(""); }, 30000);
      return;
    }
    setLoading(true);
    const users = await db.get("users", { username: username.trim().toLowerCase() });
    setLoading(false);
    if (users.length > 0 && users[0].password === pw) {
      setAttempts(0);
      onLogin(users[0]);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setErr(`Credenciais incorretas.${newAttempts >= 3 ? ` (${5 - newAttempts} tentativas restantes)` : ""}`);
    }
  }

  async function doForgot() {
    if (!forgotUsername.trim()) return;
    setForgotLoading(true);
    setErr("");
    const users = await db.get("users", { username: forgotUsername.trim().toLowerCase() });
    if (users.length === 0) {
      setForgotLoading(false);
      setErr("Username não encontrado.");
      return;
    }
    const newPw = generatePassword();
    await db.update("users", users[0].id, { password: newPw });
    setForgotLoading(false);
    setNewPassword(newPw);
  }

  if (showForgot) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { width: 340, padding: 16 } },
      React.createElement("div", { style: { marginBottom: 28 } }, React.createElement(Logo), React.createElement("div", { style: { width: 40, height: 2, background: GOLD, margin: "10px auto 0", borderRadius: 2 } })),
      React.createElement(Card, { gold: true },
        newPassword
          ? React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 13, color: GOLD, fontWeight: 700, marginBottom: 8 } }, "Nova password gerada!"),
              React.createElement("div", { style: { fontSize: 13, color: TEXT2, marginBottom: 12 } }, "Copia esta password e usa para entrar:"),
              React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: GOLD, textAlign: "center", padding: "14px", background: BG3, borderRadius: 8, marginBottom: 16, letterSpacing: 2 } }, newPassword),
              React.createElement("div", { style: { fontSize: 11, color: TEXT3, marginBottom: 16, textAlign: "center" } }, "Usa esta password para entrar. Podes alterá-la depois no teu perfil."),
              React.createElement("button", { onClick: () => { setShowForgot(false); setNewPassword(null); setForgotUsername(""); setErr(""); }, style: { ...btnGold, width: "100%", marginTop: 0 } }, "Ir para o login")
            )
          : React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 12 } }, "Esqueci a password"),
              React.createElement("div", { style: { fontSize: 13, color: TEXT2, marginBottom: 16 } }, "Indica o teu username e geramos uma nova password."),
              React.createElement("div", { style: { marginBottom: 16 } }, React.createElement("label", { style: lbl }, "Username"), React.createElement("input", { style: inp, value: forgotUsername, onChange: e => setForgotUsername(e.target.value), onKeyDown: e => e.key === "Enter" && doForgot(), placeholder: "o teu username" })),
              err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginBottom: 10 } }, err),
              React.createElement("button", { onClick: doForgot, disabled: forgotLoading, style: { ...btnGold, width: "100%", marginTop: 0, opacity: forgotLoading ? 0.7 : 1 } }, forgotLoading ? "A gerar..." : "Gerar nova password"),
              React.createElement("div", { style: { textAlign: "center", marginTop: 12 } },
                React.createElement("button", { onClick: () => { setShowForgot(false); setErr(""); }, style: { fontSize: 12, color: GOLD_DIM, background: "none", border: "none", cursor: "pointer" } }, "← Voltar ao login")
              )
            )
      )
    )
  );

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { width: 340, padding: 16 } },
      React.createElement("div", { style: { marginBottom: 28 } }, React.createElement(Logo), React.createElement("div", { style: { width: 40, height: 2, background: GOLD, margin: "10px auto 0", borderRadius: 2 } })),
      React.createElement(Card, { gold: true },
        React.createElement("div", { style: { marginBottom: 16 } }, React.createElement("label", { style: lbl }, "Username"), React.createElement("input", { style: inp, value: username, onChange: e => setUsername(e.target.value), onKeyDown: e => e.key === "Enter" && doLogin(), placeholder: "username", disabled: blocked })),
        React.createElement("div", { style: { marginBottom: 16 } }, React.createElement("label", { style: lbl }, "Password"), React.createElement("input", { type: "password", style: inp, value: pw, onChange: e => setPw(e.target.value), onKeyDown: e => e.key === "Enter" && doLogin(), placeholder: "••••••••", disabled: blocked })),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginBottom: 10 } }, err),
        React.createElement("button", { onClick: doLogin, disabled: loading || blocked, style: { ...btnGold, width: "100%", marginTop: 0, padding: "11px", opacity: blocked ? 0.4 : loading ? 0.7 : 1 } }, blocked ? "Bloqueado 30s..." : loading ? "A entrar..." : "Entrar"),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", marginTop: 16 } },
          React.createElement("button", { onClick: () => { setShowForgot(true); setErr(""); }, style: { fontSize: 12, color: TEXT3, background: "none", border: "none", cursor: "pointer" } }, "Esqueci a password"),
          React.createElement("a", { href: "?register=true", style: { fontSize: 12, color: GOLD_DIM, textDecoration: "none" } }, "Quero registar-me →")
        )
      )
    )
  );
}

function FighterProfile({ fighter, onBack, onSave, user, isOwner, onLogout, setPage, pendingCount }) {
  const [tab, setTab] = useState(0);
  const [f, setF] = useState({ ...fighter, fights: [], upcoming: [], titles: [] });
  const [loading, setLoading] = useState(true);
  const [showFF, setShowFF] = useState(false);
  const [showUF, setShowUF] = useState(false);
  const [showTF, setShowTF] = useState(false);
  const [editFight, setEditFight] = useState(null);
  const [delFightId, setDelFightId] = useState(null);
  const [editTitle, setEditTitle] = useState(null);
  const [delTitleId, setDelTitleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nf, setNf] = useState({ ...EMPTY_FIGHT });
  const [nu, setNu] = useState({ opponent: "", event: "", date: "", local: "", weight: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador" });
  const [nt, setNt] = useState({ name: "", org: "", year: 2026 });
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    async function load() {
      const [fights, upcoming, titles] = await Promise.all([
        db.get("fights", { fighter_id: fighter.id }),
        db.get("upcoming", { fighter_id: fighter.id }),
        db.get("titles", { fighter_id: fighter.id }),
      ]);
      setF(p => ({ ...p, fights, upcoming, titles }));
      setLoading(false);
    }
    load();
  }, [fighter.id]);

  const wins = f.fights.filter(x => x.result === "V").length;
  const losses = f.fights.filter(x => x.result === "D").length;
  const draws = f.fights.filter(x => x.result === "E").length;
  const kos = f.fights.filter(x => x.result === "V" && x.method === "KO/TKO").length;
  const total = wins + losses + draws;
  const wr = total > 0 ? Math.round(wins / total * 100) : 0;
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  const todayD = new Date(); todayD.setHours(0,0,0,0);
  const nextFight = (f.upcoming || []).filter(u => u.date && new Date(u.date) >= todayD).sort((a,b) => new Date(a.date)-new Date(b.date))[0];
  const daysLeft = nextFight ? daysUntil(nextFight.date) : null;
  const combatPhotos = Array.isArray(f.combat_photos) ? f.combat_photos : [];

  async function saveProfile() {
    setSaving(true);
    await db.update("fighters", f.id, { name: san(f.name, 100), weight: f.weight, category: san(f.category), contact: san(f.contact, 50), modality: f.modality, sub_modality: f.sub_modality, level: f.level, photo: f.photo, combat_photos: f.combat_photos });
    setSaving(false);
  }

  // Validação 2MB + sanitização nas fotos
  async function addCombatPhoto(e) {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > MAX_FILE_SIZE) { alert("Foto demasiado grande. Máximo 2MB."); return; }
    if (combatPhotos.length >= 3) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const newPhotos = [...combatPhotos, ev.target.result];
      upd("combat_photos", newPhotos);
      await db.update("fighters", f.id, { combat_photos: newPhotos });
    };
    reader.readAsDataURL(file);
  }

  async function removeCombatPhoto(idx) {
    const newPhotos = combatPhotos.filter((_, i) => i !== idx);
    upd("combat_photos", newPhotos);
    await db.update("fighters", f.id, { combat_photos: newPhotos });
  }

  async function saveFight() {
    const fight = { ...nf, opponent: san(nf.opponent, 100), opponent_team: san(nf.opponent_team, 100), event: san(nf.event, 100), id: `f${Date.now()}`, fighter_id: f.id, flagged: false, flag_note: "" };
    await db.insert("fights", fight);
    setF(p => ({ ...p, fights: [fight, ...p.fights] }));
    setShowFF(false); setNf({ ...EMPTY_FIGHT });
  }

  async function saveEditFight() {
    await db.update("fights", editFight.id, editFight);
    setF(p => ({ ...p, fights: p.fights.map(x => x.id === editFight.id ? { ...editFight } : x) }));
    setEditFight(null);
  }

  async function deleteFight(fightId) {
    await db.delete("fights", fightId);
    setF(p => ({ ...p, fights: p.fights.filter(x => x.id !== fightId) }));
    setDelFightId(null);
  }

  async function saveUpcoming() {
    const u = { ...nu, opponent: san(nu.opponent, 100), event: san(nu.event, 100), local: san(nu.local, 100), id: `u${Date.now()}`, fighter_id: f.id };
    await db.insert("upcoming", u);
    setF(p => ({ ...p, upcoming: [...p.upcoming, u] }));

    if (nu.event && nu.event.trim()) {
      const existingEvents = await db.get("events");
      const alreadyExists = existingEvents.some(ev => ev.name.toLowerCase().trim() === nu.event.toLowerCase().trim());
      if (!alreadyExists) {
        await db.insert("events", { id: `ev${Date.now()}`, name: san(nu.event), date: nu.date || "", local: san(nu.local), city: "", country: "Portugal", organization: "", created_at: new Date().toISOString() });
      }
    }

    setShowUF(false);
    setNu({ opponent: "", event: "", date: "", local: "", weight: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador" });
  }

  async function saveTitle() {
    const res = await db.insert("titles", { name: san(nt.name, 100), org: san(nt.org, 100), year: Number(nt.year), fighter_id: f.id });
    setF(p => ({ ...p, titles: [...p.titles, res[0] || nt] }));
    setShowTF(false); setNt({ name: "", org: "", year: 2026 });
  }

  async function saveEditTitle() {
    await db.update("titles", editTitle.id, { name: san(editTitle.name, 100), org: san(editTitle.org, 100), year: Number(editTitle.year) });
    setF(p => ({ ...p, titles: p.titles.map(x => x.id === editTitle.id ? { ...editTitle } : x) }));
    setEditTitle(null);
  }

  async function deleteTitle(titleId) {
    await db.delete("titles", titleId);
    setF(p => ({ ...p, titles: p.titles.filter(x => x.id !== titleId) }));
    setDelTitleId(null);
  }

  const TABS = ["Perfil", "Histórico", "Próximas Lutas", "Títulos"];

  if (loading) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { color: GOLD, fontSize: 14 } }, "A carregar...")
  );

  const tabContent = () => {
    if (tab === 0) return React.createElement("div", null,
      React.createElement(Card, { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, `Fotos em Combate · ${combatPhotos.length}/3`),
        React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
          combatPhotos.map((photo, idx) =>
            React.createElement("div", { key: idx, style: { position: "relative", width: 90, height: 90 } },
              React.createElement("img", { src: photo, onClick: () => setLightbox(photo), style: { width: 90, height: 90, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: `1px solid ${GOLD_DIM}` } }),
              isOwner && React.createElement("button", { onClick: () => removeCombatPhoto(idx), style: { position: "absolute", top: -6, right: -6, background: "#e05555", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 } }, "×")
            )
          ),
          isOwner && combatPhotos.length < 3 && React.createElement("label", { style: { width: 90, height: 90, border: `2px dashed ${BORDER}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: TEXT3, fontSize: 28, flexDirection: "column", gap: 4 } },
            "+",
            React.createElement("span", { style: { fontSize: 9, color: TEXT3, textAlign: "center" } }, "máx 2MB"),
            React.createElement("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: addCombatPhoto })
          )
        )
      ),
      React.createElement(Card, null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          [["Equipa", "team"], ["Peso (kg)", "weight"], ["Escalão", "category"], ["Contacto", "contact"]].map(([l, k]) =>
            React.createElement("div", { key: k },
              React.createElement("label", { style: lbl }, l),
              isOwner ? React.createElement("input", { style: inp, value: f[k] || "", onChange: e => upd(k, e.target.value) }) : React.createElement("div", { style: { fontSize: 14, color: TEXT, padding: "8px 0" } }, f[k])
            )
          ),
          isOwner && React.createElement(React.Fragment, null,
            React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"), React.createElement("select", { style: inp, value: f.modality || "Kickboxing", onChange: e => upd("modality", e.target.value) }, Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))),
            React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"), React.createElement("select", { style: inp, value: f.level || "Amador", onChange: e => upd("level", e.target.value) }, LEVELS.map(l => React.createElement("option", { key: l }, l))))
          )
        ),
        isOwner && React.createElement("button", { onClick: saveProfile, disabled: saving, style: { ...btnGold, opacity: saving ? 0.7 : 1 } }, saving ? "A guardar..." : "Guardar alterações")
      )
    );

    if (tab === 1) return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: TEXT, textTransform: "uppercase" } }, `Lutas · ${f.fights.length}`),
        isOwner && React.createElement("button", { onClick: () => { setShowFF(p => !p); setEditFight(null); }, style: btnOutline }, "+ Adicionar")
      ),
      showFF && !editFight && React.createElement(Card, { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Novo Combate"),
        React.createElement(FightForm, { val: nf, set: setNf }),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveFight, style: { ...btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setShowFF(false), style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
        )
      ),
      editFight && React.createElement(Card, { style: { marginBottom: 12, border: `1px solid ${GOLD_DIM}` } },
        React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Editar Combate"),
        React.createElement(FightForm, { val: editFight, set: setEditFight }),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveEditFight, style: { ...btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setEditFight(null), style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
        )
      ),
      f.fights.map(fight => React.createElement(Card, { key: fight.id, style: { marginBottom: 8 } },
        React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
          React.createElement(ResultBadge, { r: fight.result }),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: TEXT } }, fight.opponent, fight.opponent_team && React.createElement("span", { style: { fontSize: 12, color: TEXT3, marginLeft: 6 } }, `(${fight.opponent_team})`)),
            React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 2 } }, `${fight.event || ""} · ${fight.date || ""}`),
            React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
              React.createElement(Badge, null, fight.modality),
              fight.sub_modality && React.createElement(Badge, { type: "gold" }, fight.sub_modality),
              React.createElement(Badge, { type: "blue" }, fight.level),
              React.createElement(Badge, null, fight.method),
              fight.weight && React.createElement(Badge, null, `${fight.weight}kg`)
            ),
            delFightId === fight.id && React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 8, alignItems: "center" } },
              React.createElement("span", { style: { fontSize: 13, color: "#e05555" } }, "Tens a certeza?"),
              React.createElement("button", { onClick: () => deleteFight(fight.id), style: { ...btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: "#e05555" } }, "Eliminar"),
              React.createElement("button", { onClick: () => setDelFightId(null), style: { ...btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
            )
          ),
          isOwner && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 } },
            React.createElement("button", { onClick: () => { setEditFight({ ...fight }); setShowFF(false); window.scrollTo(0, 0); }, style: { ...btnOutline, padding: "4px 12px", fontSize: 12 } }, "Editar"),
            React.createElement("button", { onClick: () => setDelFightId(fight.id), style: { ...btnRed, padding: "4px 12px", fontSize: 12 } }, "Eliminar")
          )
        )
      ))
    );

    if (tab === 2) return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: TEXT, textTransform: "uppercase" } }, `Próximas Lutas · ${f.upcoming.length}`),
        isOwner && React.createElement("button", { onClick: () => setShowUF(p => !p), style: btnOutline }, "+ Adicionar")
      ),
      showUF && React.createElement(Card, { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Nova Luta"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Adversário"), React.createElement("input", { style: inp, value: nu.opponent, onChange: e => setNu({ ...nu, opponent: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: nu.date, onChange: e => setNu({ ...nu, date: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Evento"), React.createElement("input", { style: inp, value: nu.event, onChange: e => setNu({ ...nu, event: e.target.value }), placeholder: "nome do evento" })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Local"), React.createElement("input", { style: inp, value: nu.local, onChange: e => setNu({ ...nu, local: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Peso (kg)"), React.createElement("input", { type: "number", style: inp, value: nu.weight, onChange: e => setNu({ ...nu, weight: e.target.value }), placeholder: "ex: 70" })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"), React.createElement("select", { style: inp, value: nu.modality, onChange: e => setNu({ ...nu, modality: e.target.value, sub_modality: MODALITIES[e.target.value][0] }) }, Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Disciplina"), React.createElement("select", { style: inp, value: nu.sub_modality, onChange: e => setNu({ ...nu, sub_modality: e.target.value }) }, (MODALITIES[nu.modality] || []).map(s => React.createElement("option", { key: s }, s)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"), React.createElement("select", { style: inp, value: nu.level, onChange: e => setNu({ ...nu, level: e.target.value }) }, LEVELS.map(l => React.createElement("option", { key: l }, l))))
        ),
        nu.event && nu.event.trim() && React.createElement("div", { style: { fontSize: 11, color: GOLD_DIM, marginTop: 10, padding: "6px 10px", background: BG3, borderRadius: 6 } },
          `📅 Se "${nu.event}" não existir no calendário, será criado automaticamente.`
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveUpcoming, style: { ...btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setShowUF(false), style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
        )
      ),
      f.upcoming.map((u, i) => {
        const days = daysUntil(u.date);
        return React.createElement(Card, { key: i, style: { marginBottom: 8 } },
          React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
            React.createElement("div", { style: { background: BG3, border: `1px solid ${GOLD_DIM}`, borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 48 } },
              React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: GOLD } }, u.date?.slice(8, 10)),
              React.createElement("div", { style: { fontSize: 10, color: TEXT2 } }, `${u.date?.slice(5, 7)}/${u.date?.slice(2, 4)}`)
            ),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: TEXT } }, `vs. ${u.opponent}`),
              React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 2 } }, [u.event, u.local].filter(Boolean).join(" · ")),
              React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
                React.createElement(Badge, null, u.modality),
                React.createElement(Badge, { type: "gold" }, u.sub_modality),
                React.createElement(Badge, { type: "blue" }, u.level),
                u.weight && React.createElement(Badge, null, `${u.weight}kg`)
              )
            ),
            days !== null && days >= 0 && React.createElement("div", { style: { textAlign: "center", flexShrink: 0 } },
              React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: days <= 7 ? "#e05555" : days <= 30 ? GOLD : "#4caf7d" } }, days),
              React.createElement("div", { style: { fontSize: 9, color: TEXT3, textTransform: "uppercase" } }, "dias")
            )
          )
        );
      })
    );

    if (tab === 3) return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: TEXT, textTransform: "uppercase" } }, `Títulos · ${f.titles.length}`),
        isOwner && React.createElement("button", { onClick: () => { setShowTF(p => !p); setEditTitle(null); }, style: btnOutline }, "+ Adicionar")
      ),
      showTF && React.createElement(Card, { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Novo Título"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Título"), React.createElement("input", { style: inp, value: nt.name, onChange: e => setNt({ ...nt, name: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Organização"), React.createElement("input", { style: inp, value: nt.org, onChange: e => setNt({ ...nt, org: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Ano"), React.createElement("input", { type: "number", style: inp, value: nt.year, onChange: e => setNt({ ...nt, year: e.target.value }) }))
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveTitle, style: { ...btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setShowTF(false), style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
        )
      ),
      editTitle && React.createElement(Card, { style: { marginBottom: 12, border: `1px solid ${GOLD_DIM}` } },
        React.createElement("div", { style: { fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Editar Título"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 } },
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Título"), React.createElement("input", { style: inp, value: editTitle.name, onChange: e => setEditTitle({ ...editTitle, name: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Organização"), React.createElement("input", { style: inp, value: editTitle.org, onChange: e => setEditTitle({ ...editTitle, org: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Ano"), React.createElement("input", { type: "number", style: inp, value: editTitle.year, onChange: e => setEditTitle({ ...editTitle, year: e.target.value }) }))
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveEditTitle, style: { ...btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setEditTitle(null), style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
        )
      ),
      f.titles.length === 0 && React.createElement("div", { style: { color: TEXT3, fontSize: 14, textAlign: "center", padding: "24px 0" } }, "Nenhum título registado."),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 } },
        f.titles.map((t, i) => React.createElement("div", { key: i, style: { background: BG2, border: `1px solid ${GOLD_DIM}`, borderRadius: 10, padding: "16px", position: "relative", overflow: "hidden" } },
          React.createElement("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` } }),
          React.createElement("div", { style: { fontSize: 24, marginBottom: 8 } }, "🏆"),
          React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: GOLD } }, t.name),
          React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 4 } }, `${t.org} · ${t.year}`),
          isOwner && React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 10 } },
            React.createElement("button", { onClick: () => { setEditTitle({ ...t }); setShowTF(false); }, style: { ...btnOutline, padding: "3px 10px", fontSize: 11 } }, "Editar"),
            delTitleId === t.id
              ? React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
                  React.createElement("button", { onClick: () => deleteTitle(t.id), style: { ...btnRed, padding: "3px 10px", fontSize: 11, background: "#e0555522" } }, "Confirmar"),
                  React.createElement("button", { onClick: () => setDelTitleId(null), style: { ...btnOutline, padding: "3px 8px", fontSize: 11 } }, "✕")
                )
              : React.createElement("button", { onClick: () => setDelTitleId(t.id), style: { ...btnRed, padding: "3px 10px", fontSize: 11 } }, "Eliminar")
          )
        ))
      )
    );
  };

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    lightbox && React.createElement("div", { onClick: () => setLightbox(null), style: { position: "fixed", inset: 0, background: "#000000ee", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, cursor: "pointer" } },
      React.createElement("img", { src: lightbox, style: { maxWidth: "95vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" } })
    ),
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, setPage, pendingCount }),
      onBack && React.createElement("button", { onClick: onBack, style: { fontSize: 13, color: TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Voltar"),
      React.createElement(Card, { gold: true, style: { marginBottom: 14 } },
        React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 } },
          React.createElement("div", { style: { position: "relative", flexShrink: 0 } },
            React.createElement(Avatar, { name: f.name, size: 80, photo: f.photo }),
            isOwner && React.createElement("label", { style: { position: "absolute", bottom: 0, right: 0, background: GOLD, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13 } },
              "📷",
              React.createElement("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: e => {
                const file = e.target.files[0]; if (!file) return;
                if (file.size > MAX_FILE_SIZE) { alert("Foto demasiado grande. Máximo 2MB."); return; }
                const reader = new FileReader();
                reader.onload = async ev => { upd("photo", ev.target.result); await db.update("fighters", f.id, { photo: ev.target.result }); };
                reader.readAsDataURL(file);
              }})
            )
          ),
          React.createElement("div", { style: { flex: 1 } },
            isOwner
              ? React.createElement("input", { value: f.name || "", onChange: e => upd("name", e.target.value), style: { ...inp, fontSize: 18, fontWeight: 700, marginBottom: 10, background: "transparent", border: "none", borderBottom: `1px solid ${BORDER}`, borderRadius: 0, padding: "4px 0" } })
              : React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8 } }, f.name),
            React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
              React.createElement(Badge, { type: "gold" }, f.team),
              React.createElement(Badge, null, f.modality),
              React.createElement(Badge, { type: "blue" }, f.level),
              React.createElement(Badge, null, `${f.weight}kg`)
            ),
            daysLeft !== null && daysLeft >= 0 && React.createElement("div", { style: { marginTop: 10, display: "flex", alignItems: "center", gap: 8, background: BG3, borderRadius: 8, padding: "8px 12px", border: `1px solid ${daysLeft <= 7 ? "#e05555" : daysLeft <= 30 ? GOLD_DIM : BORDER}` } },
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontSize: 10, color: TEXT3, textTransform: "uppercase", letterSpacing: 1 } }, "Próxima luta"),
                React.createElement("div", { style: { fontSize: 13, color: TEXT, fontWeight: 600 } }, `vs. ${nextFight.opponent}${nextFight.event ? ` · ${nextFight.event}` : ""}`)
              ),
              React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: daysLeft <= 7 ? "#e05555" : daysLeft <= 30 ? GOLD : "#4caf7d" } }, daysLeft),
                React.createElement("div", { style: { fontSize: 9, color: TEXT3, textTransform: "uppercase" } }, "dias")
              )
            )
          )
        ),
        React.createElement(GoldDivider),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement(StatBox, { label: "Vitórias", value: wins, color: "#4caf7d", sub: kos > 0 ? `${kos} KO` : null }),
          React.createElement(StatBox, { label: "Derrotas", value: losses, color: "#e05555" }),
          React.createElement(StatBox, { label: "Empates", value: draws, color: TEXT3 }),
          React.createElement(StatBox, { label: "Win Rate", value: wr + "%", color: GOLD })
        )
      ),
      React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 16, background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 4 } },
        TABS.map((t, i) => React.createElement("button", { key: t, onClick: () => setTab(i), style: { flex: 1, padding: "7px 4px", borderRadius: 6, border: "none", background: tab === i ? GOLD : "transparent", color: tab === i ? "#000" : TEXT2, cursor: "pointer", fontSize: 12, fontWeight: tab === i ? 700 : 400 } }, t))
      ),
      tabContent()
    )
  );
}

function InviteModal({ fighter, user, onClose }) {
  const subject = encodeURIComponent("Convite - Norte Forte Fighters App");
  const body = encodeURIComponent(`Olá ${fighter.name},\n\nFoste adicionado à Norte Forte Fighters App.\n\nAcede à app aqui: https://norteforte.vercel.app\n\nUsername: ${user.username}\nPassword: ${user.password}\n\nNorte Forte`);
  return React.createElement("div", { style: { position: "fixed", inset: 0, background: "#000000bb", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 } },
    React.createElement(Card, { gold: true, style: { maxWidth: 400, width: "100%" } },
      React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 } }, `Convite para ${fighter.name}`),
      React.createElement(GoldDivider),
      React.createElement("div", { style: { marginBottom: 8 } }, React.createElement("div", { style: lbl }, "Link da App"), React.createElement("div", { style: { fontSize: 14, color: GOLD, fontWeight: 700 } }, "https://norteforte.vercel.app")),
      React.createElement("div", { style: { marginBottom: 8 } }, React.createElement("div", { style: lbl }, "Username"), React.createElement("div", { style: { fontSize: 16, color: GOLD, fontWeight: 700 } }, user.username)),
      React.createElement("div", { style: { marginBottom: 16 } }, React.createElement("div", { style: lbl }, "Password"), React.createElement("div", { style: { fontSize: 16, color: GOLD, fontWeight: 700 } }, user.password)),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("a", { href: `mailto:${fighter.email}?subject=${subject}&body=${body}`, style: { ...btnGold, marginTop: 0, flex: 1, textAlign: "center", textDecoration: "none", display: "block" } }, "✉ Enviar Convite"),
        React.createElement("button", { onClick: onClose, style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Fechar")
      )
    )
  );
}

function AdminDashboard({ fighters, setFighters, users, setUsers, onLogout, user, page, setPage, pendingCount }) {
  const [selected, setSelected] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [delId, setDelId] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [resetData, setResetData] = useState(null); // { fighter, newPw }

  async function resetPassword(fighter) {
    const fu = users.find(u => u.fighter_id === fighter.id);
    if (!fu) return alert("Este atleta não tem conta associada.");
    const newPw = generatePassword();
    await db.update("users", fu.id, { password: newPw });
    setResetData({ fighter, newPw });
  }

  if (page === "pending") return React.createElement(PendingPage, { onLogout, user, setPage, setUsers, users, pendingCount });
  if (page === "teams") return React.createElement(TeamsPage, { onLogout, user, setPage, pendingCount });
  if (page === "calendar") return React.createElement(CalendarPage, { onLogout, user, setPage, pendingCount });

  // Modal de password redefinida
  if (resetData) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement(Card, { gold: true, style: { maxWidth: 400, width: "100%" } },
      React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 } }, `Password redefinida — ${resetData.fighter.name}`),
      React.createElement(GoldDivider),
      React.createElement("div", { style: { fontSize: 13, color: TEXT2, marginBottom: 12 } }, "Nova password gerada. Envia ao atleta:"),
      React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: GOLD, textAlign: "center", padding: "14px", background: BG3, borderRadius: 8, marginBottom: 16, letterSpacing: 2 } }, resetData.newPw),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("button", { onClick: () => { navigator.clipboard && navigator.clipboard.writeText(resetData.newPw); }, style: { ...btnOutline, flex: 1, marginTop: 0 } }, "📋 Copiar"),
        React.createElement("button", { onClick: () => setResetData(null), style: { ...btnGold, flex: 1, marginTop: 0 } }, "Fechar")
      )
    )
  );

  if (showNewForm) return React.createElement(NewFighterForm, {
    onBack: () => setShowNewForm(false),
    onSave: async (fighter, newUser) => {
      await db.insert("fighters", { id: fighter.id, name: fighter.name, weight: fighter.weight, category: fighter.category, modality: fighter.modality, sub_modality: fighter.sub_modality, level: fighter.level, contact: fighter.contact, email: fighter.email, team: fighter.team, available: false, status: "approved" });
      await db.insert("users", newUser);
      setFighters(p => [...p, fighter]); setUsers(p => [...p, newUser]);
      setShowNewForm(false); setInviteData({ fighter, user: newUser });
    },
    onLogout, user, existingUsernames: users.map(u => u.username)
  });

  if (selected) return React.createElement(FighterProfile, {
    fighter: selected, onBack: () => setSelected(null),
    onSave: f => setFighters(p => p.map(x => x.id === f.id ? f : x)),
    user, isOwner: true, onLogout, setPage, pendingCount
  });

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "fighters", setPage, pendingCount }),
      inviteData && React.createElement(InviteModal, { fighter: inviteData.fighter, user: inviteData.user, onClose: () => setInviteData(null) }),
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        React.createElement("span", { style: { fontSize: 13, color: TEXT2, textTransform: "uppercase", letterSpacing: 1 } }, `${fighters.length} lutadores`),
        React.createElement("button", { onClick: () => setShowNewForm(true), style: btnOutline }, "+ Novo Lutador")
      ),
      delId && React.createElement("div", { style: { background: "#1a0a0a", border: `1px solid #e0555544`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" } },
        React.createElement("span", { style: { fontSize: 13, color: "#e05555" } }, `Eliminar ${fighters.find(f => f.id === delId)?.name}?`),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: async () => { await db.delete("fighters", delId); setFighters(p => p.filter(f => f.id !== delId)); setDelId(null); }, style: { ...btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: "#e05555" } }, "Eliminar"),
          React.createElement("button", { onClick: () => setDelId(null), style: { ...btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Cancelar")
        )
      ),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        fighters.map(f => {
          const fu = users.find(u => u.fighter_id === f.id);
          return React.createElement("div", { key: f.id, style: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }, onMouseEnter: e => e.currentTarget.style.borderColor = GOLD_DIM, onMouseLeave: e => e.currentTarget.style.borderColor = BORDER },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }, onClick: () => setSelected(f) },
              React.createElement(Avatar, { name: f.name, size: 36, photo: f.photo }),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 } },
                  React.createElement("span", { style: { fontWeight: 700, fontSize: 16, color: TEXT } }, f.name),
                  React.createElement(Badge, { type: "gold" }, f.team)
                ),
                React.createElement("div", { style: { fontSize: 13, color: TEXT2 } }, `${f.modality} · ${f.sub_modality} · ${f.level} · ${f.weight}kg`),
                fu && React.createElement("div", { style: { fontSize: 11, color: TEXT3, marginTop: 2 } }, `@${fu.username} · ${f.email}`)
              )
            ),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" } },
              fu && React.createElement("button", { onClick: () => setInviteData({ fighter: f, user: fu }), style: { ...btnOutline, padding: "4px 12px", fontSize: 12 } }, "✉ Convite"),
              React.createElement("button", { onClick: () => resetPassword(f), style: { ...btnOutline, padding: "4px 12px", fontSize: 12, borderColor: "#5b8fd4", color: "#5b8fd4" } }, "🔑 Password"),
              React.createElement("button", { onClick: () => setDelId(f.id), style: { ...btnRed, padding: "4px 12px", fontSize: 12 } }, "✕ Eliminar")
            )
          );
        })
      )
    )
  );
}

function AthleteView({ fighters, user, onLogout, setPage, pendingCount }) {
  const fighter = fighters.find(f => f.id === user.fighter_id);
  if (!fighter) return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "", setPage, pendingCount }),
      React.createElement(Card, null, React.createElement("div", { style: { color: TEXT2, textAlign: "center", padding: "24px 0" } }, "Perfil ainda não criado. Contacta o admin."))
    )
  );
  return React.createElement(FighterProfile, { fighter, onBack: null, onSave: () => {}, user, isOwner: true, onLogout, setPage, pendingCount });
}

function NewFighterForm({ onSave, onBack, onLogout, user, existingUsernames }) {
  const [f, setF] = useState({ name: "", weight: "", category: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", contact: "", email: "", team: "Norte Forte" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!f.name.trim()) return setErr("Nome obrigatório.");
    if (!f.email.includes("@")) return setErr("E-mail válido obrigatório.");
    setSaving(true);
    const id = Date.now();
    let username = emailToUsername(f.email);
    let base = username; let i = 2;
    while (existingUsernames.includes(username)) { username = base + i; i++; }
    const password = generatePassword();
    const newUser = { id: `user_${id}`, name: san(f.name, 100), role: "athlete", fighter_id: id, username, password, email: san(f.email, 100) };
    await onSave({ ...f, name: san(f.name, 100), email: san(f.email, 100), team: san(f.team, 100), id, weight: Number(f.weight) || 0 }, newUser);
    setSaving(false);
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user }),
      React.createElement("button", { onClick: onBack, style: { fontSize: 13, color: TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Voltar"),
      React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 4, textTransform: "uppercase" } }, "Novo Lutador"),
      React.createElement("div", { style: { width: 30, height: 2, background: GOLD, marginBottom: 16, borderRadius: 2 } }),
      React.createElement(Card, null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          [["Nome completo", "name"], ["Equipa", "team"], ["Peso (kg)", "weight"], ["Escalão", "category"], ["Contacto", "contact"]].map(([l, k]) =>
            React.createElement("div", { key: k }, React.createElement("label", { style: lbl }, l), React.createElement("input", { style: inp, value: f[k], onChange: e => upd(k, e.target.value) }))
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { ...lbl, color: GOLD } }, "E-mail (para gerar credenciais)"),
            React.createElement("input", { style: { ...inp, borderColor: GOLD_DIM }, value: f.email, onChange: e => upd("email", e.target.value), placeholder: "atleta@email.com" })
          ),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"), React.createElement("select", { style: inp, value: f.modality, onChange: e => upd("modality", e.target.value) }, Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"), React.createElement("select", { style: inp, value: f.level, onChange: e => upd("level", e.target.value) }, LEVELS.map(l => React.createElement("option", { key: l }, l))))
        ),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginTop: 10 } }, err),
        React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 12, padding: "8px 12px", background: BG3, borderRadius: 6 } }, "ℹ️ Credenciais geradas automaticamente."),
        React.createElement("button", { onClick: handleSave, disabled: saving, style: { ...btnGold, opacity: saving ? 0.7 : 1 } }, saving ? "A criar..." : "Criar Perfil e Gerar Acesso")
      )
    )
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [fighters, setFighters] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState("fighters");
  const [pendingCount, setPendingCount] = useState(0);

  const isRegister = window.location.search.includes("register=true");
  if (isRegister) return React.createElement(RegisterPage);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const [f, u] = await Promise.all([db.get("fighters"), db.get("users")]);
      setFighters(f.filter(x => x.status !== "pending" && x.status !== "rejected"));
      setPendingCount(f.filter(x => x.status === "pending").length);
      setUsers(u);
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) return React.createElement(Login, { onLogin: u => { setUser(u); setPage("fighters"); } });

  if (loading) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { color: GOLD, fontSize: 14 } }, "A carregar dados...")
  );

  if (page === "calendar") return React.createElement(React.Fragment, null,
    React.createElement(CalendarPage, { onLogout: () => { setUser(null); setPage("fighters"); }, user, setPage, pendingCount }),
    React.createElement(Footer)
  );

  if (user.role === "admin") return React.createElement(React.Fragment, null,
    React.createElement(AdminDashboard, { fighters, setFighters, users, setUsers, onLogout: () => { setUser(null); setPage("fighters"); }, user, page, setPage, pendingCount }),
    React.createElement(Footer)
  );
  return React.createElement(React.Fragment, null,
    React.createElement(AthleteView, { fighters, user, onLogout: () => setUser(null), setPage, pendingCount }),
    React.createElement(Footer)
  );
}

function Footer() {
  return React.createElement("div", { style: { textAlign: "center", padding: "24px 16px", borderTop: `1px solid #2a2a2a`, marginTop: 20, fontSize: 11, color: "#555", letterSpacing: 1 } },
    "Norte Forte Fighters App · Designed & developed by Ricardo Quintela · © 2026"
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));