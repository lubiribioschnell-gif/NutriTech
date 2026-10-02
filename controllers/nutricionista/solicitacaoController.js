const banco = require("../../config/database");

exports.listar = async (req, res) => {

        try {

            const idNutricionista = req.session.usuario.id;

            const [solicitacoes] = await banco.execute(
                `SELECT
                    s.id_solicitacao,
                    s.data_solicitacao,
                    u.id_usuario,
                    u.nome,
                    u.email,
                    u.foto
                 FROM solicitacoes_nutricionista s
                 INNER JOIN usuarios u
                    ON u.id_usuario = s.id_usuario
                 WHERE s.id_nutricionista = ?
                   AND s.status = 'pendente'
                 ORDER BY s.data_solicitacao`,
                [idNutricionista]
            );

            res.render(
                "nutricionista/solicitacoes",
                {
                    titulo: "Solicitações",
                    usuario: req.session.usuario,
                    solicitacoes
                }
            );

        } catch (erro) {

            console.log(erro);

            res.send("Erro ao carregar solicitações.");

        }

    };

exports.aceitar = async (req, res) => {

        try {

            await banco.execute(
                `UPDATE solicitacoes_nutricionista
                 SET
                    status='aceita',
                    data_resposta=NOW()
                 WHERE
                    id_solicitacao=?
                 AND
                    id_nutricionista=?`,
                [
                    req.params.id,
                    req.session.usuario.id
                ]
            );

            res.redirect("/nutricionista/solicitacoes");

        } catch (erro) {

            console.log(erro);

            res.send("Erro.");

        }

    };

exports.recusar = async (req, res) => {

        try {

            await banco.execute(
                `UPDATE solicitacoes_nutricionista
                 SET
                    status='recusada',
                    data_resposta=NOW()
                 WHERE
                    id_solicitacao=?
                 AND
                    id_nutricionista=?`,
                [
                    req.params.id,
                    req.session.usuario.id
                ]
            );

            res.redirect("/nutricionista/solicitacoes");

        } catch (erro) {

            console.log(erro);

            res.send("Erro.");

        }

    };
