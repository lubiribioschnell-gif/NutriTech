const express = require("express");
const router = express.Router();

const {verificarUsuario} = require("../middlewares/autenticacao");

const uploadUsuario = require("../middlewares/uploadUsuario");
const homeController = require("../controllers/usuario/homeController");
const imcController = require("../controllers/usuario/imcController");
const cardapioController = require("../controllers/usuario/cardapioController");
const diarioController = require("../controllers/usuario/diarioController");
const quizController = require("../controllers/usuario/quizController");
const educacaoController = require("../controllers/usuario/educacaoController");
const acompanhamentoController = require("../controllers/usuario/acompanhamentoController");
const perfilController = require("../controllers/usuario/perfilController");
const pontuacaoController = require("../controllers/usuario/pontuacaoController");

router.use(verificarUsuario);

router.get("/ajuda", (req, res) => res.render("perguntasFrequentes", { titulo: "Perguntas frequentes" }));
router.get("/home", homeController.carregarHome);

router.get("/imc", imcController.mostrarImc);
router.post("/imc", imcController.calcularImc);

router.get("/cardapio", cardapioController.mostrarCardapioAtual);
router.get("/cardapios", cardapioController.listarCardapios);
router.get("/cardapios/:id", cardapioController.visualizarCardapio);

router.get("/diario",diarioController.listar);
router.get("/diario/novo",diarioController.mostrarCadastro);
router.post("/diario",diarioController.cadastrar);
router.get("/diario/:id/editar",diarioController.mostrarEdicao);
router.post("/diario/:id/editar",diarioController.editar);
router.post("/diario/:id/excluir",diarioController.excluir);

router.get("/quizzes", quizController.listarQuizzes);
router.get("/quizzes/resultado/:id", quizController.mostrarResultado);
router.get("/quizzes/:id", quizController.abrirQuiz);
router.post("/quizzes/:id/responder", quizController.responderQuiz);

router.get("/educacao", educacaoController.listarArtigos);
router.get("/educacao/:id", educacaoController.mostrarArtigo);

router.get("/nutricionistas",acompanhamentoController.listarNutricionistas);
router.get("/nutricionistas/:id",acompanhamentoController.visualizarNutricionista);
router.post("/nutricionistas/:id/solicitar",acompanhamentoController.solicitarAcompanhamento);
router.post("/nutricionistas/solicitacao/:id/cancelar",acompanhamentoController.cancelarSolicitacao);
router.post( "/acompanhamento/:id/encerrar", acompanhamentoController.encerrarAcompanhamento);

router.get("/perfil", perfilController.mostrarPerfil);
router.get("/perfil/editar", perfilController.mostrarEdicao);
router.post("/perfil/editar",uploadUsuario.single("foto"),perfilController.editarPerfil);

router.get("/classificacao", pontuacaoController.classificacao);

module.exports = router;
