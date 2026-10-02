const banco = require("../config/database");

async function buscarTotalPontos(idUsuario) {
    const [[resultado]] = await banco.execute(
        `SELECT COALESCE(SUM(pontos), 0) AS total
         FROM pontuacoes
         WHERE id_usuario = ?`,
        [idUsuario]
    );

    return Number(resultado.total) || 0;
}

async function adicionarPontos(
    idUsuario,
    pontos,
    motivo,
    conexao = banco
) {
    if (!Number.isInteger(pontos) || pontos <= 0) {
        throw new Error("A pontuação deve ser positiva.");
    }

    await conexao.execute(
        `INSERT INTO pontuacoes (
            id_usuario,
            pontos,
            motivo
        )
        VALUES (?, ?, ?)`,
        [
            idUsuario,
            pontos,
            motivo
        ]
    );
}

async function buscarHistorico(idUsuario) {
    const [historico] = await banco.execute(
        `SELECT
            id_pontuacao,
            pontos,
            motivo,
            data_registro
         FROM pontuacoes
         WHERE id_usuario = ?
         ORDER BY data_registro DESC`,
        [idUsuario]
    );

    return historico;
}

async function buscarClassificacao() {
    const [usuarios] = await banco.execute(
        `SELECT
            u.id_usuario,
            u.nome,
            u.foto,
            COALESCE(SUM(p.pontos), 0) AS total_pontos
         FROM usuarios u
         LEFT JOIN pontuacoes p
            ON p.id_usuario = u.id_usuario
         WHERE u.ativo = 1
         GROUP BY
            u.id_usuario,
            u.nome,
            u.foto
         ORDER BY
            total_pontos DESC,
            u.nome ASC`
    );

    return usuarios;
}

module.exports = {
    buscarTotalPontos,
    adicionarPontos,
    buscarHistorico,
    buscarClassificacao
};