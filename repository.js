import pool from "./db.js";

export async function getTaskById(taskId){
    return await pool.query("select * from tasks where id = $1" , [taskId]);
}

export async function addTaskRepo(taskTitle){
    return await pool.query("INSERT INTO tasks (title) VALUES ($1) RETURNING *" , [taskTitle]);
}

export async function deleteById(taskId){
    return await pool.query("DELETE FROM tasks WHERE ID = $1 RETURNING *" , [taskId]);
}

export async function listTaskRepo(completed , limit , offset){
    // return await pool.query("select * from tasks limit $1 offset $2" , [limit , offset]);
    const conditions = [];
    const values = [];
    let queryParamNum = 1;
    if(completed !== undefined){
        conditions.push("where completed = $" + queryParamNum);
        queryParamNum++;
        values.push(completed);
    }
    conditions.push("limit $" + queryParamNum);
    values.push(limit);
    queryParamNum++;
    conditions.push("offset $" + queryParamNum);
    values.push(offset);
    const sqlQuery = conditions.join(" ");
    const query = "select * from tasks " + sqlQuery;
    return await pool.query(query , values);
}

export async function getTaskByCompletionRepo(completed){
    return await pool.query("select * from tasks where completed = $1" , [completed]);
}

export async function updateTaskRepo(taskId , body) {
    const fields = [];
    const values = [];
    let queryParamNum = 1;
    if(Object.hasOwn(body , "completed"))
    {
        fields.push("completed = $" + queryParamNum);
        values.push(body.completed);
        queryParamNum = queryParamNum + 1;
    }
    if(Object.hasOwn(body , "title"))
    {
        fields.push("title = $" + queryParamNum);
        values.push(body.title);
        queryParamNum = queryParamNum + 1;
    }
    values.push(taskId);
    const SqlQuery = fields.join(", ");
    const query = "UPDATE tasks " + "SET " +  SqlQuery + " where id = $" + queryParamNum + " RETURNING *";
    return await pool.query(query , values);
}