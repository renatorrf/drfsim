/**
 * arquivo: routes/index.js
 * descriçao: arquivo responsavel pela chamada da API na aplicaçao no lado do back-end
 * data: 14/03/2022
 * autor: Renato Filho
*/

const express = require("express"); // sempre instanciar o express numa variavel pois ele fará a rota de acesso


const router = express.Router();

router.get("/api", (req, res) => {
     res.status(200).send({
        success: "Voce conseguiu!",
        message: "Seja bem vindo a API node.js + PostgreSQL da rede SIM",
        version: "1.0.0"
    });
});

module.exports = router;