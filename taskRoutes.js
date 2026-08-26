import express from "express";
import {addTask ,completeTask , deleteTask , getTask, GetTaskByCompletion} from "./taskServices.js";
import {auth} from "./middleWare.js"; 
import pool from "./db.js";
const router = express.Router();

router.use(auth);

router.get("/" , async (req , res) => {
    const result = await pool.query("SELECT * FROM tasks");
    res.json(result.rows);
});

router.get("/filter" , async (req , res) => {
    const completed = req.query.completed === "true";
    res.status(200).json({
        message: "requested task",
        tasks: GetTaskByCompletion(completed)
    });
});

router.get("/:id" , async (req , res) => {
    res.json(await getTask(Number(req.params.id)));
});

router.post("/" , async (req , res)=>{
    const newTask = await addTask(req.body.title);
    res.status(201).json({
        message : "task created",
        task : newTask
    });
});

router.patch("/:id" , async (req , res) => {
    await completeTask(Number(req.params.id));
    res.status(200).json({
        message: "task completed",
        successful : true
    }); 
});

router.delete("/:id" ,async (req , res) => {
    await deleteTask(Number(req.params.id));
    res.status(200).json({
        message: "task deleted successfully",
        successful : true
    });
});

export default router;