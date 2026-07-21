// ═══════════════════════════════════════════════════════════
// PARTE 1: DB, THEME ENGINE, UTILITÁRIOS, COMPONENTES BASE
// ═══════════════════════════════════════════════════════════

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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(data)
    });
    if (!r.ok) {
      const err = await r.text();
      console.error(`db.update ${table} failed:`, r.status, err);
      throw new Error(err);
    }
    return true;
  },
  async delete(table, id) {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
  }
};

const { useState, useEffect } = React;

// ─── STORAGE UPLOAD ───────────────────────────────────────
async function compressImage(file, maxSize = 600, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob), "image/jpeg", quality);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadPhotoToStorage(file, fighterId) {
  // Convert file to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `fighters/${fighterId}.${ext}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": file.type,
      "x-upsert": "true"
    },
    body: arrayBuffer
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error("Upload falhou: " + err);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`;
}


// ─── THEME ENGINE ─────────────────────────────────────────
function isLightColor(hex) {
  if (!hex) return false;
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0,2),16);
  const g = parseInt(h.substr(2,2),16);
  const b = parseInt(h.substr(4,2),16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function buildTheme(club) {
  const primary = club?.primary_color || "#C9A84C";
  const secondary = club?.secondary_color || "#8a6f2e";
  return {
    GOLD: primary, GOLD_DIM: secondary,
    BG: "#0a0a0a", BG2: "#141414", BG3: "#1c1c1c", BG4: "#242424",
    BORDER: "#2a2a2a", BORDER_GOLD: secondary + "44",
    TEXT: "#f0f0f0", TEXT2: "#888", TEXT3: "#555",
  };
}
let T = buildTheme(null);

// ─── CONSTANTES ───────────────────────────────────────────
const MODALITIES = {
  "Kickboxing": ["Point Fighting", "Kick Light", "Light Contact", "Low Kick", "Full Contact", "K1"],
  "Muay Thai": ["Muay Thai"]
};
const LEVELS = ["Amador", "Neo-Profissional", "Profissional"];

const TATAMI_DISCIPLINES = ["Point Fighting", "Kick Light", "Light Contact"];
const RING_DISCIPLINES = ["Low Kick", "Full Contact", "K1"];

const ESCALOES_TATAMI = ["Crianças (7-9 anos)", "Cadetes Jovens (10-12 anos)", "Cadetes Mais Velhos (13-15 anos)", "Juniores (16-18 anos)", "Seniores (19-40 anos)", "Veteranos/Masters (41-55 anos)"];
const ESCALOES_RING = ["Juniores Mais Jovens (15-16 anos)", "Juniores Mais Velhos (17-18 anos)", "Seniores (19-40 anos)"];

const WEIGHT_CATEGORIES = {
  "Point Fighting": {
    "Crianças (7-9 anos)": { M: ["-18kg","-21kg","-24kg","-27kg","-30kg","-33kg","-36kg","+36kg"], F: ["-18kg","-21kg","-24kg","-27kg","-30kg","-33kg","-36kg","+36kg"] },
    "Cadetes Jovens (10-12 anos)": { M: ["-28kg","-32kg","-37kg","-42kg","-47kg","+47kg"], F: ["-28kg","-32kg","-37kg","-42kg","-47kg","+47kg"] },
    "Cadetes Mais Velhos (13-15 anos)": { M: ["-32kg","-37kg","-42kg","-47kg","-52kg","-57kg","-63kg","-69kg","+69kg"], F: ["-32kg","-37kg","-42kg","-46kg","-50kg","-55kg","-60kg","-65kg","+65kg"] },
    "Juniores (16-18 anos)": { M: ["-57kg","-63kg","-69kg","-74kg","-79kg","-84kg","-89kg","-94kg","+94kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Seniores (19-40 anos)": { M: ["-57kg","-63kg","-69kg","-74kg","-79kg","-84kg","-89kg","-94kg","+94kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Veteranos/Masters (41-55 anos)": { M: ["-63kg","-74kg","-84kg","-94kg","+94kg"], F: ["-55kg","-65kg","+65kg"] }
  },
  "Kick Light": {
    "Cadetes Mais Velhos (13-15 anos)": { M: ["-32kg","-37kg","-42kg","-47kg","-52kg","-57kg","-63kg","-69kg","+69kg"], F: ["-32kg","-37kg","-42kg","-46kg","-50kg","-55kg","-60kg","-65kg","+65kg"] },
    "Juniores (16-18 anos)": { M: ["-57kg","-63kg","-69kg","-74kg","-79kg","-84kg","-89kg","-94kg","+94kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Seniores (19-40 anos)": { M: ["-57kg","-63kg","-69kg","-74kg","-79kg","-84kg","-89kg","-94kg","+94kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Veteranos/Masters (41-55 anos)": { M: ["-63kg","-74kg","-84kg","-94kg","+94kg"], F: ["-55kg","-65kg","+65kg"] }
  },
  "Light Contact": {
    "Cadetes Mais Velhos (13-15 anos)": { M: ["-32kg","-37kg","-42kg","-47kg","-52kg","-57kg","-63kg","-69kg","+69kg"], F: ["-32kg","-37kg","-42kg","-46kg","-50kg","-55kg","-60kg","-65kg","+65kg"] },
    "Juniores (16-18 anos)": { M: ["-57kg","-63kg","-69kg","-74kg","-79kg","-84kg","-89kg","-94kg","+94kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Seniores (19-40 anos)": { M: ["-57kg","-63kg","-69kg","-74kg","-79kg","-84kg","-89kg","-94kg","+94kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Veteranos/Masters (41-55 anos)": { M: ["-63kg","-74kg","-84kg","-94kg","+94kg"], F: ["-55kg","-65kg","+65kg"] }
  },
  "Low Kick": {
    "Juniores Mais Jovens (15-16 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Juniores Mais Velhos (17-18 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Seniores (19-40 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-48kg","-52kg","-56kg","-60kg","-65kg","-70kg","+70kg"] }
  },
  "Full Contact": {
    "Juniores Mais Jovens (15-16 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Juniores Mais Velhos (17-18 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Seniores (19-40 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-48kg","-52kg","-56kg","-60kg","-65kg","-70kg","+70kg"] }
  },
  "K1": {
    "Juniores Mais Jovens (15-16 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Juniores Mais Velhos (17-18 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-50kg","-55kg","-60kg","-65kg","-70kg","+70kg"] },
    "Seniores (19-40 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-48kg","-52kg","-56kg","-60kg","-65kg","-70kg","+70kg"] }
  },
  "Muay Thai": {
    "Crianças (7-9 anos)": { M: ["-18kg","-21kg","-24kg","-27kg","-30kg","+30kg"], F: ["-18kg","-21kg","-24kg","-27kg","-30kg","+30kg"] },
    "Cadetes Jovens (10-12 anos)": { M: ["-27kg","-30kg","-33kg","-36kg","-39kg","-42kg","-45kg","-48kg","+48kg"], F: ["-27kg","-30kg","-33kg","-36kg","-39kg","-42kg","-45kg","-48kg","+48kg"] },
    "Cadetes Mais Velhos (13-15 anos)": { M: ["-39kg","-42kg","-45kg","-48kg","-51kg","-54kg","-57kg","-60kg","-63kg","-66kg","-69kg","+69kg"], F: ["-39kg","-42kg","-45kg","-48kg","-51kg","-54kg","-57kg","-60kg","-63kg","+63kg"] },
    "Juniores (16-18 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-48kg","-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","+71kg"] },
    "Seniores (19-40 anos)": { M: ["-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","-75kg","-81kg","-86kg","-91kg","+91kg"], F: ["-48kg","-51kg","-54kg","-57kg","-60kg","-63.5kg","-67kg","-71kg","+71kg"] },
    "Veteranos/Masters (41-55 anos)": { M: ["-60kg","-67kg","-75kg","-86kg","+86kg"], F: ["-54kg","-60kg","-67kg","+67kg"] }
  }
};

function getEscaloes(modality, subModality) {
  if (modality === "Muay Thai") return ESCALOES_TATAMI;
  if (RING_DISCIPLINES.includes(subModality)) return ESCALOES_RING;
  return ESCALOES_TATAMI;
}

const WEIGHT_CATEGORIES_PRO = {
  // WAKO Pro — mesmas categorias para Full Contact, Low Kick, K1
  ring: {
    M: ["-52.7kg (Atom)","-54.5kg (Fly)","-56.4kg (Bantam)","-58.2kg (Feather)","-60kg (Light)","-62.2kg (Super Light)","-64.5kg (Light Welter)","-66.8kg (Welter)","-69.1kg (Super Welter)","-71.8kg (Light Middle)","-75kg (Middle)","-78.1kg (Super Middle)","-81.4kg (Light Heavy)","-85.1kg (Light Cruiser)","-88.6kg (Heavy)","-94.1kg (Cruiser Heavy)","+94.1kg (Super Heavy)"],
    F: ["-48kg (Light Fly)","-50kg (Fly)","-52kg (Bantam)","-55kg (Feather)","-57.5kg (Super Feather)","-60kg (Light)","-62kg (Welter)","-65kg (Middle)","-68kg (Light Heavy)","-71kg (Heavy)","-74kg (Cruiser)","+74kg (Super Heavy)"]
  }
};

function getWeightCategories(subModality, escalao, gender, level) {
  const g = gender === "Feminino" ? "F" : "M";
  // Profissional → WAKO Pro (só ring)
  if (level === "Profissional") {
    if (RING_DISCIPLINES.includes(subModality)) return WEIGHT_CATEGORIES_PRO.ring[g];
    // Tatami pro usa as mesmas da WAKO amador
  }
  // Amador e Neo-Pro → WAKO 2025
  const disc = WEIGHT_CATEGORIES[subModality];
  if (!disc || !escalao) return [];
  const esc = disc[escalao];
  if (!esc) return [];
  return esc[g] || [];
}
const METHODS = ["KO/TKO", "Decisão Unânime", "Decisão Dividida", "Submissão", "Desqualificação", "Desistência"];

const FEDERATIONS = [
  // Internacional — Kickboxing
  "WAKO (World Association of Kickboxing Organizations)",
  "WAKO PRO",
  "WKF (World Kickboxing Federation)",
  "WKA (World Kickboxing Association)",
  "WKN (World Kickboxing Network)",
  "WKO (World Kickboxing Organization)",
  "ISKA (International Sport Karate Association)",
  "IKF (International Kickboxing Federation)",
  "ICO (International Combat Organization)",
  "WMO (World Martial Arts Organization)",
  // Internacional — Muay Thai
  "IFMA (International Federation of Muaythai Associations)",
  "WBC Muay Thai",
  "WPMF (World Professional Muaythai Federation)",
  "FEA (Fighting Entertainment Association)",
  "MTGP (Muay Thai Grand Prix)",
  "Lion Fight",
  "Max Muay Thai",
  "Muay Thai Extreme",
  "Thai Fight",
  "Rajadamnern",
  "Lumpinee",
  // Internacional — Promoções / Eventos
  "SUPERKOMBAT",
  "ONE Championship",
  "Glory Kickboxing",
  "K-1 Japan",
  "Rise Kickboxing",
  "Krush",
  "Senshi",
  "Enfusion",
  // Portugal
  "FNKDA (Portugal - Kickboxing)",
  "FPKMT (Portugal - Kickboxing & Muay Thai)",
  // Albânia
  "Kick Boxing Federation of Albania",
  "Albanian Muaythai Federation",
  // Alemanha
  "WAKO Deutschland",
  "MTBD (Muaythai Bund Deutschland)",
  // Andorra
  "Federació Andorrana de Kickboxing i Muay Thai",
  // Áustria
  "ÖBFK (Österreichischer Bundesfachverband für Kickboxen)",
  "ÖMTF (Österreichischer Muaythai Verband)",
  // Bélgica
  "WAKO Belgium",
  "BKBMO (Belgian Kickboxing, Muaythai & MMA Organisation)",
  // Bielorrússia
  "Belarusian Federation of Kickboxing and Muay Thai",
  // Bósnia e Herzegovina
  "KBSBiH (Kik Boks Savez Bosne i Hercegovine)",
  "Muaythai Savez Bosne i Hercegovine",
  // Bulgária
  "Bulgarian Confederation of Kickboxing and Muay Thai",
  // Chéquia
  "ČSFU (Český Svaz Full-contactu)",
  "CMTA (Česká Muaythai Asociace)",
  // Chipre
  "Cyprus Kickboxing Federation",
  "Cyprus Muaythai Federation",
  // Croácia
  "HKBS (Hrvatski Kikboksing Savez)",
  "HMS (Hrvatski Muaythai Savez)",
  // Dinamarca
  "Kickboxing Danmark",
  "Dansk Muaythai Forbund",
  // Eslováquia
  "SZKB (Slovenský Zväz Kickboxu)",
  "SMTA (Slovenská Muaythai Asociácia)",
  // Eslovénia
  "KBZS (Kickboxing Zveza Slovenije)",
  "Slovenska Muaythai Zveza",
  // Espanha
  "FEKM (Real Federación Española de Kickboxing y Muaythai)",
  // Estónia
  "Estonian Kickboxing Federation",
  "Estonian Muaythai Federation",
  // Finlândia
  "Suomen Potkunyrkkeilyliitto (Finnish Kickboxing Federation)",
  "Suomen Thainyrkkeilyliitto (Finnish Muaythai Federation)",
  // França
  "FFKMDA (Fédération Française de Kickboxing, Muaythai et Disciplines Associées)",
  // Grécia
  "POPO (Panhellenic Kickboxing Federation)",
  "PMF (Panhellenic Muaythai Federation)",
  // Hungria
  "Magyar KICK-BOX Szakszövetség",
  "Magyar Muaythai Szakszövetség",
  // Irlanda
  "Kickboxing Ireland (KBI)",
  "Muaythai Ireland (MTI)",
  // Islândia
  "Vaki (Kickboxing Federation of Iceland)",
  "Iceland Muay Thai Federation",
  // Itália
  "Federkombat",
  // Kosovo
  "Kickboxing Federation of Kosovo",
  "Muaythai Federation of Kosovo",
  // Letónia
  "Latvia Kickboxing Federation",
  "Latvian Muay Thai Federation",
  // Liechtenstein
  "LKBV (Liechtensteiner Kickboxing Verband)",
  // Lituânia
  "Lietuvos Kikboksingo Federacija",
  "Lietuvos Muaythai Sąjunga",
  // Luxemburgo
  "FLAM (Fédération Luxembourgeoise des Arts Martiaux)",
  // Macedónia do Norte
  "Kickboxing Muaythai Federation of Macedonia",
  // Malta
  "Malta Kickboxing Association",
  "Muaythai Malta",
  // Moldávia
  "National Kickboxing Federation of Republic of Moldova",
  "Muaythai and Kickboxing Federation of Moldova",
  // Mónaco
  "Fédération Monégasque de Kick-Boxing",
  "Fédération Monégasque de Muaythai",
  // Montenegro
  "Kik Boks Savez Crne Gore",
  "Muaythai Savez Crne Gore",
  // Noruega
  "Norges Kickboxingforbund (NKBF)",
  "Norges Muaythai Forbund",
  // Países Baixos
  "Vechtsportautoriteit / WAKO Nederland",
  "MON (Muaythai Organisatie Nederland)",
  // Polónia
  "Polski Związek Kickboxingu (PZKB)",
  "Polski Związek Muaythai (PZM)",
  // Reino Unido
  "WAKO GB (British Kickboxing Federation)",
  "UKMF (United Kingdom Muaythai Federation)",
  // Roménia
  "FRKM (Federația Română de Kickboxing)",
  "Federația Română de Muay Thai",
  // Rússia
  "FKR (Federation of Kickboxing of Russia)",
  "RMF (Russian Muaythai Federation)",
  // San Marino
  "FESAM (Federazione Sammarinese Arti Marziali)",
  // Sérvia
  "Kik Boks Savez Srbije",
  "Muaythai Savez Srbije",
  // Suécia
  "Svenska Kickboxningsförbundet",
  "Svenska Muaythaiförbundet (SMTF)",
  // Suíça
  "WAKO Switzerland",
  "SMV (Swiss Muaythai Verband)",
  // Ucrânia
  "WAKO Ukraine (National Kickboxing Federation of Ukraine)",
  "Ukrainian Muaythai Federation",
  // Outra
  "Outra"
];

const EMPTY_FIGHT = { opponent: "", opponent_team: "", result: "V", method: "KO/TKO", event: "", date: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", weight: "", federation: "" };
const EMPTY_EVENT = { name: "", local: "", city: "", country: "Portugal", organization: "", date: "", federation: "" };
const TITLE_TYPES = ["Campeão", "Vencedor", "Medalha de Ouro", "Medalha de Prata", "Medalha de Bronze"];
const MAX_FILE_SIZE = 500 * 1024; // 500KB

// ─── UTILITÁRIOS ──────────────────────────────────────────
function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function emailToUsername(email) { return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, ""); }
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}
function san(val, max = 200) { if (typeof val !== "string") return val; return val.trim().slice(0, max); }

// ─── ESTILOS DINÂMICOS ────────────────────────────────────
const getStyles = () => ({
  inp: { padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.BORDER}`, background: T.BG3, color: T.TEXT, fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none", appearance: "none", WebkitAppearance: "none", colorScheme: "dark" },
  lbl: { fontSize: 11, color: T.TEXT3, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" },
  btnGold: { padding: "9px 22px", borderRadius: 6, border: "none", background: T.GOLD, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 12 },
  btnOutline: { padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.GOLD_DIM}`, background: "transparent", cursor: "pointer", fontSize: 13, color: T.GOLD, fontWeight: 600 },
  btnRed: { padding: "6px 14px", borderRadius: 6, border: `1px solid #e0555566`, background: "transparent", cursor: "pointer", fontSize: 13, color: "#e05555", fontWeight: 600 },
  btnGreen: { padding: "6px 14px", borderRadius: 6, border: `1px solid #4caf7d66`, background: "transparent", cursor: "pointer", fontSize: 13, color: "#4caf7d", fontWeight: 600 },
});

// ─── COMPONENTES BASE ─────────────────────────────────────
function Logo({ club, large }) {
  const tfaLogo = React.createElement("img", {
    src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg",
    alt: "The Fighters App",
    style: { height: large ? 120 : 44, width: large ? "80%" : "auto", display: "block", margin: "0 auto 6px", opacity: 0.92 },
    onError: e => { e.target.style.display = "none"; }
  });
  // Sem clube = página de login = logo neutro
  if (!club) return React.createElement("div", { style: { textAlign: "center", marginBottom: 6 } },
    tfaLogo
  );
  // Com clube = logo do clube + TFA subtil
  if (club.id === "norteforte") return React.createElement("div", { style: { textAlign: "center", marginBottom: 6 } },
    React.createElement("img", { src: "norteforte.svg", alt: "Norte Forte", style: { height: 110, width: "auto", display: "block", margin: "0 auto 8px", mixBlendMode: "screen" } }),
    tfaLogo
  );
  return React.createElement("div", { style: { textAlign: "center", marginBottom: 6 } },
    club.logo_url
      ? React.createElement("img", { src: club.logo_url, alt: club.name, style: { height: 90, width: "auto", display: "block", margin: "0 auto 8px", mixBlendMode: "screen" } })
      : React.createElement("div", { style: { height: 90, width: 90, borderRadius: "50%", background: `linear-gradient(135deg, ${T.GOLD_DIM}, ${T.GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 28, fontWeight: 900, color: "#fff" } }, club.short_name || club.name.slice(0, 3)),
    tfaLogo
  );
}

function GoldDivider() {
  return React.createElement("div", { style: { height: 1, background: `linear-gradient(90deg, transparent, ${T.GOLD_DIM}, transparent)`, margin: "14px 0" } });
}

function Avatar({ name, size = 44, photo, available }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const border = available ? "2px solid #4caf7d" : `1px solid ${T.GOLD_DIM}`;
  const wrap = (child) => React.createElement("div", { style: { position: "relative", flexShrink: 0 } },
    child,
    available && React.createElement("div", { style: { position: "absolute", bottom: -3, right: -3, width: 10, height: 10, borderRadius: "50%", background: "#4caf7d", border: "2px solid #0a0a0a" } })
  );
  if (photo) return wrap(React.createElement("div", { style: { width: size, height: size * 1.4, borderRadius: 8, overflow: "hidden", border } },
    React.createElement("img", { src: photo, alt: name, style: { width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" } })
  ));
  return wrap(React.createElement("div", { style: { width: size, height: size * 1.4, borderRadius: 8, background: `linear-gradient(135deg, ${T.GOLD_DIM}, ${T.GOLD})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.32, color: "#fff", border } }, initials));
}

