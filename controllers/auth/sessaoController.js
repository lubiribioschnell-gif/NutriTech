exports.sair = (req, res) => {
    req.session.destroy(erro => {
        if (erro) {
            console.error("Erro ao encerrar sessão:", erro);
            return res.redirect("/");
        }

        res.clearCookie("connect.sid");
        return res.redirect("/");
    });
};
