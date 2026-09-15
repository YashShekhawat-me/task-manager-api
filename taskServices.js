import pool from "./db.js";
import {AppError} from "./error.js"
import { addTaskRepo, deleteById, getTaskByCompletionRepo, getTaskById, listTaskRepo, updateTaskRepo } from "./repository.js";

//service to add task in database
export async function addTask(taskTitle){
    const result = await addTaskRepo(taskTitle);
    return result.rows[0];
}

//service used to list task by fetching it from database using sql queries
export async function listTasks()
{
    const result = await listTaskRepo();
    return result.rows;
}

//service to get task by id
export async function getTask(taskId){
    const result = await getTaskById(taskId);
    if(result.rows.length === 0)
    {
        throw new AppError("Task not found" , 404);
    }
    return result.rows[0];
}

//service to delete a task
export async function deleteTask(taskId)
{
    const result = await deleteById(taskId);
    if(result.rows.length === 0)
    {
        throw new AppError("Task not found" , 404);
    }
    return result.rows[0];
}

//service to filter tasks based on its completion state
export async function GetTaskByCompletion(completed){
    const result = await getTaskByCompletionRepo(completed);
    return result.rows;
}


// service to combine all patch requests 
export async function UpdateTask(taskId , body){
    

    const result = await updateTaskRepo(taskId , body);
    if(result.rows.length === 0)
    {
        throw new AppError(" Error 404 Task Not Found" , 404);
    }
    return result.rows[0];
}
