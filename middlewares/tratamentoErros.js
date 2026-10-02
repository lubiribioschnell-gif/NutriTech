const multer = require("multer");

function tratarErros(erro, req, res, next) {
    if (res.headersSent) {
        return next(erro);
    }

    if (erro instanceof multer.MulterError) {
        let mensagem = "Não foi possível enviar a foto.";

        if (erro.code === "LIMIT_FILE_SIZE") {
            mensagem = "A foto deve ter no máximo 5 MB.";
        } else if (erro.code === "LIMIT_FILE_COUNT") {
            mensagem = "Envie apenas uma foto de perfil.";
        } else if (erro.code === "LIMIT_UNEXPECTED_FILE") {
            mensagem = "Envie somente uma imagem JPG, PNG ou WEBP.";
        }

        // Ao editar o perfil, não deixa o usuário preso em uma tela de erro.
        if (req.path === "/usuario/perfil/editar") {
            return res.redirect(
                "/usuario/perfil/editar?erro=" + encodeURIComponent(mensagem)
            );
        }

        return res.status(400).render("erros/500", {
            titulo: "Arquivo inválido",
            erro: mensagem
        });
    }

    if (erro && erro.code === "LIMIT_FILE_SIZE") {
        return res.redirect(
            "/usuario/perfil/editar?erro=" +
            encodeURIComponent("A foto deve ter no máximo 5 MB.")
        );
    }

    console.error(erro);

    return res.status(500).render("erros/500", {
        titulo: "Erro interno",
        erro: "Ocorreu um erro inesperado."
    });
}

module.exports = tratarErros;
