const banco = require("../../config/database");

exports.mostrarNovo = async (req, res) => {
        try {
            const [usuarios] = await banco.execute(
                `SELECT
        u.id_usuario,
        u.nome,
        u.email,
        u.foto
     FROM usuarios u
     INNER JOIN solicitacoes_nutricionista s
        ON s.id_usuario = u.id_usuario
     WHERE s.id_nutricionista = ?
       AND s.status = 'aceita'
     ORDER BY u.nome`,
                [
                    req.session.usuario.id
                ]
            );

            return res.render("nutricionista/novoCardapio", {
                titulo: "Novo cardápio",
                usuario: req.session.usuario,
                usuarios,
                erro: null
            });
        } catch (erro) {
            console.error("Erro ao buscar usuários:", erro);

            return res.status(500).send(
                "Não foi possível carregar os usuários."
            );
        }
    };

exports.listar = async (req, res) => {
        try {
            const [cardapios] = await banco.execute(
                `SELECT
                    c.id_cardapio,
                    c.nome,
                    c.observacoes,
                    c.id_usuario,
                    u.nome AS nome_usuario,
                    u.email AS email_usuario,
                    COUNT(DISTINCT r.id_refeicao) AS total_refeicoes
                 FROM cardapios c
                 INNER JOIN usuarios u
                    ON u.id_usuario = c.id_usuario
                 LEFT JOIN refeicoes r
                    ON r.id_cardapio = c.id_cardapio
                 WHERE c.id_nutricionista = ?
                 GROUP BY
                    c.id_cardapio,
                    c.nome,
                    c.observacoes,
                    c.id_usuario,
                    u.nome,
                    u.email
                 ORDER BY c.id_cardapio DESC`,
                [req.session.usuario.id]
            );

            return res.render(
                "nutricionista/cardapios",
                {
                    titulo: "Meus cardápios",
                    usuario: req.session.usuario,
                    cardapios,
                    erro: null,
                    sucesso: null
                }
            );
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

exports.cadastrar = async (req, res) => {
        try {
            const {
                id_usuario,
                nome,
                observacoes
            } = req.body;

            if (!id_usuario || !nome || nome.trim() === "") {
                const [usuarios] = await banco.execute(
                    `SELECT
        u.id_usuario,
        u.nome,
        u.email,
        u.foto
     FROM usuarios u
     INNER JOIN solicitacoes_nutricionista s
        ON s.id_usuario = u.id_usuario
     WHERE s.id_nutricionista = ?
       AND s.status = 'aceita'
     ORDER BY u.nome`,
                    [
                        req.session.usuario.id
                    ]
                );

                return res.status(400).render(
                    "nutricionista/novoCardapio",
                    {
                        titulo: "Novo cardápio",
                        usuario: req.session.usuario,
                        usuarios,
                        erro: "Selecione um usuário e informe o nome do cardápio."
                    }
                );
            }

            const [usuarioEncontrado] = await banco.execute(
                `SELECT s.id_usuario
     FROM solicitacoes_nutricionista s
     WHERE s.id_usuario = ?
       AND s.id_nutricionista = ?
       AND s.status = 'aceita'`,
                [
                    id_usuario,
                    req.session.usuario.id
                ]
            );

            if (usuarioEncontrado.length === 0) {
                return res.status(403).send(
                    "Esse usuário não pertence aos seus pacientes."
                );
            }
            const [cardapioExistente] = await banco.execute(
                `SELECT id_cardapio
     FROM cardapios
     WHERE LOWER(nome) = LOWER(?)
       AND id_nutricionista = ?
     LIMIT 1`,
                [
                    nome.trim(),
                    req.session.usuario.id
                ]
            );

            if (cardapioExistente.length > 0) {
                const [usuarios] = await banco.execute(
                    `SELECT
            u.id_usuario,
            u.nome,
            u.email,
            u.foto
         FROM usuarios u
         INNER JOIN solicitacoes_nutricionista s
            ON s.id_usuario = u.id_usuario
         WHERE s.id_nutricionista = ?
           AND s.status = 'aceita'
         ORDER BY u.nome`,
                    [req.session.usuario.id]
                );

                return res.status(400).render(
                    "nutricionista/novoCardapio",
                    {
                        titulo: "Novo cardápio",
                        usuario: req.session.usuario,
                        usuarios,
                        erro: "Você já possui um cardápio com esse nome."
                    }
                );
            }
            const [resultado] = await banco.execute(
                `INSERT INTO cardapios (
                    id_usuario,
                    id_nutricionista,
                    nome,
                    observacoes
                )
                VALUES (?, ?, ?, ?)`,
                [
                    id_usuario,
                    req.session.usuario.id,
                    nome.trim(),
                    observacoes?.trim() || null
                ]
            );

            return res.redirect(
                `/nutricionista/cardapios/${resultado.insertId}/refeicoes`
            );
        } catch (erro) {
            console.error("Erro ao criar cardápio:", erro);

            return res.status(500).send(
                "Não foi possível criar o cardápio."
            );
        }
    };

exports.mostrarEdicao = async (req, res) => {
        try {
            const idCardapio = req.params.id;
            const idNutricionista = req.session.usuario.id;

            const [cardapios] = await banco.execute(
                `SELECT
                    id_cardapio,
                    id_usuario,
                    nome,
                    observacoes
                 FROM cardapios
                 WHERE id_cardapio = ?
                   AND id_nutricionista = ?`,
                [
                    idCardapio,
                    idNutricionista
                ]
            );

            if (cardapios.length === 0) {
                return res.status(404).send(
                    "Cardápio não encontrado."
                );
            }

            const [usuarios] = await banco.execute(
                `SELECT
                    u.id_usuario,
                    u.nome,
                    u.email,
                    u.foto
                 FROM usuarios u
                 INNER JOIN solicitacoes_nutricionista s
                    ON s.id_usuario = u.id_usuario
                 WHERE s.id_nutricionista = ?
                   AND s.status = 'aceita'
                 ORDER BY u.nome`,
                [idNutricionista]
            );

            return res.render(
                "nutricionista/editarCardapio",
                {
                    titulo: "Editar cardápio",
                    usuario: req.session.usuario,
                    cardapio: cardapios[0],
                    usuarios,
                    erro: null
                }
            );

        } catch (erro) {
            console.error(
                "Erro ao abrir edição do cardápio:",
                erro
            );

            return res.status(500).send(
                "Não foi possível abrir a edição do cardápio."
            );
        }
    };

exports.editar = async (req, res) => {
        try {
            const idCardapio = req.params.id;
            const idNutricionista = req.session.usuario.id;

            const {
                id_usuario,
                nome,
                observacoes
            } = req.body;

            if (
                !id_usuario ||
                !nome ||
                nome.trim() === ""
            ) {
                const [cardapios] = await banco.execute(
                    `SELECT
                        id_cardapio,
                        id_usuario,
                        nome,
                        observacoes
                     FROM cardapios
                     WHERE id_cardapio = ?
                       AND id_nutricionista = ?`,
                    [
                        idCardapio,
                        idNutricionista
                    ]
                );

                const [usuarios] = await banco.execute(
                    `SELECT
                        u.id_usuario,
                        u.nome,
                        u.email,
                        u.foto
                     FROM usuarios u
                     INNER JOIN solicitacoes_nutricionista s
                        ON s.id_usuario = u.id_usuario
                     WHERE s.id_nutricionista = ?
                       AND s.status = 'aceita'
                     ORDER BY u.nome`,
                    [idNutricionista]
                );

                if (cardapios.length === 0) {
                    return res.status(404).send(
                        "Cardápio não encontrado."
                    );
                }

                return res.status(400).render(
                    "nutricionista/editarCardapio",
                    {
                        titulo: "Editar cardápio",
                        usuario: req.session.usuario,
                        cardapio: {
                            ...cardapios[0],
                            id_usuario,
                            nome,
                            observacoes
                        },
                        usuarios,
                        erro: "Selecione um paciente e informe o nome do cardápio."
                    }
                );
            }

            // Confirma que o cardápio pertence ao nutricionista
            const [cardapioEncontrado] = await banco.execute(
                `SELECT id_cardapio
                 FROM cardapios
                 WHERE id_cardapio = ?
                   AND id_nutricionista = ?`,
                [
                    idCardapio,
                    idNutricionista
                ]
            );

            if (cardapioEncontrado.length === 0) {
                return res.status(404).send(
                    "Cardápio não encontrado."
                );
            }

            // Confirma que o novo paciente pertence ao nutricionista
            const [usuarioEncontrado] = await banco.execute(
                `SELECT id_usuario
                 FROM solicitacoes_nutricionista
                 WHERE id_usuario = ?
                   AND id_nutricionista = ?
                   AND status = 'aceita'`,
                [
                    id_usuario,
                    idNutricionista
                ]
            );

            if (usuarioEncontrado.length === 0) {
                return res.status(403).send(
                    "Esse usuário não pertence aos seus pacientes."
                );
            }

            await banco.execute(
                `UPDATE cardapios
                 SET
                    id_usuario = ?,
                    nome = ?,
                    observacoes = ?
                 WHERE id_cardapio = ?
                   AND id_nutricionista = ?`,
                [
                    id_usuario,
                    nome.trim(),
                    observacoes?.trim() || null,
                    idCardapio,
                    idNutricionista
                ]
            );

            return res.redirect(
                `/nutricionista/cardapios/${idCardapio}/refeicoes`
            );

        } catch (erro) {
            console.error(
                "Erro ao editar cardápio:",
                erro
            );

            return res.status(500).send(
                "Não foi possível editar o cardápio."
            );
        }
    };

exports.excluir = async (req, res) => {
        try {

            const idCardapio = req.params.id;

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
                return res
                    .status(404)
                    .send("Cardápio não encontrado.");
            }

            // Busca todas as refeições
            const [refeicoes] = await banco.execute(
                `SELECT id_refeicao
                 FROM refeicoes
                 WHERE id_cardapio = ?`,
                [idCardapio]
            );

            // Remove os itens de cada refeição
            for (const refeicao of refeicoes) {

                await banco.execute(
                    `DELETE FROM itens_refeicao
                     WHERE id_refeicao = ?`,
                    [refeicao.id_refeicao]
                );

            }

            // Remove as refeições
            await banco.execute(
                `DELETE FROM refeicoes
                 WHERE id_cardapio = ?`,
                [idCardapio]
            );

            // Remove o cardápio
            await banco.execute(
                `DELETE FROM cardapios
                 WHERE id_cardapio = ?`,
                [idCardapio]
            );

            res.redirect("/nutricionista/home");

        } catch (erro) {

            console.error(
                "Erro ao excluir cardápio:",
                erro
            );

            res.status(500).send(
                "Não foi possível excluir o cardápio."
            );

        }
    };
