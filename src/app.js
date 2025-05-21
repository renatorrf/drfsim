/**
 * arquivo: app.js
 * descriçao: arquivo responsavel por fazer a conexao com o arquivo 'server.js' 
 * data: 17/05/2022
 * autor: Renato Filho
*/

const express = require("express");
const cors = require("cors");

const app = express();

//> rotas da api fasthelp
const index = require("./routes/index");
const drfSim = require("./routes/drfSim.routes");

app.use(express.urlencoded({extended: true}, {limit: "50mb"}));
app.use(express.json()); // dizendo que minha api vai retornar para o front dados em json
app.use(express.json({type: "application/vnd.api+json"}));
app.use(cors());

app.use(index);
app.use("/drfSim/", drfSim);

module.exports = app;