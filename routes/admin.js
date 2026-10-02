const express = require("express");
const router = express.Router();

const {verificarAdmin,impedirUsuarioLogado} = require("../middlewares/autenticacao");
const authController = require("../controllers/admin/authController");
const homeController = require("../controllers/admin/homeController");
const usuarioController = require("../controllers/admin/usuarioController");
const nutricionistaController = require("../controllers/admin/nutricionistaController");
const acompanhamentoController = require("../controllers/admin/acompanhamentoController");

router.get("/login", impedirUsuarioLogado, authController.mostrarLogin);
router.post("/login", impedirUsuarioLogado, authController.login);
router.get("/logout", verificarAdmin, authController.logout);

router.get("/home", verificarAdmin, homeController.home);

router.get("/usuarios", verificarAdmin, usuarioController.listar);
router.post("/usuarios/:id/desativar",verificarAdmin,usuarioController.desativar);
router.post("/usuarios/:id/reativar",verificarAdmin,usuarioController.reativar);

router.get("/nutricionistas",verificarAdmin,nutricionistaController.listar);
router.get("/nutricionistas/:id",verificarAdmin,nutricionistaController.analisar);
router.post("/nutricionistas/:id/aprovar",verificarAdmin,nutricionistaController.aprovar);
router.post("/nutricionistas/:id/recusar",verificarAdmin,nutricionistaController.recusar);
router.post("/nutricionistas/:id/desativar",verificarAdmin,nutricionistaController.desativar);
router.post("/nutricionistas/:id/reativar",verificarAdmin,nutricionistaController.reativar);

router.get("/acompanhamentos",verificarAdmin,acompanhamentoController.listar);

module.exports = router;
