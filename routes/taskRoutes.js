import express from "express";
import {validateCompleteQuery, validateLimit, validateOffset, ValidatePatchBody, validatePostBody, validateSearch, validateSortAndOrder, ValidateTaskId} from "../middleWares/middleWare.js"; 
import {getTaskController, postTaskController, updateTaskControllers , getAllTaskController, deleteTaskController} from "../controllers/taskController.js";
import { authenticateToken } from "../middleWares/authMiddlewares.js";
const router = express.Router();


router.use(authenticateToken);

// handeling get all tasks req
router.get("/" ,  validateSortAndOrder , validateSearch , validateCompleteQuery , validateLimit , validateOffset , getAllTaskController);


// handeling get request by id 
//getting validated by ValidateTaskId
router.get("/:id" ,  ValidateTaskId ,  getTaskController);


//handeling post request
router.post("/" ,  validatePostBody , postTaskController);


//handeling patch requests to update any key in any particular id 
//validating task id and the request body
router.patch("/:id"  , ValidateTaskId , ValidatePatchBody , updateTaskControllers);


//handeling delete request sent to delete a specific task
//validated using ValidateTaskId
router.delete("/:id" , ValidateTaskId , deleteTaskController);


//exporting so i can import in main express.js
export default router;