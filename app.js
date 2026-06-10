export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, username, newPassword } = req.body;
  if (!email || !username || !newPassword) return res.status(400).json({ error: "Missing fields" });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "The Fighters App <onboarding@resend.dev>",
      to: email,
      subject: "A tua nova password — The Fighters App",
      html: `
        <div style="background:#0a0a0a;padding:32px;font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:10px;">
          <div style="text-align:center;margin-bottom:24px;">
            <p style="color:#aaa;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin:0 0 8px">The Fighters App</p>
            <div style="width:40px;height:2px;background:#C9A84C;margin:0 auto;border-radius:2px;"></div>
          </div>
          <h2 style="color:#C9A84C;margin:0 0 8px;font-size:20px;">Nova password gerada</h2>
          <p style="color:#888;font-size:14px;margin:0 0 24px;">Foi gerada uma nova password para a tua conta.</p>
          <div style="background:#141414;border:1px solid #C9A84C44;border-radius:8px;padding:16px;margin-bottom:24px;">
            <p style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Username</p>
            <p style="color:#f0f0f0;font-size:16px;font-weight:700;margin:0 0 16px;">${username}</p>
            <p style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Nova Password</p>
            <p style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:3px;margin:0;">${newPassword}</p>
          </div>
          <p style="color:#555;font-size:12px;margin:0 0 16px;">Recomendamos que alteres a password após o login.</p>
          <a href="https://thefightersapp.vercel.app" style="display:block;text-align:center;background:#C9A84C;color:#000;padding:12px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Entrar na App</a>
          <p style="color:#333;font-size:11px;text-align:center;margin:16px 0 0;">The Fighters App · Desenvolvida por Ricardo Quintela</p>
        </div>
      `
    })
  });

  if (response.ok) {
    res.status(200).json({ success: true });
  } else {
    const err = await response.json();
    res.status(500).json({ error: err });
  }
}