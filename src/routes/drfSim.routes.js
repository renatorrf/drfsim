/**
 * arquivo: routes/fasthelproutes.js
 * descriçao: arquivo responsavel pelas rotas da API
 * data: 14/03/2022
 * autor: Renato Filho
*/

const router = require("express-promise-router")();
const drfSim = require("../controllers/drfSim.controller");

//=> Definindo as rotas do CRUD - Fasthelp

// => Rota para criar/inserir usuario : (POST) : localhost:3000/api/fasthelp-createUser
//festhelp-user abaixo é a rota que insere no postman para acessar esse metodo (createUser).

router.post("/buscaNotasAbertas", drfSim.verifyTokenSim, drfSim.buscaNotasAbertas);

router.post("/faturaTitulos", drfSim.verifyTokenSim, drfSim.faturaTitulos); 

router.post("/criaTitulos", drfSim.verifyTokenSim, drfSim.criaTitulos); 

router.post("/checkDatabaseHealth", drfSim.verifyTokenSim, drfSim.checkDatabaseHealth);

module.exports = router;