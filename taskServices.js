import pool from "./db.js";
import {AppError} from "./error.js"

//service to add task in database
export async function addTask(taskTitle){
    const result = await pool.query("INSERT INTO tasks (title) VALUES ($1) RETURNING *" , [taskTitle]);
    return result.rows[0];
}

//service used to list task by fetching it from database using sql queries
export async function listTasks()
{
    const result = await pool.query("select * from tasks");
    return result.rows;
}

//service to get task by id
export async function getTask(taskId){
    const result = await pool.query("select * from tasks where id = $1" , [taskId]);
    return result.rows[0];
}

// service to complete a task
export async function completeTask(taskId)  
{
    const result =await pool.query("UPDATE tasks SET COMPLETED = TRUE WHERE ID = $1 RETURNING *" , [taskId]);
    return result.rows[0];
}

//service to delete a task
export async function deleteTask(taskId)
{
    const result = await pool.query("DELETE FROM tasks WHERE ID = $1 RETURNING *" , [taskId]);
    return result.rows[0];
}

//service to filter tasks based on its completion state
export async function GetTaskByCompletion(completed){
    const result = await pool.query("select * from tasks where completed = $1" , [completed]);
    return result.rows;
} 


// servie to combine all patch requests 
export async function UpdateTask(taskId , body){
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

    const result = await pool.query(query , values);
    if(result.rows.length === 0)
    {
        throw new AppError(" Error 404 Task Not Found" , 404);
    }
    return result.rows[0];
}