//imports needed
import express from "express";
import taskRoutes from "./routes/taskRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { AppError, errorHandeler} from "./middleWares/error.js";
import responseTime from "response-time";
import cors from "cors";
import cookieParser from "cookie-parser";
import pool from "./db.js";


//starting express in the js file
const app = express();
app.use(cors({
    origin: "http://localhost:3000"
}))
//middlewares

//middleware to automatically parse incoming json request bodies in normal javascript objects
app.use(express.json());
app.use(cookieParser());


if(process.env.NODE_ENV !== "test") {
    app.use(responseTime((req, res, time) => {
        console.log(`[${req.method}] ${req.url} - ${time.toFixed(2)}ms`);
    }));
}
//taking every req that starts with /tasks to taskroutes
app.use("/tasks" ,taskRoutes);

//taking every request that starts with /auth to authRoutes
app.use("/auth" , authRoutes);

app.get('/.well-known/appspecific/com.chrome.devtools.json' , (req , res) => {
    res.status(200).json({});
})

app.get("/health" , async (req , res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            status: "OK",
            database: "Connected"
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        res.status(503).json({
            status: "ERROR",
            database: "Disconnected"
        });
    }
})

//the home directory or the base directory so it shows a welcoming message
app.get("/" , (req , res) => {
    res.json({
        message : "welcome to the taskManager API",
        login : "for login go to /auth/login",
        register: "to register go to /auth/register",
        currentUser: "to check current logged in user"
    });
});

app.use((req , res , next) => {
    return next(new AppError(`${req.path} path is not defined` , 404));
})
//error handeler so the client doesnt get our internal errors
app.use(errorHandeler);

export default app;