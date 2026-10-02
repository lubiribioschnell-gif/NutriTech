const banco = require("../../config/database");

exports.home = async (req, res, next) => {
    try {
        const [[usuarios]] = await banco.execute(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) AS ativos,
                SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) AS inativos
             FROM usuarios`
        );

        const [[nutricionistas]] = await banco.execute(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN aprovado = 1 AND ativo = 1 THEN 1 ELSE 0 END) AS aprovados,
                SUM(CASE WHEN aprovado = 0 AND ativo = 1 THEN 1 ELSE 0 END) AS pendentes,
                SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) AS inativos
             FROM nutricionistas`
        );

        const [[acompanhamentos]] = await banco.execute(
            `SELECT
                SUM(CASE WHEN status = 'aceita' THEN 1 ELSE 0 END) AS ativos,
                COUNT(*) AS total
             FROM solicitacoes_nutricionista`
        );

        const [[diarios]] = await banco.execute(
            "SELECT COUNT(*) AS total FROM diario_alimentar"
        ).catch(() => [[{ total: 0 }]]);

        return res.render("admin/home", {
            titulo: "Painel administrativo",
            usuario: req.session.usuario,
            resumo: {
                usuarios: Number(usuarios.total || 0),
                usuariosAtivos: Number(usuarios.ativos || 0),
                usuariosInativos: Number(usuarios.inativos || 0),
                nutricionistas: Number(nutricionistas.total || 0),
                nutricionistasAprovados: Number(nutricionistas.aprovados || 0),
                pendentes: Number(nutricionistas.pendentes || 0),
                nutricionistasInativos: Number(nutricionistas.inativos || 0),
                acompanhamentos: Number(acompanhamentos.ativos || 0),
                acompanhamentosTotal: Number(acompanhamentos.total || 0),
                diarios: Number(diarios.total || 0)
            }
        });
    } catch (erro) {
        return next(erro);
    }
};
