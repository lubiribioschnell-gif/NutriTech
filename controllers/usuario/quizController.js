const banco = require("../../config/database");
const {
    adicionarPontos
} = require("../../services/pontuacaoService");

exports.listarQuizzes = async (req, res) => {
        try {
            const idUsuario = req.session.usuario.id;

            const [quizzes] = await banco.execute(
                `SELECT
                    q.id_quiz,
                    q.titulo,
                    q.descricao,
                    n.nome AS nome_nutricionista
                 FROM quizzes q
                 INNER JOIN nutricionistas n
                    ON n.id_nutricionista = q.id_nutricionista
                 WHERE q.id_usuario = ?
                 ORDER BY q.id_quiz DESC`,
                [idUsuario]
            );

            return res.render("usuario/quizzes", {
                titulo: "Meus quizzes",
                usuario: req.session.usuario,
                quizzes
            });
        } catch (erro) {
            console.error(
                "Erro ao carregar quizzes:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar os quizzes."
            );
        }
    };

exports.abrirQuiz = async (req, res) => {
        try {
            const idQuiz = req.params.id;
            const idUsuario = req.session.usuario.id;

            const [[quiz]] = await banco.execute(
                `SELECT
                    id_quiz,
                    titulo,
                    descricao
                 FROM quizzes
                 WHERE id_quiz = ?
                   AND id_usuario = ?`,
                [
                    idQuiz,
                    idUsuario
                ]
            );

            if (!quiz) {
                return res.status(404).send(
                    "Quiz não encontrado."
                );
            }

            const [perguntas] = await banco.execute(
                `SELECT
                    id_pergunta,
                    enunciado
                 FROM perguntas
                 WHERE id_quiz = ?
                 ORDER BY id_pergunta`,
                [idQuiz]
            );

            for (const pergunta of perguntas) {
                const [alternativas] = await banco.execute(
                    `SELECT
                        id_alternativa,
                        texto
                     FROM alternativas
                     WHERE id_pergunta = ?
                     ORDER BY id_alternativa`,
                    [pergunta.id_pergunta]
                );

                pergunta.alternativas = alternativas;
            }

            return res.render(
                "usuario/responderQuiz",
                {
                    titulo: quiz.titulo,
                    usuario: req.session.usuario,
                    quiz,
                    perguntas
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao abrir quiz:",
                erro
            );

            return res.status(500).send(
                "Não foi possível abrir o quiz."
            );
        }
    };

exports.responderQuiz = async (req, res) => {
        const conexao = await banco.getConnection();

        try {
            await conexao.beginTransaction();

            const idQuiz = req.params.id;
            const idUsuario = req.session.usuario.id;

            const [[quiz]] = await conexao.execute(
                `SELECT id_quiz
                 FROM quizzes
                 WHERE id_quiz = ?
                   AND id_usuario = ?`,
                [idQuiz, idUsuario]
            );

            if (!quiz) {
                await conexao.rollback();

                return res.status(404).send(
                    "Quiz não encontrado."
                );
            }

            const [perguntas] = await conexao.execute(
                `SELECT id_pergunta
                 FROM perguntas
                 WHERE id_quiz = ?`,
                [idQuiz]
            );

            if (perguntas.length === 0) {
                await conexao.rollback();

                return res.status(400).send(
                    "Este quiz não possui perguntas."
                );
            }

            let pontuacao = 0;
            const respostas = [];

            for (const pergunta of perguntas) {
                const nomeCampo =
                    `pergunta_${pergunta.id_pergunta}`;

                const idAlternativa = req.body[nomeCampo];

                if (!idAlternativa) {
                    await conexao.rollback();

                    return res.status(400).send(
                        "Responda todas as perguntas."
                    );
                }

                const [[alternativa]] = await conexao.execute(
                    `SELECT
                        id_alternativa,
                        correta
                     FROM alternativas
                     WHERE id_alternativa = ?
                       AND id_pergunta = ?`,
                    [
                        idAlternativa,
                        pergunta.id_pergunta
                    ]
                );

                if (!alternativa) {
                    await conexao.rollback();

                    return res.status(400).send(
                        "Alternativa inválida."
                    );
                }

                const acertou =
                    alternativa.correta === 1 ||
                    alternativa.correta === true;

                if (acertou) {
                    pontuacao++;
                }

                respostas.push({
                    idPergunta: pergunta.id_pergunta,
                    idAlternativa: alternativa.id_alternativa,
                    correta: acertou
                });
            }

            const [resultadoTentativa] =
                await conexao.execute(
                    `INSERT INTO tentativas_quiz (
                        id_quiz,
                        id_usuario,
                        pontuacao,
                        total_perguntas
                    )
                    VALUES (?, ?, ?, ?)`,
                    [
                        idQuiz,
                        idUsuario,
                        pontuacao,
                        perguntas.length
                    ]
                );

            const idTentativa =
                resultadoTentativa.insertId;

            for (const resposta of respostas) {
                await conexao.execute(
                    `INSERT INTO respostas_quiz (
                        id_tentativa,
                        id_pergunta,
                        id_alternativa,
                        correta
                    )
                    VALUES (?, ?, ?, ?)`,
                    [
                        idTentativa,
                        resposta.idPergunta,
                        resposta.idAlternativa,
                        resposta.correta
                    ]
                );
            }
            await adicionarPontos(
                idUsuario,
                20,
                "Quiz respondido",
                conexao
            );

            await conexao.commit();

            return res.redirect(
                `/usuario/quizzes/resultado/${idTentativa}`
            );

        } catch (erro) {
            await conexao.rollback();

            console.error("Erro ao responder quiz:", erro);

            return res.status(500).send(
                "Não foi possível salvar as respostas."
            );

        } finally {
            conexao.release();
        }
    };

exports.mostrarResultado = async (req, res) => {
        try {
            const idTentativa = req.params.id;
            const idUsuario = req.session.usuario.id;

            const [[tentativa]] = await banco.execute(
                `SELECT
                    t.id_tentativa,
                    t.pontuacao,
                    t.total_perguntas,
                    t.data_resposta,
                    q.titulo
                 FROM tentativas_quiz t
                 INNER JOIN quizzes q
                    ON q.id_quiz = t.id_quiz
                 WHERE t.id_tentativa = ?
                   AND t.id_usuario = ?`,
                [idTentativa, idUsuario]
            );

            if (!tentativa) {
                return res.status(404).send(
                    "Resultado não encontrado."
                );
            }

            const percentual =
                tentativa.total_perguntas > 0
                    ? Math.round(
                        (
                            tentativa.pontuacao /
                            tentativa.total_perguntas
                        ) * 100
                    )
                    : 0;

            return res.render("usuario/resultadoQuiz", {
                titulo: "Resultado do Quiz",
                usuario: req.session.usuario,
                tentativa,
                percentual
            });

        } catch (erro) {
            console.error(
                "Erro ao carregar resultado:",
                erro
            );

            return res.status(500).send(
                "Não foi possível carregar o resultado."
            );
        }
    };
