import {listTasks, UpdateTask , getTask , addTask , GetTaskByCompletion , deleteTask} from "./taskServices.js";

//controller for the patch requests
export async function updateTaskControllers(req , res){
    const task = await UpdateTask(req.TaskId , req.body);
    res.status(200).json(task);
}

//controller for the get task by id request
export async function getTaskController(req , res)
{
    const task = await getTask(req.TaskId);
    res.status(200).json(task);
}

//controller for the post requests
export async function postTaskController(req , res)
{
    const newTask = await addTask(req.body.title);
    res.status(201).json({
        message: "task created!!",
        task: newTask
    });
}

//controller for the get all task request
export async function getAllTaskController(req , res)
{
    res.json(await listTasks( req.completed, req.limit , req.offset , req.sort , req.order , req.search));
}

//controller for the get request by filter
export async function getTaskByCompletionController(req , res)
{
    res.status(200).json({
        message: "requested task",
        tasks: await GetTaskByCompletion(req.completed)
    });
}

export async function deleteTaskController(req , res)
{
    await deleteTask(req.TaskId);
    res.status(200).json({
        message: "task deleted successfully",
        successful : true
    });
}