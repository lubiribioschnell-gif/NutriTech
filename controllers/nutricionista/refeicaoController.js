const banco = require("../../config/database");

const TIPOS_REFEICAO = [
    "Café da manhã",
    "Lanche da manhã",
    "Almoço",
    "Lanche da tarde",
    "Jantar",
    "Ceia"
];

exports.listarDoCardapio = async (req, res) => {
        try {
            const idCardapio = req.params.id;

            const [cardapios] = await banco.execute(
                `SELECT
                    c.id_cardapio,
                    c.nome,
                    c.observacoes,
                    u.nome AS nome_usuario
                 FROM cardapios c
                 INNER JOIN usuarios u
                    ON u.id_usuario = c.id_usuario
                 WHERE c.id_cardapio = ?
                   AND c.id_nutricionista = ?`,
                [
                    idCardapio,
                    req.session.usuario.id
                ]
            );

            if (cardapios.length === 0) {
                return res.status(404).send(
                    "Cardápio não encontrado."
                );
            }

            const [refeicoes] = await banco.execute(
                `SELECT
                    id_refeicao,
                    tipo
                 FROM refeicoes
                 WHERE id_cardapio = ?
                 ORDER BY id_refeicao`,
                [idCardapio]
            );

            return res.render(
                "nutricionista/refeicoesCardapio",
                {
                    titulo: "Refeições do cardápio",
                    usuario: req.session.usuario,
                    cardapio: cardapios[0],
                    refeicoes,
                    erro: null
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao carregar refeições:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar as refeições."
            );
        }
    };

exports.cadastrar = async (req, res) => {
        try {
            const idCardapio = req.params.id;
            const tipo = req.body.tipo?.trim();


            if (!tipo) {
                return res.redirect(
                    `/nutricionista/cardapios/${idCardapio}/refeicoes?erro=Informe o tipo da refeição`
                );
            }

            if (!TIPOS_REFEICAO.includes(tipo)) {
                return res.status(400).send(
                    "Tipo de refeição inválido."
                );
            }

            const [cardapios] = await banco.execute(
                `SELECT id_cardapio
                 FROM cardapios
                 WHERE id_cardapio = ?
                   AND id_nutricionista = ?`,
                [
                    idCardapio,
                    req.session.usuario.id
                ]
            );

            if (cardapios.length === 0) {
                return res.status(404).send(
                    "Cardápio não encontrado."
                );
            }

            await banco.execute(
                `INSERT INTO refeicoes (
                    id_cardapio,
                    tipo
                )
                VALUES (?, ?)`,
                [
                    idCardapio,
                    tipo
                ]
            );

            return res.redirect(
                `/nutricionista/cardapios/${idCardapio}/refeicoes`
            );
        } catch (erro) {
            console.error(
                "Erro ao cadastrar refeição:",
                erro
            );

            return res.status(500).send(
                "Não foi possível cadastrar a refeição."
            );
        }
    };

exports.mostrarEdicao = async (req, res) => {
        try {

            const idRefeicao = req.params.id;

            const [refeicoes] = await banco.execute(
                `SELECT
                    r.id_refeicao,
                    r.tipo,
                    r.id_cardapio
                 FROM refeicoes r
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE r.id_refeicao = ?
                 AND c.id_nutricionista = ?`,
                [
                    idRefeicao,
                    req.session.usuario.id
                ]
            );

            if (refeicoes.length === 0) {
                return res.status(404).send("Refeição não encontrada.");
            }

            res.render(
                "nutricionista/editarRefeicao",
                {
                    titulo: "Editar refeição",
                    usuario: req.session.usuario,
                    refeicao: refeicoes[0],
                    tiposRefeicao: TIPOS_REFEICAO,
                    erro: null
                }
            );

        } catch (erro) {

            console.error(erro);

            res.status(500).send(
                "Erro ao abrir edição."
            );

        }
    };

exports.editar = async (req, res) => {

        try {

            const idRefeicao = req.params.id;
            const tipo = req.body.tipo?.trim();

            if (!tipo || !TIPOS_REFEICAO.includes(tipo)) {
                return res.status(400).render(
                    "nutricionista/editarRefeicao",
                    {
                        titulo: "Editar refeição",
                        usuario: req.session.usuario,
                        refeicao: {
                            id_refeicao: idRefeicao,
                            id_cardapio: req.body.id_cardapio || "",
                            tipo: tipo || ""
                        },
                        tiposRefeicao: TIPOS_REFEICAO,
                        erro: "Selecione um tipo de refeição válido."
                    }
                );
            }

            const [refeicoes] = await banco.execute(
                `SELECT
                    r.id_cardapio
                 FROM refeicoes r
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE r.id_refeicao = ?
                 AND c.id_nutricionista = ?`,
                [
                    idRefeicao,
                    req.session.usuario.id
                ]
            );

            if (refeicoes.length === 0) {

                return res.status(404).send(
                    "Refeição não encontrada."
                );

            }

            await banco.execute(
                `UPDATE refeicoes
                 SET tipo=?
                 WHERE id_refeicao=?`,
                [
                    tipo,
                    idRefeicao
                ]
            );

            res.redirect(
                `/nutricionista/cardapios/${refeicoes[0].id_cardapio}/refeicoes`
            );

        } catch (erro) {

            console.error(erro);

            res.status(500).send(
                "Erro ao editar refeição."
            );

        }

    };

exports.excluir = async (req, res) => {
        const conexao = await banco.getConnection();

        try {
            const idRefeicao = req.params.id;
            const idNutricionista = req.session.usuario.id;

            await conexao.beginTransaction();

            // Confirma que a refeição pertence a um cardápio
            // do nutricionista logado
            const [refeicoes] = await conexao.execute(
                `SELECT
                    r.id_refeicao,
                    r.id_cardapio
                 FROM refeicoes r
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE r.id_refeicao = ?
                   AND c.id_nutricionista = ?`,
                [
                    idRefeicao,
                    idNutricionista
                ]
            );

            if (refeicoes.length === 0) {
                await conexao.rollback();

                return res
                    .status(404)
                    .send("Refeição não encontrada.");
            }

            const idCardapio = refeicoes[0].id_cardapio;

            // Apaga os alimentos ligados à refeição
            await conexao.execute(
                `DELETE FROM itens_refeicao
                 WHERE id_refeicao = ?`,
                [idRefeicao]
            );

            // Apaga a refeição
            const [resultado] = await conexao.execute(
                `DELETE FROM refeicoes
                 WHERE id_refeicao = ?`,
                [idRefeicao]
            );

            if (resultado.affectedRows === 0) {
                throw new Error("A refeição não foi excluída.");
            }

            await conexao.commit();

            return res.redirect(
                `/nutricionista/cardapios/${idCardapio}/refeicoes`
            );

        } catch (erro) {
            await conexao.rollback();

            console.error(
                "Erro ao excluir refeição:",
                erro
            );

            return res.status(500).send(
                "Não foi possível excluir a refeição."
            );

        } finally {
            conexao.release();
        }
    };
