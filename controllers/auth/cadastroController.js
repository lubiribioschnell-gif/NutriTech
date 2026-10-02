const banco = require("../../config/database");
const bcrypt = require("bcryptjs");
const {
    textoLimpo,
    emailValido,
    senhaValida,
    dataNascimentoValida,
    numeroValido,
    telefoneValido,
    crnValido
} = require("../../utils/validacoes");
const { removerArquivoEnviado } = require("../../utils/arquivos");

const SEXOS_PERMITIDOS = ["Masculino", "Feminino", "Outro"];

async function emailJaCadastrado(email) {
    const [usuarios] = await banco.execute(
        "SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1",
        [email]
    );

    if (usuarios.length > 0) return true;

    const [nutricionistas] = await banco.execute(
        "SELECT id_nutricionista FROM nutricionistas WHERE email = ? LIMIT 1",
        [email]
    );

    return nutricionistas.length > 0;
}

function renderErroUsuario(req, res, status, erro) {
    removerArquivoEnviado(req.file);
    return res.status(status).render("auth/cadastroUsuario", {
        titulo: "Cadastro de usuário",
        erro,
        dados: req.body
    });
}

function renderErroNutricionista(req, res, status, erro) {
    removerArquivoEnviado(req.file);
    return res.status(status).render("auth/cadastroNutricionista", {
        titulo: "Cadastro de nutricionista",
        erro,
        dados: req.body
    });
}

exports.mostrarEscolha = (req, res) => {
    return res.render("auth/escolherCadastro", {
        titulo: "Escolha seu cadastro"
    });
};

exports.escolherTipo = (req, res) => {
    const tipo = textoLimpo(req.body.tipo);

    if (tipo === "usuario") return res.redirect("/cadastro/usuario");
    if (tipo === "nutricionista") return res.redirect("/cadastro/nutricionista");

    return res.redirect("/cadastro");
};

exports.mostrarUsuario = (req, res) => {
    return res.render("auth/cadastroUsuario", {
        titulo: "Cadastro de usuário",
        erro: null,
        dados: {}
    });
};

exports.mostrarNutricionista = (req, res) => {
    return res.render("auth/cadastroNutricionista", {
        titulo: "Cadastro de nutricionista",
        erro: null,
        dados: {}
    });
};

