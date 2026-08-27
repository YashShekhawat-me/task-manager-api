//imports needed
import express from "express";
import taskRoutes from "./taskRoutes.js";
import { errorHandeler} from "./error.js";

//starting express in the js file
const app = express();

//middlewares


//middleware to tell that our request are going to be json 
app.use(express.json());

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

//taking every req that starts with /tasks to taskroutes
app.use("/tasks" ,taskRoutes);

//to check if the time middleware is working
app.get("/testTime" , (req , res) => {
    res.json({
        time : req.requestTime
    });
});

//to understand the how the errors are handled
app.get("/error-test", (req, res, next) => {
    const error = new Error("Something broke");
    next(error);
});

//the home directory or the base directory so it shows a welcoming message
app.get("/" , (req , res) => {
    res.json({
        message : "welcome to the taskManager API",
        command : "/tasks to see the current tasks"
    });
});



//error handeler so the client doesnt get our internal errors
app.use(errorHandeler);


// assigning the port
app.listen(3000 , ()=>{
    console.log("express server running on port 3000");
});