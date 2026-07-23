import crypto from "crypto";

const SUPABASE_URL = "https://iwjpunazbezxqwftcned.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET || "fighters_secret_2026";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

function generateToken(userId) {
        const payload = `${userId}:${Date.now()}:${SESSION_SECRET}`;
        return Buffer.from(payload).toString("base64");
}

function verifyToken(token) {
        try {
                    const decoded = Buffer.from(token, "base64").toString("utf8");
                    const [userId, timestamp] = decoded.split(":");
                    if (Date.now() - parseInt(timestamp) > 7 * 24 * 60 * 60 * 1000) return null;
                    return userId;
        } catch { return null; }
}

async function getUser(id) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}&select=id,name,role,username,email,club_id,fighter_id`, {
                    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (!r.ok) return null;
        const users = await r.json();
        return users[0] || null;
}

function generatePassword() {
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Verificar password — suporta texto simples e bcrypt
async function checkPassword(plain, stored) {
        if (!plain || !stored) return false;
        // Bcrypt
    if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
                try {
                                const bcryptModule = await import("bcryptjs");
                                const bcrypt = bcryptModule.default || bcryptModule;
                                return await bcrypt.compare(plain, stored);
                } catch {
                                // fallback: tentar bcrypt nativo do node se bcryptjs não disponível
                    return false;
                }
    }
        // Texto simples
    return plain === stored;
}

async function sendEmail(to, subject, html) {
        if (!RESEND_API_KEY) return { error: "Resend não configurado" };
        const r = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ from: "The Fighters App <onboarding@resend.dev>", to, subject, html })
        });
        return r.json();
}

function credentialsEmail(username, password) {
        return `<div style="background:#0a0a0a;padding:32px;font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:10px;">
            <p style="color:#aaa;font-size:11px;letter-spacing:4px;text-transform:uppercase;text-align:center">The Fighters App</p>
                <div style="width:40px;height:2px;background:#C9A84C;margin:8px auto 24px"></div>
                    <h2 style="color:#C9A84C;margin:0 0 16px">Acesso à plataforma</h2>
                        <p style="color:#ccc;font-size:14px">Aqui estão as tuas credenciais de acesso:</p>
                            <div style="background:#141414;border:1px solid #C9A84C44;border-radius:8px;padding:16px;margin:16px 0">
                                    <p style="color:#555;font-size:11px;text-transform:uppercase;margin:0 0 4px">Username</p>
                                            <p style="color:#f0f0f0;font-size:16px;font-weight:700;margin:0 0 16px">${username}</p>
                                                    <p style="color:#555;font-size:11px;text-transform:uppercase;margin:0 0 4px">Password</p>
                                                            <p style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:3px;margin:0">${password}</p>
                                                                </div>
                                                                    <a href="https://thefightersapp.vercel.app" style="display:block;text-align:center;background:#C9A84C;color:#000;padding:12px;border-radius:6px;text-decoration:none;font-weight:700;margin-top:16px">Entrar na App</a>
                                                                        <p style="color:#555;font-size:11px;text-align:center;margin-top:16px">Por segurança, altera a password após o primeiro login (menu Conta).</p>
                                                                            </div>`;
}

export default async function handler(req, res) {
        const { action } = req.query;

    // ── LOGIN ──────────────────────────────────────────────────────
    if (action === "login" && req.method === "POST") {
                const { username, password } = req.body;
                if (!username || !password) return res.status(400).json({ error: "Campos obrigatórios." });

            const r = await fetch(`${SUPABASE_URL}/rest/v1/users?username=ilike.${encodeURIComponent(username.toLowerCase().trim())}&select=*`, {
                            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
                if (!r.ok) return res.status(503).json({ error: "Erro temporário, tenta novamente." });
                const users = await r.json();
                if (!users?.length) return res.status(401).json({ error: "Username ou password incorrectos." });

            const user = users[0];
                const valid = await checkPassword(password, user.password);
                if (!valid) return res.status(401).json({ error: "Username ou password incorrectos." });

            const token = generateToken(user.id);
                const { password: _, ...safeUser } = user;
                return res.status(200).json({ token, user: safeUser });
    }

    // ── VERIFY SESSION ─────────────────────────────────────────────
    if (action === "verify" && req.method === "POST") {
                const { token } = req.body;
                if (!token) return res.status(401).json({ error: "No token." });
                const userId = verifyToken(token);
                if (!userId) return res.status(401).json({ error: "Token inválido ou expirado." });
                const user = await getUser(userId);
                if (!user) return res.status(401).json({ error: "Utilizador não encontrado." });
                return res.status(200).json({ user });
    }

    // ── CHANGE PASSWORD (pelo próprio utilizador) ──────────────────
    if (action === "change-password" && req.method === "POST") {
                const { token, currentPassword, newPassword } = req.body;
                if (!token) return res.status(401).json({ error: "Não autenticado." });
                const userId = verifyToken(token);
                if (!userId) return res.status(401).json({ error: "Token inválido." });

            const r = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
                            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
                if (!r.ok) return res.status(503).json({ error: "Erro temporário, tenta novamente." });
                const users = await r.json();
                if (!users?.length) return res.status(404).json({ error: "Utilizador não encontrado." });

            const valid = await checkPassword(currentPassword, users[0].password);
                if (!valid) return res.status(401).json({ error: "Password actual incorrecta." });
                if (newPassword.length < 6) return res.status(400).json({ error: "Mínimo 6 caracteres." });

            await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                            method: "PATCH",
                            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ password: newPassword })
            });
                return res.status(200).json({ success: true });
    }

    // ── RESET PASSWORD (admin reset de atleta) ─────────────────────
    if (action === "reset-by-admin" && req.method === "POST") {
                const { token, fighter_id } = req.body;
                if (!token) return res.status(401).json({ error: "Não autenticado." });

            const adminId = verifyToken(token);
                if (!adminId) return res.status(401).json({ error: "Token inválido." });

            const admin = await getUser(adminId);
                if (!admin || (admin.role !== "admin" && admin.role !== "superadmin"))
                                return res.status(403).json({ error: "Sem permissão." });

            const r = await fetch(`${SUPABASE_URL}/rest/v1/users?fighter_id=eq.${fighter_id}&select=*`, {
                            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
                if (!r.ok) return res.status(503).json({ error: "Erro temporário, tenta novamente." });
                const users = await r.json();
                if (!users?.length) return res.status(404).json({ error: "Atleta não tem conta." });

            const targetUser = users[0];
                if (admin.role === "admin" && targetUser.club_id !== admin.club_id)
                                return res.status(403).json({ error: "Sem permissão para este atleta." });

            const newPw = generatePassword();
                await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${targetUser.id}`, {
                                method: "PATCH",
                                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
                                body: JSON.stringify({ password: newPw })
                });

            // Enviar credenciais por email automaticamente se Resend disponível
            if (targetUser.email && RESEND_API_KEY) {
                            await sendEmail(
                                                targetUser.email,
                                                "As tuas credenciais — The Fighters App",
                                                credentialsEmail(targetUser.username, newPw)
                                            );
            }

            return res.status(200).json({ success: true, newPassword: newPw, username: targetUser.username });
    }

    // ── SEND INVITE (envia credenciais por email via Resend) ───────
    if (action === "send-invite" && req.method === "POST") {
                const { token, email, username, password, clubName, role } = req.body;
                if (!token) return res.status(401).json({ error: "Não autenticado." });

            const adminId = verifyToken(token);
                if (!adminId) return res.status(401).json({ error: "Token inválido." });

            const admin = await getUser(adminId);
                if (!admin || (admin.role !== "admin" && admin.role !== "superadmin"))
                                return res.status(403).json({ error: "Sem permissão." });

            const roleLabel = role === "admin" ? "Administrador" : "Atleta";
                const subject = `Acesso à The Fighters App — ${clubName}`;
                const html = `<div style="background:#0a0a0a;padding:32px;font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:10px;">
                    <p style="color:#aaa;font-size:11px;letter-spacing:4px;text-transform:uppercase;text-align:center">The Fighters App</p>
                        <div style="width:40px;height:2px;background:#C9A84C;margin:8px auto 24px"></div>
                            <h2 style="color:#C9A84C;margin:0 0 8px">Bem-vindo ao ${clubName}</h2>
                                <p style="color:#ccc;font-size:14px">Foste adicionado à plataforma como <b>${roleLabel}</b>. Aqui estão as tuas credenciais:</p>
                                    <div style="background:#141414;border:1px solid #C9A84C44;border-radius:8px;padding:16px;margin:16px 0">
                                            <p style="color:#555;font-size:11px;text-transform:uppercase;margin:0 0 4px">Username</p>
                                                    <p style="color:#f0f0f0;font-size:16px;font-weight:700;margin:0 0 16px">${username}</p>
                                                            <p style="color:#555;font-size:11px;text-transform:uppercase;margin:0 0 4px">Password</p>
                                                                    <p style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:3px;margin:0">${password}</p>
                                                                        </div>
                                                                            <a href="https://thefightersapp.vercel.app" style="display:block;text-align:center;background:#C9A84C;color:#000;padding:12px;border-radius:6px;text-decoration:none;font-weight:700;margin-top:16px">Entrar na App</a>
                                                                                <p style="color:#555;font-size:11px;text-align:center;margin-top:16px">Por segurança, altera a password após o primeiro login.</p>
                                                                                    </div>`;

            if (!RESEND_API_KEY) {
                            // Fallback: devolver dados para mailto
                    return res.status(200).json({ success: true, fallback: true, username, password });
            }

            const result = await sendEmail(email, subject, html);
                if (result.error) return res.status(500).json({ error: result.error });
                return res.status(200).json({ success: true, fallback: false });
    }

    // ── RESET PASSWORD (esqueci) ────────────────────────────────────
    if (action === "reset" && req.method === "POST") {
                const { username } = req.body;
                if (!username) return res.status(400).json({ error: "Username obrigatório." });

            const r = await fetch(`${SUPABASE_URL}/rest/v1/users?username=ilike.${encodeURIComponent(username.toLowerCase().trim())}&select=*`, {
                            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
            });
                if (!r.ok) return res.status(503).json({ error: "Erro temporário, tenta novamente." });
                const users = await r.json();
                if (!users?.length) return res.status(404).json({ error: "Username não encontrado." });

            const user = users[0];
                if (!user.email) return res.status(400).json({ error: "Sem e-mail associado." });

            const newPw = generatePassword();
                await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
                                method: "PATCH",
                                headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
                                body: JSON.stringify({ password: newPw })
                });

            const emailResult = await sendEmail(user.email, "A tua nova password — The Fighters App", credentialsEmail(user.username, newPw));
                if (emailResult.error) return res.status(500).json({ error: "Password foi alterada mas o envio do e-mail falhou: " + emailResult.error });
                return res.status(200).json({ success: true });
    }

    res.status(404).json({ error: "Action not found" });
}