exports.cadastrarUsuario = async (req, res) => {
    try {
        const nome = textoLimpo(req.body.nome);
        const email = textoLimpo(req.body.email).toLowerCase();
        const senha = req.body.senha || "";
        const confirmarSenha = req.body.confirmarSenha || "";
        const altura = req.body.altura;
        const peso = req.body.peso;
        const dataNascimento = textoLimpo(req.body.data_nascimento);
        const sexo = textoLimpo(req.body.sexo);

        if (!nome || !email || !senha || !confirmarSenha || !altura || !peso || !dataNascimento || !sexo) {
            return renderErroUsuario(req, res, 400, "Preencha todos os campos obrigatórios.");
        }

        if (nome.length < 3 || nome.length > 100) {
            return renderErroUsuario(req, res, 400, "O nome deve ter entre 3 e 100 caracteres.");
        }

        if (!emailValido(email) || email.length > 150) {
            return renderErroUsuario(req, res, 400, "Informe um endereço de e-mail válido.");
        }

        if (!senhaValida(senha)) {
            return renderErroUsuario(req, res, 400, "A senha deve ter entre 6 e 72 caracteres.");
        }

        if (senha !== confirmarSenha) {
            return renderErroUsuario(req, res, 400, "As senhas não coincidem.");
        }

        if (!numeroValido(peso, 20, 400)) {
            return renderErroUsuario(req, res, 400, "Informe um peso válido entre 20 e 400 kg.");
        }

        if (!numeroValido(altura, 0.8, 2.5)) {
            return renderErroUsuario(req, res, 400, "Informe uma altura válida entre 0,80 e 2,50 metros.");
        }

        if (!dataNascimentoValida(dataNascimento)) {
            return renderErroUsuario(req, res, 400, "Informe uma data de nascimento válida.");
        }

        if (!SEXOS_PERMITIDOS.includes(sexo)) {
            return renderErroUsuario(req, res, 400, "Selecione uma opção válida para o sexo.");
        }

        if (await emailJaCadastrado(email)) {
            return renderErroUsuario(req, res, 400, "Este e-mail já está cadastrado.");
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);
        const foto = req.file?.filename || null;

        await banco.execute(
            `INSERT INTO usuarios
             (nome, email, senha, altura, peso, foto, data_nascimento, sexo, ativo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [nome, email, senhaCriptografada, Number(altura), Number(peso), foto, dataNascimento, sexo]
        );

        return res.redirect("/login?sucesso=Cadastro realizado com sucesso");
    } catch (erro) {
        removerArquivoEnviado(req.file);
        console.error("Erro ao cadastrar usuário:", erro);
        return res.status(500).render("auth/cadastroUsuario", {
            titulo: "Cadastro de usuário",
            erro: "Não foi possível realizar o cadastro.",
            dados: req.body
        });
    }
};

exports.cadastrarNutricionista = async (req, res) => {
    try {
        const nome = textoLimpo(req.body.nome);
        const email = textoLimpo(req.body.email).toLowerCase();
        const senha = req.body.senha || "";
        const confirmarSenha = req.body.confirmarSenha || "";
        const dataNascimento = textoLimpo(req.body.data_nascimento);
        const sexo = textoLimpo(req.body.sexo);
        const crn = textoLimpo(req.body.crn);
        const telefone = textoLimpo(req.body.telefone);
        const descricao = textoLimpo(req.body.descricao);

        if (!nome || !email || !senha || !confirmarSenha || !dataNascimento || !sexo || !crn || !telefone || !descricao) {
            return renderErroNutricionista(req, res, 400, "Preencha todos os campos obrigatórios.");
        }

        if (nome.length < 3 || nome.length > 100) {
            return renderErroNutricionista(req, res, 400, "O nome deve ter entre 3 e 100 caracteres.");
        }

        if (!emailValido(email) || email.length > 150) {
            return renderErroNutricionista(req, res, 400, "Informe um endereço de e-mail válido.");
        }

        if (!senhaValida(senha)) {
            return renderErroNutricionista(req, res, 400, "A senha deve ter entre 6 e 72 caracteres.");
        }

        if (senha !== confirmarSenha) {
            return renderErroNutricionista(req, res, 400, "As senhas não coincidem.");
        }

        if (!dataNascimentoValida(dataNascimento)) {
            return renderErroNutricionista(req, res, 400, "Informe uma data de nascimento válida.");
        }

        if (!SEXOS_PERMITIDOS.includes(sexo)) {
            return renderErroNutricionista(req, res, 400, "Selecione uma opção válida para o sexo.");
        }

        if (!crnValido(crn)) {
            return renderErroNutricionista(req, res, 400, "Informe um CRN válido.");
        }

        if (!telefoneValido(telefone)) {
            return renderErroNutricionista(req, res, 400, "Informe um telefone com DDD.");
        }

        if (descricao.length < 20 || descricao.length > 1000) {
            return renderErroNutricionista(req, res, 400, "A descrição profissional deve ter entre 20 e 1000 caracteres.");
        }

        if (await emailJaCadastrado(email)) {
            return renderErroNutricionista(req, res, 400, "Este e-mail já está cadastrado.");
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);
        const foto = req.file?.filename || null;
        const telefoneFormatado = telefone.replace(/\D/g, "");

        await banco.execute(
            `INSERT INTO nutricionistas
             (nome, email, senha, certificado, foto, data_nascimento, sexo, crn, telefone, descricao, aprovado, ativo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
            [nome, email, senhaCriptografada, null, foto, dataNascimento, sexo, crn, telefoneFormatado, descricao]
        );

        return res.redirect(
            "/login?sucesso=Cadastro enviado. Aguarde a aprovação do administrador"
        );
    } catch (erro) {
        removerArquivoEnviado(req.file);
        console.error("Erro ao cadastrar nutricionista:", erro);
        return res.status(500).render("auth/cadastroNutricionista", {
            titulo: "Cadastro de nutricionista",
            erro: "Não foi possível realizar o cadastro.",
            dados: req.body
        });
    }
};
