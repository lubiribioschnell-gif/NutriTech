require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const banco = require("./config/database");

const publicoRoutes = require("./routes/publico");
const authRoutes = require("./routes/auth");
const usuarioRoutes = require("./routes/usuario");
const nutricionistaRoutes = require("./routes/nutricionista");
const adminRoutes = require("./routes/admin");

const tratarErros = require(
    "./middlewares/tratamentoErros"
);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    session({
        secret: process.env.SESSION_SECRET || "nutritech123",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 2,
            httpOnly: true,
            sameSite: "lax"
        }
    })
);

app.use((req, res, next) => {
    res.locals.usuario =
        req.session.usuario || null;

    res.locals.erro = req.query.erro || null;
    res.locals.sucesso = req.query.sucesso || null;

    next();
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use("/", publicoRoutes);
app.use("/", authRoutes);

app.use("/usuario", usuarioRoutes);
app.use("/nutricionista", nutricionistaRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
    res.status(404).render("erros/404", {
        titulo: "Página não encontrada"
    });
});

app.use(tratarErros);

async function testarConexao() {
    try {
        const conexao =
            await banco.getConnection();

        console.log(
            "Banco de dados conectado com sucesso!"
        );

        conexao.release();
    } catch (erro) {
        console.error(
            "Erro ao conectar ao banco:",
            erro.message
        );
    }
}

testarConexao();

const PORTA = process.env.PORT || 3000;

app.listen(PORTA, () => {
    console.log(
        `Servidor rodando em http://localhost:${PORTA}`
    );
});