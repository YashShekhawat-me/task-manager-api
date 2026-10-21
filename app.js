//imports needed
import express from "express";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { AppError, errorHandeler} from "./middleWares/error.js";
import responseTime from "response-time";
import cors from "cors";

//starting express in the js file
const app = express();

app.use(cors({
    origin: "http://localhost:3000"
}))
//middlewares
if(process.env.NODE_ENV !== "test") {
    app.use(responseTime((req, res, time) => {
        console.log(`[${req.method}] ${req.url} - ${time.toFixed(2)}ms`);
    }));
}

//middleware to automatically parse incoming json request bodies in normal javascript objects
app.use(express.json());

//taking every req that starts with /tasks to taskroutes
app.use("/tasks" ,taskRoutes);

//taking every request that starts with /auth to authRoutes
app.use("/auth" , authRoutes);

//the home directory or the base directory so it shows a welcoming message
app.get("/" , (req , res) => {
    res.json({
        message : "welcome to the taskManager API",
        command : "/tasks to see the current tasks"
    });
});

app.use((req , res , next) => {
    return next(new AppError(`${req.path} path is not defined` , 404));
})
//error handeler so the client doesnt get our internal errors
app.use(errorHandeler);

export default app;