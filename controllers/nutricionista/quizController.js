const banco = require("../../config/database");

exports.mostrarNovo = async (req, res) => {
        try {
            const [usuarios] = await banco.execute(
                `SELECT
        u.id_usuario,
        u.nome,
        u.email
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

            return res.render("nutricionista/novoQuiz", {
                titulo: "Novo Quiz",
                usuario: req.session.usuario,
                usuarios
            });
        } catch (erro) {
            console.error("Erro ao abrir formulário de quiz:", erro);

            return res.status(500).send(
                "Não foi possível abrir o formulário."
            );
        }
    };

exports.cadastrar = async (req, res) => {
        try {
            const {
                id_usuario,
                titulo,
                descricao
            } = req.body;

            if (!id_usuario || !titulo) {
                return res.status(400).send(
                    "Usuário e título são obrigatórios."
                );
            }

            const [[usuarioValido]] = await banco.execute(
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

            if (!usuarioValido) {
                return res.status(403).send(
                    "Esse usuário não pertence aos seus pacientes."
                );
            }

            const [resultado] = await banco.execute(
                `INSERT INTO quizzes (
                    id_nutricionista,
                    id_usuario,
                    titulo,
                    descricao
                )
                VALUES (?, ?, ?, ?)`,
                [
                    req.session.usuario.id,
                    id_usuario,
                    titulo.trim(),
                    descricao?.trim() || null
                ]
            );

            return res.redirect(
                `/nutricionista/quizzes/${resultado.insertId}/perguntas`
            );
        } catch (erro) {
            console.error("Erro ao criar quiz:", erro);

            return res.status(500).send(
                "Não foi possível criar o quiz."
            );
        }
    };

exports.listarPerguntas = async (req, res) => {

        try {

            const idQuiz = req.params.id;

            const [[quiz]] = await banco.execute(
                `SELECT *
     FROM quizzes
     WHERE id_quiz = ?
       AND id_nutricionista = ?`,
                [
                    idQuiz,
                    req.session.usuario.id
                ]
            );

            if (!quiz) {
                return res.status(404).send("Quiz não encontrado.");
            }

            const [perguntas] = await banco.execute(
                `SELECT *
                 FROM perguntas
                 WHERE id_quiz = ?`,
                [idQuiz]
            );

            res.render(
                "nutricionista/perguntasQuiz",
                {
                    titulo: "Perguntas do Quiz",
                    usuario: req.session.usuario,
                    quiz,
                    perguntas
                }
            );

        } catch (erro) {

            console.log(erro);

            res.send("Erro.");

        }

    };

exports.cadastrarPergunta = async (req, res) => {
        const conexao = await banco.getConnection();

        try {
            const idQuiz = req.params.id;

            const {
                enunciado,
                alternativa1,
                alternativa2,
                alternativa3,
                alternativa4,
                correta
            } = req.body;

            if (
                !enunciado?.trim() ||
                !alternativa1?.trim() ||
                !alternativa2?.trim() ||
                !alternativa3?.trim() ||
                !alternativa4?.trim() ||
                !["1", "2", "3", "4"].includes(String(correta))
            ) {
                return res.status(400).send(
                    "Preencha a pergunta, todas as alternativas e a resposta correta."
                );
            }

            await conexao.beginTransaction();

            const [quizzes] = await conexao.execute(
                `SELECT id_quiz
                 FROM quizzes
                 WHERE id_quiz = ?
                   AND id_nutricionista = ?`,
                [
                    idQuiz,
                    req.session.usuario.id
                ]
            );

            if (quizzes.length === 0) {
                await conexao.rollback();

                return res.status(404).send(
                    "Quiz não encontrado."
                );
            }

            const [resultadoPergunta] = await conexao.execute(
                `INSERT INTO perguntas (
                    id_quiz,
                    enunciado
                 )
                 VALUES (?, ?)`,
                [
                    idQuiz,
                    enunciado.trim()
                ]
            );

            const idPergunta = resultadoPergunta.insertId;

            const alternativas = [
                alternativa1.trim(),
                alternativa2.trim(),
                alternativa3.trim(),
                alternativa4.trim()
            ];

            for (let indice = 0; indice < alternativas.length; indice++) {
                await conexao.execute(
                    `INSERT INTO alternativas (
                        id_pergunta,
                        texto,
                        correta
                     )
                     VALUES (?, ?, ?)`,
                    [
                        idPergunta,
                        alternativas[indice],
                        Number(correta) === indice + 1
                    ]
                );
            }

            await conexao.commit();

            return res.redirect(
                `/nutricionista/quizzes/${idQuiz}/perguntas`
            );
        } catch (erro) {
            await conexao.rollback();

            console.error("Erro ao cadastrar pergunta:", erro);

            return res.status(500).send(
                "Não foi possível cadastrar a pergunta."
            );
        } finally {
            conexao.release();
        }
    };

exports.listar = async (req, res) => {
        try {
            const idNutricionista = req.session.usuario.id;

            const [quizzes] = await banco.execute(
                `SELECT
                    q.id_quiz,
                    q.titulo,
                    q.descricao,
                    q.id_usuario,
                    u.nome AS nome_usuario,
                    COUNT(DISTINCT p.id_pergunta) AS total_perguntas
                 FROM quizzes q
                 INNER JOIN usuarios u
                    ON u.id_usuario = q.id_usuario
                 LEFT JOIN perguntas p
                    ON p.id_quiz = q.id_quiz
                 WHERE q.id_nutricionista = ?
                 GROUP BY
                    q.id_quiz,
                    q.titulo,
                    q.descricao,
                    q.id_usuario,
                    u.nome
                 ORDER BY q.id_quiz DESC`,
                [idNutricionista]
            );

            return res.render("nutricionista/quizzes", {
                titulo: "Meus quizzes",
                usuario: req.session.usuario,
                quizzes,
                sucesso: req.query.sucesso || null
            });
        } catch (erro) {
            console.error("Erro ao carregar quizzes:", erro);

            return res.status(500).send(
                "Não foi possível carregar os quizzes."
            );
        }
    };

exports.mostrarEdicao = async (req, res) => {
        try {
            const idQuiz = req.params.id;
            const idNutricionista = req.session.usuario.id;

            const [quizzes] = await banco.execute(
                `SELECT
                    id_quiz,
                    id_usuario,
                    titulo,
                    descricao
                 FROM quizzes
                 WHERE id_quiz = ?
                   AND id_nutricionista = ?`,
                [
                    idQuiz,
                    idNutricionista
                ]
            );

            if (quizzes.length === 0) {
                return res.status(404).send(
                    "Quiz não encontrado."
                );
            }

            const [usuarios] = await banco.execute(
                `SELECT
                    u.id_usuario,
                    u.nome,
                    u.email
                 FROM usuarios u
                 INNER JOIN solicitacoes_nutricionista s
                    ON s.id_usuario = u.id_usuario
                 WHERE s.id_nutricionista = ?
                   AND s.status = 'aceita'
                 ORDER BY u.nome`,
                [idNutricionista]
            );

            return res.render(
                "nutricionista/editarQuiz",
                {
                    titulo: "Editar quiz",
                    usuario: req.session.usuario,
                    quiz: quizzes[0],
                    usuarios,
                    erro: null
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao abrir edição do quiz:",
                erro
            );

            return res.status(500).send(
                "Não foi possível abrir a edição do quiz."
            );
        }
    };

exports.editar = async (req, res) => {
        try {
            const idQuiz = req.params.id;
            const idNutricionista = req.session.usuario.id;

            const {
                id_usuario,
                titulo,
                descricao
            } = req.body;

            if (
                !id_usuario ||
                !titulo?.trim()
            ) {
                return res.status(400).send(
                    "Selecione um paciente e informe o título."
                );
            }

            const [quizEncontrado] = await banco.execute(
                `SELECT id_quiz
                 FROM quizzes
                 WHERE id_quiz = ?
                   AND id_nutricionista = ?`,
                [
                    idQuiz,
                    idNutricionista
                ]
            );

            if (quizEncontrado.length === 0) {
                return res.status(404).send(
                    "Quiz não encontrado."
                );
            }

            const [pacienteEncontrado] = await banco.execute(
                `SELECT id_solicitacao
                 FROM solicitacoes_nutricionista
                 WHERE id_usuario = ?
                   AND id_nutricionista = ?
                   AND status = 'aceita'`,
                [
                    id_usuario,
                    idNutricionista
                ]
            );

            if (pacienteEncontrado.length === 0) {
                return res.status(403).send(
                    "Esse usuário não pertence aos seus pacientes."
                );
            }

            await banco.execute(
                `UPDATE quizzes
                 SET
                    id_usuario = ?,
                    titulo = ?,
                    descricao = ?
                 WHERE id_quiz = ?
                   AND id_nutricionista = ?`,
                [
                    id_usuario,
                    titulo.trim(),
                    descricao?.trim() || null,
                    idQuiz,
                    idNutricionista
                ]
            );

            return res.redirect(
                "/nutricionista/quizzes?sucesso=Quiz atualizado com sucesso"
            );
        } catch (erro) {
            console.error("Erro ao editar quiz:", erro);

            return res.status(500).send(
                "Não foi possível editar o quiz."
            );
        }
    };

exports.excluir = async (req, res) => {
        const conexao = await banco.getConnection();

        try {
            const idQuiz = req.params.id;
            const idNutricionista = req.session.usuario.id;

            await conexao.beginTransaction();

            // Verifica se o quiz pertence ao nutricionista logado
            const [quizzes] = await conexao.execute(
                `SELECT id_quiz
                 FROM quizzes
                 WHERE id_quiz = ?
                   AND id_nutricionista = ?`,
                [
                    idQuiz,
                    idNutricionista
                ]
            );

            if (quizzes.length === 0) {
                await conexao.rollback();

                return res.status(404).send(
                    "Quiz não encontrado."
                );
            }

            // Busca as perguntas do quiz
            const [perguntas] = await conexao.execute(
                `SELECT id_pergunta
                 FROM perguntas
                 WHERE id_quiz = ?`,
                [idQuiz]
            );

            // Exclui as alternativas de cada pergunta
            for (const pergunta of perguntas) {
                await conexao.execute(
                    `DELETE FROM alternativas
                     WHERE id_pergunta = ?`,
                    [pergunta.id_pergunta]
                );
            }

            // Exclui as perguntas
            await conexao.execute(
                `DELETE FROM perguntas
                 WHERE id_quiz = ?`,
                [idQuiz]
            );

            // Exclui o quiz
            const [resultado] = await conexao.execute(
                `DELETE FROM quizzes
                 WHERE id_quiz = ?
                   AND id_nutricionista = ?`,
                [
                    idQuiz,
                    idNutricionista
                ]
            );

            if (resultado.affectedRows === 0) {
                throw new Error("O quiz não foi excluído.");
            }

            await conexao.commit();

            return res.redirect(
                "/nutricionista/quizzes?sucesso=Quiz excluído com sucesso"
            );
        } catch (erro) {
            await conexao.rollback();

            console.error(
                "Erro ao excluir quiz:",
                erro
            );

            return res.status(500).send(
                "Não foi possível excluir o quiz."
            );
        } finally {
            conexao.release();
        }
    };

exports.mostrarEditarPergunta = async (req, res) => {
        try {
            const idPergunta = req.params.id;
            const idNutricionista = req.session.usuario.id;

            const [perguntas] = await banco.execute(
                `SELECT
                    p.id_pergunta,
                    p.id_quiz,
                    p.enunciado,
                    q.titulo AS titulo_quiz
                 FROM perguntas p
                 INNER JOIN quizzes q
                    ON q.id_quiz = p.id_quiz
                 WHERE p.id_pergunta = ?
                   AND q.id_nutricionista = ?`,
                [
                    idPergunta,
                    idNutricionista
                ]
            );

            if (perguntas.length === 0) {
                return res.status(404).send(
                    "Pergunta não encontrada."
                );
            }

            const [alternativas] = await banco.execute(
                `SELECT
                    id_alternativa,
                    texto,
                    correta
                 FROM alternativas
                 WHERE id_pergunta = ?
                 ORDER BY id_alternativa`,
                [idPergunta]
            );

            if (alternativas.length !== 4) {
                return res.status(400).send(
                    "Esta pergunta não possui quatro alternativas."
                );
            }

            return res.render(
                "nutricionista/editarPergunta",
                {
                    titulo: "Editar pergunta",
                    usuario: req.session.usuario,
                    pergunta: perguntas[0],
                    alternativas,
                    erro: null
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao abrir edição da pergunta:",
                erro
            );

            return res.status(500).send(
                "Não foi possível abrir a edição da pergunta."
            );
        }
    };

exports.editarPergunta = async (req, res) => {
        const conexao = await banco.getConnection();

        try {
            const idPergunta = req.params.id;
            const idNutricionista = req.session.usuario.id;

            const {
                enunciado,
                alternativa1,
                alternativa2,
                alternativa3,
                alternativa4,
                correta
            } = req.body;

            if (
                !enunciado?.trim() ||
                !alternativa1?.trim() ||
                !alternativa2?.trim() ||
                !alternativa3?.trim() ||
                !alternativa4?.trim() ||
                !["1", "2", "3", "4"].includes(String(correta))
            ) {
                return res.status(400).send(
                    "Preencha todos os campos corretamente."
                );
            }

            await conexao.beginTransaction();

            const [perguntas] = await conexao.execute(
                `SELECT
                    p.id_quiz
                 FROM perguntas p
                 INNER JOIN quizzes q
                    ON q.id_quiz = p.id_quiz
                 WHERE p.id_pergunta = ?
                   AND q.id_nutricionista = ?`,
                [
                    idPergunta,
                    idNutricionista
                ]
            );

            if (perguntas.length === 0) {
                await conexao.rollback();

                return res.status(404).send(
                    "Pergunta não encontrada."
                );
            }

            const idQuiz = perguntas[0].id_quiz;

            const [alternativasBanco] = await conexao.execute(
                `SELECT id_alternativa
                 FROM alternativas
                 WHERE id_pergunta = ?
                 ORDER BY id_alternativa`,
                [idPergunta]
            );

            if (alternativasBanco.length !== 4) {
                await conexao.rollback();

                return res.status(400).send(
                    "Esta pergunta não possui quatro alternativas."
                );
            }

            await conexao.execute(
                `UPDATE perguntas
                 SET enunciado = ?
                 WHERE id_pergunta = ?`,
                [
                    enunciado.trim(),
                    idPergunta
                ]
            );

            const textosAlternativas = [
                alternativa1.trim(),
                alternativa2.trim(),
                alternativa3.trim(),
                alternativa4.trim()
            ];

            for (
                let indice = 0;
                indice < alternativasBanco.length;
                indice++
            ) {
                await conexao.execute(
                    `UPDATE alternativas
                     SET
                        texto = ?,
                        correta = ?
                     WHERE id_alternativa = ?`,
                    [
                        textosAlternativas[indice],
                        Number(correta) === indice + 1,
                        alternativasBanco[indice].id_alternativa
                    ]
                );
            }

            await conexao.commit();

            return res.redirect(
                `/nutricionista/quizzes/${idQuiz}/perguntas`
            );
        } catch (erro) {
            await conexao.rollback();

            console.error(
                "Erro ao editar pergunta:",
                erro
            );

            return res.status(500).send(
                "Não foi possível editar a pergunta."
            );
        } finally {
            conexao.release();
        }
    };

exports.excluirPergunta = async (req, res) => {
        const conexao = await banco.getConnection();

        try {
            const idPergunta = req.params.id;
            const idNutricionista = req.session.usuario.id;

            await conexao.beginTransaction();

            const [perguntas] = await conexao.execute(
                `SELECT
                    p.id_quiz
                 FROM perguntas p
                 INNER JOIN quizzes q
                    ON q.id_quiz = p.id_quiz
                 WHERE p.id_pergunta = ?
                   AND q.id_nutricionista = ?`,
                [
                    idPergunta,
                    idNutricionista
                ]
            );

            if (perguntas.length === 0) {
                await conexao.rollback();

                return res.status(404).send(
                    "Pergunta não encontrada."
                );
            }

            const idQuiz = perguntas[0].id_quiz;

            /*
             * Caso respostas estejam ligadas à alternativa,
             * elas devem ser excluídas antes das alternativas.
             */

            await conexao.execute(
                `DELETE FROM alternativas
                 WHERE id_pergunta = ?`,
                [idPergunta]
            );

            const [resultado] = await conexao.execute(
                `DELETE FROM perguntas
                 WHERE id_pergunta = ?`,
                [idPergunta]
            );

            if (resultado.affectedRows === 0) {
                throw new Error(
                    "A pergunta não foi excluída."
                );
            }

            await conexao.commit();

            return res.redirect(
                `/nutricionista/quizzes/${idQuiz}/perguntas`
            );
        } catch (erro) {
            await conexao.rollback();

            console.error(
                "Erro ao excluir pergunta:",
                erro
            );

            return res.status(500).send(
                "Não foi possível excluir a pergunta."
            );
        } finally {
            conexao.release();
        }
    };

exports.estatisticas = async (req, res) => {
        try {
            const idQuiz = req.params.id;
            const idNutricionista = req.session.usuario.id;

            // Verifica se o quiz pertence ao nutricionista
            const [quizzes] = await banco.execute(
                `SELECT
                    q.id_quiz,
                    q.titulo,
                    q.descricao,
                    u.nome AS nome_usuario
                 FROM quizzes q
                 INNER JOIN usuarios u
                    ON u.id_usuario = q.id_usuario
                 WHERE q.id_quiz = ?
                   AND q.id_nutricionista = ?`,
                [
                    idQuiz,
                    idNutricionista
                ]
            );

            if (quizzes.length === 0) {
                return res.status(404).send(
                    "Quiz não encontrado."
                );
            }

            const quiz = quizzes[0];

            const [estatisticasGerais] = await banco.execute(
                `SELECT
        COUNT(*) AS total_tentativas,
        COALESCE(AVG(pontuacao), 0) AS media_pontuacao,
        COALESCE(MAX(pontuacao), 0) AS maior_pontuacao,
        COALESCE(MIN(pontuacao), 0) AS menor_pontuacao,
        COALESCE(AVG(total_perguntas), 0) AS media_total_perguntas,
        MAX(data_resposta) AS ultima_resposta
     FROM tentativas_quiz
     WHERE id_quiz = ?`,
                [idQuiz]
            );

            const [tentativas] = await banco.execute(
                `SELECT
        t.id_tentativa,
        t.pontuacao,
        t.total_perguntas,
        t.data_resposta,
        u.nome AS nome_usuario,
        u.email
     FROM tentativas_quiz t
     INNER JOIN usuarios u
        ON u.id_usuario = t.id_usuario
     WHERE t.id_quiz = ?
     ORDER BY t.data_resposta DESC`,
                [idQuiz]
            );

            const [estatisticasPerguntas] = await banco.execute(
                `SELECT
        p.id_pergunta,
        p.enunciado,
        COUNT(r.id_resposta) AS total_respostas,

        COALESCE(
            SUM(
                CASE
                    WHEN r.correta = 1 THEN 1
                    ELSE 0
                END
            ),
            0
        ) AS total_acertos,

        COALESCE(
            ROUND(
                (
                    SUM(
                        CASE
                            WHEN r.correta = 1 THEN 1
                            ELSE 0
                        END
                    ) /
                    NULLIF(COUNT(r.id_resposta), 0)
                ) * 100,
                1
            ),
            0
        ) AS percentual_acertos

     FROM perguntas p
     LEFT JOIN respostas_quiz r
        ON r.id_pergunta = p.id_pergunta
     WHERE p.id_quiz = ?
     GROUP BY
        p.id_pergunta,
        p.enunciado
     ORDER BY p.id_pergunta`,
                [idQuiz]
            );

            return res.render(
                "nutricionista/estatisticasQuiz",
                {
                    titulo: "Estatísticas do quiz",
                    usuario: req.session.usuario,
                    quiz,
                    estatisticas: estatisticasGerais[0],
                    tentativas,
                    estatisticasPerguntas
                }
            );

            return res.render(
                "nutricionista/estatisticasQuiz",
                {
                    titulo: "Estatísticas do quiz",
                    usuario: req.session.usuario,
                    quiz,
                    estatisticas: estatisticasGerais[0],
                    tentativas,
                    estatisticasPerguntas
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao carregar estatísticas do quiz:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar as estatísticas do quiz."
            );
        }
    };
