import {AppError} from "../middleWares/error.js"
import { addTaskRepo, deleteById, getTaskById, listTaskRepo, updateTaskRepo } from "../repository/taskRepository.js";

//service to add task in database
export async function addTask(taskTitle , userId){
    const result = await addTaskRepo(taskTitle , userId);
    return result.rows[0];
}

//service used to list task by fetching it from database using sql queries
export async function listTasks(completed , limit , offset , sort , order , search , userId)
{
    const result = await listTaskRepo(completed ,limit , offset , sort , order , search , userId);
    return result;
}

//service to get task by id
export async function getTask(taskId , userId){
    const result = await getTaskById(taskId , userId);
    console.log(result);
    if(result.rows.length === 0)
    {
        throw new AppError("Task not found" , 404);
    }
    return result.rows[0];
}

//service to delete a task
export async function deleteTask(taskId , userId)
{
    const result = await deleteById(taskId , userId);
    if(result.rows.length === 0)
    {
        throw new AppError("Task not found" , 404);
    }
    return result.rows[0];
}

// service to combine all patch requests 
export async function UpdateTask(taskId , body , userId){
    

    const result = await updateTaskRepo(taskId , body , userId);
    if(result.rows.length === 0)
    {
        throw new AppError("Error 404 Task Not Found" , 404);
    }
    return result.rows[0];
}
