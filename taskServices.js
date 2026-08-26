import pool from "./db.js";

export async function addTask(taskTitle){
    const result = await pool.query("INSERT INTO tasks (title) VALUES ($1) RETURNING *" , [taskTitle]);
    return result.rows[0];
}
export async function listTasks()
{
    const result = await pool.query("");
}

export async function getTask(taskId){
    const result = await pool.query("select * from tasks where id = $1" , [taskId]);
    if(result.rows.length === 0)
    {
        const error = new Error("task not found");
        error.status = 404;
        throw error;
    }
    return result.rows[0];
}

export async function completeTask(taskId)
{
    const result =await pool.query("UPDATE tasks SET COMPLETED = TRUE WHERE ID = $1 RETURNING *" , [taskId]);
    if(result.rows.length === 0 ){
        const error = new Error("task not found");
        error.status = 404;
        throw error;
    }
    return result.rows[0];
}

export async function deleteTask(taskId)
{
    const result = await pool.query("DELETE FROM tasks WHERE ID = $1 RETURNING *" , [taskId]);
    if(result.rows.length === 0)
    {
        const error = new Error("task not found");
        error.status = 404;
        throw error;
    }
    return result.rows[0];
}

export async function GetTaskByCompletion(completed){
    const result = await pool.query("select * from tasks where completed = $1" , [completed]);
    return result.rows;
} 