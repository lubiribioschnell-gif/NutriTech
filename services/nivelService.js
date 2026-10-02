const NIVEIS = [
    {
        nome: "Novato Saudável",
        icone: "🌱",
        pontosMinimos: 0,
        pontosMaximos: 149
    },
    {
        nome: "Explorador Nutritivo",
        icone: "🥗",
        pontosMinimos: 150,
        pontosMaximos: 299
    },
    {
        nome: "Herói do Bem-Estar",
        icone: "⚡",
        pontosMinimos: 300,
        pontosMaximos: 499
    },
    {
        nome: "Guardião da Saúde",
        icone: "🛡️",
        pontosMinimos: 500,
        pontosMaximos: 799
    },
    {
        nome: "Mestre NutriTech",
        icone: "👑",
        pontosMinimos: 800,
        pontosMaximos: null
    }
];

function calcularNivel(pontos) {
    const total = Math.max(0, Number(pontos) || 0);

    let indiceAtual = NIVEIS.length - 1;

    for (let indice = NIVEIS.length - 1; indice >= 0; indice -= 1) {
        if (total >= NIVEIS[indice].pontosMinimos) {
            indiceAtual = indice;
            break;
        }
    }

    const atual = NIVEIS[indiceAtual];
    const proximo = NIVEIS[indiceAtual + 1] || null;

    let progresso = 100;
    let pontosParaProximoNivel = 0;

    if (proximo) {
        const intervalo = proximo.pontosMinimos - atual.pontosMinimos;
        const conquistadosNoNivel = total - atual.pontosMinimos;

        progresso = Math.min(
            100,
            Math.max(0, Math.round((conquistadosNoNivel / intervalo) * 100))
        );
        pontosParaProximoNivel = Math.max(0, proximo.pontosMinimos - total);
    }

    return {
        ...atual,
        totalPontos: total,
        proximoNivel: proximo ? proximo.nome : null,
        proximoNivelIcone: proximo ? proximo.icone : null,
        pontosParaProximoNivel,
        progresso
    };
}

function listarNiveis() {
    return NIVEIS.map((nivel) => ({ ...nivel }));
}

module.exports = {
    calcularNivel,
    listarNiveis
};
