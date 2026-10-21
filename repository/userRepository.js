import pool from "../db.js";

export async function createUserRepo (email , passwordHash){
    return await pool.query(
        `INSERT INTO users (email , password_hash) 
        VALUES ($1 , $2) 
        RETURNING id , email , created_at` ,
        [email , passwordHash]
    );
}

export async function findUserByEmailRepo(email){
    return await pool.query(`SELECT id , email , password_hash , created_at
        FROM USERS WHERE EMAIL = $1` ,
        [email]
    );
}