function Badge({ children, type = "default" }) {
  const s = { default: [T.BG4, T.GOLD], green: ["#0a1a0e", "#4caf7d"], blue: ["#0a0f1a", "#5b8fd4"], gold: ["#1a1200", T.GOLD], orange: ["#1a0f00", "#d4844c"], red: ["#1a0a0a", "#e05555"] }[type] || [T.BG4, T.GOLD];
  return React.createElement("span", { style: { background: s[0], color: s[1], fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap", border: `1px solid ${s[1]}22` } }, children);
}

function ResultBadge({ r }) {
  const c = r === "V" ? ["#0a1a0e", "#4caf7d"] : r === "D" ? ["#1a0a0a", "#e05555"] : [T.BG4, T.TEXT3];
  return React.createElement("span", { style: { background: c[0], color: c[1], border: `1px solid ${c[1]}44`, fontWeight: 700, fontSize: 13, padding: "4px 12px", borderRadius: 4, display: "inline-block", minWidth: 32, textAlign: "center" } }, r);
}

function Card({ children, style = {}, gold = false }) {
  return React.createElement("div", { style: { background: T.BG2, border: `1px solid ${gold ? T.BORDER_GOLD : T.BORDER}`, borderRadius: 10, padding: "14px 16px", ...style } }, children);
}

function StatBox({ label, value, color, sub }) {
  return React.createElement("div", { style: { background: T.BG3, border: `1px solid ${T.BORDER}`, borderRadius: 8, padding: "12px", textAlign: "center", flex: 1 } },
    React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color } }, value),
    React.createElement("div", { style: { fontSize: 11, color: T.TEXT3, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.5px" } }, label),
    sub && React.createElement("div", { style: { fontSize: 10, color, marginTop: 2, fontWeight: 600, opacity: 0.8 } }, sub)
  );
}

function ClubTag({ clubId, clubs }) {
  const club = (clubs || []).find(c => c.id === clubId);
  if (!club) return null;
  return React.createElement("span", { style: { background: club.primary_color + "22", color: club.primary_color, fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, border: `1px solid ${club.primary_color}44` } }, club.short_name || club.name);
}

function Footer() {
  return React.createElement("div", { style: { textAlign: "center", padding: "28px 16px 20px", borderTop: `1px solid #1e1e1e`, marginTop: 20 } },
    React.createElement("img", { 
      src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg",
      alt: "The Fighters App",
      style: { height: 36, opacity: 0.75, marginBottom: 8 },
      onError: e => { e.target.style.display = "none"; }
    }),
    React.createElement("div", { style: { fontSize: 10, color: "#444", letterSpacing: 1.5, textTransform: "uppercase" } },
      "Designed & developed by Ricardo Quintela · © 2026"
    )
  );
}
// ═══════════════════════════════════════════════════════════
// PARTE 2: HEADER, FORMS, CALENDAR
// ═══════════════════════════════════════════════════════════

function AccountModal({ user, onClose }) {
  const s = getStyles();
  const { inp, lbl } = s;
  const [currentPw, setCurrentPw] = React.useState("");
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [msg, setMsg] = React.useState(null);
  const [err, setErr] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function changePassword() {
    setErr(""); setMsg(null);
    if (!currentPw || !newPw || !confirmPw) { setErr("Preenche todos os campos."); return; }
    if (newPw !== confirmPw) { setErr("As passwords não coincidem."); return; }
    if (newPw.length < 6) { setErr("Mínimo 6 caracteres."); return; }
    setSaving(true);
    const token = localStorage.getItem("tfa_token");
    const r = await fetch("/api/auth?action=change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, currentPassword: currentPw, newPassword: newPw })
    });
    const data = await r.json();
    setSaving(false);
    if (r.ok) { setMsg("Password alterada com sucesso!"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    else { setErr(data.error || "Erro ao alterar password."); }
  }

  return React.createElement("div", { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }, onClick: onClose },
    React.createElement("div", { style: { background: T.BG2, border: `1px solid ${T.BORDER}`, borderRadius: 12, padding: 24, width: 340, maxWidth: "90vw" }, onClick: e => e.stopPropagation() },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: T.GOLD, textTransform: "uppercase", letterSpacing: 1 } }, "Minha Conta"),
        React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", color: T.TEXT2, fontSize: 20, cursor: "pointer" } }, "×")
      ),
      React.createElement("div", { style: { marginBottom: 20, padding: "12px 16px", background: T.BG3, borderRadius: 8 } },
        React.createElement("div", { style: { fontSize: 13, color: T.TEXT, fontWeight: 600 } }, user.name),
        React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, `@${user.username}`),
        user.email && React.createElement("div", { style: { fontSize: 12, color: T.TEXT3, marginTop: 2 } }, user.email)
      ),
      React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 } }, "Alterar Password"),
      React.createElement("div", { style: { marginBottom: 10 } },
        React.createElement("label", { style: lbl }, "Password actual"),
        React.createElement("input", { type: "password", style: inp, value: currentPw, onChange: e => setCurrentPw(e.target.value), placeholder: "••••••••" })
      ),
      React.createElement("div", { style: { marginBottom: 10 } },
        React.createElement("label", { style: lbl }, "Nova password"),
        React.createElement("input", { type: "password", style: inp, value: newPw, onChange: e => setNewPw(e.target.value), placeholder: "••••••••" })
      ),
      React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: lbl }, "Confirmar nova password"),
        React.createElement("input", { type: "password", style: inp, value: confirmPw, onChange: e => setConfirmPw(e.target.value), placeholder: "••••••••", onKeyDown: e => e.key === "Enter" && changePassword() })
      ),
      err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginBottom: 10 } }, err),
      msg && React.createElement("div", { style: { fontSize: 13, color: "#4caf7d", marginBottom: 10 } }, msg),
      React.createElement("button", { onClick: changePassword, disabled: saving, style: { ...s.btnGold, width: "100%", marginTop: 0, opacity: saving ? 0.7 : 1 } }, saving ? "A guardar..." : "Guardar")
    )
  );
}

