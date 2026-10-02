const bcrypt = require("bcryptjs");
const banco = require("../../config/database");

function renderLogin(res, status, erro = null) {
    return res.status(status).render("admin/login", {
        titulo: "Login administrativo",
        erro
    });
}

exports.mostrarLogin = (req, res) => {
    return res.render("admin/login", {
        titulo: "Login administrativo",
        erro: req.query.erro || null
    });
};

exports.login = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        const senha = String(req.body.senha || "");

        if (!email || !senha) {
            return renderLogin(res, 400, "Informe o e-mail e a senha.");
        }

        const [administradores] = await banco.execute(
            `SELECT id_admin, nome, email, senha, ativo
             FROM administradores
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if (administradores.length === 0) {
            return renderLogin(res, 401, "E-mail ou senha inválidos.");
        }

        const administrador = administradores[0];
        const senhaCorreta = await bcrypt.compare(senha, administrador.senha);

        if (!senhaCorreta) {
            return renderLogin(res, 401, "E-mail ou senha inválidos.");
        }

        if (!administrador.ativo) {
            return renderLogin(res, 403, "Esta conta administrativa está desativada.");
        }

        req.session.usuario = {
            id: administrador.id_admin,
            nome: administrador.nome,
            email: administrador.email,
            tipo: "admin"
        };

        return req.session.save((erro) => {
            if (erro) {
                console.error("Erro ao salvar sessão administrativa:", erro);
                return renderLogin(res, 500, "Não foi possível iniciar a sessão.");
            }

            return res.redirect("/admin/home");
        });
    } catch (erro) {
        console.error("Erro no login do administrador:", erro);
        return renderLogin(res, 500, "Não foi possível realizar o login.");
    }
};

exports.logout = (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar sessão administrativa:", erro);
            return res.redirect("/admin/home");
        }

        res.clearCookie("connect.sid");
        return res.redirect("/admin/login");
    });
};
