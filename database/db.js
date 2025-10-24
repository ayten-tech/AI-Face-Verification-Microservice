const { Pool } = require('pg');
const config = require('../config.example');

// Create PostgreSQL connection pool
const pool = new Pool(config.database);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool for transactions
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Graceful shutdown
const close = async () => {
  await pool.end();
  console.log('Database pool closed');
};

module.exports = {
  query,
  getClient,
  close,
  pool
};