function Header({ onLogout, user, currentPage, setPage, pendingCount = 0, club, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const [showAccount, setShowAccount] = React.useState(false);
  return React.createElement("div", { style: { textAlign: "center", marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${T.BORDER}` } },
    showAccount && React.createElement(AccountModal, { user, onClose: () => setShowAccount(false) }),
    viewAsClub && setViewAsClub && React.createElement("div", { style: { background: "#1a0f00", border: "1px solid #ff990066", borderRadius: 8, padding: "8px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" } },
      React.createElement("div", { style: { fontSize: 12, color: "#ff9900", display: "flex", alignItems: "center", gap: 6 } },
        React.createElement("svg", { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" },
          React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
          React.createElement("circle", { cx: 12, cy: 12, r: 3 })
        ),
        "A ver como ", React.createElement("strong", null, viewAsClub.name)
      ),
      React.createElement("button", { onClick: () => { setViewAsClub(null); T = buildTheme(null); setPage("clubs"); }, style: { fontSize: 11, color: "#ff9900", background: "transparent", border: "1px solid #ff990066", borderRadius: 6, padding: "3px 10px", cursor: "pointer" } }, "← Voltar")
    ),
    React.createElement(Logo, { club }),
    user && React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10 } },
      React.createElement("div", { style: { textAlign: "center" } },
        React.createElement("div", { style: { fontSize: 12, color: T.TEXT, fontWeight: 600 } }, user.name),
        React.createElement("div", { style: { fontSize: 11, color: user.role === "superadmin" ? "#ff9900" : user.role === "admin" ? T.GOLD : T.TEXT2 } },
          user.role === "superadmin" ? "⭐ Super Admin" : user.role === "admin" ? "Admin" : "Atleta"
        )
      ),
      React.createElement("button", { onClick: () => setShowAccount(true), style: { padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.GOLD_DIM}`, background: "transparent", color: T.GOLD, cursor: "pointer", fontSize: 12 } }, "Conta"),
      React.createElement("button", { onClick: onLogout, style: { padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.BORDER}`, background: "transparent", color: T.TEXT2, cursor: "pointer", fontSize: 12 } }, "Sair")
    ),
    user && setPage && React.createElement("div", { style: { display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" } },
      React.createElement("div", { style: { 
          display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center",
          background: "#1a1a1a", borderRadius: 14, padding: "8px 10px",
          border: "1px solid #ffffff18"
        } },
        (user.role === "admin" || user.role === "superadmin") && React.createElement("button", { onClick: () => setPage("fighters"), style: { 
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 12px", minWidth: 60, borderRadius: 10,
                border: `1px solid ${currentPage === "fighters" ? `${T.GOLD}88` : "#ffffff15"}`,
                background: currentPage === "fighters" ? `${T.GOLD}18` : "transparent",
                color: currentPage === "fighters" ? T.GOLD : "#ffffff66",
                cursor: "pointer", fontSize: 10, fontWeight: currentPage === "fighters" ? 700 : 400,
                transition: "all 0.15s"
              } },
              React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 100 100", fill: "none", stroke: "currentColor", strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } },
              React.createElement("path", { d: "M20 65 C20 75 28 82 38 82 L62 82 C72 82 80 75 80 65 L80 42 C80 36 75 31 69 31 L65 31 L65 25 C65 19 60 14 54 14 L46 14 C40 14 35 19 35 25 L35 31 L31 31 C25 31 20 36 20 42 Z" }),
              React.createElement("line", { x1: 45, y1: 31, x2: 45, y2: 58 }),
              React.createElement("line", { x1: 55, y1: 31, x2: 55, y2: 58 }),
              React.createElement("line", { x1: 65, y1: 36, x2: 65, y2: 58 }),
              React.createElement("path", { d: "M20 58 L80 58" }),
              React.createElement("path", { d: "M20 65 C15 65 10 62 10 57 L10 50 C10 45 15 42 20 42" })
            ),
              "Lutadores"
            ),
        (user.role === "admin" || user.role === "superadmin") && React.createElement("button", { onClick: () => setPage("pending"), style: { 
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 12px", minWidth: 60, borderRadius: 10,
                border: `1px solid ${currentPage === "pending" ? `${T.GOLD}88` : "#ffffff15"}`,
                background: currentPage === "pending" ? `${T.GOLD}18` : "transparent",
                color: currentPage === "pending" ? T.GOLD : "#ffffff66",
                cursor: "pointer", fontSize: 10, fontWeight: currentPage === "pending" ? 700 : 400,
                transition: "all 0.15s", position: "relative"
              } },
              React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } },
              React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })
            ),
              "Pedidos", pendingCount > 0 && React.createElement("span", { style: { position: "absolute", top: -4, right: -4, background: "#e05555", color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" } }, pendingCount > 9 ? "9+" : pendingCount)
            ),
        (user.role === "admin" || user.role === "superadmin") && React.createElement("button", { onClick: () => setPage("teams"), style: { 
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 12px", minWidth: 60, borderRadius: 10,
                border: `1px solid ${currentPage === "teams" ? `${T.GOLD}88` : "#ffffff15"}`,
                background: currentPage === "teams" ? `${T.GOLD}18` : "transparent",
                color: currentPage === "teams" ? T.GOLD : "#ffffff66",
                cursor: "pointer", fontSize: 10, fontWeight: currentPage === "teams" ? 700 : 400,
                transition: "all 0.15s"
              } },
              React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } },
              React.createElement("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
              React.createElement("circle", { cx: 9, cy: 7, r: 4 }),
              React.createElement("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
              React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
            ),
              "Equipas"
            ),
        user.role === "superadmin" && !viewAsClub && React.createElement("button", { onClick: () => setPage("dashboard"), style: { 
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 12px", minWidth: 60, borderRadius: 10,
                border: `1px solid ${currentPage === "dashboard" ? `${T.GOLD}88` : "#ffffff15"}`,
                background: currentPage === "dashboard" ? `${T.GOLD}18` : "transparent",
                color: currentPage === "dashboard" ? T.GOLD : "#ffffff66",
                cursor: "pointer", fontSize: 10, fontWeight: currentPage === "dashboard" ? 700 : 400,
                transition: "all 0.15s"
              } },
              React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } },
              React.createElement("rect", { x: 3, y: 3, width: 7, height: 7 }),
              React.createElement("rect", { x: 14, y: 3, width: 7, height: 7 }),
              React.createElement("rect", { x: 14, y: 14, width: 7, height: 7 }),
              React.createElement("rect", { x: 3, y: 14, width: 7, height: 7 })
            ),
              "Dashboard"
            ),
        user.role === "superadmin" && !viewAsClub && React.createElement("button", { onClick: () => setPage("clubs"), style: { 
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 12px", minWidth: 60, borderRadius: 10,
                border: `1px solid ${currentPage === "clubs" ? `${T.GOLD}88` : "#ffffff15"}`,
                background: currentPage === "clubs" ? `${T.GOLD}18` : "transparent",
                color: currentPage === "clubs" ? T.GOLD : "#ffffff66",
                cursor: "pointer", fontSize: 10, fontWeight: currentPage === "clubs" ? 700 : 400,
                transition: "all 0.15s"
              } },
              React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } },
              React.createElement("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
              React.createElement("polyline", { points: "9 22 9 12 15 12 15 22" })
            ),
              "Clubes"
            ),
        (user.role === "admin" || user.role === "superadmin") && React.createElement("button", { onClick: () => setPage("calendar"), style: { 
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 12px", minWidth: 60, borderRadius: 10,
                border: `1px solid ${currentPage === "calendar" ? `${T.GOLD}88` : "#ffffff15"}`,
                background: currentPage === "calendar" ? `${T.GOLD}18` : "transparent",
                color: currentPage === "calendar" ? T.GOLD : "#ffffff66",
                cursor: "pointer", fontSize: 10, fontWeight: currentPage === "calendar" ? 700 : 400,
                transition: "all 0.15s"
              } },
              React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } },
              React.createElement("rect", { x: 3, y: 4, width: 18, height: 18, rx: 2 }),
              React.createElement("line", { x1: 16, y1: 2, x2: 16, y2: 6 }),
              React.createElement("line", { x1: 8, y1: 2, x2: 8, y2: 6 }),
              React.createElement("line", { x1: 3, y1: 10, x2: 21, y2: 10 })
            ),
              "Calendário"
            ),
        React.createElement("button", { onClick: () => setPage("matchmaking"), style: { 
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "8px 12px", minWidth: 60, borderRadius: 10,
                border: `1px solid ${currentPage === "matchmaking" ? "#4caf7d" : "#4caf7d44"}`,
                background: currentPage === "matchmaking" ? "#4caf7d22" : "transparent",
                color: "#4caf7d", cursor: "pointer", fontSize: 10, fontWeight: 700,
                transition: "all 0.15s", boxShadow: currentPage === "matchmaking" ? "0 0 12px #4caf7d33" : "none"
              } },
              React.createElement("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "block" } },
              React.createElement("circle", { cx: 8, cy: 12, r: 3 }),
              React.createElement("circle", { cx: 16, cy: 8, r: 3 }),
              React.createElement("circle", { cx: 16, cy: 16, r: 3 }),
              React.createElement("line", { x1: 11, y1: 12, x2: 13, y2: 9 }),
              React.createElement("line", { x1: 11, y1: 12, x2: 13, y2: 15 })
            ),
              "Matching"
            )
      )    )
  );
}

function FightForm({ val, set }) {
  const { inp, lbl } = getStyles();
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Adversário"), React.createElement("input", { style: inp, value: val.opponent || "", onChange: e => set({ ...val, opponent: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Equipa Adversário"), React.createElement("input", { style: inp, value: val.opponent_team || "", onChange: e => set({ ...val, opponent_team: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: val.date || "", onChange: e => set({ ...val, date: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Peso (kg)"), React.createElement("input", { type: "number", style: inp, value: val.weight || "", onChange: e => set({ ...val, weight: e.target.value }), placeholder: "ex: 70" })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Resultado"),
      React.createElement("select", { style: inp, value: val.result || "V", onChange: e => set({ ...val, result: e.target.value }) }, ["V","D","E"].map(r => React.createElement("option", { key: r }, r)))
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Método"),
      React.createElement("select", { style: inp, value: val.method || "KO/TKO", onChange: e => set({ ...val, method: e.target.value }) }, METHODS.map(m => React.createElement("option", { key: m }, m)))
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"),
      React.createElement("select", { style: inp, value: val.modality || "Kickboxing", onChange: e => set({ ...val, modality: e.target.value, sub_modality: MODALITIES[e.target.value][0] }) }, Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Disciplina"),
      React.createElement("select", { style: inp, value: val.sub_modality || "K1", onChange: e => set({ ...val, sub_modality: e.target.value }) }, (MODALITIES[val.modality] || MODALITIES["Kickboxing"]).map(s => React.createElement("option", { key: s }, s)))
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"),
      React.createElement("select", { style: inp, value: val.level || "Amador", onChange: e => set({ ...val, level: e.target.value }) }, LEVELS.map(l => React.createElement("option", { key: l }, l)))
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Evento"), React.createElement("input", { style: inp, value: val.event || "", onChange: e => set({ ...val, event: e.target.value }) })),
    React.createElement("div", { style: { gridColumn: "1 / -1" } },
      React.createElement("label", { style: lbl }, "Federação"),
      React.createElement("select", { style: inp, value: val.federation || "", onChange: e => set({ ...val, federation: e.target.value }) },
        React.createElement("option", { value: "" }, "Selecionar federação..."),
        FEDERATIONS.map(fed => React.createElement("option", { key: fed, value: fed }, fed))
      )
    )
  );
}

function EventForm({ val, set }) {
  const { inp, lbl } = getStyles();
  return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
    React.createElement("div", { style: { gridColumn: "1 / -1" } },
      React.createElement("label", { style: { ...lbl, color: T.GOLD } }, "Nome da Prova"),
      React.createElement("input", { style: { ...inp, borderColor: T.GOLD_DIM }, value: val.name || "", onChange: e => set({ ...val, name: e.target.value }), placeholder: "ex: Norte Forte Fight Night" })
    ),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: val.date || "", onChange: e => set({ ...val, date: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Organização"), React.createElement("input", { style: inp, value: val.organization || "", onChange: e => set({ ...val, organization: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Local"), React.createElement("input", { style: inp, value: val.local || "", onChange: e => set({ ...val, local: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "Cidade"), React.createElement("input", { style: inp, value: val.city || "", onChange: e => set({ ...val, city: e.target.value }) })),
    React.createElement("div", null, React.createElement("label", { style: lbl }, "País"), React.createElement("input", { style: inp, value: val.country || "", onChange: e => set({ ...val, country: e.target.value }) })),
    React.createElement("div", { style: { gridColumn: "1 / -1" } },
      React.createElement("label", { style: lbl }, "Federação"),
      React.createElement("select", { style: inp, value: val.federation || "", onChange: e => set({ ...val, federation: e.target.value }) },
        React.createElement("option", { value: "" }, "Selecionar federação..."),
        FEDERATIONS.map(fed => React.createElement("option", { key: fed, value: fed }, fed))
      )
    )
  );
}

function CalendarPage({ onLogout, user, setPage, pendingCount, club, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [delEventId, setDelEventId] = useState(null);
  const [ne, setNe] = useState({ ...EMPTY_EVENT });
  const [searchCal, setSearchCal] = useState("");
  const canEdit = user && (user.role === "admin" || user.role === "superadmin");

  useEffect(() => { db.get("events").then(all => { setEvents(all.sort((a, b) => new Date(a.date) - new Date(b.date))); setLoading(false); }); }, []);

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

  async function deleteEvent(id) { await db.delete("events", id); setEvents(p => p.filter(x => x.id !== id)); setDelEventId(null); }

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = events.filter(e => new Date(e.date) >= today);
  const past = events.filter(e => new Date(e.date) < today).reverse();

  function EventCard({ ev }) {
    const days = daysUntil(ev.date);
    const isPast = days !== null && days < 0;
    return React.createElement(Card, { style: { marginBottom: 8, border: `1px solid ${isPast ? T.BORDER : T.BORDER_GOLD}` } },
      editEvent && editEvent.id === ev.id
        ? React.createElement("div", null,
            React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Editar Prova"),
            React.createElement(EventForm, { val: editEvent, set: setEditEvent }),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
              React.createElement("button", { onClick: saveEditEvent, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
              React.createElement("button", { onClick: () => setEditEvent(null), style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
            )
          )
        : React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "flex-start" } },
            React.createElement("div", { style: { background: T.BG3, border: `1px solid ${isPast ? T.BORDER : T.GOLD_DIM}`, borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 52, flexShrink: 0 } },
              React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: isPast ? T.TEXT3 : T.GOLD } }, ev.date?.slice(8, 10)),
              React.createElement("div", { style: { fontSize: 10, color: T.TEXT3 } }, ev.date ? `${ev.date.slice(5,7)}/${ev.date.slice(0,4)}` : "")
            ),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: isPast ? T.TEXT2 : T.TEXT } }, ev.name),
              ev.organization && React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 600, marginTop: 2 } }, ev.organization),
              React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, [ev.local, ev.city, ev.country].filter(Boolean).join(" · ")),
              ev.federation && React.createElement("div", { style: { fontSize: 11, color: "#d4844c", fontWeight: 600, marginTop: 3 } }, ev.federation),
              delEventId === ev.id && React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 8, alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 13, color: "#e05555" } }, "Tens a certeza?"),
                React.createElement("button", { onClick: () => deleteEvent(ev.id), style: { ...s.btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: "#e05555" } }, "Eliminar"),
                React.createElement("button", { onClick: () => setDelEventId(null), style: { ...s.btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
              )
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 } },
              !isPast && days !== null && React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: days <= 7 ? "#e05555" : days <= 30 ? T.GOLD : "#4caf7d" } }, days),
                React.createElement("div", { style: { fontSize: 9, color: T.TEXT3, textTransform: "uppercase" } }, "dias")
              ),
              isPast && React.createElement(Badge, { type: "default" }, "Realizado"),
              canEdit && React.createElement("div", { style: { display: "flex", gap: 6 } },
                React.createElement("button", { onClick: () => { setEditEvent({ ...ev }); setShowForm(false); }, style: { ...s.btnOutline, padding: "3px 10px", fontSize: 11 } }, "Editar"),
                React.createElement("button", { onClick: () => setDelEventId(ev.id), style: { ...s.btnRed, padding: "3px 10px", fontSize: 11 } }, "Eliminar")
              )
            )
          )
    );
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "calendar", setPage, pendingCount, club, viewAsClub, setViewAsClub }),
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: T.TEXT, textTransform: "uppercase", letterSpacing: 1 } }, "Calendário de Provas"),
        canEdit && React.createElement("button", { onClick: () => { setShowForm(p => !p); setEditEvent(null); }, style: s.btnOutline }, "+ Nova Prova")
      ),
      React.createElement("input", { style: { ...getStyles().inp, marginBottom: 14, background: T.BG2 }, placeholder: "🔍  Prova, cidade ou organização...", value: searchCal, onChange: e => setSearchCal(e.target.value) }),
      showForm && React.createElement(Card, { gold: true, style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" } }, "Nova Prova"),
        React.createElement(EventForm, { val: ne, set: setNe }),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveEvent, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => { setShowForm(false); setNe({ ...EMPTY_EVENT }); }, style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      loading && React.createElement("div", { style: { color: T.TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      upcoming.length > 0 && React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 11, color: T.GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 } }, `Próximas · ${upcoming.length}`),
        upcoming.filter(e => !searchCal || e.name?.toLowerCase().includes(searchCal.toLowerCase()) || e.city?.toLowerCase().includes(searchCal.toLowerCase()) || e.organization?.toLowerCase().includes(searchCal.toLowerCase())).map(ev => React.createElement(EventCard, { key: ev.id, ev }))
      ),
      upcoming.filter(e => !searchCal || e.name?.toLowerCase().includes(searchCal.toLowerCase()) || e.city?.toLowerCase().includes(searchCal.toLowerCase()) || e.organization?.toLowerCase().includes(searchCal.toLowerCase())).length === 0 && !loading && React.createElement(Card, { style: { marginBottom: 16 } },
        React.createElement("div", { style: { color: T.TEXT3, textAlign: "center", padding: "16px 0" } }, searchCal ? "Nenhuma prova encontrada." : "Nenhuma prova agendada.")
      ),
      past.filter(e => !searchCal || e.name?.toLowerCase().includes(searchCal.toLowerCase()) || e.city?.toLowerCase().includes(searchCal.toLowerCase()) || e.organization?.toLowerCase().includes(searchCal.toLowerCase())).length > 0 && React.createElement("div", { style: { marginTop: 20 } },
        React.createElement(GoldDivider),
        React.createElement("div", { style: { fontSize: 11, color: T.TEXT3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 } }, `Realizadas · ${past.filter(e => !searchCal || e.name?.toLowerCase().includes(searchCal.toLowerCase()) || e.city?.toLowerCase().includes(searchCal.toLowerCase()) || e.organization?.toLowerCase().includes(searchCal.toLowerCase())).length}`),
        past.filter(e => !searchCal || e.name?.toLowerCase().includes(searchCal.toLowerCase()) || e.city?.toLowerCase().includes(searchCal.toLowerCase()) || e.organization?.toLowerCase().includes(searchCal.toLowerCase())).map(ev => React.createElement(EventCard, { key: ev.id, ev }))
      ),
      React.createElement(Footer)
    )
  );
}
// ═══════════════════════════════════════════════════════════
// PARTE 3: LOGIN, REGISTER, PENDING, DASHBOARD, CLUBS
// ═══════════════════════════════════════════════════════════

function Login({ onLogin, clubs }) {
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

  // Reset tema neutro sempre que login é mostrado
  useEffect(() => { T = buildTheme(null); }, []);

  const s = getStyles();
  const { inp, lbl } = s;

  async function doLogin() {
    if (blocked || loading) return;
    if (attempts >= 5) {
      setBlocked(true); setErr("Demasiadas tentativas. Aguarda 30 segundos.");
      setTimeout(() => { setBlocked(false); setAttempts(0); setErr(""); }, 30000); return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password: pw })
      });
      const data = await r.json();
      setLoading(false);
      if (r.ok && data.user) {
        setAttempts(0);
        localStorage.setItem("tfa_token", data.token);
        const userClub = (clubs || []).find(c => c.id === data.user.club_id) || null;
        T = buildTheme(userClub);
        onLogin(data.user, userClub);
      } else {
        const na = attempts + 1; setAttempts(na);
        setErr(data.error || `Credenciais incorretas.${na >= 3 ? ` (${5 - na} tentativas restantes)` : ""}`);
      }
    } catch(e) {
      setLoading(false);
      setErr("Erro de ligação. Tenta novamente.");
    }
  }

  async function doForgot() {
    if (!forgotUsername.trim()) return;
    setForgotLoading(true); setErr("");
    try {
      const r = await fetch("/api/auth?action=reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername.trim().toLowerCase() })
      });
      const data = await r.json();
      setForgotLoading(false);
      if (r.ok) { setNewPassword(true); }
      else { setErr(data.error || "Erro ao enviar. Tenta novamente."); }
    } catch(e) {
      setForgotLoading(false); setErr("Erro de ligação. Tenta novamente.");
    }
  }

  if (showForgot) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("div", { style: { width: 340, padding: 16 } },
      React.createElement("div", { style: { marginBottom: 28 } }, React.createElement(Logo, { club: null })),
      React.createElement(Card, { gold: true },
        newPassword
          ? React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 32, textAlign: "center", marginBottom: 12 } },),
              React.createElement("div", { style: { fontSize: 16, color: T.GOLD, fontWeight: 700, marginBottom: 8, textAlign: "center" } }, "E-mail enviado!"),
              React.createElement("div", { style: { fontSize: 13, color: T.TEXT2, marginBottom: 16, textAlign: "center" } }, "Verifica a tua caixa de entrada. A nova password foi enviada para o teu e-mail."),
              React.createElement("button", { onClick: () => { setShowForgot(false); setNewPassword(null); setForgotUsername(""); setErr(""); }, style: { ...s.btnGold, width: "100%", marginTop: 0 } }, "Ir para o login")
            )
          : React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: T.TEXT, marginBottom: 12 } }, "Esqueci a password"),
              React.createElement("div", { style: { fontSize: 13, color: T.TEXT2, marginBottom: 16 } }, "Indica o teu username e enviamos uma nova password para o teu e-mail."),
              React.createElement("div", { style: { marginBottom: 16 } }, React.createElement("label", { style: lbl }, "Username"), React.createElement("input", { style: inp, value: forgotUsername, onChange: e => setForgotUsername(e.target.value), onKeyDown: e => e.key === "Enter" && doForgot() })),
              err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginBottom: 10 } }, err),
              React.createElement("button", { onClick: doForgot, disabled: forgotLoading, style: { ...s.btnGold, width: "100%", marginTop: 0 } }, forgotLoading ? "A enviar..." : "Enviar nova password"),
              React.createElement("div", { style: { textAlign: "center", marginTop: 12 } },
                React.createElement("button", { onClick: () => { setShowForgot(false); setErr(""); }, style: { fontSize: 12, color: T.GOLD_DIM, background: "none", border: "none", cursor: "pointer" } }, "← Voltar ao login")
              )
            )
      )
    )
  );

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px 32px" } },

    // ── LOGO TFA ──
    React.createElement("img", {
      src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg",
      alt: "The Fighters App",
      style: { height: 90, width: "auto", display: "block", margin: "0 auto 32px", opacity: 0.93 },
      onError: e => { e.target.style.display = "none"; }
    }),

    // ── TAGLINE ──
    React.createElement("p", { style: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 1.8, margin: "0 0 32px", maxWidth: 280 } },
      "A plataforma digital dos atletas de desportos de combate. Regista a tua carreira. Acompanha a tua evolução."
    ),

    // ── FEATURES ──
    React.createElement("div", { style: { marginBottom: 40, textAlign: "center" } },
      React.createElement("p", { style: { fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 10px" } }, "O que podes fazer"),
      React.createElement("span", { style: { fontSize: 12, color: "#666", display: "block", lineHeight: 2 } }, "Histórico de combates · Títulos · Próximas lutas"),
      React.createElement("span", { style: { fontSize: 12, color: "#666", display: "block", lineHeight: 2 } }, "Estatísticas · Calendário · Gestão de equipa")
    ),

    // ── INPUTS SUBTIS ──
    React.createElement("div", { style: { width: "100%", maxWidth: 280, marginBottom: 4 } },
      React.createElement("input", {
        style: { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #1e1e1e", padding: "10px 0", color: "#888", fontSize: 13, boxSizing: "border-box", outline: "none", letterSpacing: 1 },
        value: username, onChange: e => setUsername(e.target.value), onKeyDown: e => e.key === "Enter" && doLogin(),
        placeholder: "USERNAME", disabled: blocked
      })
    ),
    React.createElement("div", { style: { width: "100%", maxWidth: 280, marginBottom: 4 } },
      React.createElement("input", {
        type: "password",
        style: { width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #1e1e1e", padding: "10px 0", color: "#888", fontSize: 13, boxSizing: "border-box", outline: "none", letterSpacing: 1 },
        value: pw, onChange: e => setPw(e.target.value), onKeyDown: e => e.key === "Enter" && doLogin(),
        placeholder: "PASSWORD", disabled: blocked
      })
    ),

    err && React.createElement("div", { style: { fontSize: 12, color: "#e05555", margin: "8px 0", textAlign: "center", maxWidth: 280 } }, err),

    // ── BOTÃO ──
    React.createElement("button", {
      onClick: doLogin, disabled: loading || blocked,
      style: { width: "100%", maxWidth: 280, background: "transparent", border: "1px solid #3a2e10", borderRadius: 4, padding: 11, color: T.GOLD, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", margin: "20px 0 14px", opacity: blocked ? 0.4 : loading ? 0.7 : 1 }
    }, blocked ? "BLOQUEADO..." : loading ? "A ENTRAR..." : "ENTRAR"),

    // ── LINKS ──
    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 280, marginBottom: 52 } },
      React.createElement("button", { onClick: () => { setShowForgot(true); setErr(""); }, style: { fontSize: 11, color: "#555", background: "none", border: "none", cursor: "pointer", letterSpacing: 0.5 } }, "Esqueci a password"),
      React.createElement("a", { href: "?register=true", style: { fontSize: 11, color: "#6a5a30", textDecoration: "none" } }, "Registar →")
    ),

    // ── LOGOS CLUBES ──
    clubs && clubs.filter(c => c.active).length > 0 && React.createElement("div", { style: { textAlign: "center" } },
      React.createElement("div", { style: { fontSize: 9, color: "#444", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 } }, "Clubes na plataforma"),
      React.createElement("div", { style: { display: "flex", gap: 18, justifyContent: "center", alignItems: "center", opacity: 0.4 } },
        clubs.filter(c => c.active).map(c =>
          c.logo_url
            ? React.createElement("img", { key: c.id, src: c.logo_url, alt: c.name, title: c.name, style: { width: 28, height: 28, objectFit: "contain" } })
            : React.createElement("div", { key: c.id, title: c.name, style: { width: 28, height: 28, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#555", fontWeight: 700 } }, c.short_name || c.name.slice(0,2))
        )
      )
    ),

    // ── FOOTER ──
    React.createElement("div", { style: { marginTop: 36, fontSize: 9, color: "#444", textAlign: "center", letterSpacing: 1 } },
      "Designed & developed by Ricardo Quintela · © 2026"
    )
  );
}

function calcEscalaoGlobal(birthdate, modality, subModality) {
  if (!birthdate) return "";
  const year = new Date(birthdate).getFullYear();
  const age = new Date().getFullYear() - year;
  const isRing = RING_DISCIPLINES.includes(subModality);
  if (!isRing) {
    if (age <= 9) return "Crianças (7-9 anos)";
    if (age <= 12) return "Cadetes Jovens (10-12 anos)";
    if (age <= 15) return "Cadetes Mais Velhos (13-15 anos)";
    if (age <= 18) return "Juniores (16-18 anos)";
    if (age <= 40) return "Seniores (19-40 anos)";
    return "Veteranos/Masters (41-55 anos)";
  } else {
    if (age <= 16) return "Juniores Mais Jovens (15-16 anos)";
    if (age <= 18) return "Juniores Mais Velhos (17-18 anos)";
    return "Seniores (19-40 anos)";
  }
}

function RegisterPage({ clubs }) {
  const s = getStyles();
  const { inp, lbl } = s;
  const [f, setF] = useState({ name: "", weight: "", category: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", email: "", club_id: "", gender: "", birthdate: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const upd = (k, v) => setF(p => ({ ...p, [k]: v }));
  const activeClubs = (clubs || []).filter(c => c.active);
  const selectedClub = activeClubs.find(c => c.id === f.club_id) || null;
  const autoEscalao = calcEscalaoGlobal(f.birthdate, f.modality, f.sub_modality);

  async function handleRegister() {
    if (!f.name.trim()) return setErr("Nome obrigatório.");
    if (!f.email.includes("@")) return setErr("E-mail válido obrigatório.");
    if (!f.club_id) return setErr("Selecciona o teu clube.");
    if (!f.gender) return setErr("Selecciona o género.");
    if (!f.birthdate) return setErr("Data de nascimento obrigatória.");
    setSaving(true);
    try {
      const existing = await db.get("fighters");
      if (existing.some(x => x.email && x.email.toLowerCase() === f.email.toLowerCase().trim())) {
        setSaving(false); return setErr("Este e-mail já está registado.");
      }
      await db.insert("fighters", { name: san(f.name, 100), category: autoEscalao, modality: f.modality, sub_modality: f.sub_modality, level: f.level, email: san(f.email, 100), team: san(selectedClub?.name || "", 100), club_id: f.club_id, gender: f.gender, birthdate: f.birthdate, id: Date.now(), available: false, status: "pending", registration_date: new Date().toISOString() });
      setSaving(false); setDone(true);
    } catch(e) {
      console.error("Register error:", e);
      setSaving(false); setErr("Erro ao enviar pedido. Tenta novamente.");
    }
  }

  if (done) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement("div", { style: { textAlign: "center", maxWidth: 400 } },
      React.createElement(Logo, { club: selectedClub }),
      React.createElement("div", { style: { marginTop: 24, padding: 24, background: T.BG2, borderRadius: 10, border: `1px solid ${T.GOLD_DIM}` } },
        React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: T.GOLD, marginBottom: 8 } }, "Pedido enviado!"),
        React.createElement("div", { style: { fontSize: 14, color: T.TEXT2, marginBottom: 16 } }, "O teu pedido foi enviado ao administrador. Receberás as tuas credenciais após aprovação."),
        React.createElement("a", { href: "/", style: { fontSize: 13, color: T.GOLD_DIM, textDecoration: "none" } }, "← Ir para o login")
      )
    )
  );

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement("div", { style: { width: "100%", maxWidth: 500 } },
      React.createElement("div", { style: { marginBottom: 24 } }, React.createElement(Logo, { club: selectedClub })),
      React.createElement(Card, null,
        React.createElement("div", { style: { marginBottom: 16 } },
          React.createElement("label", { style: { ...lbl, color: T.GOLD } }, "Clube"),
          React.createElement("select", { style: { ...inp, borderColor: T.GOLD_DIM }, value: f.club_id,
            onChange: e => { const c = activeClubs.find(x => x.id === e.target.value); if (c) T = buildTheme(c); upd("club_id", e.target.value); }
          },
            React.createElement("option", { value: "" }, "Selecciona o teu clube..."),
            activeClubs.map(c => React.createElement("option", { key: c.id, value: c.id }, c.name))
          )
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: lbl }, "Nome Completo"),
            React.createElement("input", { style: inp, value: f.name, onChange: e => upd("name", e.target.value) })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Modalidade"),
            React.createElement("select", { style: inp, value: f.modality, onChange: e => upd("modality", e.target.value) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Disciplina"),
            React.createElement("select", { style: inp, value: f.sub_modality, onChange: e => upd("sub_modality", e.target.value) },
              (MODALITIES[f.modality] || MODALITIES["Kickboxing"]).map(s => React.createElement("option", { key: s }, s)))
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Género"),
            React.createElement("select", { style: inp, value: f.gender, onChange: e => upd("gender", e.target.value) },
              React.createElement("option", { value: "" }, "Selecionar..."),
              React.createElement("option", { value: "Masculino" }, "Masculino"),
              React.createElement("option", { value: "Feminino" }, "Feminino"))
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Data de Nascimento"),
            React.createElement("input", { type: "date", style: inp, value: f.birthdate, onChange: e => upd("birthdate", e.target.value) })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Escalão"),
            React.createElement("div", { style: { fontSize: 13, color: autoEscalao ? T.GOLD : T.TEXT3, padding: "8px 0", fontStyle: autoEscalao ? "normal" : "italic" } },
              autoEscalao || "Preenche a data de nascimento")
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Classe"),
            React.createElement("select", { style: inp, value: f.level, onChange: e => upd("level", e.target.value) },
              LEVELS.map(l => React.createElement("option", { key: l }, l)))
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: lbl }, "Categoria de Peso (kg)"),
            React.createElement("select", { style: inp, value: f.weight, onChange: e => upd("weight", e.target.value) },
              React.createElement("option", { value: "" }, "Selecionar..."),
              getWeightCategories(f.sub_modality || "K1", autoEscalao, f.gender, f.level).map(w => React.createElement("option", { key: w }, w)))
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { ...lbl, color: T.GOLD } }, "E-mail"),
            React.createElement("input", { style: { ...inp, borderColor: T.GOLD_DIM }, value: f.email, onChange: e => upd("email", e.target.value), placeholder: "o teu e-mail" })
          )
        ),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginTop: 10 } }, err),
        React.createElement("button", { onClick: handleRegister, disabled: saving, style: { ...s.btnGold, width: "100%", marginTop: 16, opacity: saving ? 0.7 : 1 } }, saving ? "A enviar..." : "Enviar Pedido de Registo")
      )
    )
  );
}

function PendingPage({ onLogout, user, setPage, setUsers, users, pendingCount, club, clubs, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.get("fighters").then(all => {
      const activeClubId = viewAsClub ? viewAsClub.id : user.club_id;
      const filtered = viewAsClub
        ? all.filter(f => f.status === "pending" && f.club_id === activeClubId)
        : user.role === "superadmin"
          ? all.filter(f => f.status === "pending")
          : all.filter(f => f.status === "pending" && f.club_id === activeClubId);
      setPending(filtered); setLoading(false);
    });
  }, []);

  async function approve(fighter) {
    let username = emailToUsername(fighter.email);
    const existingUsers = await db.get("users");
    let base = username; let i = 2;
    while (existingUsers.map(u => u.username).includes(username)) { username = base + i; i++; }
    const password = generatePassword();
    const newUser = { id: `user_${fighter.id}`, name: fighter.name, role: "athlete", fighter_id: fighter.id, username, password, email: fighter.email, club_id: fighter.club_id };
    await db.update("fighters", fighter.id, { status: "approved" });
    await db.insert("users", newUser);
    setUsers(p => [...p, newUser]);
    setPending(p => p.filter(f => f.id !== fighter.id));
    alert(`✅ Aprovado!\n\nUsername: ${username}\nPassword: ${password}\n\nEnvia estas credenciais ao atleta: ${fighter.email}`);
  }

  async function reject(fighterId) { await db.update("fighters", fighterId, { status: "rejected" }); setPending(p => p.filter(f => f.id !== fighterId)); }

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "pending", setPage, pendingCount, club, viewAsClub, setViewAsClub }),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: T.TEXT, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 } }, `Pedidos Pendentes · ${pending.length}`),
      loading && React.createElement("div", { style: { color: T.TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      pending.length === 0 && !loading && React.createElement(Card, null, React.createElement("div", { style: { color: T.TEXT3, textAlign: "center", padding: "24px 0" } }, "Nenhum pedido pendente.")),
      pending.map(f => {
        const fClub = (clubs || []).find(c => c.id === f.club_id);
        return React.createElement(Card, { key: f.id, style: { marginBottom: 8 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
            React.createElement(Avatar, { name: f.name, size: 36 }),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: T.TEXT } }, f.name),
              fClub && React.createElement("div", { style: { fontSize: 11, color: fClub.primary_color, fontWeight: 700, marginTop: 1 } }, fClub.name),
              React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, `${f.email} · ${f.modality} · ${f.level} · ${f.weight}`),
              React.createElement("div", { style: { fontSize: 11, color: T.TEXT3, marginTop: 2 } }, `Pedido: ${f.registration_date ? new Date(f.registration_date).toLocaleDateString("pt-PT") : "—"}`)
            ),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              React.createElement("button", { onClick: () => approve(f), style: { ...s.btnGreen, padding: "5px 14px", fontSize: 12 } }, "✓ Aprovar"),
              React.createElement("button", { onClick: () => reject(f.id), style: { ...s.btnRed, padding: "5px 14px", fontSize: 12 } }, "✕ Rejeitar")
            )
          )
        );
      }),
      React.createElement(Footer)
    )
  );
}

function DashboardPage({ onLogout, user, setPage, pendingCount, clubs, allFighters, allFights, viewAsClub, setViewAsClub }) {
  const [rankBy, setRankBy] = React.useState("wr");

  const activeClubs = (clubs || []).filter(c => c.active);

  const clubStats = activeClubs.map(club => {
    const cf = allFighters.filter(f => f.club_id === club.id && f.status !== "pending");
    const cfIds = new Set(cf.map(f => String(f.id)));
    const ff = allFights.filter(f => cfIds.has(String(f.fighter_id)));
    const wins = ff.filter(x => x.result === "V").length;
    const losses = ff.filter(x => x.result === "D").length;
    const kos = ff.filter(x => x.result === "V" && x.method && x.method.includes("KO")).length;
    const wr = ff.length >= 3 ? Math.round(wins / ff.length * 100) : null;
    const available = cf.filter(f => f.available).length;
    return { club, fighters: cf.length, fights: ff.length, wins, losses, kos, wr, available };
  });

  const ranked = [...clubStats].sort((a, b) => {
    if (rankBy === "wr") return (b.wr ?? -1) - (a.wr ?? -1);
    if (rankBy === "fights") return b.fights - a.fights;
    if (rankBy === "kos") return b.kos - a.kos;
    if (rankBy === "athletes") return b.fighters - a.fighters;
    return 0;
  });

  // Actividade recente — últimos 10 combates
  const recentFights = [...allFights]
    .filter(f => f.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const getFighterName = (id) => {
    const f = allFighters.find(x => String(x.id) === String(id));
    return f?.name || "—";
  };

  const getClubByFighter = (id) => {
    const f = allFighters.find(x => String(x.id) === String(id));
    return (clubs || []).find(c => c.id === f?.club_id);
  };

  // Novos atletas — último mês
  const oneMonthAgo = new Date(); oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newAthletes = allFighters
    .filter(f => f.registration_date && new Date(f.registration_date) > oneMonthAgo && f.status !== "pending")
    .sort((a, b) => new Date(b.registration_date) - new Date(a.registration_date))
    .slice(0, 5);

  const rankLabels = { wr: "Win Rate", fights: "Combates", kos: "KOs", athletes: "Atletas" };

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 720, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "dashboard", setPage, pendingCount, club: null, viewAsClub, setViewAsClub }),

      React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#ff9900", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 } }, "Dashboard Analítico"),

      // Stats globais
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 } },
        React.createElement(StatBox, { label: "Clubes", value: activeClubs.length, color: T.GOLD }),
        React.createElement(StatBox, { label: "Atletas", value: allFighters.filter(f => f.status !== "pending").length, color: "#4caf7d" }),
        React.createElement(StatBox, { label: "Combates", value: allFights.length, color: "#5b8fd4" }),
        React.createElement(StatBox, { label: "KO/TKO", value: allFights.filter(f => f.result === "V" && f.method && f.method.includes("KO")).length, color: "#e05555" })
      ),

      // Ranking de equipas
      React.createElement(GoldDivider),
      React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 11, color: T.TEXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 } }, "Ranking de Equipas"),
        React.createElement("div", { style: { display: "flex", gap: 4 } },
          Object.entries(rankLabels).map(([key, label]) =>
            React.createElement("button", { key, onClick: () => setRankBy(key), style: { fontSize: 10, padding: "3px 8px", borderRadius: 5, border: `1px solid ${rankBy === key ? T.GOLD : T.BORDER}`, background: rankBy === key ? T.GOLD + "22" : "transparent", color: rankBy === key ? T.GOLD : T.TEXT3, cursor: "pointer" } }, label)
          )
        )
      ),
      ranked.map(({ club, fighters, fights, wins, losses, kos, wr, available }, i) =>
        React.createElement(Card, { key: club.id, style: { marginBottom: 6, padding: "10px 14px" } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            React.createElement("div", { style: { width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#C9A84C22" : i === 1 ? "#88888822" : i === 2 ? "#cd7f3222" : T.BG3, border: `1px solid ${i === 0 ? T.GOLD : i === 1 ? "#888" : i === 2 ? "#cd7f32" : T.BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: i === 0 ? T.GOLD : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : T.TEXT3, flexShrink: 0 } }, i + 1),
            club.logo_url
              ? React.createElement("img", { src: club.logo_url, style: { width: 26, height: 26, objectFit: "contain", borderRadius: 4, flexShrink: 0 } })
              : React.createElement("div", { style: { width: 26, height: 26, borderRadius: 4, background: (club.primary_color || T.GOLD) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: club.primary_color || T.GOLD, flexShrink: 0 } }, club.short_name || "?"),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: club.primary_color || T.GOLD } }, club.name),
              React.createElement("div", { style: { display: "flex", gap: 8, fontSize: 11, color: T.TEXT2, marginTop: 2 } },
                React.createElement("span", null, fighters + " atletas"),
                fights > 0 && React.createElement("span", { style: { color: "#4caf7d" } }, wins + "V"),
                fights > 0 && React.createElement("span", { style: { color: "#e05555" } }, losses + "D"),
                kos > 0 && React.createElement("span", { style: { color: T.GOLD } }, kos + " KO"),
                available > 0 && React.createElement("span", { style: { color: "#4caf7d" } }, available + " disp.")
              )
            ),
            wr !== null && React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: wr >= 60 ? "#4caf7d" : wr >= 40 ? T.GOLD : "#e05555" } }, wr + "%")
          )
        )
      ),

      // Actividade recente
      React.createElement(GoldDivider),
      React.createElement("div", { style: { fontSize: 11, color: T.TEXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 } }, "Combates Recentes"),
      recentFights.length === 0
        ? React.createElement("div", { style: { color: T.TEXT3, fontSize: 12, marginBottom: 16 } }, "Nenhum combate registado.")
        : recentFights.map((f, i) => {
            const fc = getClubByFighter(f.fighter_id);
            return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.BORDER}` } },
              React.createElement("div", { style: { width: 28, height: 28, borderRadius: 4, background: (fc?.primary_color || T.GOLD) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: fc?.primary_color || T.GOLD, flexShrink: 0 } }, fc?.short_name || "?"),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontSize: 12, color: T.TEXT, fontWeight: 600 } }, getFighterName(f.fighter_id) + " vs. " + (f.opponent || "—")),
                React.createElement("div", { style: { fontSize: 10, color: T.TEXT3 } }, (f.event || "") + (f.date ? " · " + f.date : ""))
              ),
              React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: f.result === "V" ? "#4caf7d" : f.result === "D" ? "#e05555" : T.TEXT3, minWidth: 24, textAlign: "right" } }, f.result)
            );
          }),

      // Novos atletas
      newAthletes.length > 0 && React.createElement("div", null,
        React.createElement(GoldDivider),
        React.createElement("div", { style: { fontSize: 11, color: T.TEXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 } }, "Novos Atletas (último mês)"),
        newAthletes.map((f, i) => {
          const fc = (clubs || []).find(c => c.id === f.club_id);
          return React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.BORDER}` } },
            React.createElement(Avatar, { name: f.name, size: 28, photo: f.photo }),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 12, color: T.TEXT, fontWeight: 600 } }, f.name),
              React.createElement("div", { style: { fontSize: 10, color: T.TEXT3 } }, fc?.name || f.club_id)
            ),
            React.createElement("div", { style: { fontSize: 10, color: T.TEXT3 } }, f.registration_date ? f.registration_date.slice(0, 10) : "")
          );
        })
      ),

      React.createElement(Footer)
    )
  );
}
function ClubsPage({ onLogout, user, setPage, pendingCount, clubs, setClubes, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const { inp, lbl } = s;
  const [showForm, setShowForm] = useState(false);
  const [inviteClub, setInviteClub] = useState(null);
  const [nc, setNc] = useState({ id: "", name: "", short_name: "", primary_color: "#C9A84C", secondary_color: "#8a6f2e", logo_url: "", active: true });

  async function saveClub() {
    if (!nc.name.trim() || !nc.id.trim()) return;
    const club = { ...nc, id: nc.id.toLowerCase().replace(/[^a-z0-9]/g, ""), created_at: new Date().toISOString() };
    await db.insert("clubs", club); setClubes(p => [...p, club]);
    setShowForm(false); setNc({ id: "", name: "", short_name: "", primary_color: "#C9A84C", secondary_color: "#8a6f2e", logo_url: "", active: true });
  }

  async function toggleActive(club) {
    await db.update("clubs", club.id, { active: !club.active });
    setClubes(p => p.map(c => c.id === club.id ? { ...c, active: !c.active } : c));
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "clubs", setPage, pendingCount, club: null, viewAsClub, setViewAsClub }),
      inviteClub && React.createElement(InviteModal, { onClose: () => setInviteClub(null), user, club: inviteClub, clubs, defaultClubId: inviteClub.id, defaultRole: "admin", defaultEmail: "" }),
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#ff9900", textTransform: "uppercase", letterSpacing: 1 } }, `Clubes · ${(clubs || []).length}`),
        React.createElement("button", { onClick: () => setShowForm(p => !p), style: { ...s.btnOutline, borderColor: "#ff990066", color: "#ff9900" } }, "+ Novo Clube")
      ),
      showForm && React.createElement(Card, { gold: true, style: { marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 12, color: "#ff9900", fontWeight: 700, marginBottom: 12, textTransform: "uppercase" } }, "Novo Clube"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          React.createElement("div", null, React.createElement("label", { style: lbl }, "ID único"), React.createElement("input", { style: inp, value: nc.id, onChange: e => setNc({ ...nc, id: e.target.value }), placeholder: "ex: portofight" })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Nome completo"), React.createElement("input", { style: inp, value: nc.name, onChange: e => setNc({ ...nc, name: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Abreviatura"), React.createElement("input", { style: inp, value: nc.short_name, onChange: e => setNc({ ...nc, short_name: e.target.value }), placeholder: "ex: PFC" })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "URL do Logo"), React.createElement("input", { style: inp, value: nc.logo_url, onChange: e => setNc({ ...nc, logo_url: e.target.value }), placeholder: "https://..." })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Cor Principal"),
            React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
              React.createElement("input", { type: "color", value: nc.primary_color, onChange: e => setNc({ ...nc, primary_color: e.target.value }), style: { width: 44, height: 36, borderRadius: 6, border: "none", cursor: "pointer" } }),
              React.createElement("input", { style: { ...inp, flex: 1 }, value: nc.primary_color, onChange: e => setNc({ ...nc, primary_color: e.target.value }) })
            )
          ),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Cor Secundária"),
            React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
              React.createElement("input", { type: "color", value: nc.secondary_color, onChange: e => setNc({ ...nc, secondary_color: e.target.value }), style: { width: 44, height: 36, borderRadius: 6, border: "none", cursor: "pointer" } }),
              React.createElement("input", { style: { ...inp, flex: 1 }, value: nc.secondary_color, onChange: e => setNc({ ...nc, secondary_color: e.target.value }) })
            )
          )
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveClub, style: { ...s.btnGold, marginTop: 0, background: "#ff9900" } }, "Criar Clube"),
          React.createElement("button", { onClick: () => setShowForm(false), style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      (clubs || []).map(club => React.createElement(Card, { key: club.id, style: { marginBottom: 8 } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
          club.logo_url
            ? React.createElement("img", { src: club.logo_url, style: { width: 44, height: 44, objectFit: "contain", borderRadius: 8, background: T.BG3 } })
            : React.createElement("div", { style: { width: 44, height: 44, borderRadius: 8, background: club.primary_color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: club.primary_color } }, club.short_name || "?"),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontWeight: 700, color: club.primary_color, fontSize: 15 } }, club.name),
            React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, `ID: ${club.id} · ${club.short_name || "—"}`)
          ),
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            React.createElement("button", { onClick: () => { setViewAsClub(club); T = buildTheme(club); setPage("fighters"); }, style: { padding: "5px 14px", borderRadius: 6, border: "1px solid #5b8fd444", background: "transparent", color: "#5b8fd4", cursor: "pointer", fontSize: 12, fontWeight: 700 } }, React.createElement("span", { style: { display: "flex", alignItems: "center", gap: 4 } }, React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", style: { display: "inline", verticalAlign: "middle", marginRight: 4 } },
              React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
              React.createElement("circle", { cx: 12, cy: 12, r: 3 })
            ), "Ver como")),
            React.createElement("button", { onClick: () => toggleActive(club), style: { padding: "5px 14px", borderRadius: 6, border: `1px solid ${club.active ? "#4caf7d44" : "#e0555544"}`, background: "transparent", color: club.active ? "#4caf7d" : "#e05555", cursor: "pointer", fontSize: 12, fontWeight: 700 } }, club.active ? "Ativo" : "Inativo"),
            React.createElement("button", { onClick: () => setInviteClub(club), style: { padding: "5px 14px", borderRadius: 6, border: "1px solid #4caf7d44", background: "transparent", color: "#4caf7d", cursor: "pointer", fontSize: 12, fontWeight: 700 } }, "✉ Admin")
          )
        )
      )),
      React.createElement(Footer)
    )
  );
}
// ═══════════════════════════════════════════════════════════
// PARTE 4: TEAMS PAGE
// ═══════════════════════════════════════════════════════════

