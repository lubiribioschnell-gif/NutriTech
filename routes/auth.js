const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const { impedirUsuarioLogado } = require("../middlewares/autenticacao");

const loginController = require("../controllers/auth/loginController");
const cadastroController = require("../controllers/auth/cadastroController");
const sessaoController = require("../controllers/auth/sessaoController");
const recuperacaoController = require("../controllers/auth/recuperacaoController");

router.get("/login", impedirUsuarioLogado, loginController.mostrar);
router.post("/login", impedirUsuarioLogado, loginController.entrar);

// Recuperação de senha
router.get("/recuperar-senha", impedirUsuarioLogado, recuperacaoController.mostrar);
router.post("/recuperar-senha", impedirUsuarioLogado, recuperacaoController.solicitar);
router.get("/recuperar-senha/redefinir/:token", recuperacaoController.formularioRedefinicao);
router.post("/recuperar-senha/redefinir", recuperacaoController.redefinir);

router.get("/cadastro", impedirUsuarioLogado, cadastroController.mostrarEscolha);
router.post("/cadastro", impedirUsuarioLogado, cadastroController.escolherTipo);
router.get("/escolherCadastro",cadastroController.mostrarEscolha);
router.get("/cadastro/usuario",impedirUsuarioLogado,cadastroController.mostrarUsuario);
router.get("/cadastro/nutricionista",impedirUsuarioLogado,cadastroController.mostrarNutricionista);
router.post("/cadastroUsuario",impedirUsuarioLogado,upload.single("foto"),cadastroController.cadastrarUsuario);
router.post("/cadastroNutricionista",impedirUsuarioLogado,upload.single("foto"),cadastroController.cadastrarNutricionista);

router.get("/logout", sessaoController.sair);

module.exports = router;
