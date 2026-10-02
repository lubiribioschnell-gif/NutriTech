const fs = require("fs");

function removerArquivoEnviado(arquivo) {
    if (!arquivo?.path) return;

    fs.unlink(arquivo.path, erro => {
        if (erro && erro.code !== "ENOENT") {
            console.error("Erro ao remover arquivo enviado:", erro);
        }
    });
}

module.exports = { removerArquivoEnviado };