function TeamsPage({ onLogout, user, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const [teams, setTeams] = useState([]);
  const [allFighters, setAllFighters] = useState([]);
  const [allFights, setAllFights] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selFighter, setSelFighter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTeam, setSearchTeam] = useState("");

  useEffect(() => {
    async function load() {
      const [fighters, fights] = await Promise.all([db.get("fighters"), db.get("fights")]);
      const approved = fighters.filter(f => {
        if (f.status === "pending" || f.status === "rejected") return false;
        if (user.role === "admin") return f.club_id === user.club_id;
        return true;
      });
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

  // Vista detalhe de atleta
  if (selFighter) {
    const rec = getRecord(selFighter.id);
    const wr = rec.total > 0 ? Math.round(rec.wins / rec.total * 100) : 0;
    const fighterFights = allFights.filter(f => f.fighter_id === selFighter.id);
    return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
      React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
        React.createElement(Header, { onLogout, user, currentPage: "teams", setPage, pendingCount, club, viewAsClub, setViewAsClub }),
        React.createElement("button", { onClick: () => setSelFighter(null), style: { fontSize: 13, color: T.TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Voltar"),
        React.createElement(Card, { gold: true, style: { marginBottom: 14 } },
          React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 } },
            React.createElement(Avatar, { name: selFighter.name, size: 70, photo: selFighter.photo }),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: T.TEXT, marginBottom: 8 } }, selFighter.name),
              React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
                React.createElement(ClubTag, { clubId: selFighter.club_id, clubs }),
                React.createElement(Badge, { type: "gold" }, selFighter.team),
                React.createElement(Badge, null, selFighter.modality),
                selFighter.sub_modality && React.createElement(Badge, { type: "gold" }, selFighter.sub_modality),
                React.createElement(Badge, { type: "blue" }, selFighter.level),
                React.createElement(Badge, null, selFighter.weight)
              )
            )
          ),
          React.createElement(GoldDivider),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement(StatBox, { label: "Vitórias", value: rec.wins, color: "#4caf7d", sub: rec.kos > 0 ? `${rec.kos} KO` : null }),
            React.createElement(StatBox, { label: "Derrotas", value: rec.losses, color: "#e05555" }),
            React.createElement(StatBox, { label: "Empates", value: rec.draws, color: T.TEXT3 }),
            React.createElement(StatBox, { label: "Win Rate", value: wr + "%", color: T.GOLD })
          )
        ),
        React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: T.TEXT2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 } }, `Histórico · ${fighterFights.length} combates`),
        fighterFights.length === 0
          ? React.createElement(Card, null, React.createElement("div", { style: { color: T.TEXT3, textAlign: "center", padding: "16px 0" } }, "Sem combates registados."))
          : fighterFights.map((fight, i) => React.createElement(Card, { key: i, style: { marginBottom: 8 } },
              React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
                React.createElement(ResultBadge, { r: fight.result }),
                React.createElement("div", { style: { flex: 1 } },
                  React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: T.TEXT } }, `vs. ${fight.opponent}`, fight.opponent_team && React.createElement("span", { style: { fontSize: 12, color: T.TEXT3, marginLeft: 6 } }, `(${fight.opponent_team})`)),
                  React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, `${fight.event || ""} · ${fight.date || ""}`),
                  React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
                    React.createElement(Badge, null, fight.modality),
                    fight.sub_modality && React.createElement(Badge, { type: "gold" }, fight.sub_modality),
                    React.createElement(Badge, { type: "blue" }, fight.level),
                    React.createElement(Badge, null, fight.method),
                    fight.weight && React.createElement(Badge, null, fight.weight)
                  )
                )
              )
            )),
        React.createElement(Footer)
      )
    );
  }

  // Vista lista de atletas duma equipa
  if (selected) {
    const teamFighters = allFighters.filter(f => (f.team || "Sem Equipa") === selected);
    return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
      React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
        React.createElement(Header, { onLogout, user, currentPage: "teams", setPage, pendingCount, club, viewAsClub, setViewAsClub }),
        React.createElement("button", { onClick: () => setSelected(null), style: { fontSize: 13, color: T.TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Equipas"),
        React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: T.GOLD, marginBottom: 4, textTransform: "uppercase", letterSpacing: 2 } }, selected),
        React.createElement("div", { style: { fontSize: 13, color: T.TEXT2, marginBottom: 16 } }, `${teamFighters.length} atleta${teamFighters.length !== 1 ? "s" : ""}`),
        React.createElement(GoldDivider),
        teamFighters.map(f => {
          const rec = getRecord(f.id);
          return React.createElement("div", { key: f.id, style: { background: T.BG2, border: `1px solid ${T.BORDER}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }, onMouseEnter: e => e.currentTarget.style.borderColor = T.GOLD_DIM, onMouseLeave: e => e.currentTarget.style.borderColor = T.BORDER, onClick: () => setSelFighter(f) },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
              React.createElement(Avatar, { name: f.name, size: 36, photo: f.photo, available: f.available }),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: T.TEXT, marginBottom: 4 } }, f.name),
                React.createElement("div", { style: { display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 } },
                  React.createElement(ClubTag, { clubId: f.club_id, clubs }),
                  React.createElement(Badge, null, f.modality),
                  f.sub_modality && React.createElement(Badge, { type: "gold" }, f.sub_modality),
                  React.createElement(Badge, { type: "blue" }, f.level),
                  React.createElement(Badge, null, f.weight)
                ),
                React.createElement("div", { style: { display: "flex", gap: 12, fontSize: 13 } },
                  React.createElement("span", { style: { color: "#4caf7d", fontWeight: 700 } }, `${rec.wins}V`),
                  React.createElement("span", { style: { color: "#e05555", fontWeight: 700 } }, `${rec.losses}D`),
                  React.createElement("span", { style: { color: T.TEXT3, fontWeight: 700 } }, `${rec.draws}E`),
                  rec.kos > 0 && React.createElement("span", { style: { color: T.GOLD, fontSize: 11 } }, `· ${rec.kos} KO`)
                )
              ),
              React.createElement("div", { style: { fontSize: 20, color: T.TEXT3 } }, "›")
            )
          );
        }),
        React.createElement(Footer)
      )
    );
  }

  // Vista lista de equipas
  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "teams", setPage, pendingCount, club, viewAsClub, setViewAsClub }),
      React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: T.TEXT, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 } }, `Equipas · ${teams.length}`),
      React.createElement("input", { style: { ...getStyles().inp, marginBottom: 14, background: T.BG2 }, placeholder: "🔍  Pesquisar equipa...", value: searchTeam, onChange: e => setSearchTeam(e.target.value) }),
      loading && React.createElement("div", { style: { color: T.TEXT2, textAlign: "center", padding: 24 } }, "A carregar..."),
      (() => {
        // Stats globais para o cabeçalho
        const totalAthletes = teams.reduce((a, t) => a + t.fighters.length, 0);
        const allTeamFights = allFights.length;
        const allTeamWins = allFights.filter(x => x.result === "V").length;
        const allKOs = allFights.filter(x => x.result === "V" && x.method && x.method.includes("KO")).length;
        const availableTotal = teams.reduce((a, t) => a + t.fighters.filter(f => f.available).length, 0);

        // Ranking de equipas por win rate (mín 3 combates)
        const ranked = teams.map(t => {
          const tf = t.fighters.reduce((a, f) => a + allFights.filter(x => String(x.fighter_id) === String(f.id)).length, 0);
          const tw = t.fighters.reduce((a, f) => a + allFights.filter(x => String(x.fighter_id) === String(f.id) && x.result === "V").length, 0);
          const td = t.fighters.reduce((a, f) => a + allFights.filter(x => String(x.fighter_id) === String(f.id) && x.result === "D").length, 0);
          const tk = t.fighters.reduce((a, f) => a + allFights.filter(x => String(x.fighter_id) === String(f.id) && x.result === "V" && x.method && x.method.includes("KO")).length, 0);
          const wr = tf >= 3 ? Math.round(tw / tf * 100) : null;
          const av = t.fighters.filter(f => f.available).length;
          // Find club for this team
          const teamClub = (clubs || []).find(c => t.fighters.some(f => f.club_id === c.id));
          return { ...t, tf, tw, td, tk, wr, av, teamClub };
        }).sort((a, b) => (b.wr ?? -1) - (a.wr ?? -1));

        const filtered = ranked.filter(t => !searchTeam || t.name.toLowerCase().includes(searchTeam.toLowerCase()));

        return React.createElement("div", null,
          // Stats globais
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 } },
            React.createElement(StatBox, { label: "Equipas", value: teams.length, color: T.GOLD }),
            React.createElement(StatBox, { label: "Atletas", value: totalAthletes, color: "#4caf7d" }),
            React.createElement(StatBox, { label: "Combates", value: allTeamFights, color: "#5b8fd4" }),
            React.createElement(StatBox, { label: "Disponíveis", value: availableTotal, color: "#4caf7d" })
          ),

          // Lista de equipas enriquecida
          filtered.map((t, rank) => {
            const teamColor = t.teamClub?.primary_color || T.GOLD;
            return React.createElement("div", { key: t.name, style: { background: T.BG2, border: `1px solid ${T.BORDER}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer" },
              onMouseEnter: e => e.currentTarget.style.borderColor = teamColor + "88",
              onMouseLeave: e => e.currentTarget.style.borderColor = T.BORDER,
              onClick: () => setSelected(t.name)
            },
              React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                // Rank badge
                React.createElement("div", { style: { width: 24, height: 24, borderRadius: "50%", background: rank === 0 ? "#C9A84C22" : rank === 1 ? "#88888822" : rank === 2 ? "#cd7f3222" : T.BG3, border: `1px solid ${rank === 0 ? T.GOLD : rank === 1 ? "#888" : rank === 2 ? "#cd7f32" : T.BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: rank === 0 ? T.GOLD : rank === 1 ? "#aaa" : rank === 2 ? "#cd7f32" : T.TEXT3, flexShrink: 0 } }, rank + 1),
                // Logo clube
                t.teamClub?.logo_url
                  ? React.createElement("img", { src: t.teamClub.logo_url, style: { width: 28, height: 28, objectFit: "contain", borderRadius: 4, flexShrink: 0 } })
                  : React.createElement("div", { style: { width: 28, height: 28, borderRadius: 4, background: teamColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: teamColor, flexShrink: 0 } }, t.teamClub?.short_name || t.name[0]),
                React.createElement("div", { style: { flex: 1 } },
                  React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: teamColor, marginBottom: 3 } }, t.name),
                  React.createElement("div", { style: { display: "flex", gap: 8, fontSize: 11, color: T.TEXT2, flexWrap: "wrap" } },
                    React.createElement("span", null, `${t.fighters.length} atletas`),
                    t.tf > 0 && React.createElement("span", { style: { color: "#4caf7d" } }, `${t.tw}V`),
                    t.tf > 0 && React.createElement("span", { style: { color: "#e05555" } }, `${t.td}D`),
                    t.tk > 0 && React.createElement("span", { style: { color: T.GOLD } }, `${t.tk} KO`),
                    t.wr !== null && React.createElement("span", { style: { fontWeight: 700, color: t.wr >= 60 ? "#4caf7d" : t.wr >= 40 ? T.GOLD : "#e05555" } }, `${t.wr}% WR`),
                    t.av > 0 && React.createElement("span", { style: { color: "#4caf7d" } }, `${t.av} disponíveis`)
                  )
                ),
                React.createElement("div", { style: { fontSize: 16, color: T.TEXT3 } }, "›")
              )
            );
          })
        );
      })(),
      React.createElement(Footer)
    )
  );
}
// ═══════════════════════════════════════════════════════════
// PARTE 5: FIGHTER PROFILE, INVITE MODAL, NEW FIGHTER FORM
// ═══════════════════════════════════════════════════════════

function FighterProfile({ fighter, onBack, onSave, user, isOwner, onLogout, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const { inp, lbl } = s;
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
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [nf, setNf] = useState({ ...EMPTY_FIGHT });
  const [nu, setNu] = useState({ opponent: "", event: "", date: "", local: "", weight: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador" });
  const [nt, setNt] = useState({ name: "", org: "", year: 2026 });
  const [lightbox, setLightbox] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [opponentSuggestions, setOpponentSuggestions] = useState([]);

  const [editUpcoming, setEditUpcoming] = useState(null);

  async function saveEditUpcoming() {
    const { _eventId, _opponentId, ...clean } = editUpcoming;
    await db.update("upcoming", clean.id, clean);
    setF(p => ({ ...p, upcoming: p.upcoming.map(u => u.id === clean.id ? clean : u) }));
    setEditUpcoming(null);
  }

  async function deleteUpcoming(id) {
    await db.delete("upcoming", id);
    setF(p => ({ ...p, upcoming: p.upcoming.filter(u => u.id !== id) }));
  }

  async function searchOpponent(name) {
    if (!name || name.length < 2) { setOpponentSuggestions([]); return; }
    const all = await db.get("fighters");
    const q = name.toLowerCase();
    const matches = all.filter(fg => fg.id !== fighter.id && fg.name && fg.name.toLowerCase().includes(q)).slice(0, 5);
    setOpponentSuggestions(matches);
  }

  useEffect(() => {
    setLoading(true);
    async function load() {
      const [fights, upcoming, titles] = await Promise.all([
        db.get("fights", { fighter_id: fighter.id }),
        db.get("upcoming", { fighter_id: fighter.id }),
        db.get("titles", { fighter_id: fighter.id })
      ]);
      setF(p => ({ ...p, fights, upcoming, titles }));
      setLoading(false);
    }
    load();
    const today = new Date(); today.setHours(0,0,0,0);
    db.get("events").then(evs => setCalendarEvents(evs.filter(e => new Date(e.date) >= today).sort((a,b) => new Date(a.date)-new Date(b.date))));
  }, [fighter.id]);

  // Snapshot dos campos editáveis para detectar alterações
  const profileFields = ["name","team","weight","category","gender","modality","sub_modality","level","birthdate","available"];
  const snapshot = savedSnapshot || profileFields.reduce((o,k) => ({...o,[k]: fighter[k]}), {});
  const isDirty = profileFields.some(k => String(f[k]||"") !== String(snapshot[k]||""));

  // Calcular escalão automaticamente a partir da data de nascimento
  function calcEscalao(birthdate, modality, subModality) {
    if (!birthdate) return "";
    const year = new Date(birthdate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    const isRing = RING_DISCIPLINES.includes(subModality);
    if (!isRing) {
      // Tatami e Muay Thai
      if (age <= 9) return "Crianças (7-9 anos)";
      if (age <= 12) return "Cadetes Jovens (10-12 anos)";
      if (age <= 15) return "Cadetes Mais Velhos (13-15 anos)";
      if (age <= 18) return "Juniores (16-18 anos)";
      if (age <= 40) return "Seniores (19-40 anos)";
      return "Veteranos/Masters (41-55 anos)";
    } else {
      // Ring
      if (age <= 16) return "Juniores Mais Jovens (15-16 anos)";
      if (age <= 18) return "Juniores Mais Velhos (17-18 anos)";
      return "Seniores (19-40 anos)";
    }
  }

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

  const fClub = (clubs || []).find(c => c.id === fighter.club_id);

  async function saveProfile() {
    setSaving(true);
    try {
      const autoCategory = calcEscalao(f.birthdate, f.modality, f.sub_modality);
      await db.update("fighters", f.id, { name: san(f.name, 100), weight: f.weight, category: autoCategory || san(f.category), modality: f.modality, sub_modality: f.sub_modality, level: f.level, gender: f.gender || "", photo: f.photo, birthdate: f.birthdate || "", available: f.available || false });
      setSavedSnapshot(profileFields.reduce((o,k) => ({...o,[k]: f[k]}), {}));
    } catch(e) {
      alert("Erro ao guardar. Verifica a ligação e tenta novamente. " + e.message);
    }
    setSaving(false);
  }



  async function saveFight() {
    const fight = { ...nf, opponent: san(nf.opponent, 100), opponent_team: san(nf.opponent_team, 100), event: san(nf.event, 100), id: `f${Date.now()}`, fighter_id: f.id };
    await db.insert("fights", fight); setF(p => ({ ...p, fights: [fight, ...p.fights] })); setShowFF(false); setNf({ ...EMPTY_FIGHT });
  }

  async function saveEditFight() { await db.update("fights", editFight.id, editFight); setF(p => ({ ...p, fights: p.fights.map(x => x.id === editFight.id ? { ...editFight } : x) })); setEditFight(null); }
  async function deleteFight(id) { await db.delete("fights", id); setF(p => ({ ...p, fights: p.fights.filter(x => x.id !== id) })); setDelFightId(null); }

  async function saveUpcoming() {
    const { _eventId, _opponentId, ...nuClean } = nu;
    const u = { ...nuClean, opponent: san(nuClean.opponent, 100), opponent_team: san(nuClean.opponent_team || "", 100), event: san(nuClean.event, 100), local: san(nuClean.local, 100), id: `u${Date.now()}`, fighter_id: f.id };
    const result = await db.insert("upcoming", u);
    console.log("insert result:", result);
    // Se o adversário existe na plataforma, criar a luta também no perfil dele
    if (_opponentId) {
      const opp = await db.get("fighters", { id: _opponentId });
      if (opp && opp[0]) {
        const oppFight = { ...u, id: `u${Date.now()+1}`, fighter_id: _opponentId, opponent: f.name, opponent_team: f.team || "" };
        await db.insert("upcoming", oppFight);
      }
    }
    if (nuClean.event && nuClean.event.trim()) {
      const evs = await db.get("events");
      if (!evs.some(ev => ev.name.toLowerCase().trim() === nuClean.event.toLowerCase().trim()))
        await db.insert("events", { id: `ev${Date.now()}`, name: san(nuClean.event), date: nuClean.date || "", local: san(nuClean.local), city: "", country: "Portugal", organization: "", created_at: new Date().toISOString() });
    }
    // Recarregar upcoming do servidor
    const fresh = await db.get("upcoming", { fighter_id: f.id });
    setF(p => ({ ...p, upcoming: fresh }));
    setShowUF(false);
    setNu({ opponent: "", event: "", date: "", local: "", weight: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", _eventId: "", _opponentId: "" });
  }

  async function saveTitle() { const res = await db.insert("titles", { name: san(nt.name, 100), org: san(nt.org, 100), modality: nt.modality || "Kickboxing", sub_modality: nt.sub_modality || "", escalao: san(nt.escalao || "", 100), weight: san(nt.weight || "", 50), event_name: san(nt.event_name || "", 100), date: nt.date || "", fighter_id: f.id }); setF(p => ({ ...p, titles: [...p.titles, res[0] || nt] })); setShowTF(false); setNt({ name: "", org: "", modality: "Kickboxing", sub_modality: "K1", escalao: "", weight: "", event_name: "", date: "" }); }
  async function saveEditTitle() { await db.update("titles", editTitle.id, { name: san(editTitle.name, 100), org: san(editTitle.org, 100), modality: editTitle.modality || "Kickboxing", sub_modality: editTitle.sub_modality || "", escalao: san(editTitle.escalao || "", 100), weight: san(editTitle.weight || "", 50), event_name: san(editTitle.event_name || "", 100), date: editTitle.date || "" }); setF(p => ({ ...p, titles: p.titles.map(x => x.id === editTitle.id ? { ...editTitle } : x) })); setEditTitle(null); }
  async function deleteTitle(id) { await db.delete("titles", id); setF(p => ({ ...p, titles: p.titles.filter(x => x.id !== id) })); setDelTitleId(null); }

  const TABS = ["Perfil", "Histórico", "Próximas Lutas", "Títulos"];

  if (loading) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center" } }, React.createElement("div", { style: { color: T.GOLD, fontSize: 14 } }, "A carregar..."));

  const tabContent = () => {
    if (tab === 0) return React.createElement("div", null,

      React.createElement(Card, null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          // Nome Completo
          React.createElement("div", { key: "name", style: { gridColumn: "1 / -1" } }, React.createElement("label", { style: lbl }, "Nome Completo"),
            isOwner ? React.createElement("input", { style: inp, value: f.name || "", onChange: e => upd("name", e.target.value) }) : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.name)
          ),
          // Modalidade
          React.createElement("div", { key: "modality" }, React.createElement("label", { style: lbl }, "Modalidade"),
            isOwner
              ? React.createElement("select", { style: inp, value: f.modality || "Kickboxing", onChange: e => upd("modality", e.target.value) },
                  Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))
              : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.modality)
          ),
          // Disciplina
          React.createElement("div", { key: "sub_modality" }, React.createElement("label", { style: lbl }, "Disciplina"),
            isOwner
              ? React.createElement("select", { style: inp, value: f.sub_modality || "K1", onChange: e => upd("sub_modality", e.target.value) },
                  (MODALITIES[f.modality || "Kickboxing"] || MODALITIES["Kickboxing"]).map(s => React.createElement("option", { key: s }, s)))
              : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.sub_modality)
          ),
          // Género
          React.createElement("div", { key: "gender" }, React.createElement("label", { style: lbl }, "Género"),
            isOwner
              ? React.createElement("select", { style: inp, value: f.gender || "", onChange: e => upd("gender", e.target.value) },
                  React.createElement("option", { value: "" }, "Selecionar..."),
                  React.createElement("option", { value: "Masculino" }, "Masculino"),
                  React.createElement("option", { value: "Feminino" }, "Feminino"))
              : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.gender || "—")
          ),
          // Data de Nascimento
          React.createElement("div", { key: "birthdate" }, React.createElement("label", { style: lbl }, "Data de Nascimento"),
            isOwner
              ? React.createElement("input", { type: "date", style: inp, value: f.birthdate || "", onChange: e => upd("birthdate", e.target.value) })
              : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.birthdate || "—")
          ),
          // Escalão (calculado automaticamente)
          React.createElement("div", { key: "category" }, React.createElement("label", { style: lbl }, "Escalão"),
            React.createElement("div", { style: { fontSize: 13, color: f.birthdate ? T.GOLD : T.TEXT3, padding: "8px 0", fontStyle: f.birthdate ? "normal" : "italic" } },
              f.birthdate ? calcEscalao(f.birthdate, f.modality, f.sub_modality) || "—" : "Preenche a data de nascimento"
            )
          ),
          // Classe
          React.createElement("div", { key: "level" }, React.createElement("label", { style: lbl }, "Classe"),
            isOwner
              ? React.createElement("select", { style: inp, value: f.level || "Amador", onChange: e => upd("level", e.target.value) },
                  LEVELS.map(l => React.createElement("option", { key: l }, l)))
              : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.level)
          ),
          // Categoria de Peso
          React.createElement("div", { key: "weight", style: { gridColumn: "1 / -1" } }, React.createElement("label", { style: lbl }, "Categoria de Peso (kg)"),
            isOwner
              ? React.createElement("select", { style: inp, value: f.weight || "", onChange: e => upd("weight", e.target.value) },
                  React.createElement("option", { value: "" }, "Selecionar..."),
                  getWeightCategories(f.sub_modality || "K1", calcEscalao(f.birthdate, f.modality, f.sub_modality) || f.category, f.gender, f.level || "Amador").map(w => React.createElement("option", { key: w }, w)))
              : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.weight)
          ),
          // Equipa
          React.createElement("div", { key: "team", style: { gridColumn: "1 / -1" } }, React.createElement("label", { style: lbl }, "Equipa"),
            isOwner ? React.createElement("input", { style: inp, value: f.team || "", onChange: e => upd("team", e.target.value) }) : React.createElement("div", { style: { fontSize: 14, color: T.TEXT, padding: "8px 0" } }, f.team)
          )
        ),
        isOwner && React.createElement("button", { onClick: saveProfile, disabled: saving || !isDirty, style: { ...s.btnGold, opacity: (saving || !isDirty) ? 0.4 : 1 } }, saving ? "A guardar..." : isDirty ? "Guardar alterações" : "Sem alterações")
      )
    );

    if (tab === 1) return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: T.TEXT, textTransform: "uppercase" } }, `Lutas · ${f.fights.length}`),
        isOwner && React.createElement("button", { onClick: () => { setShowFF(p => !p); setEditFight(null); }, style: s.btnOutline }, "+ Adicionar")
      ),
      showFF && !editFight && React.createElement(Card, { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Novo Combate"),
        React.createElement(FightForm, { val: nf, set: setNf }),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveFight, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setShowFF(false), style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      editFight && React.createElement(Card, { style: { marginBottom: 12, border: `1px solid ${T.GOLD_DIM}` } },
        React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Editar Combate"),
        React.createElement(FightForm, { val: editFight, set: setEditFight }),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveEditFight, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setEditFight(null), style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      f.fights.map(fight => React.createElement(Card, { key: fight.id, style: { marginBottom: 8 } },
        React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 } },
          React.createElement(ResultBadge, { r: fight.result }),
          React.createElement("div", { style: { flex: 1 } },
            React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: T.TEXT } }, fight.opponent, fight.opponent_team && React.createElement("span", { style: { fontSize: 12, color: T.TEXT3, marginLeft: 6 } }, `(${fight.opponent_team})`)),
            React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, `${fight.event || ""} · ${fight.date || ""}`),
            React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
              React.createElement(Badge, null, fight.modality), fight.sub_modality && React.createElement(Badge, { type: "gold" }, fight.sub_modality),
              React.createElement(Badge, { type: "blue" }, fight.level), React.createElement(Badge, null, fight.method),
              fight.weight && React.createElement(Badge, null, fight.weight),
              fight.federation && React.createElement(Badge, { type: "orange" }, fight.federation)
            ),
            delFightId === fight.id && React.createElement("div", { style: { marginTop: 10, display: "flex", gap: 8, alignItems: "center" } },
              React.createElement("span", { style: { fontSize: 13, color: "#e05555" } }, "Tens a certeza?"),
              React.createElement("button", { onClick: () => deleteFight(fight.id), style: { ...s.btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: "#e05555" } }, "Eliminar"),
              React.createElement("button", { onClick: () => setDelFightId(null), style: { ...s.btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
            )
          ),
          isOwner && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 } },
            React.createElement("button", { onClick: () => { setEditFight({ ...fight }); setShowFF(false); window.scrollTo(0, 0); }, style: { ...s.btnOutline, padding: "4px 12px", fontSize: 12 } }, "Editar"),
            React.createElement("button", { onClick: () => setDelFightId(fight.id), style: { ...s.btnRed, padding: "4px 12px", fontSize: 12 } }, "Eliminar")
          )
        )
      ))
    );

    if (tab === 2) return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: T.TEXT, textTransform: "uppercase" } }, `Próximas Lutas · ${f.upcoming.length}`),
        isOwner && React.createElement("button", { onClick: () => setShowUF(p => !p), style: s.btnOutline }, "+ Adicionar")
      ),
      showUF && React.createElement(Card, { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Nova Luta"),
        // Selector de prova do calendário
        calendarEvents.length > 0 && React.createElement("div", { style: { marginBottom: 12 } },
          React.createElement("label", { style: { ...lbl, color: T.GOLD } }, "Ligar a uma Prova do Calendário"),
          React.createElement("select", { style: { ...inp, borderColor: T.GOLD_DIM },
            value: nu._eventId || "",
            onChange: e => {
              const ev = calendarEvents.find(x => x.id === e.target.value);
              if (ev) setNu({ ...nu, _eventId: ev.id, event: ev.name, date: ev.date || nu.date, local: ev.local || ev.city || nu.local });
              else setNu({ ...nu, _eventId: "", event: "", date: "", local: "" });
            }
          },
            React.createElement("option", { value: "" }, "— Seleccionar prova —"),
            calendarEvents.map(ev => React.createElement("option", { key: ev.id, value: ev.id },
              `${ev.name}${ev.date ? " · " + ev.date.slice(8,10) + "/" + ev.date.slice(5,7) + "/" + ev.date.slice(0,4) : ""}${ev.city ? " · " + ev.city : ""}`
            )),
            React.createElement("option", { value: "manual" }, "✏️ Outro evento...")
          )
        ),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          React.createElement("div", { style: { position: "relative" } },
            React.createElement("label", { style: lbl }, "Adversário"),
            React.createElement("input", { style: inp, value: nu.opponent, onChange: e => { setNu({ ...nu, opponent: e.target.value, opponent_team: nu._opponentId ? "" : nu.opponent_team, _opponentId: "" }); searchOpponent(e.target.value); } }),
            opponentSuggestions.length > 0 && React.createElement("div", { style: { position: "absolute", top: "100%", left: 0, right: 0, background: T.BG3, border: `1px solid ${T.GOLD_DIM}`, borderRadius: 6, zIndex: 100, maxHeight: 180, overflowY: "auto" } },
              opponentSuggestions.map(fg => React.createElement("div", { key: fg.id, onClick: () => { setNu({ ...nu, opponent: fg.name, opponent_team: fg.team || "", _opponentId: fg.id }); setOpponentSuggestions([]); }, style: { padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${T.BG4}`, fontSize: 13 } },
                React.createElement("span", { style: { color: T.TEXT, fontWeight: 600 } }, fg.name),
                fg.team && React.createElement("span", { style: { color: T.GOLD_DIM, fontSize: 11, marginLeft: 6 } }, fg.team),
                React.createElement("span", { style: { color: "#4caf7d", fontSize: 10, marginLeft: 6 } }, "✓ na plataforma")
              ))
            )
          ),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: nu.date, onChange: e => setNu({ ...nu, date: e.target.value }) })),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Equipa do Adversário"),
            React.createElement("input", { style: inp, list: "clubs-list", value: nu.opponent_team || "", onChange: e => setNu({ ...nu, opponent_team: e.target.value }), placeholder: "Clube ou equipa..." }),
            React.createElement("datalist", { id: "clubs-list" },
              (clubs || []).map(c => React.createElement("option", { key: c.id, value: c.name }))
            )
          ),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Evento"), React.createElement("input", { style: inp, value: nu.event, onChange: e => setNu({ ...nu, event: e.target.value, _eventId: "" }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Local"), React.createElement("input", { style: inp, value: nu.local, onChange: e => setNu({ ...nu, local: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Peso (kg)"), React.createElement("input", { type: "number", style: inp, value: nu.weight, onChange: e => setNu({ ...nu, weight: e.target.value }) })),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"), React.createElement("select", { style: inp, value: nu.modality, onChange: e => setNu({ ...nu, modality: e.target.value, sub_modality: MODALITIES[e.target.value][0] }) }, Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Disciplina"), React.createElement("select", { style: inp, value: nu.sub_modality, onChange: e => setNu({ ...nu, sub_modality: e.target.value }) }, (MODALITIES[nu.modality] || []).map(s => React.createElement("option", { key: s }, s)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"), React.createElement("select", { style: inp, value: nu.level, onChange: e => setNu({ ...nu, level: e.target.value }) }, LEVELS.map(l => React.createElement("option", { key: l }, l)))),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: lbl }, "Federação"),
            React.createElement("select", { style: inp, value: nu.federation || "", onChange: e => setNu({ ...nu, federation: e.target.value }) },
              React.createElement("option", { value: "" }, "Selecionar federação..."),
              FEDERATIONS.map(fed => React.createElement("option", { key: fed, value: fed }, fed))
            )
          )
        ),
        nu.event && nu.event.trim() && !nu._eventId && React.createElement("div", { style: { fontSize: 11, color: T.GOLD_DIM, marginTop: 10, padding: "6px 10px", background: T.BG3, borderRadius: 6 } },
          `📅 Se "${nu.event}" não existir no calendário, será criado automaticamente.`
        ),
        nu._eventId && React.createElement("div", { style: { fontSize: 11, color: "#4caf7d", marginTop: 10, padding: "6px 10px", background: "#0a1a0e", borderRadius: 6 } },
          `✅ Ligado à prova "${nu.event}"`
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveUpcoming, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => { setShowUF(false); setNu({ opponent: "", opponent_team: "", event: "", date: "", local: "", weight: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", _eventId: "" }); }, style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      f.upcoming.map((u, i) => {
        const days = daysUntil(u.date);
        const isEditing = editUpcoming?.id === u.id;
        return React.createElement(Card, { key: i, style: { marginBottom: 8 } },
          isEditing
            ? React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Editar Luta"),
                React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
                  React.createElement("div", null, React.createElement("label", { style: lbl }, "Adversário"), React.createElement("input", { style: inp, value: editUpcoming.opponent || "", onChange: e => setEditUpcoming({ ...editUpcoming, opponent: e.target.value }) })),
                  React.createElement("div", null, React.createElement("label", { style: lbl }, "Data"), React.createElement("input", { type: "date", style: inp, value: editUpcoming.date || "", onChange: e => setEditUpcoming({ ...editUpcoming, date: e.target.value }) })),
                  React.createElement("div", null, React.createElement("label", { style: lbl }, "Evento"), React.createElement("input", { style: inp, value: editUpcoming.event || "", onChange: e => setEditUpcoming({ ...editUpcoming, event: e.target.value }) })),
                  React.createElement("div", null, React.createElement("label", { style: lbl }, "Local"), React.createElement("input", { style: inp, value: editUpcoming.local || "", onChange: e => setEditUpcoming({ ...editUpcoming, local: e.target.value }) })),
                  React.createElement("div", null, React.createElement("label", { style: lbl }, "Peso (kg)"), React.createElement("input", { type: "number", style: inp, value: editUpcoming.weight || "", onChange: e => setEditUpcoming({ ...editUpcoming, weight: e.target.value }) })),
                  React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"), React.createElement("select", { style: inp, value: editUpcoming.level || "Amador", onChange: e => setEditUpcoming({ ...editUpcoming, level: e.target.value }) }, LEVELS.map(l => React.createElement("option", { key: l }, l))))
                ),
                React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10 } },
                  React.createElement("button", { onClick: saveEditUpcoming, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
                  React.createElement("button", { onClick: () => setEditUpcoming(null), style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
                )
              )
            : React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } },
                React.createElement("div", { style: { background: T.BG3, border: `1px solid ${T.GOLD_DIM}`, borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 48 } },
                  React.createElement("div", { style: { fontSize: 18, fontWeight: 700, color: T.GOLD } }, u.date?.slice(8, 10)),
                  React.createElement("div", { style: { fontSize: 10, color: T.TEXT2 } }, `${u.date?.slice(5, 7)}/${u.date?.slice(2, 4)}`)
                ),
                React.createElement("div", { style: { flex: 1 } },
                  React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: T.TEXT } }, `vs. ${u.opponent}${u.opponent_team ? ` · ${u.opponent_team}` : ``}`),
                  React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, [u.event, u.local].filter(Boolean).join(" · ")),
                  React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
                    React.createElement(Badge, null, u.modality), React.createElement(Badge, { type: "gold" }, u.sub_modality),
                    React.createElement(Badge, { type: "blue" }, u.level), u.weight && React.createElement(Badge, null, u.weight),
                    u.federation && React.createElement(Badge, { type: "orange" }, u.federation)
                  ),
                  isOwner && React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 8 } },
                    React.createElement("button", { onClick: () => setEditUpcoming({ ...u }), style: { ...s.btnOutline, fontSize: 11, padding: "3px 10px" } }, "Editar"),
                    React.createElement("button", { onClick: () => deleteUpcoming(u.id), style: { ...s.btnOutline, fontSize: 11, padding: "3px 10px", borderColor: "#e05555", color: "#e05555" } }, "Eliminar")
                  )
                ),
                days !== null && days >= 0 && React.createElement("div", { style: { textAlign: "center", flexShrink: 0 } },
                  React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: days <= 7 ? "#e05555" : days <= 30 ? T.GOLD : "#4caf7d" } }, days),
                  React.createElement("div", { style: { fontSize: 9, color: T.TEXT3, textTransform: "uppercase" } }, "dias")
                )
              )
        );
      })
    );

    if (tab === 3) return React.createElement("div", null,
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
        React.createElement("span", { style: { fontWeight: 700, fontSize: 14, color: T.TEXT, textTransform: "uppercase" } }, `Títulos · ${f.titles.length}`),
        isOwner && React.createElement("button", { onClick: () => { setShowTF(p => !p); setEditTitle(null); }, style: s.btnOutline }, "+ Adicionar")
      ),
      showTF && React.createElement(Card, { style: { marginBottom: 12 } },
        React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Novo Título"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Classificação"),
            React.createElement("select", { style: inp, value: nt.name, onChange: e => setNt({ ...nt, name: e.target.value }) },
              React.createElement("option", { value: "" }, "Selecionar..."),
              TITLE_TYPES.map(t => React.createElement("option", { key: t, value: t }, t))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Organização / Federação"),
            React.createElement("select", { style: inp, value: nt.org, onChange: e => setNt({ ...nt, org: e.target.value }) },
              React.createElement("option", { value: "" }, "Selecionar federação..."),
              FEDERATIONS.map(fed => React.createElement("option", { key: fed, value: fed }, fed))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Modalidade"),
            React.createElement("select", { style: inp, value: nt.modality || "Kickboxing", onChange: e => setNt({ ...nt, modality: e.target.value, sub_modality: MODALITIES[e.target.value][0] }) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Disciplina"),
            React.createElement("select", { style: inp, value: nt.sub_modality || "K1", onChange: e => setNt({ ...nt, sub_modality: e.target.value }) },
              (MODALITIES[nt.modality || "Kickboxing"] || []).map(s => React.createElement("option", { key: s }, s))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Escalão"),
            React.createElement("input", { style: inp, value: nt.escalao || "", onChange: e => setNt({ ...nt, escalao: e.target.value }), placeholder: "ex: Seniores" })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Peso"),
            React.createElement("input", { style: inp, value: nt.weight || "", onChange: e => setNt({ ...nt, weight: e.target.value }), placeholder: "ex: -70kg" })
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: lbl }, "Nome do Título / Evento"),
            React.createElement("input", { style: inp, value: nt.event_name || "", onChange: e => setNt({ ...nt, event_name: e.target.value }), placeholder: "ex: Campeonato Nacional 2025" })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Data"),
            React.createElement("input", { type: "date", style: inp, value: nt.date || "", onChange: e => setNt({ ...nt, date: e.target.value }) })
          )
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveTitle, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setShowTF(false), style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      editTitle && React.createElement(Card, { style: { marginBottom: 12, border: `1px solid ${T.GOLD_DIM}` } },
        React.createElement("div", { style: { fontSize: 12, color: T.GOLD, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" } }, "Editar Título"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Classificação"),
            React.createElement("select", { style: inp, value: editTitle.name, onChange: e => setEditTitle({ ...editTitle, name: e.target.value }) },
              React.createElement("option", { value: "" }, "Selecionar..."),
              TITLE_TYPES.map(t => React.createElement("option", { key: t, value: t }, t))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Organização / Federação"),
            React.createElement("select", { style: inp, value: editTitle.org, onChange: e => setEditTitle({ ...editTitle, org: e.target.value }) },
              React.createElement("option", { value: "" }, "Selecionar federação..."),
              FEDERATIONS.map(fed => React.createElement("option", { key: fed, value: fed }, fed))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Modalidade"),
            React.createElement("select", { style: inp, value: editTitle.modality || "Kickboxing", onChange: e => setEditTitle({ ...editTitle, modality: e.target.value, sub_modality: MODALITIES[e.target.value][0] }) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Disciplina"),
            React.createElement("select", { style: inp, value: editTitle.sub_modality || "K1", onChange: e => setEditTitle({ ...editTitle, sub_modality: e.target.value }) },
              (MODALITIES[editTitle.modality || "Kickboxing"] || []).map(s => React.createElement("option", { key: s }, s))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Escalão"),
            React.createElement("input", { style: inp, value: editTitle.escalao || "", onChange: e => setEditTitle({ ...editTitle, escalao: e.target.value }), placeholder: "ex: Seniores" })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Peso"),
            React.createElement("input", { style: inp, value: editTitle.weight || "", onChange: e => setEditTitle({ ...editTitle, weight: e.target.value }), placeholder: "ex: -70kg" })
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: lbl }, "Nome do Título / Evento"),
            React.createElement("input", { style: inp, value: editTitle.event_name || "", onChange: e => setEditTitle({ ...editTitle, event_name: e.target.value }), placeholder: "ex: Campeonato Nacional 2025" })
          ),
          React.createElement("div", null,
            React.createElement("label", { style: lbl }, "Data"),
            React.createElement("input", { type: "date", style: inp, value: editTitle.date || "", onChange: e => setEditTitle({ ...editTitle, date: e.target.value }) })
          )
        ),
        React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
          React.createElement("button", { onClick: saveEditTitle, style: { ...s.btnGold, marginTop: 0 } }, "Guardar"),
          React.createElement("button", { onClick: () => setEditTitle(null), style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      f.titles.length === 0 && React.createElement("div", { style: { color: T.TEXT3, fontSize: 14, textAlign: "center", padding: "24px 0" } }, "Nenhum título registado."),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 } },
        f.titles.map((t, i) => React.createElement("div", { key: i, style: { background: T.BG2, border: `1px solid ${T.GOLD_DIM}`, borderRadius: 10, padding: "16px", position: "relative", overflow: "hidden" } },
          React.createElement("div", { style: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.GOLD}, transparent)` } }),

          React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: T.GOLD } }, t.name),
          t.event_name && React.createElement("div", { style: { fontSize: 13, color: T.TEXT, fontWeight: 600, marginTop: 4 } }, t.event_name),
          React.createElement("div", { style: { fontSize: 11, color: T.TEXT2, marginTop: 4 } }, t.org),
          React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 } },
            t.modality && React.createElement(Badge, null, t.sub_modality || t.modality),
            t.escalao && React.createElement(Badge, { type: "blue" }, t.escalao),
            t.weight && React.createElement(Badge, null, t.weight),
            t.date && React.createElement(Badge, { type: "default" }, t.date.slice(0,4))
          ),
          isOwner && React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 10 } },
            React.createElement("button", { onClick: () => { setEditTitle({ ...t }); setShowTF(false); }, style: { ...s.btnOutline, padding: "3px 10px", fontSize: 11 } }, "Editar"),
            delTitleId === t.id
              ? React.createElement("div", { style: { display: "flex", gap: 4, alignItems: "center" } },
                  React.createElement("button", { onClick: () => deleteTitle(t.id), style: { ...s.btnRed, padding: "3px 10px", fontSize: 11, background: "#e0555522" } }, "Confirmar"),
                  React.createElement("button", { onClick: () => setDelTitleId(null), style: { ...s.btnOutline, padding: "3px 8px", fontSize: 11 } }, "✕")
                )
              : React.createElement("button", { onClick: () => setDelTitleId(t.id), style: { ...s.btnRed, padding: "3px 10px", fontSize: 11 } }, "Eliminar")
          )
        ))
      )
    );
  };

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    lightbox && React.createElement("div", { onClick: () => setLightbox(null), style: { position: "fixed", inset: 0, background: "#000000ee", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, cursor: "pointer" } },
      React.createElement("img", { src: lightbox, style: { maxWidth: "95vw", maxHeight: "90vh", borderRadius: 8, objectFit: "contain" } })
    ),
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, setPage, pendingCount, club, viewAsClub, setViewAsClub }),
      onBack && React.createElement("button", { onClick: onBack, style: { fontSize: 13, color: T.TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Voltar"),
      React.createElement(Card, { gold: true, style: { marginBottom: 14 } },
        React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 } },
          React.createElement("div", { style: { position: "relative", flexShrink: 0 } },
            React.createElement(Avatar, { name: f.name, size: 80, photo: f.photo, available: f.available }),
            isOwner && React.createElement("label", { style: { position: "absolute", bottom: 0, right: 0, background: T.GOLD, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13 } },
              "📷",
              React.createElement("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: async e => {
                const file = e.target.files[0]; if (!file) return;
                if (file.size > MAX_FILE_SIZE) { alert("Foto demasiado grande. Máximo 500KB."); return; }
                try {
                  const compressed = await compressImage(file, 600, 0.7);
                  const url = await uploadPhotoToStorage(compressed, f.id);
                  upd("photo", url);
                  await db.update("fighters", f.id, { photo: url });
                } catch(e) {
                  alert("Erro ao carregar foto. Tenta novamente.");
                  console.error(e);
                }
              }})
            )
          ),
          React.createElement("div", { style: { flex: 1 } },
            isOwner
              ? React.createElement("input", { value: f.name || "", onChange: e => upd("name", e.target.value), style: { ...inp, fontSize: 18, fontWeight: 700, marginBottom: 10, background: "transparent", border: "none", borderBottom: `1px solid ${T.BORDER}`, borderRadius: 0, padding: "4px 0" } })
              : React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: T.TEXT, marginBottom: 8 } }, f.name),
            React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
              fClub && React.createElement(ClubTag, { clubId: fighter.club_id, clubs }),
              React.createElement(Badge, { type: "gold" }, f.team),
              React.createElement(Badge, null, f.modality),
              React.createElement(Badge, { type: "blue" }, f.level),
              React.createElement(Badge, null, f.weight)
            ),
            (isOwner || user.role === "admin" || user.role === "superadmin") && React.createElement("div", {
              style: { marginTop: 10, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" },
              onClick: async () => {
                const newVal = !f.available;
                upd("available", newVal);
                // Guardar imediatamente
                try {
                  await db.update("fighters", f.id, { available: newVal });
                } catch(e) {
                  console.error("Erro ao guardar disponibilidade:", e);
                }
              }
            },
              React.createElement("div", { style: { width: 36, height: 20, borderRadius: 10, background: f.available ? "#4caf7d" : T.BG4, border: `1px solid ${f.available ? "#4caf7d" : T.BORDER}`, position: "relative", transition: "background 0.2s" } },
                React.createElement("div", { style: { position: "absolute", top: 2, left: f.available ? 18 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s" } })
              ),
              React.createElement("span", { style: { fontSize: 12, color: f.available ? "#4caf7d" : T.TEXT3, fontWeight: 600 } }, f.available ? "Disponível para lutar" : "Não disponível")
            ),
            daysLeft !== null && daysLeft >= 0 && React.createElement("div", { style: { marginTop: 10, display: "flex", alignItems: "center", gap: 8, background: T.BG3, borderRadius: 8, padding: "8px 12px", border: `1px solid ${daysLeft <= 7 ? "#e05555" : daysLeft <= 30 ? T.GOLD_DIM : T.BORDER}` } },
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { fontSize: 10, color: T.TEXT3, textTransform: "uppercase", letterSpacing: 1 } }, "Próxima luta"),
                React.createElement("div", { style: { fontSize: 13, color: T.TEXT, fontWeight: 600 } }, `vs. ${nextFight.opponent}${nextFight.event ? ` · ${nextFight.event}` : ""}`)
              ),
              React.createElement("div", { style: { textAlign: "center" } },
                React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: daysLeft <= 7 ? "#e05555" : daysLeft <= 30 ? T.GOLD : "#4caf7d" } }, daysLeft),
                React.createElement("div", { style: { fontSize: 9, color: T.TEXT3, textTransform: "uppercase" } }, "dias")
              )
            )
          )
        ),
        React.createElement(GoldDivider),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement(StatBox, { label: "Vitórias", value: wins, color: "#4caf7d", sub: kos > 0 ? `${kos} KO` : null }),
          React.createElement(StatBox, { label: "Derrotas", value: losses, color: "#e05555" }),
          React.createElement(StatBox, { label: "Empates", value: draws, color: T.TEXT3 }),
          React.createElement(StatBox, { label: "Win Rate", value: wr + "%", color: T.GOLD })
        )
      ),
      React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 16, background: T.BG2, border: `1px solid ${T.BORDER}`, borderRadius: 8, padding: 4 } },
        TABS.map((t, i) => React.createElement("button", { key: t, onClick: () => setTab(i), style: { flex: 1, padding: "7px 4px", borderRadius: 6, border: "none", background: tab === i ? T.GOLD : "transparent", color: tab === i ? (isLightColor(T.GOLD) ? "#111" : "#fff") : T.TEXT2, cursor: "pointer", fontSize: 12, fontWeight: tab === i ? 700 : 400 } }, t))
      ),
      tabContent(),
      React.createElement(Footer)
    )
  );
}

function AcceptInvitePage({ token, clubs }) {
  const s = getStyles();
  const { inp, lbl } = s;
  const [invite, setInvite] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [name, setName] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/invite?action=validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    }).then(r => r.json()).then(data => {
      setLoading(false);
      if (data.ok) setInvite(data.invite);
      else setErr(data.error || "Convite inválido.");
    }).catch(() => { setLoading(false); setErr("Erro de ligação."); });
  }, [token]);

  async function handleAccept() {
    setErr("");
    if (!name.trim()) return setErr("O teu nome é obrigatório.");
    if (pw.length < 6) return setErr("Password mínimo 6 caracteres.");
    if (pw !== pw2) return setErr("As passwords não coincidem.");
    setSaving(true);
    const r = await fetch("/api/invite?action=accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: pw, name: name.trim() })
    });
    const data = await r.json();
    setSaving(false);
    if (data.ok) {
      localStorage.setItem("tfa_token", data.token);
      setDone(true);
      setTimeout(() => { window.location.href = "/"; }, 2000);
    } else {
      setErr(data.error || "Erro ao activar conta.");
    }
  }

  const club = invite?.club;

  if (loading) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("img", { src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg", style: { height: 60, opacity: 0.7 } })
  );

  if (err && !invite) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement("div", { style: { textAlign: "center", maxWidth: 400 } },
      React.createElement("img", { src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg", style: { height: 60, opacity: 0.7, marginBottom: 24 } }),
      React.createElement("div", { style: { background: "#1a0a0a", border: "1px solid #e0555544", borderRadius: 12, padding: 24 } },
        React.createElement("div", { style: { fontSize: 32, marginBottom: 12 } }, "⚠️"),
        React.createElement("div", { style: { fontSize: 16, color: "#e05555", fontWeight: 700, marginBottom: 8 } }, "Convite inválido"),
        React.createElement("div", { style: { fontSize: 14, color: T.TEXT2, marginBottom: 16 } }, err),
        React.createElement("a", { href: "/", style: { fontSize: 13, color: T.GOLD_DIM, textDecoration: "none" } }, "← Ir para o login")
      )
    )
  );

  if (done) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement("div", { style: { textAlign: "center", maxWidth: 400 } },
      React.createElement("img", { src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg", style: { height: 60, opacity: 0.9, marginBottom: 24 } }),
      React.createElement("div", { style: { background: "#0a1a0e", border: "1px solid #4caf7d44", borderRadius: 12, padding: 24 } },
        React.createElement("div", { style: { fontSize: 32, marginBottom: 12 } }, "✅"),
        React.createElement("div", { style: { fontSize: 18, color: "#4caf7d", fontWeight: 700, marginBottom: 8 } }, "Conta activada!"),
        React.createElement("div", { style: { fontSize: 14, color: T.TEXT2 } }, "A entrar na app...")
      )
    )
  );

  const roleLabel = invite.role === "admin" ? "Administrador" : "Atleta";

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement("div", { style: { width: "100%", maxWidth: 420 } },
      React.createElement("img", { src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg", style: { height: 70, display: "block", margin: "0 auto 28px", opacity: 0.92 } }),
      React.createElement("div", { style: { background: T.BG2, border: `1px solid ${T.BORDER_GOLD}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 } },
        React.createElement("div", { style: { fontSize: 11, color: T.TEXT3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 } }, "Convite para"),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
          club?.logo_url
            ? React.createElement("img", { src: club.logo_url, style: { width: 36, height: 36, objectFit: "contain", borderRadius: 6 } })
            : React.createElement("div", { style: { width: 36, height: 36, borderRadius: 6, background: (club?.primary_color || T.GOLD) + "33", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: club?.primary_color || T.GOLD } }, club?.short_name || "?"),
          React.createElement("div", null,
            React.createElement("div", { style: { fontWeight: 700, color: club?.primary_color || T.GOLD, fontSize: 15 } }, club?.name || invite.club_id),
            React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 2 } }, roleLabel + " · " + invite.email)
          )
        )
      ),
      React.createElement("div", { style: { background: T.BG2, border: `1px solid ${T.BORDER}`, borderRadius: 10, padding: "20px 16px" } },
        React.createElement("div", { style: { fontSize: 13, color: T.GOLD, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 } }, "Activar Conta"),
        React.createElement("div", { style: { marginBottom: 12 } },
          React.createElement("label", { style: lbl }, "O teu nome completo"),
          React.createElement("input", { style: inp, value: name, onChange: e => setName(e.target.value), placeholder: "Nome Apelido", autoFocus: true })
        ),
        React.createElement("div", { style: { marginBottom: 12 } },
          React.createElement("label", { style: lbl }, "Escolhe uma password"),
          React.createElement("input", { type: "password", style: inp, value: pw, onChange: e => setPw(e.target.value), placeholder: "Mínimo 6 caracteres" })
        ),
        React.createElement("div", { style: { marginBottom: 16 } },
          React.createElement("label", { style: lbl }, "Confirmar password"),
          React.createElement("input", { type: "password", style: inp, value: pw2, onChange: e => setPw2(e.target.value), placeholder: "Repetir password", onKeyDown: e => e.key === "Enter" && handleAccept() })
        ),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginBottom: 12 } }, err),
        React.createElement("button", { onClick: handleAccept, disabled: saving, style: { ...s.btnGold, width: "100%", marginTop: 0, opacity: saving ? 0.7 : 1 } }, saving ? "A activar..." : "Activar Conta")
      ),
      React.createElement("div", { style: { textAlign: "center", marginTop: 16 } },
        React.createElement("a", { href: "/", style: { fontSize: 12, color: T.TEXT3, textDecoration: "none" } }, "Já tenho conta → Login")
      )
    )
  );
}

