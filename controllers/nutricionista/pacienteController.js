const banco = require("../../config/database");

exports.listar = async (req, res) => {
    try {
        const idNutricionista = req.session.usuario.id;

        const [pacientes] = await banco.query(
            `
            SELECT
                u.id_usuario,
                u.nome,
                u.email,
                u.foto,
                u.data_nascimento,
                u.sexo,
                u.altura,
                u.peso,
                s.data_resposta
            FROM solicitacoes_nutricionista AS s
            INNER JOIN usuarios AS u
                ON u.id_usuario = s.id_usuario
            WHERE s.id_nutricionista = ?
              AND s.status = 'aceita'
            ORDER BY u.nome ASC
            `,
            [idNutricionista]
        );

        res.render("nutricionista/pacientes", {
            titulo: "Meus pacientes",
            usuario: req.session.usuario,
            pacientes
        });
    } catch (erro) {
        console.error("Erro ao carregar pacientes:", erro);

        res.status(500).send(
            "Não foi possível carregar os pacientes."
        );
    }
};

exports.visualizarDiario = async (req, res) => {
    try {
        const idNutricionista = req.session.usuario.id;
        const idUsuario = req.params.idUsuario;

        const [relacao] = await banco.query(
            `
            SELECT id_solicitacao
            FROM solicitacoes_nutricionista
            WHERE id_usuario = ?
              AND id_nutricionista = ?
              AND status = 'aceita'
            `,
            [idUsuario, idNutricionista]
        );

        if (relacao.length === 0) {
            return res.status(403).send("Paciente não autorizado.");
        }

        const [pacientes] = await banco.query(
            `
            SELECT
                id_usuario,
                nome,
                email
            FROM usuarios
            WHERE id_usuario = ?
            `,
            [idUsuario]
        );

        if (pacientes.length === 0) {
            return res.status(404).send("Paciente não encontrado.");
        }

        const [registros] = await banco.query(
            `
            SELECT
                id_diario,
                alimento,
                quantidade,
                observacoes,
                data_registro
            FROM diario_alimentar
            WHERE id_usuario = ?
            ORDER BY data_registro DESC
            `,
            [idUsuario]
        );

        const [grafico] = await banco.query(
            `
    SELECT
        DATE(data_registro) AS dia,
        COUNT(*) AS total
    FROM diario_alimentar
    WHERE id_usuario = ?
      AND data_registro >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(data_registro)
    ORDER BY dia
    `,
            [idUsuario]
        );

        res.render("nutricionista/diarioPaciente", {
            titulo: "Diário Alimentar",
            usuario: req.session.usuario,
            paciente: pacientes[0],
            registros: registros,
            grafico: grafico
        });

    } catch (erro) {
        console.error("Erro ao carregar diário:", erro);
        res.status(500).send("Erro ao carregar diário.");
    }
};
