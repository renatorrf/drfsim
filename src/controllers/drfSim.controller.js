/* eslint-disable no-unused-vars */
/**
 * arquivo: config/database.js
 * descrição: arquivo responsável pela lógica do CRUD (API)
 * data: 14/04/2025
 * autor: Renato Filho
 * melhorias:
 *   - Uso da nova estrutura de transações
 *   - Melhor tratamento de erros
 */

const db = require("../config/database");
require("dotenv-safe").config();
const moment = require("moment");
const jwt = require("jsonwebtoken");

// Middleware de verificação de token (inalterado)
exports.verifyTokenSim = async (req, res, next) => {
  const token = req.headers.authorization;
  const tokenValido = process.env.AUTHTOKEN;

  if (token === tokenValido) {
    next();
  } else {
    return res.status(401).json({ auth: false, message: "Auth-Token inválido." });
  }
};

// Busca notas abertas com nova estrutura de transação
exports.buscaNotasAbertas = async (req, res) => {
  const { cnpj } = req.body;
  const COD_TIPO_COB = '4045'; // criado na base de homologacao
  const dataAtualMais5Dias = moment().add(5, 'days').format('YYYY.MM.DD');

  try {
    const result = await db.transactionalQuery(
      `SELECT 
        tp.num_cnpj_cpf,
        ttp.seq_titulo,
        ttp.num_titulo,
        ttp.val_original,
        ttp.val_juros,
        TO_CHAR(ttp.dta_emissao, 'YYYY-MM-DD') AS dta_emissao,
        TO_CHAR(ttp.dta_vencimento, 'YYYY-MM-DD') AS dta_vencimento,
        tp.nom_pessoa,
        ttp.cod_empresa,
        ttp.ind_tipo_titulo,
        ttp.ind_status
      FROM tab_titulo_pagar ttp
      INNER JOIN tab_pessoa tp ON (ttp.cod_pessoa_favorecido = tp.cod_pessoa)
      WHERE ttp.ind_status = 'A'
        AND tp.cod_pessoa <> '140552'
        AND tp.ind_natureza <> 'F'
        AND tp.num_cnpj_cpf NOT LIKE '07473735%'
        AND ttp.dta_vencimento <> ttp.dta_emissao
        AND tp.num_cnpj_cpf = $1
        AND ttp.cod_tipo_cobranca <> $2
        AND ttp.dta_vencimento >= $3`,
      [cnpj, COD_TIPO_COB, dataAtualMais5Dias]
    );
    
    res.status(200).json({
      titulos: result.rows
    });
  } catch (error) {
    console.error("Erro ao buscar títulos abertos:", error);
    res.status(500).json({
      message: "Falha em buscar títulos abertos, tente novamente.",
      error: error.message
    });
  }
};

