const banco = require("../../config/database");

exports.listarNutricionistas = async (req, res) => {
        try {
            const idUsuario = req.session.usuario.id;

            const [[solicitacaoAtual]] = await banco.execute(
                `SELECT
                    s.id_solicitacao,
                    s.id_nutricionista,
                    s.status,
                    s.data_solicitacao,
                    n.nome AS nutricionista_nome,
                    n.email AS nutricionista_email,
                    n.foto AS nutricionista_foto
                 FROM solicitacoes_nutricionista s
                 INNER JOIN nutricionistas n
                    ON n.id_nutricionista = s.id_nutricionista
                 WHERE s.id_usuario = ?
                   AND s.status IN ('pendente', 'aceita')
                 ORDER BY s.id_solicitacao DESC
                 LIMIT 1`,
                [idUsuario]
            );

            const [nutricionistas] = await banco.execute(
                `SELECT
                    id_nutricionista,
                    nome,
                    email,
                    foto
                 FROM nutricionistas
                 ORDER BY nome`
            );

            return res.render("usuario/nutricionistas", {
                titulo: "Escolher Nutricionista",
                usuario: req.session.usuario,
                nutricionistas,
                solicitacaoAtual: solicitacaoAtual || null
            });

        } catch (erro) {
            console.error("Erro ao carregar nutricionistas:", erro);

            return res.status(500).send(
                "Não foi possível carregar os nutricionistas."
            );
        }
    };

exports.visualizarNutricionista = async (req, res) => {
        try {
            const idNutricionista = Number(req.params.id);

            if (!Number.isInteger(idNutricionista)) {
                return res.status(400).send(
                    "Nutricionista inválido."
                );
            }

            const [[nutricionista]] = await banco.execute(
                `SELECT
                    id_nutricionista,
                    nome,
                    email,
                    foto,
                    certificado,
                    crn,
                    sexo,
                    data_nascimento,
                    descricao
                 FROM nutricionistas
                 WHERE id_nutricionista = ?`,
                [idNutricionista]
            );

            if (!nutricionista) {
                return res.status(404).send(
                    "Nutricionista não encontrado."
                );
            }

            return res.render(
                "usuario/visualizarNutricionista",
                {
                    titulo: nutricionista.nome,
                    usuario: req.session.usuario,
                    nutricionista
                }
            );

        } catch (erro) {
            console.error(
                "Erro ao visualizar nutricionista:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar o nutricionista."
            );
        }
    };

exports.solicitarAcompanhamento = async (req, res) => {
        try {
            const idUsuario = req.session.usuario.id;
            const idNutricionista = Number(req.params.id);

            if (!Number.isInteger(idNutricionista)) {
                return res.status(400).send(
                    "Nutricionista inválido."
                );
            }

            const [[nutricionista]] = await banco.execute(
                `SELECT id_nutricionista
                 FROM nutricionistas
                 WHERE id_nutricionista = ?`,
                [idNutricionista]
            );

            if (!nutricionista) {
                return res.status(404).send(
                    "Nutricionista não encontrado."
                );
            }

            const [[solicitacaoAtiva]] = await banco.execute(
                `SELECT id_solicitacao, status
                 FROM solicitacoes_nutricionista
                 WHERE id_usuario = ?
                   AND status IN ('pendente', 'aceita')
                 LIMIT 1`,
                [idUsuario]
            );

            if (solicitacaoAtiva) {
                return res.status(400).send(
                    solicitacaoAtiva.status === "aceita"
                        ? "Você já possui um nutricionista."
                        : "Você já possui uma solicitação pendente."
                );
            }

            await banco.execute(
                `INSERT INTO solicitacoes_nutricionista (
                    id_usuario,
                    id_nutricionista,
                    status
                 )
                 VALUES (?, ?, 'pendente')`,
                [idUsuario, idNutricionista]
            );

            return res.redirect("/usuario/nutricionistas");

        } catch (erro) {
            console.error("Erro ao enviar solicitação:", erro);

            return res.status(500).send(
                "Não foi possível enviar a solicitação."
            );
        }
    };

exports.cancelarSolicitacao = async (req, res) => {
        try {
            const idUsuario = req.session.usuario.id;
            const idSolicitacao = Number(req.params.id);

            if (!Number.isInteger(idSolicitacao)) {
                return res.status(400).send(
                    "Solicitação inválida."
                );
            }

            const [resultado] = await banco.execute(
                `UPDATE solicitacoes_nutricionista
                 SET
                    status = 'cancelada',
                    data_resposta = CURRENT_TIMESTAMP
                 WHERE id_solicitacao = ?
                   AND id_usuario = ?
                   AND status = 'pendente'`,
                [idSolicitacao, idUsuario]
            );

            if (resultado.affectedRows === 0) {
                return res.status(400).send(
                    "Essa solicitação não pode ser cancelada."
                );
            }

            return res.redirect("/usuario/nutricionistas");

        } catch (erro) {
            console.error("Erro ao cancelar solicitação:", erro);

            return res.status(500).send(
                "Não foi possível cancelar a solicitação."
            );
        }
    };

async function garantirStatusEncerrada() {
    const [[coluna]] = await banco.execute(
        `SELECT COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'solicitacoes_nutricionista'
           AND COLUMN_NAME = 'status'`
    );

    if (!coluna || !String(coluna.COLUMN_TYPE).toLowerCase().startsWith('enum(')) {
        return;
    }

    const tipo = String(coluna.COLUMN_TYPE);
    if (tipo.toLowerCase().includes("'encerrada'")) return;

    const valores = [...tipo.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
    valores.push('encerrada');
    const enumSql = valores.map(v => `'${v.replace(/'/g, "\\'")}'`).join(',');
    const nullable = String(coluna.IS_NULLABLE).toUpperCase() === 'YES' ? 'NULL' : 'NOT NULL';
    const defaultSql = coluna.COLUMN_DEFAULT === null ? '' : ` DEFAULT '${String(coluna.COLUMN_DEFAULT).replace(/'/g, "\\'")}'`;

    await banco.execute(
        `ALTER TABLE solicitacoes_nutricionista MODIFY COLUMN status ENUM(${enumSql}) ${nullable}${defaultSql}`
    );
}

exports.encerrarAcompanhamento = async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id;
        const idSolicitacao = Number(req.params.id);

        if (!Number.isInteger(idSolicitacao) || idSolicitacao <= 0) {
            return res.status(400).send("Acompanhamento inválido.");
        }

        await garantirStatusEncerrada();

        const [resultado] = await banco.execute(
            `UPDATE solicitacoes_nutricionista
             SET status = 'encerrada', data_resposta = CURRENT_TIMESTAMP
             WHERE id_solicitacao = ?
               AND id_usuario = ?
               AND status = 'aceita'`,
            [idSolicitacao, idUsuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).send(
                "Acompanhamento ativo não encontrado."
            );
        }

        return res.redirect("/usuario/nutricionistas");
    } catch (erro) {
        console.error("Erro ao encerrar acompanhamento:", erro);
        return res.status(500).send(
            "Não foi possível encerrar o acompanhamento."
        );
    }
};
