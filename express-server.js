import express from "express";
import taskRoutes from "./taskRoutes.js";
const app = express();
//middlewares
app.use(express.json());
//taskroute
app.use("/tasks" ,taskRoutes);
//assigining time to every request
app.use((req, res, next) => {
    req.requestTime = new Date();
    next();
});
//display on cli every request type and url
app.use((req, res, next) => {
    console.log("Request received:", req.method, req.url);
    next();
});

app.get("/test" , (req , res) => {
    res.json({
        time : req.requestTime
    });
});

app.get("/error-test", (req, res, next) => {
    const error = new Error("Something broke");
    next(error);
});

app.get("/" , (req , res) => {
    res.json({
        message : "welcome to the taskManager API",
        command : "/tasks to see the current tasks"
    });
});

app.get("/search", (req, res) => {
    console.log(req.query);
    res.json(req.query);
});

app.listen(3000 , ()=>{
    console.log("express server running on port 3000");
});

app.use((err , req, res , next) => {
    console.log(err);
    const status = err.status || 500;

    res.status(status).json({
        message: err.message,
        successful : false 
    });
});