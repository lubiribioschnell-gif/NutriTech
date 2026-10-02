const banco = require("../../config/database");
const crypto = require("crypto");

function renderLoginErro(res, mensagem) {
    return res.status(400).render("auth/login", {
        titulo: "Login",
        erro: mensagem,
        sucesso: null
    });
}

exports.configuracao = (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).send("Login com Google não configurado. Defina GOOGLE_CLIENT_ID no arquivo .env.");
    }

    return res.redirect("/login");
};

exports.entrar = async (req, res) => {
    const credential = String(req.body.credential || "");

    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
        return renderLoginErro(res, "Login com Google não está configurado.");
    }

    try {
        const resposta = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );

        if (!resposta.ok) {
            return renderLoginErro(res, "Não foi possível validar sua conta Google.");
        }

        const dados = await resposta.json();

        if (
            dados.aud !== process.env.GOOGLE_CLIENT_ID ||
            dados.email_verified !== "true" ||
            !dados.email
        ) {
            return renderLoginErro(res, "A conta Google não pôde ser validada.");
        }

        const email = String(dados.email).toLowerCase().trim();

        const [usuarios] = await banco.execute(
            `SELECT id_usuario, nome, email, senha, foto, ativo
             FROM usuarios WHERE email = ? LIMIT 1`,
            [email]
        );

        if (usuarios.length > 0) {
            const usuario = usuarios[0];

            if (!usuario.ativo) {
                return renderLoginErro(res, "Sua conta está desativada.");
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

        const [nutricionistas] = await banco.execute(
            `SELECT id_nutricionista, nome, email, senha, foto, aprovado, ativo
             FROM nutricionistas WHERE email = ? LIMIT 1`,
            [email]
        );

        if (nutricionistas.length > 0) {
            const nutricionista = nutricionistas[0];

            if (!nutricionista.ativo) {
                return renderLoginErro(res, "Sua conta está desativada.");
            }

            if (!nutricionista.aprovado) {
                return renderLoginErro(res, "Seu cadastro ainda precisa ser aprovado pelo administrador.");
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

        // Não cria automaticamente um cadastro incompleto. O usuário é enviado ao cadastro normal.
        return renderLoginErro(
            res,
            "Este e-mail Google ainda não possui uma conta NutriTech. Faça seu cadastro primeiro."
        );
    } catch (erro) {
        console.error("Erro no login com Google:", erro);
        return renderLoginErro(res, "Não foi possível entrar com o Google. Tente novamente.");
    }
};
