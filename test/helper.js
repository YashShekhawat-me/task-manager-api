import pool from "../db.js";
export async function resetDB(){
    if(!process.env.DB_NAME.endsWith("_test")){
        throw new Error("refusing to run tests on a non-test database");
    }
    await pool.query("TRUNCATE tasks RESTART IDENTITY");
}

export async function seedDb() {
    await pool.query(`insert into tasks (title , completed) values ($1 , $2) ,($3 , $4) , ($5 , $6)` ,
            ["buy milk" , false , "test node" , false , "learn jest" , true]);
}
