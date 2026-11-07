import express from "express";
import { authenticateToken, validateCredentials } from "../middleWares/authMiddlewares.js";
import {loginController, logoutController, registerationController} from "../controllers/authController.js"
const router = express.Router();


router.get("/" , (req , res) => {
    res.json({
        message: "send a post request at /login for login , or /register for register",
        format: "{email: `your email`, password: `YourPass@123`}",
        successful : true 
    });
});

router.get("/me" , authenticateToken , async (req ,res) => {
    res.status(200).json({authentication : "successful" , user : req.user.id});    
});

router.get("/login" , (req , res) => {
    res.json({
        message: "send a post request at this route with your mail , and password in body",
        format: "{ email : 'xyz@123.com' , password: 'your pass'}"
    });
});

router.post("/logout" , logoutController);
router.post("/login" , validateCredentials , loginController );
router.post("/register" , validateCredentials , registerationController);
export default router;