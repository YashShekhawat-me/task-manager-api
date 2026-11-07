import { AppError } from "../middleWares/error.js";
import {loginUser, registerUser} from "../services/authServices.js";

export async function registerationController(req , res , next){
    try {
        const user = await registerUser(req.body.email , req.body.password);
        return res.status(201).json({
            successful: true,
            user
        });
    } catch (error) {
        return next(error);
    }
}

export async function loginController(req , res , next) {
    try {
        const response = await loginUser(req.body.email , req.body.password);
        const secureEnv = process.env.NODE_ENV === "production";
        res.cookie("access_token" , response.token , {
            httpOnly : true ,
            secure : secureEnv,
            sameSite : "lax",
            path: "/" ,
            maxAge: 4*60*60*1000
        });
        return res.status(200).json({
            successful:true,
            user : response.user
        })
    } catch(error) {
        return next(error);
    }
}

export async function logoutController(req , res , next){
    const secureEnv = process.env.NODE_ENV === "production";
    res.cookie("access_token" , "" , {
            httpOnly : true ,
            secure : secureEnv,
            sameSite : "lax",
            path: "/" ,
            maxAge: 0
    });
    res.status(200).json({
        message : "logged out successful"
    });
}