const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'finetern_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

/**
 * Memverifikasi konektivitas ke database MySQL
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    connection.release();
    return {
      connected: true,
      message: 'MySQL pool successfully connected to ' + (process.env.DB_NAME || 'finetern_db'),
    };
  } catch (error) {
    return {
      connected: false,
      message: error.message,
    };
  }
}

module.exports = {
  pool,
  testConnection,
};
