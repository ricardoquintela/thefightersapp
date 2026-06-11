import crypto from "crypto";

const SUPABASE_URL = "https://iwjpunazbezxqwftcned.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET || "fighters_secret_2026";

// Gerar token de sessão simples
function generateToken(userId) {
  const payload = `${userId}:${Date.now()}:${SESSION_SECRET}`;
  return Buffer.from(payload).toString("base64");
}

// Verificar token
function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [userId, timestamp] = decoded.split(":");
    // Token válido por 7 dias
    if (Date.now() - parseInt(timestamp) > 7 * 24 * 60 * 60 * 1000) return null;
    return userId;
  } catch { return null; }
}

async function getUser(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}&select=id,name,role,username,email,club_id,fighter_id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const users = await r.json();
  return users[0] || null;
}

export default async function handler(req, res) {
  const { action } = req.query;

  // ── LOGIN ──
  if (action === "login" && req.method === "POST") {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Campos obrigatórios." });

    const r = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username.toLowerCase().trim())}&select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const users = await r.json();
    if (!users?.length || users[0].password !== password)
      return res.status(401).json({ error: "Username ou password incorrectos." });

    const user = users[0];
    const token = generateToken(user.id);
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ token, user: safeUser });
  }

  // ── VERIFY SESSION ──
  if (action === "verify" && req.method === "POST") {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: "No token." });
    const userId = verifyToken(token);
    if (!userId) return res.status(401).json({ error: "Token inválido ou expirado." });
    const user = await getUser(userId);
    if (!user) return res.status(401).json({ error: "Utilizador não encontrado." });
    return res.status(200).json({ user });
  }

  // ── CHANGE PASSWORD ──
  if (action === "change-password" && req.method === "POST") {
    const { token, currentPassword, newPassword } = req.body;
    if (!token) return res.status(401).json({ error: "Não autenticado." });
    const userId = verifyToken(token);
    if (!userId) return res.status(401).json({ error: "Token inválido." });

    // Verificar password actual
    const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const users = await r.json();
    if (!users?.length || users[0].password !== currentPassword)
      return res.status(401).json({ error: "Password actual incorrecta." });

    if (newPassword.length < 6) return res.status(400).json({ error: "Mínimo 6 caracteres." });

    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword })
    });
    return res.status(200).json({ success: true });
  }

  // ── RESET PASSWORD (admin) ──
  if (action === "reset" && req.method === "POST") {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username obrigatório." });

    const r = await fetch(`${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username.toLowerCase())}&select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const users = await r.json();
    if (!users?.length) return res.status(404).json({ error: "Username não encontrado." });

    const user = users[0];
    if (!user.email) return res.status(400).json({ error: "Sem e-mail associado." });

    // Gerar nova password
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const newPw = Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join("");

    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPw })
    });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "The Fighters App <onboarding@resend.dev>",
        to: user.email,
        subject: "A tua nova password — The Fighters App",
        html: `<div style="background:#0a0a0a;padding:32px;font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:10px;">
          <p style="color:#aaa;font-size:11px;letter-spacing:4px;text-transform:uppercase;text-align:center">The Fighters App</p>
          <div style="width:40px;height:2px;background:#C9A84C;margin:8px auto 24px"></div>
          <h2 style="color:#C9A84C;margin:0 0 8px">Nova password gerada</h2>
          <div style="background:#141414;border:1px solid #C9A84C44;border-radius:8px;padding:16px;margin:16px 0">
            <p style="color:#555;font-size:11px;text-transform:uppercase;margin:0 0 4px">Username</p>
            <p style="color:#f0f0f0;font-size:16px;font-weight:700;margin:0 0 16px">${user.username}</p>
            <p style="color:#555;font-size:11px;text-transform:uppercase;margin:0 0 4px">Nova Password</p>
            <p style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:3px;margin:0">${newPw}</p>
          </div>
          <a href="https://thefightersapp.vercel.app" style="display:block;text-align:center;background:#C9A84C;color:#000;padding:12px;border-radius:6px;text-decoration:none;font-weight:700">Entrar na App</a>
        </div>`
      })
    });

    return res.status(200).json({ success: true });
  }

  res.status(404).json({ error: "Action not found" });
}
