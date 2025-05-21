/**
 * arquivo: config/database.js
 * descrição: arquivo responsável pelas conexões e transações no banco de dados PostgreSQL
 * data: 14/04/2025
 * autor: Renato Filho
 * melhorias: 
 *   - Suporte a transações isoladas
 *   - Gerenciamento de conexões mais robusto
 *   - Melhor tratamento de erros
 */

const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// Configuração mais segura usando variáveis de ambiente
const config = {
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD ? encodeURIComponent(process.env.PG_PASSWORD) : encodeURIComponent('1qazxsw2#'),
  host: process.env.PG_HOST || '192.168.254.201',
  port: process.env.PG_PORT || 5434,
  database: process.env.PG_DATABASE || 'dev_emsys',
  max: 20, // número máximo de clientes no pool
  idleTimeoutMillis: 30000, // tempo em ms que um cliente pode ficar idle no pool
  connectionTimeoutMillis: 2000, // tempo máximo para tentar conectar
};

const pool = new Pool(config);

// Eventos do pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err.stack);
  // Não encerra o processo automaticamente para evitar downtime
});

pool.on('connect', () => {
  console.log('Nova conexão estabelecida com o banco de dados');
});

pool.on('acquire', () => {
  console.debug('Cliente adquirido do pool');
});

pool.on('remove', () => {
  console.debug('Cliente removido do pool');
});

/**
 * Executa uma query simples sem transação
 * @param {string} text Query SQL
 * @param {Array} params Parâmetros da query
 * @returns {Promise<QueryResult>} Resultado da query
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    console.debug('Executando query:', { text, params });
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.debug('Query executada em:', { duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Erro na query:', { text, params, error: err.stack });
    throw err;
  }
};

/**
 * Executa uma função em uma transação isolada
 * @param {Function} callback Função que recebe um cliente de transação e retorna um Promise
 * @returns {Promise} Resultado da função callback
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.debug('Transação iniciada');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    console.debug('Transação commitada com sucesso');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transação revertida devido a erro:', err.stack);
    throw err;
  } finally {
    client.release();
    console.debug('Cliente liberado de volta para o pool');
  }
};

/**
 * Executa uma única query em uma transação
 * @param {string} text Query SQL
 * @param {Array} params Parâmetros da query
 * @returns {Promise<QueryResult>} Resultado da query
 */
const transactionalQuery = async (text, params) => {
  return await transaction(async (client) => {
    console.debug('Executando query transacional:', { text, params });
    return await client.query(text, params);
  });
};

module.exports = {
  query,
  transaction,
  transactionalQuery,
  // Exporta o pool para casos específicos (não recomendado para uso geral)
  getPool: () => pool,
};