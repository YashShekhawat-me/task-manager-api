//imports needed
import express from "express";
import taskRoutes from "./routes/taskRoutes.js";
import { errorHandeler} from "./middleWares/error.js";
import responseTime from "response-time";

//starting express in the js file
const app = express();

//middlewares
app.use(responseTime((req, res, time) => {
  console.log(`[${req.method}] ${req.url} - ${time.toFixed(2)}ms`);
}));

//middleware to automatically parse incoming json request bodies in normal javascript objects
app.use(express.json());

//taking every req that starts with /tasks to taskroutes
app.use("/tasks" ,taskRoutes);

//the home directory or the base directory so it shows a welcoming message
app.get("/" , (req , res) => {
    res.json({
        message : "welcome to the taskManager API",
        command : "/tasks to see the current tasks"
    });
});

//error handeler so the client doesnt get our internal errors
app.use(errorHandeler);

export default app;