import {AppError} from "./error.js";
import jwt from "jsonwebtoken";

export function validateCredentials(req , res , next){
    if(!req.body || typeof req.body !=="object" || Array.isArray(req.body)){
        return next( new AppError("body should be a valid json object" , 400));
    }
    
    const {email , password} = req.body;
    if(typeof email !== "string" || typeof password !== "string"){
        return next(new AppError("email and password are required" , 400));
    }
    const normlizedEmail = email.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normlizedEmail)){
        return next(new AppError("invalid email address" , 400));
    }
    if(password.length < 8) {
        return next(new AppError("password must be at least 8 characters" , 400));
    }
    if(Buffer.byteLength(password , "utf-8") > 72) {
        return next(new AppError("password must not exceed 72 UTF-8 bytes" , 400));
    }
    req.body.email = normlizedEmail;
    next();
}

export function authenticateToken(req , res , next){
    const authHeader = req.get('Authorization');
    const match = /^Bearer\s+(\S+)$/i.exec(authHeader);
    if(!match) {
        return next(new AppError("Invalid or missing token" , 401));
    } 
    const token = match[1];
    try{
        if(!process.env.JWT_SECRET){
            return next(new Error("JWT_SECRET not configured"));
        }
        const decoded = jwt.verify(token , process.env.JWT_SECRET , { algorithms: ["HS256"] });
        const UserId = Number(decoded.sub);
        if(!Number.isSafeInteger(UserId) || UserId <= 0){
            return next(new AppError("Invalid token" , 401))
        }
        req.user = {id: UserId};
    } catch(error) {
        return next(new AppError("Invalid or expired token" , 401));
    }
    next();
}