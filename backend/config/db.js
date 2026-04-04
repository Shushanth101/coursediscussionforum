import pg from 'pg';
const { Client, Pool } = pg;
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({
    connectionString: process.env.DB_URL
})

export default pool;