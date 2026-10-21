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
        const user = await loginUser(req.body.email , req.body.password);
        return res.status(200).json({
            successful:true,
            ...user
        })
    } catch(error) {
        return next(error);
    }
}

