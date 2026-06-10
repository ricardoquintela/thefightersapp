export default async function handler(req, res) {
  // Verificar secret para segurança
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const SUPABASE_URL = "https://iwjpunazbezxqwftcned.supabase.co";
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3anB1bmF6YmV6eHF3ZnRjbmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjMzNjAsImV4cCI6MjA5NjMzOTM2MH0.Ip0ccSaud0dcMFyD8WA2VsfY9vvle2EG6bZvQwfscls";
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  // Data de ontem
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10);

  // Buscar próximas lutas com data = ontem
  const upRes = await fetch(`${SUPABASE_URL}/rest/v1/upcoming?date=eq.${dateStr}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const upcoming = await upRes.json();

  if (!upcoming.length) return res.status(200).json({ sent: 0 });

  let sent = 0;
  for (const fight of upcoming) {
    // Buscar atleta
    const fRes = await fetch(`${SUPABASE_URL}/rest/v1/fighters?id=eq.${fight.fighter_id}&select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const fighters = await fRes.json();
    const fighter = fighters[0];
    if (!fighter) continue;

    // Buscar user para email
    const uRes = await fetch(`${SUPABASE_URL}/rest/v1/users?fighter_id=eq.${fighter.id}&select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const users = await uRes.json();
    const user = users[0];
    if (!user?.email) continue;

    // Enviar email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "The Fighters App <onboarding@resend.dev>",
        to: user.email,
        subject: `Como correu a luta ontem? — ${fight.event || "The Fighters App"}`,
        html: `
          <div style="background:#0a0a0a;padding:32px;font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:10px;">
            <div style="text-align:center;margin-bottom:24px;">
              <p style="color:#aaa;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">The Fighters App</p>
              <div style="width:40px;height:2px;background:#C9A84C;margin:0 auto;border-radius:2px;"></div>
            </div>
            <h2 style="color:#C9A84C;margin:0 0 8px;font-size:20px;">Olá ${fighter.name}!</h2>
            <p style="color:#888;font-size:14px;margin:0 0 20px;">Ontem tinhas uma luta agendada. Não te esqueças de registar o resultado na app!</p>
            <div style="background:#141414;border:1px solid #C9A84C44;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Adversário</p>
              <p style="color:#f0f0f0;font-size:15px;font-weight:700;margin:0 0 12px;">${fight.opponent || "—"}</p>
              <p style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Evento</p>
              <p style="color:#f0f0f0;font-size:14px;margin:0;">${fight.event || "—"}</p>
            </div>
            <a href="https://thefightersapp.vercel.app" style="display:block;text-align:center;background:#C9A84C;color:#000;padding:12px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Registar resultado</a>
            <p style="color:#333;font-size:11px;text-align:center;margin:16px 0 0;">The Fighters App · Desenvolvida por Ricardo Quintela</p>
          </div>
        `
      })
    });
    sent++;
  }

  res.status(200).json({ sent });
}
