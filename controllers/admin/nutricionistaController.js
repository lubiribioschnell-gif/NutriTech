const banco = require("../../config/database");

exports.listar = async (req, res, next) => {
    try {
        const [nutricionistas] = await banco.execute(
            `SELECT
                n.id_nutricionista,
                n.nome,
                n.email,
                n.foto,
                n.crn,
                n.telefone,
                n.descricao,
                n.certificado,
                n.aprovado,
                n.ativo,
                COALESCE(p.total_pacientes, 0) AS total_pacientes
             FROM nutricionistas n
             LEFT JOIN (
                SELECT id_nutricionista, COUNT(DISTINCT id_usuario) AS total_pacientes
                FROM solicitacoes_nutricionista
                WHERE status = 'aceita'
                GROUP BY id_nutricionista
             ) p ON p.id_nutricionista = n.id_nutricionista
             ORDER BY n.ativo DESC, n.aprovado ASC, n.nome ASC`
        );

        return res.render("admin/nutricionistas", {
            titulo: "Nutricionistas",
            usuario: req.session.usuario,
            nutricionistas,
            sucesso: req.query.sucesso || null,
            erro: req.query.erro || null
        });
    } catch (erro) {
        return next(erro);
    }
};

exports.analisar = async (req, res, next) => {
    try {
        const idNutricionista = Number(req.params.id);

        if (!Number.isInteger(idNutricionista) || idNutricionista <= 0) {
            return res.redirect("/admin/nutricionistas?erro=Nutricionista inválido");
        }

        const [[nutricionista]] = await banco.execute(
            `SELECT id_nutricionista, nome, email, foto, data_nascimento,
                    sexo, crn, telefone, descricao, certificado, aprovado, ativo
             FROM nutricionistas
             WHERE id_nutricionista = ?`,
            [idNutricionista]
        );

        if (!nutricionista) {
            return res.redirect("/admin/nutricionistas?erro=Nutricionista não encontrado");
        }

        return res.render("admin/analisarNutricionista", {
            titulo: "Analisar nutricionista",
            usuario: req.session.usuario,
            nutricionista
        });
    } catch (erro) {
        return next(erro);
    }
};

async function definirAprovacao(req, res, next, aprovado) {
    try {
        const idNutricionista = Number(req.params.id);

        if (!Number.isInteger(idNutricionista) || idNutricionista <= 0) {
            return res.redirect("/admin/nutricionistas?erro=Nutricionista inválido");
        }

        const [resultado] = await banco.execute(
            `UPDATE nutricionistas SET aprovado = ? WHERE id_nutricionista = ?`,
            [aprovado, idNutricionista]
        );

        if (resultado.affectedRows === 0) {
            return res.redirect("/admin/nutricionistas?erro=Nutricionista não encontrado");
        }

        const mensagem = aprovado
            ? "Nutricionista aprovado com sucesso"
            : "A aprovação do nutricionista foi retirada";

        return res.redirect(`/admin/nutricionistas?sucesso=${encodeURIComponent(mensagem)}`);
    } catch (erro) {
        return next(erro);
    }
}

async function alterarStatus(req, res, next, ativo) {
    try {
        const idNutricionista = Number(req.params.id);

        if (!Number.isInteger(idNutricionista) || idNutricionista <= 0) {
            return res.redirect("/admin/nutricionistas?erro=Nutricionista inválido");
        }

        const [resultado] = await banco.execute(
            `UPDATE nutricionistas SET ativo = ? WHERE id_nutricionista = ?`,
            [ativo, idNutricionista]
        );

        if (resultado.affectedRows === 0) {
            return res.redirect("/admin/nutricionistas?erro=Nutricionista não encontrado");
        }

        const mensagem = ativo
            ? "Nutricionista reativado com sucesso"
            : "Nutricionista desativado com sucesso";

        return res.redirect(`/admin/nutricionistas?sucesso=${encodeURIComponent(mensagem)}`);
    } catch (erro) {
        return next(erro);
    }
}

exports.aprovar = (req, res, next) => definirAprovacao(req, res, next, 1);
exports.recusar = (req, res, next) => definirAprovacao(req, res, next, 0);
exports.desativar = (req, res, next) => alterarStatus(req, res, next, 0);
exports.reativar = (req, res, next) => alterarStatus(req, res, next, 1);