function InviteModal({ onClose, user, club, clubs, defaultEmail, defaultClubId, defaultRole, fighters, users }) {
  const s = getStyles();
  const { inp, lbl } = s;
  const [email, setEmail] = React.useState(defaultEmail || "");
  const [role, setRole] = React.useState(defaultRole || "athlete");
  const [clubId, setClubId] = React.useState(defaultClubId || user.club_id || "");

  // Atletas sem conta ou sem convite enviado
  const pendingFighters = (fighters || []).filter(f => {
    const hasUser = (users || []).some(u => u.fighter_id === f.id);
    const matchClub = user.role === "superadmin" ? (clubId ? f.club_id === clubId : true) : f.club_id === user.club_id;
    return !hasUser && matchClub && f.email;
  });
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState("");
  const [err, setErr] = React.useState("");

  const isSuperAdmin = user.role === "superadmin";

  async function handleSend() {
    setErr("");
    if (!email.includes("@")) return setErr("Email inválido.");
    if (!clubId) return setErr("Selecciona um clube.");
    const clubName = (clubs || []).find(c => c.id === clubId)?.name || clubId;
    const roleLabel = role === "admin" ? "Administrador" : "Atleta";

    // Gerar credenciais
    const username = emailToUsername(email.trim());
    const password = generatePassword();

    // Verificar se já existe utilizador com este email ou username
    const allUsers = await db.get("users");
    if (allUsers.some(u => u.email === email.trim())) return setErr("Este email já tem conta.");
    if (allUsers.some(u => u.username === username)) return setErr("Username já existe — tenta outro email.");

    // Criar o utilizador
    const fighter = (fighters || []).find(f => f.email && f.email.toLowerCase() === email.trim().toLowerCase());
    const newUser = {
      id: `user_${Date.now()}`,
      name: fighter ? fighter.name : email.split("@")[0],
      username,
      password,
      email: email.trim(),
      role,
      club_id: clubId,
      fighter_id: fighter ? fighter.id : null
    };
    await db.insert("users", newUser);

    // Tentar enviar via Resend
    const token = localStorage.getItem("tfa_token");
    try {
      const r = await fetch("/api/auth?action=send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim(), username, password, clubName, role })
      });
      const data = await r.json();
      if (data.success && !data.fallback) {
        setDone(`Email enviado automaticamente para ${email}`);
        setEmail(""); return;
      }
    } catch {}

    // Fallback: abrir mailto
    const subject = encodeURIComponent(`Acesso à The Fighters App — ${clubName}`);
    const body = encodeURIComponent(`Olá,

Aqui estão as tuas credenciais de acesso à The Fighters App como ${roleLabel} do ${clubName}.

Acede em: https://thefightersapp.vercel.app

Username: ${username}
Password: ${password}

Por segurança, altera a password após o primeiro login.

The Fighters App`);
    window.open(`mailto:${email.trim()}?subject=${subject}&body=${body}`, "_blank");
    setDone(`Email preparado para ${email}`);
    setEmail("");
  }

  return React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }, onClick: onClose },
    React.createElement("div", { style: { background: T.BG2, border: `1px solid ${T.BORDER_GOLD}`, borderRadius: 12, padding: 24, width: "100%", maxWidth: 400 }, onClick: e => e.stopPropagation() },
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
        React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: T.GOLD, textTransform: "uppercase", letterSpacing: 1 } }, "Convidar"),
        React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", color: T.TEXT2, fontSize: 20, cursor: "pointer" } }, "×")
      ),
      isSuperAdmin && React.createElement("div", { style: { marginBottom: 12 } },
        React.createElement("label", { style: { ...lbl, color: "#ff9900" } }, "Clube"),
        React.createElement("select", { style: inp, value: clubId, onChange: e => setClubId(e.target.value) },
          React.createElement("option", { value: "" }, "Seleccionar clube..."),
          (clubs || []).filter(c => c.active).map(c => React.createElement("option", { key: c.id, value: c.id }, c.name))
        )
      ),
      isSuperAdmin && React.createElement("div", { style: { marginBottom: 12 } },
        React.createElement("label", { style: lbl }, "Função"),
        React.createElement("select", { style: inp, value: role, onChange: e => setRole(e.target.value) },
          React.createElement("option", { value: "athlete" }, "Atleta"),
          React.createElement("option", { value: "admin" }, "Administrador")
        )
      ),
      !isSuperAdmin && React.createElement("div", { style: { marginBottom: 12, padding: "10px 14px", background: T.BG3, borderRadius: 8 } },
        React.createElement("div", { style: { fontSize: 12, color: T.TEXT2 } },
          "A convidar como ", React.createElement("strong", { style: { color: T.GOLD } }, "Atleta"),
          " para ", React.createElement("strong", { style: { color: T.TEXT } }, club?.name || "o teu clube")
        )
      ),
      pendingFighters.length > 0 && React.createElement("div", { style: { marginBottom: 14 } },
        React.createElement("label", { style: lbl }, "Atletas sem acesso"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto", marginTop: 6 } },
          pendingFighters.map(f => React.createElement("div", {
            key: f.id,
            onClick: () => setEmail(f.email),
            style: { padding: "8px 12px", background: email === f.email ? T.GOLD + "22" : T.BG3, border: `1px solid ${email === f.email ? T.GOLD : T.BORDER}`, borderRadius: 6, cursor: "pointer", fontSize: 13 }
          },
            React.createElement("span", { style: { color: T.TEXT, fontWeight: 600 } }, f.name),
            React.createElement("span", { style: { color: T.TEXT3, fontSize: 11, marginLeft: 8 } }, f.email)
          ))
        )
      ),
      React.createElement("div", { style: { marginBottom: 16 } },
        React.createElement("label", { style: lbl }, "Email do convidado"),
        React.createElement("input", { style: inp, type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "atleta@email.com", onKeyDown: e => e.key === "Enter" && handleSend(), autoFocus: !defaultEmail })
      ),
      err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginBottom: 12 } }, err),
      done && React.createElement("div", { style: { fontSize: 13, color: "#4caf7d", marginBottom: 12, padding: "10px 14px", background: "#0a1a0e", borderRadius: 8 } }, "✓ " + done),
      React.createElement("button", { onClick: handleSend, style: { ...s.btnGold, width: "100%", marginTop: 0 } }, "✉ Enviar Convite por Email"),
      React.createElement("div", { style: { fontSize: 11, color: T.TEXT3, marginTop: 12, textAlign: "center" } }, "Abre o teu cliente de email com a mensagem pronta a enviar.")
    )
  );
}

