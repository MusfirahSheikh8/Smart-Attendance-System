const oracledb = require('oracledb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

try {
    oracledb.initOracleClient();
    console.log('initOracleClient succeeded (THICK mode)');
} catch (err) {
    console.warn('initOracleClient failed (THIN mode fallback):', err.message);
}

async function testConnection() {
  let connection;

  try {
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`
    };

    console.log('Testing connection with:', { ...config, password: '****' });

    connection = await oracledb.getConnection(config);

    console.log('Successfully connected to Oracle!');
    const mode = oracledb.thin ? 'THIN' : 'THICK';
    console.log('Driver Mode:', mode);
    
    const result = await connection.execute('SELECT banner FROM v$version');
    console.log('Database Version:', result.rows[0].BANNER || result.rows[0][0]);

  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

testConnection();
