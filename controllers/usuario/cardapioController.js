const banco = require("../../config/database");

exports.mostrarCardapioAtual = async (req, res) => {
        try {

            const idUsuario = req.session.usuario.id;

            const [cardapios] = await banco.execute(
                `SELECT
                    c.id_cardapio,
                    c.nome,
                    c.observacoes,
                    n.nome AS nutricionista
                 FROM cardapios c
                 INNER JOIN nutricionistas n
                    ON n.id_nutricionista = c.id_nutricionista
                 WHERE c.id_usuario = ?`,
                [idUsuario]
            );

            if (cardapios.length === 0) {
                return res.render("usuario/cardapio", {
                    titulo: "Meu Cardápio",
                    usuario: req.session.usuario,
                    cardapio: null,
                    refeicoes: []
                });
            }

            const cardapio = cardapios[0];

            const [refeicoes] = await banco.execute(
                `SELECT
                    r.id_refeicao,
                    r.tipo
                 FROM refeicoes r
                 WHERE r.id_cardapio = ?`,
                [cardapio.id_cardapio]
            );

            for (const refeicao of refeicoes) {

                const [alimentos] = await banco.execute(
                    `SELECT
                        a.nome,
                        i.quantidade,
                        a.calorias,
                        a.proteinas,
                        a.carboidratos,
                        a.gorduras
                     FROM itens_refeicao i
                     INNER JOIN alimentos a
                        ON a.id_alimento = i.id_alimento
                     WHERE i.id_refeicao = ?`,
                    [refeicao.id_refeicao]
                );

                refeicao.alimentos = alimentos;
            }

            res.render("usuario/visualizarCardapio", {
                titulo: "Visualizar cardápio",
                usuario: req.session.usuario,
                cardapio,
                refeicoes
            });

        } catch (erro) {
            console.log(erro);
            res.send("Erro ao carregar o cardápio.");
        }
    };

exports.listarCardapios = async (req, res) => {
        try {
            const idUsuario = req.session.usuario.id;

            const [cardapios] = await banco.execute(
                `SELECT
                    c.id_cardapio,
                    c.nome,
                    c.observacoes,
                    n.nome AS nome_nutricionista
                 FROM cardapios c
                 INNER JOIN nutricionistas n
                    ON n.id_nutricionista = c.id_nutricionista
                 WHERE c.id_usuario = ?
                 ORDER BY c.id_cardapio DESC`,
                [idUsuario]
            );

            return res.render("usuario/cardapios", {
                titulo: "Meus cardápios",
                usuario: req.session.usuario,
                cardapios
            });
        } catch (erro) {
            console.error(
                "Erro ao carregar cardápios:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar os cardápios."
            );
        }
    };

exports.visualizarCardapio = async (req, res) => {
        try {
            const idCardapio = req.params.id;
            const idUsuario = req.session.usuario.id;

            const [[cardapio]] = await banco.execute(
                `SELECT
                    c.id_cardapio,
                    c.nome,
                    c.observacoes,
                    n.nome AS nome_nutricionista
                 FROM cardapios c
                 INNER JOIN nutricionistas n
                    ON n.id_nutricionista = c.id_nutricionista
                 WHERE c.id_cardapio = ?
                   AND c.id_usuario = ?`,
                [
                    idCardapio,
                    idUsuario
                ]
            );

            if (!cardapio) {
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

            for (const refeicao of refeicoes) {
                const [alimentos] = await banco.execute(
                    `SELECT
                        i.quantidade,
                        a.nome,
                        a.calorias,
                        a.proteinas,
                        a.carboidratos,
                        a.gorduras
                     FROM itens_refeicao i
                     INNER JOIN alimentos a
                        ON a.id_alimento = i.id_alimento
                     WHERE i.id_refeicao = ?
                     ORDER BY a.nome`,
                    [refeicao.id_refeicao]
                );

                refeicao.alimentos = alimentos;
            }

            return res.render(
                "usuario/visualizarCardapio",
                {
                    titulo: cardapio.nome,
                    usuario: req.session.usuario,
                    cardapio,
                    refeicoes
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao visualizar cardápio:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar o cardápio."
            );
        }
    };
