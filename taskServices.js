import {AppError} from "./middleWares/error.js"
import { addTaskRepo, deleteById, getTaskById, listTaskRepo, updateTaskRepo } from "./repository.js";

//service to add task in database
export async function addTask(taskTitle){
    const result = await addTaskRepo(taskTitle);
    return result.rows[0];
}

//service used to list task by fetching it from database using sql queries
export async function listTasks(completed , limit , offset , sort , order , search)
{
    const result = await listTaskRepo(completed ,limit , offset , sort , order , search);
    return result;
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

// service to combine all patch requests 
export async function UpdateTask(taskId , body){
    

    const result = await updateTaskRepo(taskId , body);
    if(result.rows.length === 0)
    {
        throw new AppError(" Error 404 Task Not Found" , 404);
    }
    return result.rows[0];
}
