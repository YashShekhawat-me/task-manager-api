import pg from "pg";
import "dotenv/config";
const {Pool} = pg;


//hidden database host username , passwords using .env file
const pool = new Pool({
    user:process.env.DB_USER,
    host:process.env.DB_HOST,
    database:process.env.DB_NAME,
    password:process.env.DB_PASSWORD,
    port:process.env.DB_PORT
});

export default pool;