const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    return res.render("home", {
        titulo: "NutriTech"
    });
});

module.exports = router;