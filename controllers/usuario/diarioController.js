const banco = require("../../config/database");

function dadosDiario(req) {
    return {
        alimento: req.body.alimento?.trim(),
        quantidade: req.body.quantidade?.trim(),
        observacoes: req.body.observacoes?.trim() || null
    };
}

function validarRegistro({ alimento, quantidade, observacoes }) {
    if (!alimento || !quantidade) {
        return "Preencha o alimento e a quantidade.";
    }

    if (alimento.length < 2 || alimento.length > 100) {
        return "O alimento deve ter entre 2 e 100 caracteres.";
    }

    if (quantidade.length > 50) {
        return "A quantidade deve ter no máximo 50 caracteres.";
    }

    if (observacoes && observacoes.length > 500) {
        return "As observações devem ter no máximo 500 caracteres.";
    }

    return null;
}

exports.listar = async (req, res) => {
    try {
        const idUsuario = req.session.usuario.id;

        const [registros] = await banco.execute(
            `SELECT
                id_diario,
                alimento,
                quantidade,
                observacoes,
                data_registro
             FROM diario_alimentar
             WHERE id_usuario = ?
             ORDER BY data_registro DESC`,
            [idUsuario]
        );

        const [grafico] = await banco.execute(
            `SELECT
                DATE(data_registro) AS dia,
                COUNT(*) AS total
             FROM diario_alimentar
             WHERE id_usuario = ?
               AND data_registro >= DATE_SUB(
                    CURDATE(),
                    INTERVAL 6 DAY
               )
             GROUP BY DATE(data_registro)
             ORDER BY dia`,
            [idUsuario]
        );

        return res.render("usuario/diario", {
            titulo: "Diário alimentar",
            usuario: req.session.usuario,
            registros,
            grafico,
            sucesso: req.query.sucesso || null,
            erro: null
        });
    } catch (erro) {
        console.error("Erro ao carregar diário:", erro);

        return res.status(500).send(
            "Não foi possível carregar o diário alimentar."
        );
    }
};

exports.mostrarCadastro = (req, res) => {
    return res.render("usuario/novoDiario", {
        titulo: "Novo registro",
        usuario: req.session.usuario,
        erro: null,
        sucesso: null,
        registro: {
            alimento: "",
            quantidade: "",
            observacoes: ""
        }
    });
};

exports.cadastrar = async (req, res) => {
    try {
        const usuario = req.session?.usuario;

        if (!usuario || usuario.tipo !== "usuario") {
            return res.redirect("/login");
        }

        const idUsuario = usuario.id;
        const registro = dadosDiario(req);
        const erroValidacao = validarRegistro(registro);

        if (erroValidacao) {
            return res.status(400).render(
                "usuario/novoDiario",
                {
                    titulo: "Novo registro",
                    usuario,
                    erro: erroValidacao,
                    sucesso: null,
                    registro
                }
            );
        }

        const [resultado] = await banco.execute(
            `INSERT INTO diario_alimentar (
        id_usuario,
        data,
        alimento,
        quantidade,
        observacoes
    )
    VALUES (?, CURDATE(), ?, ?, ?)`,
            [
                idUsuario,
                registro.alimento,
                registro.quantidade,
                registro.observacoes
            ]
        );

        console.log(
            "Diário cadastrado:",
            resultado.insertId
        );

        return res.redirect(
            "/usuario/diario?sucesso=" +
            encodeURIComponent(
                "Registro adicionado com sucesso"
            )
        );
    } catch (erro) {
        console.error(
            "ERRO COMPLETO AO SALVAR DIÁRIO:",
            erro
        );

        return res.status(500).render(
            "usuario/novoDiario",
            {
                titulo: "Novo registro",
                usuario: req.session?.usuario || null,
                erro:
                    "Não foi possível salvar o registro: " +
                    erro.message,
                sucesso: null,
                registro: dadosDiario(req)
            }
        );
    }
};

exports.mostrarEdicao = async (req, res) => {
    try {
        const idDiario = Number(req.params.id);
        const idUsuario = req.session.usuario.id;

        if (!Number.isInteger(idDiario) || idDiario <= 0) {
            return res.status(400).send(
                "Registro do diário inválido."
            );
        }

        const [[registro]] = await banco.execute(
            `SELECT
                id_diario,
                alimento,
                quantidade,
                observacoes,
                data_registro
             FROM diario_alimentar
             WHERE id_diario = ?
               AND id_usuario = ?`,
            [idDiario, idUsuario]
        );

        if (!registro) {
            return res.status(404).send(
                "Registro do diário não encontrado."
            );
        }

        return res.render("usuario/editarDiario", {
            titulo: "Editar registro",
            usuario: req.session.usuario,
            registro,
            erro: null
        });
    } catch (erro) {
        console.error(
            "Erro ao abrir edição do diário:",
            erro
        );

        return res.status(500).send(
            "Não foi possível abrir o registro."
        );
    }
};

exports.editar = async (req, res) => {
    try {
        const idDiario = Number(req.params.id);
        const idUsuario = req.session.usuario.id;
        const registro = dadosDiario(req);

        if (!Number.isInteger(idDiario) || idDiario <= 0) {
            return res.status(400).send(
                "Registro do diário inválido."
            );
        }

        const erroValidacao = validarRegistro(registro);

        if (erroValidacao) {
            return res.status(400).render(
                "usuario/editarDiario",
                {
                    titulo: "Editar registro",
                    usuario: req.session.usuario,
                    erro: erroValidacao,
                    registro: {
                        id_diario: idDiario,
                        ...registro
                    }
                }
            );
        }

        const [resultado] = await banco.execute(
            `UPDATE diario_alimentar
             SET
                alimento = ?,
                quantidade = ?,
                observacoes = ?
             WHERE id_diario = ?
               AND id_usuario = ?`,
            [
                registro.alimento,
                registro.quantidade,
                registro.observacoes,
                idDiario,
                idUsuario
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).send(
                "Registro do diário não encontrado."
            );
        }

        return res.redirect(
            "/usuario/diario?sucesso=Registro atualizado com sucesso"
        );
    } catch (erro) {
        console.error("Erro ao editar diário:", erro);

        return res.status(500).send(
            "Não foi possível editar o registro."
        );
    }
};

exports.excluir = async (req, res) => {
    try {
        const idDiario = Number(req.params.id);
        const idUsuario = req.session.usuario.id;

        if (!Number.isInteger(idDiario) || idDiario <= 0) {
            return res.status(400).send(
                "Registro do diário inválido."
            );
        }

        const [resultado] = await banco.execute(
            `DELETE FROM diario_alimentar
             WHERE id_diario = ?
               AND id_usuario = ?`,
            [idDiario, idUsuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(400).render(
                "usuario/novoDiario",
                {
                    titulo: "Novo registro",
                    usuario: req.session.usuario,
                    erro: erroValidacao,
                    sucesso: null,
                    registro
                }
            );
        }

        return res.redirect(
            "/usuario/diario?sucesso=Registro excluído com sucesso"
        );
    } catch (erro) {
        console.error("Erro ao excluir diário:", erro);

        return res.status(500).render(
            "usuario/novoDiario",
            {
                titulo: "Novo registro",
                usuario: req.session.usuario,
                erro: "Não foi possível salvar o registro.",
                sucesso: null,
                registro: dadosDiario(req)
            }
        );
    }
};