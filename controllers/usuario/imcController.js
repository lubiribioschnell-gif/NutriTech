
exports.mostrarImc = (req, res) => {
    res.render("usuario/imc", {
        titulo: "Calculadora de IMC",
        usuario: req.session.usuario,
        resultado: null,
        erro: null
    });
};

exports.calcularImc = (req, res) => {
    const peso = Number(req.body.peso);
    const altura = Number(req.body.altura);

    if (
        !Number.isFinite(peso) ||
        !Number.isFinite(altura) ||
        peso <= 0 ||
        altura <= 0
    ) {
        return res.status(400).render("usuario/imc", {
            titulo: "Calculadora de IMC",
            usuario: req.session.usuario,
            resultado: null,
            erro: "Informe um peso e uma altura válidos."
        });
    }

    const imc = peso / (altura * altura);

    let classificacao;

    if (imc < 18.5) {
        classificacao = "Abaixo do peso";
    } else if (imc < 25) {
        classificacao = "Peso adequado";
    } else if (imc < 30) {
        classificacao = "Sobrepeso";
    } else if (imc < 35) {
        classificacao = "Obesidade grau I";
    } else if (imc < 40) {
        classificacao = "Obesidade grau II";
    } else {
        classificacao = "Obesidade grau III";
    }

    return res.render("usuario/imc", {
        titulo: "Calculadora de IMC",
        usuario: req.session.usuario,
        erro: null,
        resultado: {
            imc: imc.toFixed(2),
            classificacao
        }
    });
};
