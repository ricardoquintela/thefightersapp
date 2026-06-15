const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, username, password, clubName, roleLabel } = req.body || {};
  if (!email || !username || !password) return res.status(400).json({ error: "Missing fields" });

  const club = clubName || "o teu clube";
  const role = roleLabel || "Atleta";

  const html = `<div style="background:#0a0a0a;color:#f0f0f0;font-family:sans-serif;padding:32px;max-width:480px;margin:0 auto;border-radius:12px;border:1px solid #2a2a2a">
    <div style="text-align:center;margin-bottom:24px">
      <img src="https://thefightersapp.vercel.app/tfa_icon.png" width="72" height="72" style="border-radius:12px"/>
      <h2 style="color:#C9A84C;margin:12px 0 4px">The Fighters App</h2>
      <p style="color:#888;font-size:13px;margin:0">Bem-vindo(a)!</p>
    </div>
    <p style="font-size:15px;line-height:1.6">Foram criadas as tuas credenciais de acesso à <strong>The Fighters App</strong> como <strong style="color:#C9A84C">${role}</strong> do <strong>${club}</strong>.</p>
    <div style="background:#1c1c1c;border:1px solid #2a2a2a;border-radius:8px;padding:16px;margin:20px 0">
      <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px">As tuas credenciais</p>
      <p style="margin:4px 0;font-size:15px"><span style="color:#888">Username:</span> <strong>${username}</strong></p>
      <p style="margin:4px 0;font-size:15px"><span style="color:#888">Password:</span> <strong style="font-family:monospace;color:#C9A84C">${password}</strong></p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="https://thefightersapp.vercel.app" style="display:inline-block;background:#C9A84C;color:#000;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">Entrar na App</a>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin-top:16px">Por segurança, altera a password após o primeiro login (menu Conta).</p>
  </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "The Fighters App <onboarding@resend.dev>", to: email, subject: "Acesso à The Fighters App — " + club, html })
    });
    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data.message || "Resend error" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
