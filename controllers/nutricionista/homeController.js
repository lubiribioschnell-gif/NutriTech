const banco = require("../../config/database");

exports.home = async (req, res) => {
        try {
            const idNutricionista = req.session.usuario.id;

            const [[resultadoCardapios]] = await banco.execute(
                `SELECT COUNT(*) AS total
     FROM cardapios
     WHERE id_nutricionista = ?`,
                [idNutricionista]
            );


            const [resultadoUsuarios] = await banco.execute(
                `SELECT COUNT(DISTINCT id_usuario) AS total
     FROM solicitacoes_nutricionista
     WHERE id_nutricionista = ?
       AND status = 'aceita'`,
                [idNutricionista]
            );

            const [resultadoRefeicoes] = await banco.execute(
                `SELECT COUNT(r.id_refeicao) AS total
                 FROM refeicoes r
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE c.id_nutricionista = ?`,
                [idNutricionista]
            );

            return res.render("nutricionista/home", {
                titulo: "Área do nutricionista",
                usuario: req.session.usuario,
                resumo: {
                    cardapios: resultadoCardapios.total,
                    usuarios: resultadoUsuarios[0].total,
                    refeicoes: resultadoRefeicoes[0].total
                }
            });
        } catch (erro) {
            console.error(
                "Erro ao carregar dashboard do nutricionista:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar a página inicial."
            );
        }
    };
