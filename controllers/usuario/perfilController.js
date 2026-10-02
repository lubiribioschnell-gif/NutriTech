const banco = require("../../config/database");

exports.mostrarPerfil = async (req, res) => {
    try {

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
                nome,
                email,
                altura,
                peso,
                sexo,
                data_nascimento,
                foto,
                req.session.usuario.id
            ]
        );

        req.session.usuario.nome = nome;
        req.session.usuario.email = email;
        req.session.usuario.foto = foto;

        res.redirect("/usuario/perfil");

    } catch (erro) {

        console.error(erro);

        res.status(500).send("Erro ao atualizar perfil.");

    }

};