function NewFighterForm({ onSave, onBack, onLogout, user, existingUsernames, club, clubs, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const { inp, lbl } = s;
  const [f, setF] = useState({ name: "", weight: "", category: "", modality: "Kickboxing", sub_modality: "K1", level: "Amador", email: "", team: club?.name || "", club_id: user.club_id || club?.id || "", gender: "" });
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
    const newUser = { id: `user_${id}`, name: san(f.name, 100), role: "athlete", fighter_id: id, username, password, email: san(f.email, 100), club_id: f.club_id };
    await onSave({ ...f, name: san(f.name, 100), email: san(f.email, 100), team: san(f.team, 100), gender: f.gender || "", id, weight: Number(f.weight) || 0, club_id: f.club_id }, newUser);
    setSaving(false);
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, club }),
      React.createElement("button", { onClick: onBack, style: { fontSize: 13, color: T.TEXT2, background: "none", border: "none", cursor: "pointer", marginBottom: 14, padding: 0 } }, "← Voltar"),
      React.createElement("div", { style: { fontSize: 20, fontWeight: 700, color: T.TEXT, marginBottom: 4, textTransform: "uppercase" } }, "Novo Lutador"),
      React.createElement("div", { style: { width: 30, height: 2, background: T.GOLD, marginBottom: 16, borderRadius: 2 } }),
      React.createElement(Card, null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          user.role === "superadmin" && React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { ...lbl, color: "#ff9900" } }, "Clube"),
            React.createElement("select", { style: inp, value: f.club_id, onChange: e => upd("club_id", e.target.value) },
              React.createElement("option", { value: "" }, "Seleccionar clube..."),
              (clubs || []).filter(c => c.active).map(c => React.createElement("option", { key: c.id, value: c.id }, c.name))
            )
          ),
          [["Nome completo", "name"], ["Equipa", "team"], ["Peso (kg)", "weight"], ["Escalão", "category"]].map(([l, k]) =>
            React.createElement("div", { key: k }, React.createElement("label", { style: lbl }, l), React.createElement("input", { style: inp, value: f[k], onChange: e => upd(k, e.target.value) }))
          ),
          React.createElement("div", { style: { gridColumn: "1 / -1" } },
            React.createElement("label", { style: { ...lbl, color: T.GOLD } }, "E-mail"),
            React.createElement("input", { style: { ...inp, borderColor: T.GOLD_DIM }, value: f.email, onChange: e => upd("email", e.target.value), placeholder: "atleta@email.com" })
          ),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Modalidade"), React.createElement("select", { style: inp, value: f.modality, onChange: e => upd("modality", e.target.value) }, Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Nível"), React.createElement("select", { style: inp, value: f.level, onChange: e => upd("level", e.target.value) }, LEVELS.map(l => React.createElement("option", { key: l }, l)))),
          React.createElement("div", null, React.createElement("label", { style: lbl }, "Género"),
            React.createElement("select", { style: inp, value: f.gender, onChange: e => upd("gender", e.target.value) },
              React.createElement("option", { value: "" }, "Selecionar..."), React.createElement("option", { value: "Masculino" }, "Masculino"), React.createElement("option", { value: "Feminino" }, "Feminino")
            )
          )
        ),
        err && React.createElement("div", { style: { fontSize: 13, color: "#e05555", marginTop: 10 } }, err),
        React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 12, padding: "8px 12px", background: T.BG3, borderRadius: 6 } }, "ℹ️ Credenciais geradas automaticamente."),
        React.createElement("button", { onClick: handleSave, disabled: saving, style: { ...s.btnGold, opacity: saving ? 0.7 : 1 } }, saving ? "A criar..." : "Criar Perfil e Gerar Acesso")
      )
    )
  );
}
// ═══════════════════════════════════════════════════════════
// PARTE 6: ADMIN DASHBOARD, ATHLETE VIEW, APP ROOT
// ═══════════════════════════════════════════════════════════

