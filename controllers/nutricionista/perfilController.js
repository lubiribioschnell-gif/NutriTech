const banco = require("../../config/database");
const { dataNascimentoValida, emailValido, textoLimpo } = require("../../utils/validacoes");

exports.mostrarPerfil = async (req, res) => {
        try {
            const idNutricionista = req.session.usuario.id;

 const [usuarios] = await banco.query(
    `
    SELECT
        id_usuario,
        nome,
        email,
        altura,
        peso,
        sexo,
        data_nascimento,
        foto
    FROM usuarios
    WHERE id_usuario = ?
    `,
    [idNutricionista]
);

            if (nutricionistas.length === 0) {
                return res
                    .status(404)
                    .send("Nutricionista não encontrado.");
            }

            res.render("nutricionista/perfil", {
                titulo: "Meu Perfil",
                usuario: req.session.usuario,
                nutricionista: nutricionistas[0]
            });

        } catch (erro) {
            console.error("Erro ao carregar perfil:", erro);

            res
                .status(500)
                .send("Erro ao carregar perfil.");
        }
    };

exports.mostrarEdicao = async (req, res) => {
        try {
            const idNutricionista = req.session.usuario.id;

            const [nutricionistas] = await banco.query(
                `
                SELECT
                    id_nutricionista,
                    nome,
                    email,
                    data_nascimento,
                    sexo,
                    crn,
                    telefone,
                    descricao,
                    foto
                FROM nutricionistas
                WHERE id_nutricionista = ?
                `,
                [idNutricionista]
            );

            if (nutricionistas.length === 0) {
                return res
                    .status(404)
                    .send("Nutricionista não encontrado.");
            }

            res.render("nutricionista/editarPerfil", {
                titulo: "Editar Perfil",
                usuario: req.session.usuario,
                nutricionista: nutricionistas[0],
                erro: null
            });

        } catch (erro) {
            console.error(
                "Erro ao abrir edição do perfil:",
                erro
            );

            res
                .status(500)
                .send("Erro ao abrir edição do perfil.");
        }
    };

exports.editar = async (req, res) => {
        try {
            const idNutricionista = req.session.usuario.id;

            const {
                nome,
                email,
                data_nascimento,
                sexo,
                crn,
                telefone,
                descricao
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

            const [nutricionistas] = await banco.query(
                `
                SELECT foto
                FROM nutricionistas
                WHERE id_nutricionista = ?
                `,
                [idNutricionista]
            );

            if (nutricionistas.length === 0) {
                return res
                    .status(404)
                    .send("Nutricionista não encontrado.");
            }

            let foto = nutricionistas[0].foto;

            if (req.file) {
                foto = req.file.filename;
            }

            await banco.query(
                `
                UPDATE nutricionistas
                SET
                    nome = ?,
                    email = ?,
                    data_nascimento = ?,
                    sexo = ?,
                    crn = ?,
                    telefone = ?,
                    descricao = ?,
                    foto = ?
                WHERE id_nutricionista = ?
                `,
                [
                    nomeLimpo,
                    emailLimpo,
                    data_nascimento,
                    sexo,
                    crn,
                    telefone,
                    descricao,
                    foto,
                    idNutricionista
                ]
            );

            req.session.usuario.nome = nomeLimpo;
            req.session.usuario.email = emailLimpo;
            req.session.usuario.foto = foto;

            res.redirect("/nutricionista/perfil");

        } catch (erro) {
            console.error(
                "Erro ao atualizar perfil:",
                erro
            );

            res
                .status(500)
                .send("Erro ao atualizar perfil.");
        }
    };
