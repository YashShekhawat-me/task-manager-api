//imports needed
import express from "express";
import taskRoutes from "./taskRoutes.js";
import { errorHandeler} from "./error.js";
import { attachTimeToRequest , displayOnCli, errorTest, testTime } from "./server-services.js";
import responseTime from "response-time";

//starting express in the js file
const app = express();

//middlewares
app.use(responseTime((req, res, time) => {
  console.log(`[${req.method}] ${req.url} - ${time.toFixed(2)}ms`);
}));
//middleware to automatically parse incoming json request bodies in normal javascript objects
app.use(express.json());

//assigining time to every request
app.use(attachTimeToRequest);

//display on cli every request type and url
app.use(displayOnCli);

//taking every req that starts with /tasks to taskroutes
app.use("/tasks" ,taskRoutes);

//to check if the time middleware is working
app.get("/testTime" , testTime);

//to understand the how the errors are handled
app.get("/error-test", errorTest);

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