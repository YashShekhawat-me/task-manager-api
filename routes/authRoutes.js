import express from "express";
import { authenticateToken, validateCredentials } from "../middleWares/authMiddlewares.js";
import {loginController, registerationController} from "../controllers/authController.js"
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
} )
router.post("/login" , validateCredentials , loginController );
router.post("/register" , validateCredentials , registerationController);
export default router;