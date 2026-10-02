const bcrypt = require("bcryptjs");
const banco = require("./config/database");

async function criarAdmin() {
    const nome = process.argv[2];
    const email = process.argv[3];
    const senha = process.argv[4];

    if (!nome || !email || !senha) {
        console.log(
            'Uso: node criarAdmin.js "Nome" email@exemplo.com "senha"'
        );
        process.exit(1);
    }

    if (senha.length < 6) {
        console.log("A senha deve possuir pelo menos 6 caracteres.");
        process.exit(1);
    }

    try {
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        await banco.execute(
            `INSERT INTO administradores (nome, email, senha)
             VALUES (?, ?, ?)`,
            [nome.trim(), email.trim().toLowerCase(), senhaCriptografada]
        );

        console.log("Administrador criado com sucesso.");
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY") {
            console.error("Já existe um administrador com esse e-mail.");
        } else {
            console.error("Erro ao criar administrador:", erro.message);
        }
        process.exitCode = 1;
    } finally {
        await banco.end();
    }
}

criarAdmin();