// Fatura títulos com transação encapsulada
exports.faturaTitulos = async (req, res) => {
  const { titulos } = req.body;

  const NUM_TITULO = 99999;
  const COD_PESSOA_FAVORECIDO = 149285; // Banco Topazio
  const COD_TIPO_COBRANCA = 4045; // Tipo de cobrança Topazio
  const DES_OBSERVACAO = 'Fatura via API Topazio';
  const IND_TIPO = 'MA'; // tipo de titulo que estamos testando
  const IND_STATUS_ATIVO = 'A'; 
  const IND_STATUS_FATURADO = 'F';
  const COD_EMPRESA_PADRAO = 1;

  try {
    await db.transaction(async (client) => {
      for (const row of titulos) {
        const { dta_vencimento, seq_titulo, val_original, val_juros, cod_empresa } = row;

        // Busca títulos existentes
        const result = await client.query(
          `SELECT * FROM tab_titulo_pagar 
           WHERE dta_vencimento = $1 
             AND ind_tipo_titulo = $2
             AND ind_status = $3
             AND cod_tipo_cobranca = $4
             AND cod_empresa = $5
             AND cod_pessoa_favorecido = $6`,
          [dta_vencimento, IND_TIPO, IND_STATUS_ATIVO, COD_TIPO_COBRANCA, cod_empresa, COD_PESSOA_FAVORECIDO]
        );

        if (result.rowCount > 0) {
          // Atualiza título existente
          const faturaPai = parseInt(result.rows[0].seq_titulo);

          await client.query(
            `INSERT INTO tab_compoe_fatura (seq_fatura_pai, seq_fatura_filho) 
             VALUES ($1, $2)`,
            [faturaPai, seq_titulo]
          );

          await client.query(
            `UPDATE tab_titulo_pagar 
             SET ind_status = $1, 
                 des_observacao = COALESCE(des_observacao, '') || $2 
             WHERE seq_titulo = $3`,
            [IND_STATUS_FATURADO, ` ${faturaPai}`, seq_titulo]
          );

          await client.query(
            `UPDATE tab_titulo_pagar 
             SET val_original = val_original + $1, 
                 val_juros = val_juros + $2 
             WHERE seq_titulo = $3`,
            [val_original, val_juros, faturaPai]
          );
        } else {
          // Gera novo título
          await client.query(
            `SELECT sp_gera_titulo_a_pagar($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              cod_empresa,
              NUM_TITULO,
              COD_PESSOA_FAVORECIDO,
              moment(dta_vencimento).format('YYYY-MM-DD'),
              moment(dta_vencimento).format('YYYY-MM-DD'),
              COD_TIPO_COBRANCA,
              val_original,
              val_juros,
              DES_OBSERVACAO,
              IND_TIPO,
            ]
          );

          const currentValResult = await client.query("SELECT CURRVAL('gen_titulo_pagar')");
          const faturaPai = parseInt(currentValResult.rows[0]?.currval);

          await client.query(
            `INSERT INTO tab_compoe_fatura (seq_fatura_pai, seq_fatura_filho) 
             VALUES ($1, $2)`,
            [faturaPai, seq_titulo]
          );

          await client.query(
            `UPDATE tab_titulo_pagar 
             SET ind_status = $1, 
                 des_observacao = COALESCE(des_observacao, '') || $2 
             WHERE seq_titulo = $3`,
            [IND_STATUS_FATURADO, ` ${faturaPai}`, seq_titulo]
          );
        }
      }
    });

    res.status(200).json({
      message: "Títulos processados com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao processar títulos:", error);
    res.status(500).json({
      message: "Ocorreu um erro ao processar os títulos.",
      error: error.message
    });
  }
};

// Cria títulos com transação simplificada
exports.criaTitulos = async (req, res) => {
  const { dta_emissao, dta_vencimento, val_original, val_juros, cod_pessoa, cod_empresa } = req.body;

  const NUM_TITULO = 11111;
  const COD_TIPO_COBRANCA = 10; // carteira
  const DES_OBSERVACAO = 'TITULO PARA TESTE API';
  const IND_TIPO_TITULO = 'MA';

  try {
    await db.transaction(async (client) => {
      await client.query(
        "SELECT sp_gera_titulo_a_pagar($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [
          cod_empresa,
          NUM_TITULO,
          cod_pessoa,
          dta_emissao,
          dta_vencimento,
          COD_TIPO_COBRANCA,
          val_original,
          val_juros,
          DES_OBSERVACAO,
          IND_TIPO_TITULO,
        ]
      );
    });

    res.status(200).json({
      message: "Título gerado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao processar título:", error);
    res.status(500).json({
      message: "Ocorreu um erro ao processar o título.",
      error: error.message
    });
  }
};

// Verificação de saúde do banco simplificada
exports.checkDatabaseHealth = async (req, res) => {
  try {
    const result = await db.query('SELECT 1 + 1 AS result');

    res.status(200).json({
      healthy: true,
      report: {
        lucid: {
          displayName: 'Database',
          health: {
            healthy: true,
            message: 'Connection is healthy'
          },
          meta: {
            query: 'SELECT 1 + 1',
            result: result.rows[0].result
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao verificar saúde do banco:', error);
    res.status(500).json({
      healthy: false,
      report: {
        lucid: {
          displayName: 'Database',
          health: {
            healthy: false,
            message: 'Unable to reach the database server'
          },
          meta: {
            error: error.message
          }
        }
      }
    });
  }
};