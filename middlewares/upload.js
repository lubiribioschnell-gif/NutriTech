const fs = require("fs");
const path = require("path");
const multer = require("multer");

const pastaUploads = path.join(
    __dirname,
    "..",
    "public",
    "uploads"
);

fs.mkdirSync(pastaUploads, { recursive: true });

const extensoesPermitidas = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
]);

const tiposPermitidos = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, pastaUploads);
    },

    filename(req, file, callback) {
        const extensao = path
            .extname(file.originalname)
            .toLowerCase();

        const nomeArquivo = [
            Date.now(),
            Math.round(Math.random() * 1e9)
        ].join("-") + extensao;

        callback(null, nomeArquivo);
    }
});

function fileFilter(req, file, callback) {
    const extensao = path
        .extname(file.originalname)
        .toLowerCase();

    const tipoValido = tiposPermitidos.has(file.mimetype);
    const extensaoValida = extensoesPermitidas.has(extensao);

    if (!tipoValido || !extensaoValida) {
        return callback(
            new multer.MulterError(
                "LIMIT_UNEXPECTED_FILE",
                file.fieldname
            )
        );
    }

    return callback(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 2
    }
});

module.exports = upload;
