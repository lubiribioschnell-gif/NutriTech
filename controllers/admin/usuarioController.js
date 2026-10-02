const banco = require("../../config/database");

exports.listar = async (req, res, next) => {
    try {
        const [usuarios] = await banco.execute(
            `SELECT
                u.id_usuario,
                u.nome,
                u.email,
                u.foto,
                u.data_nascimento,
                u.sexo,
                u.ativo,
                COALESCE(p.total_pontos, 0) AS total_pontos,
                n.nome AS nutricionista
             FROM usuarios u
             LEFT JOIN (
                SELECT id_usuario, SUM(pontos) AS total_pontos
                FROM pontuacoes
                GROUP BY id_usuario
             ) p ON p.id_usuario = u.id_usuario
             LEFT JOIN solicitacoes_nutricionista s
                ON s.id_usuario = u.id_usuario
               AND s.status = 'aceita'
             LEFT JOIN nutricionistas n
                ON n.id_nutricionista = s.id_nutricionista
             ORDER BY u.ativo DESC, u.nome ASC`
        );

        return res.render("admin/usuarios", {
            titulo: "Usuários",
            usuario: req.session.usuario,
            usuarios,
            sucesso: req.query.sucesso || null,
            erro: req.query.erro || null
        });
    } catch (erro) {
        return next(erro);
    }
};

async function alterarStatus(req, res, next, ativo) {
    try {
        const idUsuario = Number(req.params.id);

        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return res.redirect("/admin/usuarios?erro=Usuário inválido");
        }

        const [resultado] = await banco.execute(
            `UPDATE usuarios SET ativo = ? WHERE id_usuario = ?`,
            [ativo, idUsuario]
        );

        if (resultado.affectedRows === 0) {
            return res.redirect("/admin/usuarios?erro=Usuário não encontrado");
        }

        const mensagem = ativo
            ? "Usuário reativado com sucesso"
            : "Usuário desativado com sucesso";

        return res.redirect(`/admin/usuarios?sucesso=${encodeURIComponent(mensagem)}`);
    } catch (erro) {
        return next(erro);
    }
}

exports.desativar = (req, res, next) => alterarStatus(req, res, next, 0);
exports.reativar = (req, res, next) => alterarStatus(req, res, next, 1);
