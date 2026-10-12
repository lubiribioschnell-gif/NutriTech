const banco = require("../../config/database");
const { dataNascimentoValida, emailValido, numeroValido, textoLimpo } = require("../../utils/validacoes");

exports.mostrarPerfil = async (req, res) => {
    try {

        const [usuarios] = await banco.query(
            `
            SELECT
                id_usuario,
                nomeLimpo,
                emailLimpo,
                altura,
                peso,
                sexo,
                data_nascimento,
                foto
            FROM usuarios
            WHERE id_usuario = ?
            `,
            [req.session.usuario.id]
        );

        res.render("usuario/perfil", {
            titulo: "Meu Perfil",
            usuario: usuarios[0]
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).send("Erro ao carregar perfil.");

    }
};

exports.mostrarEdicao = async (req, res) => {

    const [usuarios] = await banco.query(
        `
        SELECT *
        FROM usuarios
        WHERE id_usuario = ?
        `,
        [req.session.usuario.id]
    );

    res.render("usuario/editarPerfil", {
        titulo: "Editar Perfil",
        usuario: usuarios[0]
    });

};

exports.editarPerfil = async (req, res) => {

    try {

        const {
            nome,
            email,
            altura,
            peso,
            sexo,
            data_nascimento
        } = req.body;

        const nomeLimpo = textoLimpo(nome);
        const emailLimpo = textoLimpo(email).toLowerCase();
        if (nomeLimpo.length < 3 || nomeLimpo.length > 100 || !emailValido(emailLimpo) || emailLimpo.length > 150) {
            if (req.file) require("../../utils/arquivos").removerArquivoEnviado(req.file.filename);
            return res.status(400).send("Confira o nome e o e-mail informados.");
        }
        if (!dataNascimentoValida(data_nascimento)) {
            if (req.file) require("../../utils/arquivos").removerArquivoEnviado(req.file.filename);
            return res.status(400).send("Informe uma data de nascimento válida, entre hoje e os últimos 120 anos.");
        }
        if (!numeroValido(peso, 20, 400) || !numeroValido(altura, 0.5, 2.7)) {
            if (req.file) require("../../utils/arquivos").removerArquivoEnviado(req.file.filename);
            return res.status(400).send("Informe altura e peso válidos.");
        }

        let foto = req.session.usuario.foto;

        if (req.file) {
            foto = req.file.filename;
        }

        await banco.query(
            `
            UPDATE usuarios
            SET
                nome=?,
                email=?,
                altura=?,
                peso=?,
                sexo=?,
                data_nascimento=?,
                foto=?
            WHERE id_usuario=?
            `,
            [
                nomeLimpo,
                emailLimpo,
                altura,
                peso,
                sexo,
                data_nascimento,
                foto,
                req.session.usuario.id
            ]
        );

        req.session.usuario.nome = nomeLimpo;
        req.session.usuario.email = emailLimpo;
        req.session.usuario.foto = foto;

        res.redirect("/usuario/perfil");

    } catch (erro) {

        console.error(erro);

        res.status(500).send("Erro ao atualizar perfil.");

    }

};
