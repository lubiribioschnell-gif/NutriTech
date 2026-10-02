const {
    buscarClassificacao
} = require("../../services/pontuacaoService");

const {
    calcularNivel,
    listarNiveis
} = require("../../services/nivelService");

exports.classificacao = async (req, res, next) => {
    try {
        const usuarios = await buscarClassificacao();

        let posicaoAtual = 0;
        let pontosAnteriores = null;

        // Classificação densa: 1, 2, 2, 3.
        const classificacao = usuarios.map((usuario) => {
            const totalPontos = Number(usuario.total_pontos) || 0;

            if (pontosAnteriores === null || totalPontos !== pontosAnteriores) {
                posicaoAtual += 1;
                pontosAnteriores = totalPontos;
            }

            return {
                ...usuario,
                total_pontos: totalPontos,
                posicao: posicaoAtual,
                nivel: calcularNivel(totalPontos),
                usuarioAtual:
                    Number(usuario.id_usuario) ===
                    Number(req.session.usuario.id)
            };
        });

        const minhaClassificacao = classificacao.find(
            (item) => item.usuarioAtual
        ) || null;

        return res.render("usuario/classificacao", {
            titulo: "Classificação",
            usuario: req.session.usuario,
            classificacao,
            minhaClassificacao,
            niveis: listarNiveis()
        });
    } catch (erro) {
        console.error("Erro ao carregar classificação:", erro);
        return next(erro);
    }
};