function AdminDashboard({ fighters, setFighters, users, setUsers, onLogout, user, page, setPage, pendingCount, club, clubs, setClubes, allFighters, allFights, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const [selected, setSelected] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [delId, setDelId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [resetData, setResetData] = useState(null);
  const [search, setSearch] = useState("");

  async function resetPassword(fighter) {
    const fu = users.find(u => u.fighter_id === fighter.id);
    if (!fu) return alert("Este atleta não tem conta associada.");
    const token = localStorage.getItem("tfa_token");
    const r = await fetch("/api/auth?action=reset-by-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, fighter_id: fighter.id })
    });
    const data = await r.json();
    if (!r.ok) return alert(data.error || "Erro ao redefinir password.");
    setResetData({ fighter, newPw: data.newPassword });
  }

  // Routing para sub-páginas
  if (page === "pending") return React.createElement(PendingPage, { onLogout, user, setPage, setUsers, users, pendingCount, club, clubs, viewAsClub, setViewAsClub });
  if (page === "teams") return React.createElement(TeamsPage, { onLogout, user, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub });
  if (page === "calendar") return React.createElement(CalendarPage, { onLogout, user, setPage, pendingCount, club, viewAsClub, setViewAsClub });
  if (page === "dashboard") return React.createElement(DashboardPage, { onLogout, user, setPage, pendingCount, clubs, allFighters, allFights, viewAsClub, setViewAsClub });
  if (page === "clubs") return React.createElement(ClubsPage, { onLogout, user, setPage, pendingCount, clubs, setClubes, viewAsClub, setViewAsClub });
  if (page === "matchmaking") return React.createElement(MatchmakingPage, { onLogout, user, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub });

  // Modal password redefinida
  if (resetData) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 } },
    React.createElement(Card, { gold: true, style: { maxWidth: 400, width: "100%" } },
      React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: T.TEXT, marginBottom: 4 } }, `Password redefinida — ${resetData.fighter.name}`),
      React.createElement(GoldDivider),
      React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: T.GOLD, textAlign: "center", padding: "14px", background: T.BG3, borderRadius: 8, marginBottom: 16, letterSpacing: 2 } }, resetData.newPw),
      React.createElement("div", { style: { display: "flex", gap: 8 } },
        React.createElement("button", { onClick: () => navigator.clipboard && navigator.clipboard.writeText(resetData.newPw), style: { ...s.btnOutline, flex: 1, marginTop: 0 } }, "📋 Copiar"),
        React.createElement("button", { onClick: () => setResetData(null), style: { ...s.btnGold, flex: 1, marginTop: 0 } }, "Fechar")
      )
    )
  );

  if (showNewForm) return React.createElement(NewFighterForm, {
    onBack: () => setShowNewForm(false),
    onSave: async (fighter, newUser) => {
      await db.insert("fighters", { ...fighter, available: false, status: "approved" , viewAsClub, setViewAsClub });
      await db.insert("users", newUser);
      setFighters(p => [...p, fighter]); setUsers(p => [...p, newUser]);
      setShowNewForm(false); setInviteData({ fighter, user: newUser });
    },
    onLogout, user, existingUsernames: users.map(u => u.username), club, clubs
  });

  if (selected) return React.createElement(FighterProfile, {
    fighter: selected, onBack: () => setSelected(null),
    onSave: f => setFighters(p => p.map(x => x.id === f.id ? f : x)),
    user, isOwner: true, onLogout, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub
  });

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },

      React.createElement(Header, { onLogout, user, currentPage: "fighters", setPage, pendingCount, club, viewAsClub, setViewAsClub }),
      React.createElement("input", { style: { ...s.inp, marginBottom: 14, background: T.BG2 }, placeholder: "🔍  Nome ou modalidade...", value: search, onChange: e => setSearch(e.target.value) }),
      showInvite && React.createElement(InviteModal, { onClose: () => setShowInvite(false), user, club, clubs, defaultEmail: inviteData?.fighter?.email || "", fighters, users }),
      inviteData && React.createElement("div", { style: { background: "#0a1a0e", border: "1px solid #4caf7d44", borderRadius: 10, padding: "12px 16px", marginBottom: 16 } },
        React.createElement("div", { style: { fontSize: 13, color: "#4caf7d", marginBottom: 8, fontWeight: 700 } }, `✓ Perfil criado — ${inviteData.fighter.name}`),
        React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginBottom: 8 } }, `Username: ${inviteData.user.username} · Password: ${inviteData.user.password}`),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: () => setShowInvite(true), style: { ...s.btnGreen, padding: "4px 12px", fontSize: 12, marginTop: 0 } }, "✉ Enviar convite por email"),
          React.createElement("button", { onClick: () => setInviteData(null), style: { ...s.btnOutline, padding: "4px 12px", fontSize: 12 } }, "Fechar")
        )
      ),
      React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
        React.createElement("span", { style: { fontSize: 13, color: T.TEXT2, textTransform: "uppercase", letterSpacing: 1 } }, `${fighters.filter(f => { const q = search.toLowerCase(); return !search || f.name?.toLowerCase().includes(q) || f.modality?.toLowerCase().includes(q) || f.sub_modality?.toLowerCase().includes(q); }).length} lutadores`),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: () => setShowInvite(true), style: { ...s.btnOutline, borderColor: "#4caf7d44", color: "#4caf7d" } }, "✉ Convidar"),
          React.createElement("button", { onClick: () => setShowNewForm(true), style: s.btnOutline }, "+ Novo Lutador")
        )
      ),
      delId && React.createElement("div", { style: { background: "#1a0a0a", border: `1px solid #e0555544`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" } },
        React.createElement("span", { style: { fontSize: 13, color: "#e05555" } }, `Eliminar ${fighters.find(f => f.id === delId)?.name}?`),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement("button", { onClick: async () => { await db.delete("fighters", delId); setFighters(p => p.filter(f => f.id !== delId)); setDelId(null); }, style: { ...s.btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: "#e05555" } }, "Eliminar"),
          React.createElement("button", { onClick: () => setDelId(null), style: { ...s.btnGold, marginTop: 0, padding: "5px 14px", fontSize: 12, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Cancelar")
        )
      ),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        fighters.filter(f => { const q = search.toLowerCase(); return !search || f.name?.toLowerCase().includes(q) || f.modality?.toLowerCase().includes(q) || f.sub_modality?.toLowerCase().includes(q); }).map(f => {
          const fu = users.find(u => u.fighter_id === f.id);
          return React.createElement("div", { key: f.id, style: { background: T.BG2, border: `1px solid ${T.BORDER}`, borderRadius: 10, padding: "14px 16px" }, onMouseEnter: e => e.currentTarget.style.borderColor = T.GOLD_DIM, onMouseLeave: e => e.currentTarget.style.borderColor = T.BORDER },
            React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }, onClick: () => setSelected(f) },
              React.createElement(Avatar, { name: f.name, size: 36, photo: f.photo, available: f.available }),
              React.createElement("div", { style: { flex: 1 } },
                React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 } },
                  React.createElement("span", { style: { fontWeight: 700, fontSize: 16, color: T.TEXT } }, f.name),
                  React.createElement(ClubTag, { clubId: f.club_id, clubs }),
                  React.createElement(Badge, { type: "gold" }, f.team)
                ),
                React.createElement("div", { style: { fontSize: 13, color: T.TEXT2 } }, `${f.modality} · ${f.sub_modality} · ${f.level} · ${f.weight}`),
                fu && React.createElement("div", { style: { fontSize: 11, color: T.TEXT3, marginTop: 2 } }, `@${fu.username} · ${f.email}`)
              )
            ),
            React.createElement("div", { style: { display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" } },
              !fu && React.createElement("button", { onClick: () => { setInviteData({ fighter: f, user: {} }); setShowInvite(true); }, style: { ...s.btnOutline, padding: "4px 12px", fontSize: 12, borderColor: "#4caf7d44", color: "#4caf7d" } }, "✉ Convite"),
              React.createElement("button", { onClick: () => resetPassword(f), style: { ...s.btnOutline, padding: "4px 12px", fontSize: 12, borderColor: "#5b8fd444", color: "#5b8fd4" } }, "🔑 Password"),
              React.createElement("button", { onClick: () => setDelId(f.id), style: { ...s.btnRed, padding: "4px 12px", fontSize: 12 } }, "✕ Eliminar")
            )
          );
        })
      ),
      React.createElement(Footer)
    )
  );
}

function AthleteView({ fighters, user, onLogout, setPage, pendingCount: allPending, club, clubs, viewAsClub, setViewAsClub }) {
  const pendingCount = Array.isArray(allPending) ? allPending.filter(x => x.club_id === user.club_id).length : (allPending || 0);
  const fighter = fighters.find(f => f.id === user.fighter_id);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [matchConfirmDone, setMatchConfirmDone] = React.useState(false);
  if (!fighter) return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 680, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "", setPage, pendingCount, club }),
      React.createElement(Card, { gold: true },
        React.createElement("div", { style: { textAlign: "center", padding: "24px 0" } },
          React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: T.GOLD, marginBottom: 8 } }, "Registo pendente de aprovação"),
          React.createElement("div", { style: { fontSize: 14, color: T.TEXT2 } }, "O teu perfil está a aguardar aprovação pelo administrador do clube.")
        )
      )
    )
  );
  return React.createElement("div", null,
    !matchConfirmDone && fighter && React.createElement(MatchConfirmModal, { fighter, onDone: () => setMatchConfirmDone(true) }),
    React.createElement(FighterProfile, { key: refreshKey, fighter, onBack: null, onSave: () => setRefreshKey(k => k+1), user, isOwner: true, onLogout, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub })
  );
}


// ═══════════════════════════════════════════════════════════
// CONFIRMAÇÃO DE COMBATES — primeiro login do atleta
// ═══════════════════════════════════════════════════════════

