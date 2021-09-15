require('dotenv').config();
const Pool = require('pg').Pool;

//connection string

const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE
})

//queries

module.exports = pool;