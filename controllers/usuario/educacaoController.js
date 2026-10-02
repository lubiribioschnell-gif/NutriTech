const artigos = require("../../data/artigos");

exports.listarArtigos = (req, res) => {

        res.render(
            "usuario/educacao",
            {
                titulo: "Área Educativa",
                usuario: req.session.usuario,
                artigos
            }
        );

    };

exports.mostrarArtigo = (req, res) => {

        const artigo = artigos.find(
            a => a.id == req.params.id
        );

        if (!artigo) {

            return res.send("Artigo não encontrado.");

        }

        res.render(
            "usuario/artigo",
            {
                titulo: artigo.titulo,
                usuario: req.session.usuario,
                artigo
            }
        );

    };