function MatchConfirmModal({ fighter, onDone }) {
  const s = getStyles();
  const [matches, setMatches] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [confirmed, setConfirmed] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    async function findMatches() {
      const allFights = await db.get("fights");

      // Normalizar texto: minúsculas, sem acentos, sem espaços extra
      const norm = (str) => {
        if (!str) return "";
        return str.toLowerCase().normalize("NFD").split("").filter(c => c.charCodeAt(0) < 0x0300 || c.charCodeAt(0) > 0x036F).join("").trim();
      };

      const name = norm(fighter.name);
      // Tokens com mais de 2 letras (ignora preposições como "de", "da", "dos")
      const nameTokens = name.split(/\s+/).filter(t => t.length > 2);
      const myTeam = norm(fighter.team);
      const myIdStr = String(fighter.id);

      const found = allFights.filter(f => {
        if (String(f.fighter_id) === myIdStr) return false; // luta própria
        if (f.confirmed_from) return false; // já confirmada
        const op = norm(f.opponent);
        const ot = norm(f.opponent_team);
        // Nome: pelo menos 2 tokens em comum, ou 1 se o nome só tiver 1 token
        const overlap = nameTokens.filter(t => op.includes(t)).length;
        const nameMatch = nameTokens.length > 0 && overlap >= Math.min(2, nameTokens.length);
        // Equipa: se existir nos dois lados tem de bater; se faltar num dos lados aceita na mesma
        const teamMatch = !myTeam || !ot || ot.includes(myTeam) || myTeam.includes(ot);
        return nameMatch && teamMatch;
      });

      setMatches(found);
      setLoading(false);
      if (found.length === 0) onDone();
    }
    findMatches();
  }, []);

  async function handleConfirm() {
    setSaving(true);
    const toConfirm = matches.filter(f => confirmed[f.id]);
    for (const fight of toConfirm) {
      // Resultado invertido
      const mirrorResult = fight.result === "V" ? "D" : fight.result === "D" ? "V" : "E";
      // Buscar o atleta que registou o combate
      const ownerFighters = await db.get("fighters", { id: fight.fighter_id });
      const owner = ownerFighters && ownerFighters[0];
      await db.insert("fights", {
        id: `f${Date.now()}_${fight.id}`,
        fighter_id: fighter.id,
        opponent: owner ? owner.name : fight.opponent_team || "Desconhecido",
        opponent_team: owner ? (owner.team || "") : "",
        result: mirrorResult,
        method: fight.method,
        event: fight.event,
        date: fight.date,
        modality: fight.modality,
        sub_modality: fight.sub_modality,
        level: fight.level,
        weight: fight.weight,
        federation: fight.federation || "",
        confirmed_from: fight.id
      });
    }
    setSaving(false);
    setDone(true);
    setTimeout(() => onDone(), 1500);
  }

  if (loading) return null;
  if (matches.length === 0) return null;

  if (done) return React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 } },
    React.createElement("div", { style: { background: "#0a1a0e", border: "1px solid #4caf7d44", borderRadius: 12, padding: 32, textAlign: "center", maxWidth: 400 } },
      React.createElement("div", { style: { fontSize: 18, color: "#4caf7d", fontWeight: 700, marginBottom: 8 } }, "Histórico actualizado!"),
      React.createElement("div", { style: { fontSize: 14, color: T.TEXT2 } }, "Os combates confirmados foram adicionados ao teu perfil.")
    )
  );

  return React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16, overflowY: "auto" } },
    React.createElement("div", { style: { background: T.BG2, border: `1px solid ${T.BORDER_GOLD}`, borderRadius: 12, padding: 24, width: "100%", maxWidth: 500 } },
      React.createElement("div", { style: { fontSize: 16, fontWeight: 700, color: T.GOLD, marginBottom: 6 } }, "Encontrámos combates com o teu nome!"),
      React.createElement("div", { style: { fontSize: 13, color: T.TEXT2, marginBottom: 20 } },
        `Outros atletas registaram ${matches.length} combate${matches.length !== 1 ? "s" : ""} onde apareces como adversário. Confirma os que são teus para os adicionar ao teu histórico.`
      ),
      matches.map(fight => {
        const isConfirmed = confirmed[fight.id];
        return React.createElement("div", {
          key: fight.id,
          style: { background: isConfirmed ? "#0a1a0e" : T.BG3, border: `1px solid ${isConfirmed ? "#4caf7d44" : T.BORDER}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10, cursor: "pointer" },
          onClick: () => setConfirmed(p => ({ ...p, [fight.id]: !p[fight.id] }))
        },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            React.createElement("div", { style: { width: 22, height: 22, borderRadius: 4, border: `2px solid ${isConfirmed ? "#4caf7d" : T.BORDER}`, background: isConfirmed ? "#4caf7d" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } },
              isConfirmed && React.createElement("span", { style: { color: "#fff", fontSize: 13, fontWeight: 700 } }, "✓")
            ),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: T.TEXT } },
                `vs. `,
                React.createElement("span", { style: { color: T.GOLD } }, "Adversário registado por outro atleta"),
                React.createElement("span", { style: { color: fight.result === "V" ? "#e05555" : "#4caf7d", marginLeft: 8, fontSize: 12, fontWeight: 700 } },
                  fight.result === "V" ? "← Derrota para ti" : fight.result === "D" ? "← Vitória para ti" : "Empate"
                )
              ),
              React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginTop: 3 } },
                `${fight.event || "—"} · ${fight.date || "—"}`
              ),
              React.createElement("div", { style: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" } },
                React.createElement(Badge, null, fight.modality),
                fight.sub_modality && React.createElement(Badge, { type: "gold" }, fight.sub_modality),
                React.createElement(Badge, { type: "blue" }, fight.level),
                fight.weight && React.createElement(Badge, null, fight.weight)
              )
            )
          )
        );
      }),
      React.createElement("div", { style: { display: "flex", gap: 10, marginTop: 20 } },
        React.createElement("button", {
          onClick: handleConfirm,
          disabled: saving || Object.values(confirmed).every(v => !v),
          style: { ...s.btnGold, flex: 1, marginTop: 0, opacity: (saving || Object.values(confirmed).every(v => !v)) ? 0.5 : 1 }
        }, saving ? "A guardar..." : `Confirmar ${Object.values(confirmed).filter(Boolean).length} combate${Object.values(confirmed).filter(Boolean).length !== 1 ? "s" : ""}`),
        React.createElement("button", { onClick: onDone, style: { ...s.btnGold, marginTop: 0, background: T.BG4, color: T.TEXT2, border: `1px solid ${T.BORDER}` } }, "Ignorar")
      )
    )
  );
}


// ═══════════════════════════════════════════════════════════
// MATCHMAKING PAGE
// ═══════════════════════════════════════════════════════════
function MatchmakingPage({ onLogout, user, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub }) {
  const s = getStyles();
  const [allFighters, setAllFighters] = React.useState([]);
  const [allFights, setAllFights] = React.useState([]);
  const [allClubs, setAllClubs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({ modality: "Kickboxing", sub_modality: "K1", level: "Amador", escalao: "", weight: "", gender: "Masculino", country: "Portugal", fight_date: "", adjacent: true });
  const [pairs, setPairs] = React.useState([]);
  const [searched, setSearched] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      const [f, fi, c] = await Promise.all([db.get("fighters"), db.get("fights"), db.get("clubs")]);
      setAllFighters(f.filter(x => x.status === "approved"));
      setAllFights(fi);
      setAllClubs(c);
      setLoading(false);
    }
    load();
  }, []);

  function getRecord(fighterId) {
    const ff = allFights.filter(f => String(f.fighter_id) === String(fighterId));
    const wins = ff.filter(x => x.result === "V").length;
    const losses = ff.filter(x => x.result === "D").length;
    const draws = ff.filter(x => x.result === "E").length;
    const kos = ff.filter(x => x.result === "V" && x.method && x.method.includes("KO")).length;
    const kod = ff.filter(x => x.result === "D" && x.method && x.method.includes("KO")).length;
    const total = ff.length;
    const wr = total > 0 ? Math.round(wins / total * 100) : null;
    return { wins, losses, draws, kos, kod, total, wr };
  }

  function hasUpcomingNear(fighterId, fightDate) {
    if (!fightDate) return false;
    const target = new Date(fightDate);
    const from = new Date(target); from.setDate(from.getDate() - 30);
    return allFights.filter(f => String(f.fighter_id) === String(fighterId) && f.date).some(f => {
      const d = new Date(f.date); return d >= from && d <= target;
    });
  }

  function getClubCountry(clubId) {
    const c = allClubs.find(x => x.id === clubId);
    return c?.country || "";
  }

  function evaluatePair(a, b, ra, rb, fightDate) {
    const wrDiff = Math.abs((ra.wr ?? 50) - (rb.wr ?? 50));
    const expDiff = Math.abs(ra.total - rb.total);
    const aKoPct = ra.total > 0 ? ra.kos / ra.total : 0;
    const bKoPct = rb.total > 0 ? rb.kos / rb.total : 0;
    const aKodPct = ra.total > 0 ? ra.kod / ra.total : 0;
    const bKodPct = rb.total > 0 ? rb.kod / rb.total : 0;
    const dangerous = (aKoPct > 0.5 && (bKodPct > 0.4 || (rb.total < 3 && ra.total > 5))) || (bKoPct > 0.5 && (aKodPct > 0.4 || (ra.total < 3 && rb.total > 5)));
    const unbalanced = !dangerous && (wrDiff > 35 || expDiff > 8);
    const good = !dangerous && !unbalanced && wrDiff <= 15 && expDiff <= 4;
    const warnA = hasUpcomingNear(a.id, fightDate);
    const warnB = hasUpcomingNear(b.id, fightDate);
    if (dangerous) return { label: "Perigoso", color: "#e05555", icon: "!", warnA, warnB };
    if (unbalanced) return { label: "Desequilibrado", color: "#d4844c", icon: "~", warnA, warnB };
    if (good) return { label: "Bom combate", color: "#4caf7d", icon: "*", warnA, warnB };
    return { label: "Justo", color: T.GOLD, icon: "ok", warnA, warnB };
  }

  function search() {
    const { modality, sub_modality, level, escalao, weight, gender, country, fight_date, adjacent } = filters;

    // Categorias de peso adjacentes
    const weightList = getWeightCategories(sub_modality, escalao, gender, level);
    const weightIdx = weight ? weightList.indexOf(weight) : -1;
    const validWeights = new Set();
    if (weight) {
      validWeights.add(weight);
      if (adjacent) {
        if (weightIdx > 0) validWeights.add(weightList[weightIdx - 1]);
        if (weightIdx < weightList.length - 1) validWeights.add(weightList[weightIdx + 1]);
      }
    }

    const candidates = allFighters.filter(f => {
      if (f.modality !== modality) return false;
      if (sub_modality && f.sub_modality !== sub_modality) return false;
      if (level && f.level !== level) return false;
      if (escalao && f.category && f.category !== escalao) return false;
      if (weight && !validWeights.has(f.weight)) return false;
      if (country && getClubCountry(f.club_id) !== country) return false;
      return true;
    });
    const result = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const a = candidates[i], b = candidates[j];
        if (a.club_id === b.club_id) continue;
        const ra = getRecord(a.id), rb = getRecord(b.id);
        const ev = evaluatePair(a, b, ra, rb, fight_date);
        result.push({ a, b, ra, rb, ev });
      }
    }
    const order = { "Bom combate": 0, "Justo": 1, "Desequilibrado": 2, "Perigoso": 3 };
    result.sort((x, y) => (order[x.ev.label] || 0) - (order[y.ev.label] || 0));
    setPairs(result);
    setSearched(true);
  }

  const clubCountries = [...new Set(allClubs.filter(c => c.country).map(c => c.country))].sort();

  function FighterMiniCard({ fighter, record, warn }) {
    const fc = allClubs.find(c => c.id === fighter.club_id);
    return React.createElement("div", { style: { flex: 1, background: T.BG3, borderRadius: 8, padding: "10px 12px" } },
      React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 6 } },
        React.createElement(Avatar, { name: fighter.name, size: 30, photo: fighter.photo, available: fighter.available }),
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: T.TEXT } }, fighter.name),
          React.createElement("div", { style: { fontSize: 11, color: T.TEXT2 } }, fc?.name || fighter.club_id)
        )
      ),
      React.createElement("div", { style: { display: "flex", gap: 8, fontSize: 12 } },
        React.createElement("span", { style: { color: "#4caf7d", fontWeight: 700 } }, record.wins + "V"),
        React.createElement("span", { style: { color: "#e05555", fontWeight: 700 } }, record.losses + "D"),
        React.createElement("span", { style: { color: T.TEXT3 } }, record.draws + "E"),
        record.kos > 0 && React.createElement("span", { style: { color: T.GOLD, fontSize: 11 } }, record.kos + " KO"),
        record.wr !== null && React.createElement("span", { style: { color: T.TEXT2, fontSize: 11 } }, record.wr + "% WR")
      ),
      warn && React.createElement("div", { style: { fontSize: 10, color: "#e05555", marginTop: 4 } }, "! Pode ter luta nos 30 dias anteriores")
    );
  }

  return React.createElement("div", { style: { minHeight: "100vh", background: T.BG, padding: "20px 16px" } },
    React.createElement("div", { style: { maxWidth: 720, margin: "0 auto" } },
      React.createElement(Header, { onLogout, user, currentPage: "matchmaking", setPage, pendingCount, club, viewAsClub, setViewAsClub }),
      React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: T.TEXT, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 } }, "Matchmaking"),
      React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginBottom: 16 } }, "Encontra combates equilibrados com base no histórico dos atletas."),
      React.createElement(Card, { gold: true, style: { marginBottom: 16 } },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } },
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "Modalidade"),
            React.createElement("select", { style: s.inp, value: filters.modality, onChange: e => setFilters(p => ({ ...p, modality: e.target.value, sub_modality: (MODALITIES[e.target.value] || [])[0] || "", escalao: "", weight: "" })) },
              Object.keys(MODALITIES).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "Disciplina"),
            React.createElement("select", { style: s.inp, value: filters.sub_modality, onChange: e => setFilters(p => ({ ...p, sub_modality: e.target.value, escalao: "", weight: "" })) },
              (MODALITIES[filters.modality] || []).map(m => React.createElement("option", { key: m }, m))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "Nível"),
            React.createElement("select", { style: s.inp, value: filters.level, onChange: e => setFilters(p => ({ ...p, level: e.target.value, escalao: "", weight: "" })) },
              LEVELS.map(l => React.createElement("option", { key: l }, l))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "Género"),
            React.createElement("select", { style: s.inp, value: filters.gender, onChange: e => setFilters(p => ({ ...p, gender: e.target.value, weight: "" })) },
              ["Masculino", "Feminino"].map(g => React.createElement("option", { key: g }, g))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "Escalão"),
            React.createElement("select", { style: s.inp, value: filters.escalao, onChange: e => setFilters(p => ({ ...p, escalao: e.target.value, weight: "" })) },
              React.createElement("option", { value: "" }, "Todos"),
              getEscaloes(filters.modality, filters.sub_modality).map(e => React.createElement("option", { key: e, value: e }, e))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "Categoria de peso"),
            React.createElement("select", { style: s.inp, value: filters.weight, onChange: e => setFilters(p => ({ ...p, weight: e.target.value })) },
              React.createElement("option", { value: "" }, "Todas"),
              getWeightCategories(filters.sub_modality, filters.escalao, filters.gender, filters.level).map(w => React.createElement("option", { key: w, value: w }, w))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "País"),
            React.createElement("select", { style: s.inp, value: filters.country, onChange: e => setFilters(p => ({ ...p, country: e.target.value })) },
              React.createElement("option", { value: "" }, "Todos"),
              clubCountries.map(c => React.createElement("option", { key: c, value: c }, c))
            )
          ),
          React.createElement("div", null,
            React.createElement("label", { style: s.lbl }, "Data prevista da luta"),
            React.createElement("input", { type: "date", style: s.inp, value: filters.fight_date, onChange: e => setFilters(p => ({ ...p, fight_date: e.target.value })) })
          )
        ),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }, onClick: () => setFilters(p => ({ ...p, adjacent: !p.adjacent })) },
          React.createElement("div", { style: { width: 32, height: 18, borderRadius: 9, background: filters.adjacent ? "#4caf7d" : T.BG4, border: "1px solid " + (filters.adjacent ? "#4caf7d" : T.BORDER), position: "relative" } },
            React.createElement("div", { style: { position: "absolute", top: 2, left: filters.adjacent ? 16 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left 0.2s" } })
          ),
          React.createElement("span", { style: { fontSize: 12, color: filters.adjacent ? "#4caf7d" : T.TEXT3 } }, "Incluir categoria acima e abaixo")
        ),
        React.createElement("button", { onClick: search, disabled: loading, style: { ...s.btnGold, width: "100%", marginTop: 12 } }, loading ? "A carregar..." : "Pesquisar")
      ),
      searched && React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 12, color: T.TEXT2, marginBottom: 10 } }, pairs.length + " par" + (pairs.length !== 1 ? "es" : "") + " encontrado" + (pairs.length !== 1 ? "s" : "")),
        pairs.length === 0 && React.createElement(Card, null, React.createElement("div", { style: { color: T.TEXT3, textAlign: "center", padding: "24px 0" } }, "Nenhum par encontrado com estes critérios.")),
        pairs.map((p, i) => React.createElement(Card, { key: i, style: { marginBottom: 10, borderLeft: "3px solid " + p.ev.color } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 } },
            React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: p.ev.color } }, p.ev.label),
            React.createElement("span", { style: { fontSize: 11, color: T.TEXT3, marginLeft: "auto" } }, "Dif. WR: " + Math.abs((p.ra.wr ?? 50) - (p.rb.wr ?? 50)) + "% · Dif. lutas: " + Math.abs(p.ra.total - p.rb.total))
          ),
          React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center" } },
            React.createElement(FighterMiniCard, { fighter: p.a, record: p.ra, warn: p.ev.warnA }),
            React.createElement("div", { style: { color: T.TEXT3, fontWeight: 700, flexShrink: 0 } }, "vs"),
            React.createElement(FighterMiniCard, { fighter: p.b, record: p.rb, warn: p.ev.warnB })
          )
        ))
      ),
      React.createElement(Footer)
    )
  );
}

// ─── APP ROOT ──────────────────────────────────────────────
function App() {
  const [user, setUser] = useState(null);
  const [club, setClub] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [allFighters, setAllFighters] = useState([]);
  const [allFights, setAllFights] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("fighters");
  const [pendingCount, setPendingCount] = useState(0);
  const [viewAsClub, setViewAsClub] = useState(null);

  const isRegister = window.location.search.includes("register=true");
  const inviteToken = new URLSearchParams(window.location.search).get("invite");

  // Carregar clubes sempre
  useEffect(() => { db.get("clubs").then(c => setClubs(c.filter(x => x.active))); }, []);

  // Restaurar sessão se houver token guardado
  useEffect(() => {
    if (isRegister || inviteToken) { setLoading(false); return; }
    const token = localStorage.getItem("tfa_token");
    if (!token) { setLoading(false); return; }
    fetch("/api/auth?action=verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    }).then(r => r.json()).then(data => {
      if (data.user) {
        db.get("clubs").then(allClubs => {
          const userClub = allClubs.find(c => c.id === data.user.club_id) || null;
          T = buildTheme(userClub);
          setUser(data.user);
          setClub(userClub);
        });
      }
      setLoading(false);
    }).catch(() => { localStorage.removeItem("tfa_token"); setLoading(false); });
  }, []);

  if (isRegister) return React.createElement(RegisterPage, { clubs });
  if (inviteToken && !user) return React.createElement(AcceptInvitePage, { token: inviteToken, clubs });

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [f, u, fi] = await Promise.all([db.get("fighters"), db.get("users"), db.get("fights")]);
      const approved = f.filter(x => x.status !== "pending" && x.status !== "rejected");
      const pending = f.filter(x => x.status === "pending");
      setAllFighters(f.filter(x => x.status !== "rejected"));
      setAllFights(fi);
      setFighters(user.role === "superadmin" ? approved : approved.filter(x => x.club_id === user.club_id));
      setPendingCount(viewAsClub
        ? pending.filter(x => x.club_id === viewAsClub.id).length
        : user.role === "superadmin"
          ? pending.length
          : pending.filter(x => x.club_id === user.club_id).length);
      setUsers(u);
    }
    load();
  }, [user]);

  function handleLogin(loggedUser, userClub) {
    setUser(loggedUser);
    setClub(userClub);
    T = buildTheme(userClub);
    setPage("fighters");
  }

  function handleLogout() {
    localStorage.removeItem("tfa_token");
    setUser(null); setClub(null);
    T = buildTheme(null);
    setPage("fighters");
  }

  if (loading) return React.createElement("div", { style: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" } },
    React.createElement("img", { src: "https://iwjpunazbezxqwftcned.supabase.co/storage/v1/object/public/logos/tfa_logo.jpeg", style: { height: 60, opacity: 0.7 } })
  );

  if (!user) return React.createElement(Login, { onLogin: handleLogin, clubs });

  if (page === "calendar") return React.createElement(CalendarPage, { onLogout: handleLogout, user, setPage, pendingCount, club, viewAsClub, setViewAsClub });
  if (page === "matchmaking") return React.createElement(MatchmakingPage, { onLogout: handleLogout, user, setPage, pendingCount, club, clubs, viewAsClub, setViewAsClub });

  // Superadmin a ver como outro clube
  const effectiveClub = viewAsClub || club;
  const effectiveFighters = viewAsClub
    ? allFighters.filter(f => f.club_id === viewAsClub.id)
    : user.role === "superadmin"
      ? allFighters.filter(f => f.club_id === user.club_id)
      : fighters;

  if (user.role === "admin" || user.role === "superadmin") return React.createElement(AdminDashboard, {
    fighters: effectiveFighters, setFighters, users, setUsers,
    onLogout: handleLogout,
    user, page, setPage, pendingCount,
    club: effectiveClub, clubs, setClubes: setClubs,
    allFighters, allFights,
    viewAsClub, setViewAsClub
  });

  return React.createElement(AthleteView, { fighters, user, onLogout: handleLogout, setPage, pendingCount, club, clubs });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
