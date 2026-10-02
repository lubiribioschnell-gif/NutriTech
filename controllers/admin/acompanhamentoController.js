const banco = require("../../config/database");

exports.listar = async (req, res) => {
    try {
        const [acompanhamentos] = await banco.execute(
            `SELECT
                s.id_solicitacao,
                s.status,
                s.data_solicitacao,
                s.data_resposta,
                u.id_usuario,
                u.nome AS usuario_nome,
                u.email AS usuario_email,
                n.id_nutricionista,
                n.nome AS nutricionista_nome,
                n.email AS nutricionista_email
             FROM solicitacoes_nutricionista s
             INNER JOIN usuarios u
                ON u.id_usuario = s.id_usuario
             INNER JOIN nutricionistas n
                ON n.id_nutricionista = s.id_nutricionista
             ORDER BY s.id_solicitacao DESC`
        );

        return res.render("admin/acompanhamentos", {
            titulo: "Acompanhamentos",
            usuario: req.session.usuario,
            acompanhamentos
        });
    } catch (erro) {
        console.error("Erro ao listar acompanhamentos:", erro);
        return res.status(500).send(
            "Não foi possível listar os acompanhamentos."
        );
    }
};
