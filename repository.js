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

export async function listTaskRepo(completed , limit , offset , sort , order , search){
    const conditions = [];
    const snlo = [];
    const values = [];
    let queryParamNum = 1;
    if(completed !== undefined){
        conditions.push("completed = $" + queryParamNum);
        queryParamNum++;
        values.push(completed);
    }
    if(sort !== undefined){
        snlo.push("order by " + sort + " " + order);
    }
    if(search !== undefined){
        conditions.push("title ILIKE $" + queryParamNum);
        values.push(`%${search}%`);
        queryParamNum++;
    }
    snlo.push("limit $" + queryParamNum);
    values.push(limit);
    queryParamNum++;
    snlo.push("offset $" + queryParamNum);
    values.push(offset);
    const conditionsQuery = " where " + conditions.join(" and ");
    const snloQuery = snlo.join(" ");
    let query;
    if(conditions.length === 0){
        query =   "select * from tasks " + snloQuery + ";"
    } else {
        query = "select * from tasks" + conditionsQuery + " " + snloQuery + ";" ;
    }
    console.log(query);
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