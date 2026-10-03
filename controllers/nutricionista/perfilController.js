const banco = require("../../config/database");

exports.mostrarPerfil = async (req, res) => {
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
                    nome,
                    email,
                    data_nascimento,
                    sexo,
                    crn,
                    telefone,
                    descricao,
                    foto,
                    idNutricionista
                ]
            );

            req.session.usuario.nome = nome;
            req.session.usuario.email = email;
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
