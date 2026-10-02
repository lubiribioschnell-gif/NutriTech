function textoLimpo(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

function emailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function senhaValida(senha) {
    return typeof senha === "string" && senha.length >= 6 && senha.length <= 72;
}

function dataNascimentoValida(dataNascimento) {
    if (!dataNascimento) return false;

    const data = new Date(`${dataNascimento}T00:00:00`);
    const hoje = new Date();

    if (Number.isNaN(data.getTime()) || data > hoje) return false;

    const dataMinima = new Date();
    dataMinima.setFullYear(hoje.getFullYear() - 120);

    return data >= dataMinima;
}

function numeroValido(valor, minimo, maximo) {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= minimo && numero <= maximo;
}

function telefoneValido(telefone) {
    const somenteNumeros = textoLimpo(telefone).replace(/\D/g, "");
    return somenteNumeros.length === 10 || somenteNumeros.length === 11;
}

function crnValido(crn) {
    return /^[0-9A-Za-z./\-\s]{4,30}$/.test(textoLimpo(crn));
}

module.exports = {
    textoLimpo,
    emailValido,
    senhaValida,
    dataNascimentoValida,
    numeroValido,
    telefoneValido,
    crnValido
};
