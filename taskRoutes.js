import express from "express";
import {addTask ,completeTask , deleteTask , getTask, GetTaskByCompletion, listTasks} from "./taskServices.js";
import {auth, ValidateTaskId} from "./middleWare.js"; 
import pool from "./db.js";
import {AppError} from "./error.js";
const router = express.Router();

//using authorization function 
router.use(auth);

// handeling get all tasks req
router.get("/" , async (req , res) => {
    res.json(await listTasks());
});

// filter task by completion using GetTaskByCompletion
router.get("/filter" , async (req , res) => {
    const completed = req.query.completed === "true";
    res.status(200).json({
        message: "requested task",
        tasks: await GetTaskByCompletion(completed)
    });
});

// handeling get request by id 
//getting validated by ValidateTaskId
router.get("/:id" , ValidateTaskId ,  async (req , res) => {
    res.json(await getTask(req.TaskId));
});

//handeling post request
//dev notes -  the validation is also being done here have to change it
router.post("/" , async (req , res)=>{
    
    if(typeof req.body !== "object" || req.body == null || Array.isArray(req.body)){
        throw new AppError("request body must be an object" , 400);
    }

    const {title} = req.body;
    
    if(typeof title !== "string" || title.trim().length === 0 || title.trim().length>100){
        throw new AppError("title must be between 1 to 100 character" , 400);
    }
    const newTask = await addTask(title);
    res.status(201).json({
        message : "task created",
        task : newTask
    });
});


//handeling patch request sent to complete a specific task
//validated using ValidateTaskId
router.patch("/:id" , ValidateTaskId , async (req , res) => {
    const task = await completeTask(req.TaskId);
    res.status(200).json(task); 
});

//handeling delete request sent to delete a specific task
//validated using ValidateTaskId
router.delete("/:id" , ValidateTaskId , async (req , res) => {
    await deleteTask(id);
    res.status(200).json({
        message: "task deleted successfully",
        successful : true
    });
});

//exporting so i can import in main express.js
export default router;