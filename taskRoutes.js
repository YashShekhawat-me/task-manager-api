import express from "express";
import { deleteTask , GetTaskByCompletion, listTasks} from "./taskServices.js";
import {auth, ValidatePatchBody, validatePostBody, ValidateTaskId} from "./middleWare.js"; 
import {getTaskController, postTaskController, updateTaskControllers , getAllTaskController, getTaskByCompletionController, deleteTaskController} from "./task-controller.js";
const router = express.Router();


//using authorization function 
router.use(auth);


// handeling get all tasks req
router.get("/" , getAllTaskController);


// filter task by completion using GetTaskByCompletion
router.get("/filter" , getTaskByCompletionController);


// handeling get request by id 
//getting validated by ValidateTaskId
router.get("/:id" , ValidateTaskId ,  getTaskController);


//handeling post request
router.post("/" , validatePostBody , postTaskController);


//handeling patch requests to update any key in any particular id 
//validating task id and the request body
router.patch("/:id" , ValidateTaskId , ValidatePatchBody , updateTaskControllers);


//handeling delete request sent to delete a specific task
//validated using ValidateTaskId
router.delete("/:id" , ValidateTaskId , deleteTaskController);


//exporting so i can import in main express.js
export default router;