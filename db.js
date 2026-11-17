import pg from "pg";
import dotenv from "dotenv";
dotenv.config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"
});
const {Pool} = pg;

// making a connection pool to neon pg databse
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export default pool;