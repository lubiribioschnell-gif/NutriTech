const banco = require("../../config/database");
const bcrypt = require("bcryptjs");
const { textoLimpo } = require("../../utils/validacoes");

function renderLogin(res, status, erro = null) {
    return res.status(status).render("auth/login", {
        titulo: "Login",
        erro
    });
}

exports.mostrar = (req, res) => {
    return res.render("auth/login", {
        titulo: "Login",
        erro: null,
        sucesso: req.query.sucesso || null
    });
};

exports.entrar = async (req, res) => {
    try {
        const email = textoLimpo(req.body.email).toLowerCase();
        const senha = req.body.senha || "";
        const tipo = textoLimpo(req.body.tipo);

        if (!email || !senha || !tipo) {
            return renderLogin(res, 400, "Preencha todos os campos.");
        }

        if (tipo === "usuario") {
            const [usuarios] = await banco.execute(
                `SELECT id_usuario, nome, email, senha, foto, ativo
                 FROM usuarios
                 WHERE email = ?
                 LIMIT 1`,
                [email]
            );

            if (usuarios.length === 0) {
                return renderLogin(res, 401, "E-mail ou senha inválidos.");
            }

            const usuario = usuarios[0];
            const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

            if (!senhaCorreta) {
                return renderLogin(res, 401, "E-mail ou senha inválidos.");
            }

            if (usuario.ativo === 0 || usuario.ativo === false) {
                return renderLogin(res, 403, "Sua conta está desativada.");
            }

            req.session.usuario = {
                id: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                foto: usuario.foto,
                tipo: "usuario"
            };

            return req.session.save(() => res.redirect("/usuario/home"));
        }

        if (tipo === "nutricionista") {
            const [nutricionistas] = await banco.execute(
                `SELECT id_nutricionista, nome, email, senha, foto, aprovado, ativo
                 FROM nutricionistas
                 WHERE email = ?
                 LIMIT 1`,
                [email]
            );

            if (nutricionistas.length === 0) {
                return renderLogin(res, 401, "E-mail ou senha inválidos.");
            }

            const nutricionista = nutricionistas[0];
            const senhaCorreta = await bcrypt.compare(senha, nutricionista.senha);

            if (!senhaCorreta) {
                return renderLogin(res, 401, "E-mail ou senha inválidos.");
            }

            if (nutricionista.ativo === 0 || nutricionista.ativo === false) {
                return renderLogin(res, 403, "Sua conta está desativada.");
            }

            if (!nutricionista.aprovado) {
                return renderLogin(
                    res,
                    403,
                    "Seu cadastro ainda precisa ser aprovado pelo administrador."
                );
            }

            req.session.usuario = {
                id: nutricionista.id_nutricionista,
                nome: nutricionista.nome,
                email: nutricionista.email,
                foto: nutricionista.foto,
                tipo: "nutricionista"
            };

            return req.session.save(() => res.redirect("/nutricionista/home"));
        }

        return renderLogin(res, 400, "Tipo de conta inválido.");
    } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        return renderLogin(res, 500, "Não foi possível fazer login.");
    }
};
