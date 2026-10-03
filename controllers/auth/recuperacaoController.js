const banco = require("../../config/database");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const HORAS_EXPIRACAO = 1;

async function garantirTabelaRecuperacao() {
    await banco.execute(`
        CREATE TABLE IF NOT EXISTS password_resets (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            email VARCHAR(150) NOT NULL,
            token_hash CHAR(64) NOT NULL,
            expires_at DATETIME NOT NULL,
            used_at DATETIME NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_password_reset_token (token_hash),
            KEY idx_password_reset_email (email),
            KEY idx_password_reset_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

function mensagem(res, sucesso = null, erro = null, status = 200) {
    return res.status(status).render("auth/recuperarSenha", {
        titulo: "Recuperar senha",
        sucesso,
        erro
    });
}

function criarTransportador() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        throw new Error("SMTP não configurado. Preencha SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env.");
    }

    return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
}

exports.mostrar = (req, res) => mensagem(res);

exports.solicitar = async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();

    // Resposta genérica para não revelar se o e-mail existe.
    const respostaGenerica =
        "Se o e-mail estiver cadastrado, enviaremos um link para redefinição da senha.";

    if (!email) {
        return mensagem(res, null, "Informe seu e-mail.", 400);
    }

    try {
        await garantirTabelaRecuperacao();

        const [[usuario]] = await banco.execute(
            "SELECT id_usuario AS id, email, nome FROM usuarios WHERE email = ? LIMIT 1",
            [email]
        );

        const [[nutricionista]] = await banco.execute(
            "SELECT id_nutricionista AS id, email, nome FROM nutricionistas WHERE email = ? LIMIT 1",
            [email]
        );

        const conta = usuario || nutricionista;

        if (!conta) {
            return mensagem(res, respostaGenerica);
        }

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        await banco.execute(
            "DELETE FROM password_resets WHERE email = ? OR expires_at < NOW()",
            [email]
        );

        await banco.execute(
            `INSERT INTO password_resets (email, token_hash, expires_at)
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
            [email, tokenHash, HORAS_EXPIRACAO]
        );

        const protocolo = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0].trim();
        const host = req.get("host");
        const baseUrl = String(process.env.APP_URL || `${protocolo}://${host}`).replace(/\/$/, "");
        const link = `${baseUrl}/recuperar-senha/redefinir/${token}`;

        const transporter = criarTransportador();
        await transporter.verify();

        const remetente = String(process.env.MAIL_FROM || process.env.SMTP_USER || "")
            .replace(/^MAIL_FROM\s*=\s*/i, "")
            .trim();

        await transporter.sendMail({
            from: remetente || user,
            to: email,
            subject: "Redefinição de senha - NutriTech",
            text:
                `Olá, ${conta.nome}!\n\n` +
                `Recebemos uma solicitação para redefinir sua senha no NutriTech.\n\n` +
                `Acesse o link abaixo em até ${HORAS_EXPIRACAO} hora:\n${link}\n\n` +
                "Se você não fez essa solicitação, ignore este e-mail.",
            html:
                `<!doctype html><html lang="pt-BR"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333">` +
                `<div style="max-width:600px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:12px">` +
                `<h2 style="margin-top:0">NutriTech</h2>` +
                `<p>Olá, <strong>${conta.nome}</strong>!</p>` +
                `<p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>` +
                `<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#2e7d32;color:#fff;text-decoration:none;border-radius:8px">Redefinir minha senha</a></p>` +
                `<p>Este link expira em ${HORAS_EXPIRACAO} hora.</p>` +
                `<p>Se você não solicitou a alteração, ignore este e-mail.</p>` +
                `</div></body></html>`
        });

        return mensagem(res, respostaGenerica);
    } catch (erro) {
        console.error("Erro ao solicitar recuperação de senha:", erro);
        return mensagem(res, null, "Não foi possível iniciar a recuperação. Tente novamente.", 500);
    }
};

exports.formularioRedefinicao = async (req, res) => {
    const token = String(req.params.token || "");
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).render("auth/redefinirSenha", {
            titulo: "Redefinir senha",
            erro: "Link de recuperação inválido ou expirado.",
            token: null
        });
    }

    try {
        await garantirTabelaRecuperacao();
    } catch (erro) {
        console.error("Erro ao preparar tabela de recuperação:", erro);
        return res.status(500).render("auth/redefinirSenha", {
            titulo: "Redefinir senha",
            erro: "Não foi possível validar o link de recuperação.",
            token: null
        });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const [[reset]] = await banco.execute(
        `SELECT email
         FROM password_resets
         WHERE token_hash = ?
           AND used_at IS NULL
           AND expires_at > NOW()
         LIMIT 1`,
        [tokenHash]
    );

    if (!reset) {
        return res.status(400).render("auth/redefinirSenha", {
            titulo: "Redefinir senha",
            erro: "Link de recuperação inválido ou expirado.",
            token: null
        });
    }

    return res.render("auth/redefinirSenha", {
        titulo: "Redefinir senha",
        erro: null,
        token
    });
};

exports.redefinir = async (req, res) => {
    const token = String(req.body.token || "");
    const senha = String(req.body.senha || "");
    const confirmarSenha = String(req.body.confirmarSenha || "");

    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).render("auth/redefinirSenha", {
            titulo: "Redefinir senha",
            erro: "Link de recuperação inválido ou expirado.",
            token: null
        });
    }

    if (senha.length < 6 || senha.length > 72) {
        return res.status(400).render("auth/redefinirSenha", {
            titulo: "Redefinir senha",
            erro: "A senha deve ter entre 6 e 72 caracteres.",
            token
        });
    }

    if (senha !== confirmarSenha) {
        return res.status(400).render("auth/redefinirSenha", {
            titulo: "Redefinir senha",
            erro: "As senhas não coincidem.",
            token
        });
    }

    try {
        await garantirTabelaRecuperacao();
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const [[reset]] = await banco.execute(
            `SELECT email
             FROM password_resets
             WHERE token_hash = ?
               AND used_at IS NULL
               AND expires_at > NOW()
             LIMIT 1`,
            [tokenHash]
        );

        if (!reset) {
            return res.status(400).render("auth/redefinirSenha", {
                titulo: "Redefinir senha",
                erro: "Link de recuperação inválido ou expirado.",
                token: null
            });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const [usuarios] = await banco.execute(
            "UPDATE usuarios SET senha = ? WHERE email = ?",
            [senhaCriptografada, reset.email]
        );

        if (usuarios.affectedRows === 0) {
            await banco.execute(
                "UPDATE nutricionistas SET senha = ? WHERE email = ?",
                [senhaCriptografada, reset.email]
            );
        }

        await banco.execute(
            "UPDATE password_resets SET used_at = NOW() WHERE token_hash = ?",
            [tokenHash]
        );

        return res.redirect("/login?sucesso=" + encodeURIComponent("Senha alterada com sucesso. Faça login com sua nova senha."));
    } catch (erro) {
        console.error("Erro ao redefinir senha:", erro);
        return res.status(500).render("auth/redefinirSenha", {
            titulo: "Redefinir senha",
            erro: "Não foi possível alterar sua senha.",
            token
        });
    }
};
