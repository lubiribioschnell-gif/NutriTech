const banco = require("../../config/database");
const { buscarTotalPontos } = require("../../services/pontuacaoService");
const { calcularNivel } = require("../../services/nivelService");

exports.carregarHome = async (req, res, next) => {
    try {
        const idUsuario = req.session.usuario.id;

        const [
            [[cardapios]],
            [[quizzes]],
            [[diarios]],
            totalPontos,
            [[nutricionista]]
        ] = await Promise.all([
            banco.execute(
                `SELECT COUNT(*) AS total
                 FROM cardapios
                 WHERE id_usuario = ?`,
                [idUsuario]
            ),
            banco.execute(
                `SELECT COUNT(*) AS total
                 FROM quizzes
                 WHERE id_usuario = ?`,
                [idUsuario]
            ),
            banco.execute(
                `SELECT COUNT(*) AS total
                 FROM diario_alimentar
                 WHERE id_usuario = ?`,
                [idUsuario]
            ),
            buscarTotalPontos(idUsuario),
            banco.execute(
                `SELECT
                    n.id_nutricionista,
                    n.nome,
                    n.email,
                    n.foto
                 FROM solicitacoes_nutricionista s
                 INNER JOIN nutricionistas n
                    ON n.id_nutricionista = s.id_nutricionista
                 WHERE s.id_usuario = ?
                   AND s.status = 'aceita'
                 ORDER BY s.data_resposta DESC
                 LIMIT 1`,
                [idUsuario]
            )
        ]);

        return res.render("usuario/home", {
            titulo: "Área do usuário",
            usuario: req.session.usuario,
            resumo: {
                cardapios: Number(cardapios.total) || 0,
                quizzes: Number(quizzes.total) || 0,
                diarios: Number(diarios.total) || 0,
                pontos: totalPontos
            },
            nivel: calcularNivel(totalPontos),
            nutricionista: nutricionista || null
        });
    } catch (erro) {
        console.error("Erro ao carregar a home do usuário:", erro);
        return next(erro);
    }
};
