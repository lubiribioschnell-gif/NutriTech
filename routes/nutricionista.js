const express = require("express");
const router = express.Router();

const {verificarNutricionista} = require("../middlewares/autenticacao");

const uploadNutricionista = require("../middlewares/uploadNutricionista");

const homeController = require("../controllers/nutricionista/homeController");
const cardapioController = require("../controllers/nutricionista/cardapioController");
const refeicaoController = require("../controllers/nutricionista/refeicaoController");
const alimentoController = require("../controllers/nutricionista/alimentoController");
const quizController = require("../controllers/nutricionista/quizController");
const solicitacaoController = require("../controllers/nutricionista/solicitacaoController");
const pacienteController = require("../controllers/nutricionista/pacienteController");
const perfilController = require("../controllers/nutricionista/perfilController");

router.get("/ajuda", verificarNutricionista, (req, res) => res.render("perguntasFrequentes", { titulo: "Perguntas frequentes" }));

router.get("/home",verificarNutricionista,homeController.home);

router.get("/cardapios/novo",verificarNutricionista,cardapioController.mostrarNovo);
router.get("/cardapios", verificarNutricionista, cardapioController.listar);
router.post("/cardapios",verificarNutricionista,cardapioController.cadastrar);
router.get("/cardapios/:id/refeicoes",verificarNutricionista,refeicaoController.listarDoCardapio);
router.post("/cardapios/:id/refeicoes",verificarNutricionista,refeicaoController.cadastrar);

router.get("/refeicoes/:id/alimentos",verificarNutricionista,alimentoController.listarDaRefeicao);
router.post("/refeicoes/:id/alimentos",verificarNutricionista,alimentoController.adicionarExistente);
router.post("/refeicoes/:id/alimentos/novo",verificarNutricionista,alimentoController.cadastrarEAdicionar);

router.post("/itens-refeicao/:id/editar",verificarNutricionista,alimentoController.editarQuantidade);
router.post("/itens-refeicao/:id/remover",verificarNutricionista,alimentoController.removerItem);

router.get("/quizzes/novo",verificarNutricionista,quizController.mostrarNovo);
router.post("/quizzes",verificarNutricionista,quizController.cadastrar);
router.get("/quizzes/:id/perguntas",verificarNutricionista,quizController.listarPerguntas);
router.post("/quizzes/:id/perguntas",verificarNutricionista, quizController.cadastrarPergunta);

router.get("/solicitacoes",verificarNutricionista,solicitacaoController.listar);
router.post("/solicitacoes/:id/aceitar",verificarNutricionista,solicitacaoController.aceitar);
router.post("/solicitacoes/:id/recusar",verificarNutricionista,solicitacaoController.recusar);

router.get("/pacientes",verificarNutricionista,pacienteController.listar);

router.get("/diario/:idUsuario",verificarNutricionista,pacienteController.visualizarDiario);

router.get("/perfil",verificarNutricionista,perfilController.mostrarPerfil);
router.get("/perfil/editar",verificarNutricionista,perfilController.mostrarEdicao);
router.post("/perfil/editar", verificarNutricionista, uploadNutricionista.single("foto"), perfilController.editar);

router.get("/cardapios/:id/editar",verificarNutricionista,cardapioController.mostrarEdicao);
router.post("/cardapios/:id/editar",verificarNutricionista,cardapioController.editar);
router.post("/cardapios/:id/excluir",verificarNutricionista,cardapioController.excluir);

router.get("/refeicoes/:id/editar",verificarNutricionista,refeicaoController.mostrarEdicao);
router.post("/refeicoes/:id/editar",verificarNutricionista,refeicaoController.editar);
router.post("/refeicoes/:id/excluir",verificarNutricionista,refeicaoController.excluir);

router.get("/alimentos/:id/editar",verificarNutricionista,alimentoController.mostrarEdicao);
router.post("/alimentos/:id/editar",verificarNutricionista,alimentoController.editar);

router.get("/quizzes",verificarNutricionista,quizController.listar);
router.get("/quizzes/:id/editar",verificarNutricionista,quizController.mostrarEdicao);
router.post("/quizzes/:id/editar",verificarNutricionista,quizController.editar);
router.post("/quizzes/:id/excluir",verificarNutricionista,quizController.excluir);

router.get("/perguntas/:id/editar",verificarNutricionista,quizController.mostrarEditarPergunta);
router.post("/perguntas/:id/editar",verificarNutricionista,quizController.editarPergunta);
router.post("/perguntas/:id/excluir",verificarNutricionista,quizController.excluirPergunta);

router.get("/quizzes/:id/estatisticas",verificarNutricionista,quizController.estatisticas);

module.exports = router;
