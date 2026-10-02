const banco = require("../../config/database");

exports.listarDaRefeicao = async (req, res) => {
        try {
            const idRefeicao = req.params.id;

            const [refeicoes] = await banco.execute(
                `SELECT
                    r.id_refeicao,
                    r.tipo,
                    r.id_cardapio,
                    c.nome AS nome_cardapio,
                    u.nome AS nome_usuario
                 FROM refeicoes r
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 INNER JOIN usuarios u
                    ON u.id_usuario = c.id_usuario
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

            const [alimentos] = await banco.execute(
                `SELECT
                    id_alimento,
                    nome,
                    calorias,
                    proteinas,
                    carboidratos,
                    gorduras
                 FROM alimentos
                 ORDER BY nome`
            );

            const [itens] = await banco.execute(
                `SELECT
                    i.id_item,
                    i.quantidade,
                    a.id_alimento,
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
                [idRefeicao]
            );

            return res.render(
                "nutricionista/alimentosRefeicao",
                {
                    titulo: "Alimentos da refeição",
                    usuario: req.session.usuario,
                    refeicao: refeicoes[0],
                    alimentos,
                    itens,
                    erro: null,
                    sucesso: req.query.sucesso || null
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao carregar alimentos:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar os alimentos."
            );
        }
    };

exports.adicionarExistente = async (req, res) => {
        try {
            const idRefeicao = req.params.id;
            const {
                id_alimento,
                quantidade
            } = req.body;

            if (!id_alimento || !quantidade?.trim()) {
                return res.redirect(
                    `/nutricionista/refeicoes/${idRefeicao}/alimentos`
                );
            }

            const [refeicoes] = await banco.execute(
                `SELECT r.id_refeicao
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

            const [alimentoEncontrado] = await banco.execute(
                `SELECT id_alimento
                 FROM alimentos
                 WHERE id_alimento = ?`,
                [id_alimento]
            );

            if (alimentoEncontrado.length === 0) {
                return res.status(404).send(
                    "Alimento não encontrado."
                );
            }

            const [itemExistente] = await banco.execute(
                `SELECT id_item
                 FROM itens_refeicao
                 WHERE id_refeicao = ?
                   AND id_alimento = ?`,
                [
                    idRefeicao,
                    id_alimento
                ]
            );

            if (itemExistente.length > 0) {
                await banco.execute(
                    `UPDATE itens_refeicao
                     SET quantidade = ?
                     WHERE id_item = ?`,
                    [
                        quantidade.trim(),
                        itemExistente[0].id_item
                    ]
                );
            } else {
                await banco.execute(
                    `INSERT INTO itens_refeicao (
                        id_refeicao,
                        id_alimento,
                        quantidade
                    )
                    VALUES (?, ?, ?)`,
                    [
                        idRefeicao,
                        id_alimento,
                        quantidade.trim()
                    ]
                );
            }

            return res.redirect(
                `/nutricionista/refeicoes/${idRefeicao}/alimentos?sucesso=Alimento adicionado com sucesso`
            );
        } catch (erro) {
            console.error(
                "Erro ao adicionar alimento:",
                erro
            );

            return res.status(500).send(
                "Não foi possível adicionar o alimento."
            );
        }
    };

exports.cadastrarEAdicionar = async (req, res) => {
        try {
            const idRefeicao = req.params.id;

            const {
                nome,
                quantidade,
                calorias,
                proteinas,
                carboidratos,
                gorduras
            } = req.body;

            const nomeLimpo = nome?.trim();
            const quantidadeLimpa = quantidade?.trim();

            function numeroValido(valor, minimo, maximo) {
                const numero = Number(valor);

                return (
                    valor !== "" &&
                    valor !== null &&
                    valor !== undefined &&
                    Number.isFinite(numero) &&
                    numero >= minimo &&
                    numero <= maximo
                );
            }

            if (!nomeLimpo) {
                return res.status(400).send(
                    "Informe o nome do alimento."
                );
            }

            if (!quantidadeLimpa) {
                return res.status(400).send(
                    "Informe a quantidade do alimento."
                );
            }

            if (!numeroValido(calorias, 0, 5000)) {
                return res.status(400).send(
                    "Informe uma quantidade válida de calorias."
                );
            }

            if (!numeroValido(proteinas, 0, 1000)) {
                return res.status(400).send(
                    "Informe uma quantidade válida de proteínas."
                );
            }

            if (!numeroValido(carboidratos, 0, 1000)) {
                return res.status(400).send(
                    "Informe uma quantidade válida de carboidratos."
                );
            }

            if (!numeroValido(gorduras, 0, 1000)) {
                return res.status(400).send(
                    "Informe uma quantidade válida de gorduras."
                );
            }


            const [refeicoes] = await banco.execute(
                `SELECT r.id_refeicao
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

            const [resultadoAlimento] = await banco.execute(
                `INSERT INTO alimentos (
                    nome,
                    calorias,
                    proteinas,
                    carboidratos,
                    gorduras
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    nomeLimpo,
                    Number(calorias),
                    Number(proteinas),
                    Number(carboidratos),
                    Number(gorduras)
                ]
            );

            await banco.execute(
                `INSERT INTO itens_refeicao (
                    id_refeicao,
                    id_alimento,
                    quantidade
                )
                VALUES (?, ?, ?)`,
                [
                    idRefeicao,
                    resultadoAlimento.insertId,
                    quantidadeLimpa
                ]
            );

            return res.redirect(
                `/nutricionista/refeicoes/${idRefeicao}/alimentos?sucesso=Novo alimento cadastrado`
            );
        } catch (erro) {
            console.error(
                "Erro ao cadastrar alimento:",
                erro
            );

            return res.status(500).send(
                "Não foi possível cadastrar o alimento."
            );
        }
    };

exports.editarQuantidade = async (req, res) => {
        try {
            const idItem = req.params.id;
            const { quantidade } = req.body;

            const [itens] = await banco.execute(
                `SELECT
                    i.id_item,
                    i.id_refeicao
                 FROM itens_refeicao i
                 INNER JOIN refeicoes r
                    ON r.id_refeicao = i.id_refeicao
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE i.id_item = ?
                   AND c.id_nutricionista = ?`,
                [
                    idItem,
                    req.session.usuario.id
                ]
            );

            if (itens.length === 0) {
                return res.status(404).send(
                    "Item não encontrado."
                );
            }

            if (!quantidade?.trim()) {
                return res.redirect(
                    `/nutricionista/refeicoes/${itens[0].id_refeicao}/alimentos`
                );
            }

            await banco.execute(
                `UPDATE itens_refeicao
                 SET quantidade = ?
                 WHERE id_item = ?`,
                [
                    quantidade.trim(),
                    idItem
                ]
            );

            return res.redirect(
                `/nutricionista/refeicoes/${itens[0].id_refeicao}/alimentos?sucesso=Quantidade atualizada`
            );
        } catch (erro) {
            console.error(
                "Erro ao editar quantidade:",
                erro
            );

            return res.status(500).send(
                "Não foi possível editar a quantidade."
            );
        }
    };

exports.removerItem = async (req, res) => {
        try {
            const idItem = req.params.id;

            const [itens] = await banco.execute(
                `SELECT
                    i.id_item,
                    i.id_refeicao
                 FROM itens_refeicao i
                 INNER JOIN refeicoes r
                    ON r.id_refeicao = i.id_refeicao
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE i.id_item = ?
                   AND c.id_nutricionista = ?`,
                [
                    idItem,
                    req.session.usuario.id
                ]
            );

            if (itens.length === 0) {
                return res.status(404).send(
                    "Item não encontrado."
                );
            }

            await banco.execute(
                `DELETE FROM itens_refeicao
                 WHERE id_item = ?`,
                [idItem]
            );

            return res.redirect(
                `/nutricionista/refeicoes/${itens[0].id_refeicao}/alimentos?sucesso=Alimento removido`
            );
        } catch (erro) {
            console.error(
                "Erro ao remover alimento:",
                erro
            );

            return res.status(500).send(
                "Não foi possível remover o alimento."
            );
        }
    };

exports.mostrarEdicao = async (req, res) => {

        try {

            const idAlimento = req.params.id;

            const [alimentos] = await banco.execute(
                `SELECT
                    a.id_alimento,
                    a.nome,
                    a.calorias,
                    a.proteinas,
                    a.carboidratos,
                    a.gorduras,
                    i.id_refeicao
                 FROM alimentos a
                 INNER JOIN itens_refeicao i
                    ON i.id_alimento = a.id_alimento
                 INNER JOIN refeicoes r
                    ON r.id_refeicao = i.id_refeicao
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE a.id_alimento = ?
                   AND c.id_nutricionista = ?`,
                [
                    idAlimento,
                    req.session.usuario.id
                ]
            );

            if (alimentos.length === 0) {
                return res
                    .status(404)
                    .send("Alimento não encontrado.");
            }

            res.render(
                "nutricionista/editarAlimento",
                {
                    titulo: "Editar alimento",
                    usuario: req.session.usuario,
                    alimento: alimentos[0]
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

            const idAlimento = req.params.id;

            const {
                nome,
                calorias,
                proteinas,
                carboidratos,
                gorduras
            } = req.body;

            const [alimentos] = await banco.execute(
                `SELECT
                    i.id_refeicao
                 FROM alimentos a
                 INNER JOIN itens_refeicao i
                    ON i.id_alimento = a.id_alimento
                 INNER JOIN refeicoes r
                    ON r.id_refeicao = i.id_refeicao
                 INNER JOIN cardapios c
                    ON c.id_cardapio = r.id_cardapio
                 WHERE a.id_alimento = ?
                   AND c.id_nutricionista = ?`,
                [
                    idAlimento,
                    req.session.usuario.id
                ]
            );

            if (alimentos.length === 0) {
                return res
                    .status(404)
                    .send("Alimento não encontrado.");
            }

            await banco.execute(
                `UPDATE alimentos
                 SET
                    nome=?,
                    calorias=?,
                    proteinas=?,
                    carboidratos=?,
                    gorduras=?
                 WHERE id_alimento=?`,
                [
                    nome.trim(),
                    Number(calorias),
                    Number(proteinas),
                    Number(carboidratos),
                    Number(gorduras),
                    idAlimento
                ]
            );

            res.redirect(
                `/nutricionista/refeicoes/${alimentos[0].id_refeicao}/alimentos`
            );

        } catch (erro) {

            console.error(erro);

            res.status(500).send(
                "Erro ao editar alimento."
            );

        }

    };
