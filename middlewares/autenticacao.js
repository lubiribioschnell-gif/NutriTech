const banco = require("../config/database");

function estaAutenticado(req) {
    return Boolean(req.session && req.session.usuario);
}

function negarAcesso(res, mensagem = "Você não tem permissão para acessar esta página.") {
    return res.status(403).render("erros/403", {
        titulo: "Acesso negado",
        mensagem
    });
}

function verificarLogin(req, res, next) {
    if (!estaAutenticado(req)) {
        return res.redirect("/login");
    }

    return next();
}

async function verificarContaAtiva(req, res, next, tipo) {
    try {
        if (!estaAutenticado(req)) {
            return res.redirect(tipo === "admin" ? "/admin/login" : "/login");
        }

        if (req.session.usuario.tipo !== tipo) {
            return negarAcesso(res);
        }

        const configuracoes = {
            usuario: {
                tabela: "usuarios",
                id: "id_usuario"
            },
            nutricionista: {
                tabela: "nutricionistas",
                id: "id_nutricionista"
            },
            admin: {
                tabela: "administradores",
                id: "id_admin"
            }
        };

        const conta = configuracoes[tipo];
        const [registros] = await banco.execute(
            `SELECT ativo FROM ${conta.tabela} WHERE ${conta.id} = ? LIMIT 1`,
            [req.session.usuario.id]
        );

        if (registros.length === 0 || !registros[0].ativo) {
            return req.session.destroy(() => {
                res.clearCookie("connect.sid");
                return res.redirect(
                    tipo === "admin"
                        ? "/admin/login?erro=Conta administrativa desativada"
                        : "/login?erro=Sua conta foi desativada pelo administrador"
                );
            });
        }

        return next();
    } catch (erro) {
        return next(erro);
    }
}

function verificarUsuario(req, res, next) {
    return verificarContaAtiva(req, res, next, "usuario");
}

function verificarNutricionista(req, res, next) {
    return verificarContaAtiva(req, res, next, "nutricionista");
}

function verificarAdmin(req, res, next) {
    return verificarContaAtiva(req, res, next, "admin");
}

function impedirUsuarioLogado(req, res, next) {
    if (!estaAutenticado(req)) {
        return next();
    }

    const redirecionamentos = {
        usuario: "/usuario/home",
        nutricionista: "/nutricionista/home",
        admin: "/admin/home"
    };

    return res.redirect(redirecionamentos[req.session.usuario.tipo] || "/");
}

module.exports = {
    verificarLogin,
    verificarUsuario,
    verificarNutricionista,
    verificarAdmin,
    impedirUsuarioLogado
};
