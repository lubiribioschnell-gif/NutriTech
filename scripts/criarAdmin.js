const bcrypt = require("bcryptjs");
const banco = require("../config/database");

async function prepararEstrutura() {
    await banco.execute(`
        CREATE TABLE IF NOT EXISTS administradores (
            id_admin INT NOT NULL AUTO_INCREMENT,
            nome VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            senha VARCHAR(255) NOT NULL,
            ativo TINYINT(1) NOT NULL DEFAULT 1,
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id_admin)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const ajustes = [
        "ALTER TABLE usuarios ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1",
        "ALTER TABLE nutricionistas ADD COLUMN aprovado TINYINT(1) NOT NULL DEFAULT 0",
        "ALTER TABLE nutricionistas ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1"
    ];

    for (const sql of ajustes) {
        try {
            await banco.execute(sql);
        } catch (erro) {
            // ER_DUP_FIELDNAME significa que a coluna já existe.
            if (erro.code !== "ER_DUP_FIELDNAME") throw erro;
        }
    }
}

async function criarAdmin() {
    const [, , nomeArg, emailArg, senhaArg] = process.argv;
    const nome = String(nomeArg || "").trim();
    const email = String(emailArg || "").trim().toLowerCase();
    const senha = String(senhaArg || "");

    if (!nome || !email || !senha) {
        console.log('Uso: node scripts/criarAdmin.js "Nome" "email@exemplo.com" "senha"');
        process.exitCode = 1;
        return;
    }

    if (senha.length < 6 || senha.length > 72) {
        console.log("A senha deve ter entre 6 e 72 caracteres.");
        process.exitCode = 1;
        return;
    }

    await prepararEstrutura();

    const [existentes] = await banco.execute(
        "SELECT id_admin FROM administradores WHERE email = ? LIMIT 1",
        [email]
    );

    if (existentes.length > 0) {
        console.log("Já existe um administrador com esse e-mail.");
        process.exitCode = 1;
        return;
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);
    await banco.execute(
        `INSERT INTO administradores (nome, email, senha, ativo)
         VALUES (?, ?, ?, 1)`,
        [nome, email, senhaCriptografada]
    );

    console.log(`Administrador ${nome} criado com sucesso.`);
}

criarAdmin()
    .catch((erro) => {
        console.error("Erro ao criar administrador:", erro.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await banco.end();
    });
