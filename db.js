import pg from "pg";
import dotenv from "dotenv";
dotenv.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"
});
const {Pool} = pg;

//hidden database host username , passwords using .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export default pool;