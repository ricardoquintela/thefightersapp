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

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function emailToUsername(email) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
}

const inp = { padding: "8px 12px", borderRadius: 6, border: `1px solid ${BORDER}`, background: BG3, color: TEXT, fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" };
const lbl = { fontSize: 11, color: TEXT3, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" };
const btnGold = { padding: "9px 22px", borderRadius: 6, border: "none", background: GOLD, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 12 };
const btnOutline = { padding: "6px 14px", borderRadius: 6, border: `1px solid ${GOLD_DIM}`, background: "transparent", cursor: "pointer", fontSize: 13, color: GOLD, fontWeight: 600 };
const btnRed = { padding: "6px 14px", borderRadius: 6, border: `1px solid #e0555566`, background: "transparent", cursor: "pointer", fontSize: 13, color: "#e05555", fontWeight: 600 };
const btnGreen = { padding: "6px 14px", borderRadius: 6, border: `1px solid #4caf7d66`, background: "transparent", cursor: "pointer", fontSize: 13, color: "#4caf7d", fontWeight: 600 };

function Logo() {
  return React.createElement("div", { style: { textAlign: "center", marginBottom: 6 } },
    React.createElement("div", { style: { fontSize: 10, color: "#aaa", letterSpacing: 5, marginBottom: 4, fontWeight: 600, textTransform: "uppercase" } }, "The Fighters App"),
    React.createElement("div", { style: { fontFamily: "'Arial Black', Impact, sans-serif", fontSize: 34, fontWeight: 900, color: GOLD, lineHeight: 1.0, letterSpacing: 2, textTransform: "uppercase" } }, "Norte Forte"),
    React.createElement("div", { style: { fontSize: 10, color: "#aaa", letterSpacing: 5, marginTop: 4, fontWeight: 600, textTransform: "uppercase" } }, "Porto · Portugal")
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

function Header({ onLogout, user, currentPage, setPage }) {
  return React.createElement("div", { style: { textAlign: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${BORDER}`, position: "relative" } },
    React.createElement(Logo),
    user && React.createElement("div", { style: { position: "absolute", right: 0, top: 0, display: "flex", alignItems: "center", gap: 8 } },
      React.createElement("div", { style: { textAlign: "right" } },
        React.createElement("div", { style: { fontSize: 12, color: TEXT, fontWeight: 600 } }, user.name),
        React.createElement("div", { style: { fontSize: 11, color: user.role === "admin" ? GOLD : TEXT2 } }, user.role === "admin" ? "Admin" : "Atleta")
      ),
      React.createElement("button", { onClick: onLogout, style: { padding: "5px 10px", borderRadius: 6, border: `1px solid ${BORDER}`, background: "transparent", color: TEXT2, cursor: "pointer", fontSize: 12 } }, "Sair")
    ),
    user && user.role === "admin" && setPage && React.createElement("div", { style: { display: "flex", gap: 8, justifyContent: "center", marginTop: 12 } },
      React.createElement("button", { onClick: () => setPage("fighters"), style: { ...btnOutline, fontSize: 11, padding: "4px 12px", background: currentPage === "fighters" ? GOLD_DIM : "transparent", color: currentPage === "fighters" ? "#fff" : GOLD } }, "Lutadores"),
      React.createElement("button", { onClick: () => setPage("pending"), style: { ...btnOutline, fontSize: 11, padding: "4px 12px", background: currentPage === "pending" ? GOLD_DIM : "transparent", color: currentPage === "pending" ? "#fff" : GOLD } }, "Pedidos"),
      React.createElement("button", { onClick: () => setPage("teams"), style: { ...btnOutline, fontSize: 11, padding: "4px 12px", background: currentPage === "teams" ? GOLD_DIM : "transparent", color: currentPage === "teams" ? "#fff" : GOLD } }, "Equipas")
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
    const existing = await db.get("fighters", { email: f.email });
    if (existing.length > 0) { setSaving(false); return setErr("Este e-mail já está registado."); }
    const id = Date.now();
    await db.insert("fighters", { ...f, id, weight: Number(f.weight) || 0, available: false, status: "pending", registration_date: new Date().toISOString() });
    setSaving(false);
    setDone(true);
  }

  if (done) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 16 } },
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

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: 16 } },
    React.createElement("div", { style: { width: "100%", maxWidth: 500 } },
      React.createElement("div", { style: { marginBottom: 24 } }, React.createElement(Logo)),
      React.createElement("div", { style: { fontSize: 14, color: TEXT2, textAlign: "center", marginBottom: 20 } }, "Preenche os teus dados para te juntares à Norte Forte Fighters App"),
      React.createElement(Card, null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          [["Nome completo", "name"], ["Peso (kg)", "weight"], ["Escalão", "category"], ["Contacto", "contact"]].map(([l, k]) =>
            React.createElement("div", { key: k },
              React.createElement("label", { style: lbl }, l),
              React.createElement("input", { style: inp, value: f[k], onChange: e => upd(k, e.target.value) })
            )
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { ...lbl, color: GOLD } }, "E-mail"),
            React.createElement("input", { style: { ...inp, borderColor: GOLD_DIM }, value: f.email, onChange: e => upd("email", e.target.value), placeholder: "o teu e-mail" })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Modalidade"),
            React.createElement("select", { style: inp, value: f.modality, onChange: e => upd("modality", e.target.value) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Nível"),
            React.createElement("select", { style: inp, value: f.level, onChange: e => upd("level", e.target.value) },
              LEVELS.map(l => React.createElement("option", { key: l }, l))
            )
          )
        ),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginTop: 10 } }, err),
        React.createElement("button", { onClick: handleRegister, disabled: saving, style: { ...btnGold, width: "100%", marginTop: 16, opacity: saving ? 0.7 : 1 } }, saving ? "A enviar..." : "Enviar Pedido de Registo")
      )
    )
  );
}

function PendingPage({ onLogout, user, setPage, setUsers, users }) {
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

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px", fontFamily: "system-ui, sans-serif" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "pending", setPage }),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 } }, `Pedidos Pendentes · ${pending.length}`),
      loading && React.createElement("div", { style: { color: TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      pending.length === 0 && !loading && React.createElement(Card, null,
        React.createElement("div", { style: { color: TEXT3, textAlign: "center", padding: "24px 0" } }, "Nenhum pedido pendente.")
      ),
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

function TeamsPage({ onLogout, user, setPage }) {
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
      setAllFighters(approved);
      setAllFights(fights);
      const teamMap = {};
      approved.forEach(f => {
        const t = f.team || "Sem Equipa";
        if (!teamMap[t]) teamMap[t] = [];
        teamMap[t].push(f);
      });
      setTeams(Object.entries(teamMap).map(([name, fighters]) => ({ name, fighters })));
      setLoading(false);
    }
    load();
  }, []);

  function getRecord(fighterId) {
    const fights = allFights.filter(f => f.fighter_id === fighterId);
    const wins = fights.filter(x => x.result === "V").length;
    const losses = fights.filter(x => x.result === "D").length;
    const draws = fights.filter(x => x.result === "E").length;
    const kos = fights.filter(x => x.result === "V" && x.method === "KO/TKO").length;
    return { wins, losses, draws, kos, total: fights.length };
  }

  if (selFighter) {
    const rec = getRecord(selFighter.id);
    const wr = rec.total > 0 ? Math.round(rec.wins / rec.total * 100) : 0;
    const fighterFights = allFights.filter(f => f.fighter_id === selFighter.id);
    return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px", fontFamily: "system-ui, sans-serif" } },
      React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
        React.createElement(Header, { onLogout, user, currentPage: "teams", setPage }),
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
        React.createElement("div", { style: { fontSize: 12, color: TEXT3, textAlign: "center", marginBottom: 16, padding: "8px", background: BG2, borderRadius: 6, border: `1px solid ${BORDER}` } },
          "🔒 Apenas records públicos. Contactos não disponíveis."
        ),
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: TEXT2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 } },
          `Histórico · ${fighterFights.length} combates`
        ),
        fighterFights.length === 0
          ? React.createElement(Card, null, React.createElement("div", { style: { color: TEXT3, textAlign: "center", padding: "16px 0" } }, "Sem combates registados."))
          : fighterFights.map((fight, i) =>
              React.createElement(Card, { key: i, style: { marginBottom: 8 } },
                React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
                  React.createElement(ResultBadge, { r: fight.result }),
                  React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: TEXT } },
                      `vs. ${fight.opponent}`,
                      fight.opponent_team && React.createElement("span", { style: { fontSize: 12, color: TEXT3, marginLeft: 6 } }, `(${fight.opponent_team})`)
                    ),
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
              )
            )
      )
    );
  }

  if (selected) {
    const teamFighters = allFighters.filter(f => (f.team || "Sem Equipa") === selected);
    return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px", fontFamily: "system-ui, sans-serif" } },
      React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
        React.createElement(Header, { onLogout, user, currentPage: "teams", setPage }),
        React.createElement("button", { onClick: () => setSelected(null), style: { fontSize: 13, color: TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Equipas"),
        React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: GOLD, marginBottom: 4, textTransform: "uppercase", letterSpacing: 2 } }, selected),
        React.createElement("div", { style: { fontSize: 13, color: TEXT2, marginBottom: 16 } }, `${teamFighters.length} atleta${teamFighters.length !== 1 ? "s" : ""}`),
        React.createElement(GoldDivider),
        teamFighters.map(f => {
          const rec = getRecord(f.id);
          return React.createElement("div", { key: f.id,
            style: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer" },
            onMouseEnter: e => e.currentTarget.style.borderColor = GOLD_DIM,
            onMouseLeave: e => e.currentTarget.style.borderColor = BORDER,
            onClick: () => setSelFighter(f)
          },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
              React.createElement(Avatar, { name: f.name, size: 36, photo: f.photo }),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 4 } }, f.name),
                React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 } },
                  React.createElement(Badge, null, f.modality),
                  f.sub_modality && React.createElement(Badge, { type: "gold" }, f.sub_modality),
                  React.createElement(Badge, { type: "blue" }, f.level),
                  React.createElement(Badge, null, `${f.weight}kg`)
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

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px", fontFamily: "system-ui, sans-serif" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "teams", setPage }),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 } }, `Equipas · ${teams.length}`),
      loading && React.createElement("div", { style: { color: TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      teams.map(t => {
        const totalFights = t.fighters.reduce((acc, f) => acc + allFights.filter(x => x.fighter_id === f.id).length, 0);
        const totalWins = t.fighters.reduce((acc, f) => acc + allFights.filter(x => x.fighter_id === f.id && x.result === "V").length, 0);
        return React.createElement("div", { key: t.name,
          style: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px", marginBottom: 8, cursor: "pointer" },
          onMouseEnter: e => e.currentTarget.style.borderColor = GOLD_DIM,
          onMouseLeave: e => e.currentTarget.style.borderColor = BORDER,
          onClick: () => setSelected(t.name)
        },
          React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
            React.createElement("div", null,
              React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: GOLD, marginBottom: 4 } }, t.name),
              React.createElement("div", { style: { fontSize: 13, color: TEXT2 } },
                `${t.fighters.length} atleta${t.fighters.length !== 1 ? "s" : ""}`,
                totalFights > 0 && React.createElement("span", { style: { color: TEXT3, marginLeft: 8 } },
                  `· ${totalWins}V / ${totalFights - totalWins}D em ${totalFights} combates`
                )
              )
            ),
            React.createElement("div", { style: { fontSize: 20, color: TEXT3 } }, "›")
          )
        );
      })
    )
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function doLogin() {
    setLoading(true);
    const users = await db.get("users", { username: username.trim().toLowerCase() });
    setLoading(false);
    if (users.length > 0 && users[0].password === pw) onLogin(users[0]);
    else setErr("Credenciais incorretas.");
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { width: 340, padding: 16 } },
      React.createElement("div", { style: { marginBottom: 28 } },
        React.createElement(Logo),
        React.createElement("div", { style: { width: 40, height: 2, background: GOLD, margin: "10px auto 0", borderRadius: 2 } })
      ),
      React.createElement(Card, { gold: true },
        React.createElement("div", { style: { marginBottom: 16 } },
          React.createElement("label", { style: lbl }, "Username"),
          React.createElement("input", { style: inp, value: username, onChange: e => setUsername(e.target.value), onKeyDown: e => e.key === "Enter" && doLogin(), placeholder: "username" })
        ),
        React.createElement("div", { style: { marginBottom: 16 } },
          React.createElement("label", { style: lbl }, "Password"),
          React.createElement("input", { type: "password", style: inp, value: pw, onChange: e => setPw(e.target.value), onKeyDown: e => e.key === "Enter" && doLogin(), placeholder: "••••••••" })
        ),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginBottom: 10 } }, err),
        React.createElement("div", { style: { fontSize: 12, color: TEXT3, marginBottom: 14 } }, "Admin: admin / admin123"),
        React.createElement("button", { onClick: doLogin, disabled: loading, style: { ...btnGold, width: "100%", marginTop: 0, padding: "11px", opacity: loading ? 0.7 : 1 } }, loading ? "A entrar..." : "Entrar"),
        React.createElement("div", { style: { textAlign: "center", marginTop: 16 } },
          React.createElement("a", { href: "?register=true", style: { fontSize: 12, color: GOLD_DIM, textDecoration: "none" } }, "Quero registar-me →")
        )
      )
    )
  );
}

function FighterProfile({ fighter, onBack, onSave, user, isOwner, onLogout }) {
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
  const [nu, setNu] = useState({ opponent: "", event: "", date: "", local: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador" });
  const [nt, setNt] = useState({ name: "", org: "", year: 2026 });

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

  async function saveProfile() {
    setSaving(true);
    await db.update("fighters", f.id, { name: f.name, weight: f.weight, category: f.category, contact: f.contact, modality: f.modality, sub_modality: f.sub_modality, level: f.level, available: f.available, photo: f.photo });
    setSaving(false);
  }

  async function saveFight() {
    const fight = { ...nf, id: `f${Date.now()}`, fighter_id: f.id, flagged: false, flag_note: "" };
    await db.insert("fights", fight);
    setF(p => ({ ...p, fights: [fight, ...p.fights] }));
    setShowFF(false);
    setNf({ ...EMPTY_FIGHT });
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
    const u = { ...nu, id: `u${Date.now()}`, fighter_id: f.id };
    await db.insert("upcoming", u);
    setF(p => ({ ...p, upcoming: [...p.upcoming, u] }));
    setShowUF(false);
    setNu({ opponent: "", event: "", date: "", local: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador" });
  }

  async function saveTitle() {
    const res = await db.insert("titles", { ...nt, year: Number(nt.year), fighter_id: f.id });
    setF(p => ({ ...p, titles: [...p.titles, res[0] || nt] }));
    setShowTF(false);
    setNt({ name: "", org: "", year: 2026 });
  }

  async function saveEditTitle() {
    await db.update("titles", editTitle.id, { name: editTitle.name, org: editTitle.org, year: Number(editTitle.year) });
    setF(p => ({ ...p, titles: p.titles.map(x => x.id === editTitle.id ? { ...editTitle } : x) }));
    setEditTitle(null);
  }

  async function deleteTitle(titleId) {
    await db.delete("titles", titleId);
    setF(p => ({ ...p, titles: p.titles.filter(x => x.id !== titleId) }));
    setDelTitleId(null);
  }

  const TABS = ["Perfil", "Histórico", "Próximas Lutas", "Títulos", "Transferência"];

  if (loading) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { color: GOLD, fontSize: 14 } }, "A carregar...")
  );

  const tabContent = () => {
    if (tab === 0) return React.createElement(Card, null,
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
        [["Equipa", "team"], ["Peso (kg)", "weight"], ["Escalão", "category"], ["Contacto", "contact"]].map(([l, k]) =>
          React.createElement("div", { key: k },
            React.createElement("label", { style: lbl }, l),
            isOwner
              ? React.createElement("input", { style: inp, value: f[k] || "", onChange: e => upd(k, e.target.value) })
              : React.createElement("div", { style: { fontSize: 14, color: TEXT, padding: "8px 0" } }, f[k])
          )
        ),
        isOwner && React.createElement(React.Fragment, null,
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Modalidade"),
            React.createElement("select", { style: inp, value: f.modality || "Kickboxing", onChange: e => upd("modality", e.target.value) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Nível"),
            React.createElement("select", { style: inp, value: f.level || "Amador", onChange: e => upd("level", e.target.value) },
              LEVELS.map(l => React.createElement("option", { key: l }, l))
            )
          )
        )
      ),
      isOwner && React.createElement("button", { onClick: saveProfile, disabled: saving, style: { ...btnGold, opacity: saving ? 0.7 : 1 } }, saving ? "A guardar..." : "Guardar alterações")
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
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: TEXT } },
              fight.opponent,
              fight.opponent_team && React.createElement("span", { style: { fontSize: 12, color: TEXT3, marginLeft: 6 } }, `(${fight.opponent_team})`)
            ),
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
            React.createElement("button", {
              onClick: () => { setEditFight({ ...fight }); setShowFF(false); window.scrollTo(0, 0); },
              style: { ...btnOutline, padding: "4px 12px", fontSize: 12 }
            }, "Editar"),
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
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Adversário"), React.createElement("input", { style: inp, value: nu.opponent, onChange: e => setNu({ ...nu, opponent: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: nu.date, onChange: e => setNu({ ...nu, date: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Evento"), React.createElement("input", { style: inp, value: nu.event, onChange: e => setNu({ ...nu, event: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Local"), React.createElement("input", { style: inp, value: nu.local, onChange: e => setNu({ ...nu, local: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"),
            React.createElement("select", { style: inp, value: nu.modality, onChange: e => setNu({ ...nu, modality: e.target.value, sub_modality: MODALITIES[e.target.value][0] }) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Disciplina"),
            React.createElement("select", { style: inp, value: nu.sub_modality, onChange: e => setNu({ ...nu, sub_modality: e.target.value }) },
              (MODALITIES[nu.modality] || []).map(s => React.createElement("option", { key: s }, s))
            )
          )
        ),
        React.createElement("button", { onClick: saveUpcoming, style: btnGold }, "Guardar")
      ),
      f.upcoming.map((u, i) => React.createElement(Card, { key: i, style: { marginBottom: 8 } },
        React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
          React.createElement("div", { style: { background: BG3, border: `1px solid ${GOLD_DIM}`, borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 48 } },
            React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: GOLD } }, u.date?.slice(8, 10)),
            React.createElement("div", { style: { fontSize: 10, color: TEXT2 } }, `${u.date?.slice(5, 7)}/${u.date?.slice(2, 4)}`)
          ),
          React.createElement("div", null,
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: TEXT } }, `vs. ${u.opponent}`),
            React.createElement("div", { style: { fontSize: 12, color: TEXT2, marginTop: 2 } }, `${u.event} · ${u.local}`),
            React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
              React.createElement(Badge, null, u.modality),
              React.createElement(Badge, { type: "gold" }, u.sub_modality),
              React.createElement(Badge, { type: "blue" }, u.level)
            )
          )
        )
      ))
    );

    if (tab === 3) return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: TEXT, textTransform: "uppercase" } }, `Títulos · ${f.titles.length}`),
        isOwner && React.createElement("button", { onClick: () => { setShowTF(p => !p); setEditTitle(null); }, style: btnOutline }, "+ Adicionar")
      ),
      // Formulário novo título
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
      // Formulário editar título
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
          // Botões editar/eliminar
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

    if (tab === 4) return React.createElement(Card, null,
      isOwner ? React.createElement(React.Fragment, null,
        React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 12 } },
          React.createElement("div", { onClick: () => upd("available", !f.available), style: { width: 42, height: 24, borderRadius: 12, background: f.available ? GOLD : BG4, border: `1px solid ${f.available ? GOLD : BORDER}`, position: "relative", cursor: "pointer", flexShrink: 0 } },
            React.createElement("div", { style: { position: "absolute", top: 3, left: f.available ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: f.available ? "#000" : TEXT3, transition: "left 0.2s" } })
          ),
          React.createElement("span", { style: { fontWeight: 700, fontSize: 15, color: TEXT } }, "Disponível para transferência")
        ),
        React.createElement("button", { onClick: saveProfile, style: btnGold }, "Guardar")
      ) : React.createElement("div", { style: { color: TEXT2, fontSize: 14 } }, f.available ? "Disponível para transferência." : "Não disponível.")
    );
  };

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user }),
      onBack && React.createElement("button", { onClick: onBack, style: { fontSize: 13, color: TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Voltar"),
      React.createElement(Card, { gold: true, style: { marginBottom: 14 } },
        React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 } },
          React.createElement("div", { style: { position: "relative", flexShrink: 0 } },
            React.createElement(Avatar, { name: f.name, size: 80, photo: f.photo }),
            isOwner && React.createElement("label", { style: { position: "absolute", bottom: 0, right: 0, background: GOLD, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13 } },
              "📷",
              React.createElement("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async ev => {
                  upd("photo", ev.target.result);
                  await db.update("fighters", f.id, { photo: ev.target.result });
                };
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
      React.createElement("div", { style: { marginBottom: 8 } },
        React.createElement("div", { style: lbl }, "Link da App"),
        React.createElement("div", { style: { fontSize: 14, color: GOLD, fontWeight: 700 } }, "https://norteforte.vercel.app")
      ),
      React.createElement("div", { style: { marginBottom: 8 } },
        React.createElement("div", { style: lbl }, "Username"),
        React.createElement("div", { style: { fontSize: 16, color: GOLD, fontWeight: 700 } }, user.username)
      ),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("div", { style: lbl }, "Password"),
        React.createElement("div", { style: { fontSize: 16, color: GOLD, fontWeight: 700 } }, user.password)
      ),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("a", { href: `mailto:${fighter.email}?subject=${subject}&body=${body}`, style: { ...btnGold, marginTop: 0, flex: 1, textAlign: "center", textDecoration: "none", display: "block" } }, "✉ Enviar Convite"),
        React.createElement("button", { onClick: onClose, style: { ...btnGold, marginTop: 0, background: BG4, color: TEXT2, border: `1px solid ${BORDER}` } }, "Fechar")
      )
    )
  );
}

function AdminDashboard({ fighters, setFighters, users, setUsers, onLogout, user, page, setPage }) {
  const [selected, setSelected] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [delId, setDelId] = useState(null);
  const [inviteData, setInviteData] = useState(null);

  if (page === "pending") return React.createElement(PendingPage, { onLogout, user, setPage, setUsers, users });
  if (page === "teams") return React.createElement(TeamsPage, { onLogout, user, setPage });

  if (showNewForm) return React.createElement(NewFighterForm, {
    onBack: () => setShowNewForm(false),
    onSave: async (fighter, newUser) => {
      await db.insert("fighters", { id: fighter.id, name: fighter.name, weight: fighter.weight, category: fighter.category, modality: fighter.modality, sub_modality: fighter.sub_modality, level: fighter.level, contact: fighter.contact, email: fighter.email, team: fighter.team, available: false, status: "approved" });
      await db.insert("users", newUser);
      setFighters(p => [...p, fighter]);
      setUsers(p => [...p, newUser]);
      setShowNewForm(false);
      setInviteData({ fighter, user: newUser });
    },
    onLogout, user,
    existingUsernames: users.map(u => u.username)
  });

  if (selected) return React.createElement(FighterProfile, {
    fighter: selected, onBack: () => setSelected(null),
    onSave: f => setFighters(p => p.map(x => x.id === f.id ? f : x)),
    user, isOwner: true, onLogout
  });

  return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "fighters", setPage }),
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
          return React.createElement("div", { key: f.id, style: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" },
            onMouseEnter: e => e.currentTarget.style.borderColor = GOLD_DIM,
            onMouseLeave: e => e.currentTarget.style.borderColor = BORDER
          },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }, onClick: () => setSelected(f) },
              React.createElement(Avatar, { name: f.name, size: 36, photo: f.photo }),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 } },
                  React.createElement("span", { style: { fontWeight: 700, fontSize: 16, color: TEXT } }, f.name),
                  React.createElement(Badge, { type: "gold" }, f.team),
                  f.available && React.createElement(Badge, { type: "green" }, "Disponível")
                ),
                React.createElement("div", { style: { fontSize: 13, color: TEXT2 } }, `${f.modality} · ${f.sub_modality} · ${f.level} · ${f.weight}kg`),
                fu && React.createElement("div", { style: { fontSize: 11, color: TEXT3, marginTop: 2 } }, `@${fu.username} · ${f.email}`)
              )
            ),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" } },
              fu && React.createElement("button", { onClick: () => setInviteData({ fighter: f, user: fu }), style: { ...btnOutline, padding: "4px 12px", fontSize: 12 } }, "✉ Convite"),
              React.createElement("button", { onClick: () => setDelId(f.id), style: { ...btnRed, padding: "4px 12px", fontSize: 12 } }, "✕ Eliminar")
            )
          );
        })
      )
    )
  );
}

function AthleteView({ fighters, user, onLogout }) {
  const fighter = fighters.find(f => f.id === user.fighter_id);
  if (!fighter) return React.createElement("div", { style: { minHeight: "100vh", background: BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user }),
      React.createElement(Card, null, React.createElement("div", { style: { color: TEXT2, textAlign: "center", padding: "24px 0" } }, "Perfil ainda não criado. Contacta o admin."))
    )
  );
  return React.createElement(FighterProfile, { fighter, onBack: null, onSave: () => {}, user, isOwner: true, onLogout });
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
    const newUser = { id: `user_${id}`, name: f.name, role: "athlete", fighter_id: id, username, password, email: f.email };
    await onSave({ ...f, id, weight: Number(f.weight) || 0 }, newUser);
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
            React.createElement("div", { key: k },
              React.createElement("label", { style: lbl }, l),
              React.createElement("input", { style: inp, value: f[k], onChange: e => upd(k, e.target.value) })
            )
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { ...lbl, color: GOLD } }, "E-mail (para gerar credenciais)"),
            React.createElement("input", { style: { ...inp, borderColor: GOLD_DIM }, value: f.email, onChange: e => upd("email", e.target.value), placeholder: "atleta@email.com" })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Modalidade"),
            React.createElement("select", { style: inp, value: f.modality, onChange: e => upd("modality", e.target.value) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Nível"),
            React.createElement("select", { style: inp, value: f.level, onChange: e => upd("level", e.target.value) },
              LEVELS.map(l => React.createElement("option", { key: l }, l))
            )
          )
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

  const isRegister = window.location.search.includes("register=true");
  if (isRegister) return React.createElement(RegisterPage);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const [f, u] = await Promise.all([db.get("fighters"), db.get("users")]);
      setFighters(f.filter(x => x.status !== "pending" && x.status !== "rejected"));
      setUsers(u);
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) return React.createElement(Login, { onLogin: u => { setUser(u); setPage("fighters"); } });

  if (loading) return React.createElement("div", { style: { minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { color: GOLD, fontSize: 14 } }, "A carregar dados...")
  );

  if (user.role === "admin") return React.createElement(React.Fragment, null,
    React.createElement(AdminDashboard, { fighters, setFighters, users, setUsers, onLogout: () => { setUser(null); setPage("fighters"); }, user, page, setPage }),
    React.createElement(Footer)
  );
  return React.createElement(React.Fragment, null,
    React.createElement(AthleteView, { fighters, user, onLogout: () => setUser(null) }),
    React.createElement(Footer)
  );
}

function Footer() {
  return React.createElement("div", { style: { textAlign: "center", padding: "24px 16px", borderTop: `1px solid #2a2a2a`, marginTop: 20, fontSize: 11, color: "#555", letterSpacing: 1 } },
    "Norte Forte Fighters App · Designed & developed by Ricardo Quintela · © 2025"
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));