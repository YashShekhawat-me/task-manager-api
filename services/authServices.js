import bcrypt from "bcrypt";
import {createUserRepo, findUserByEmailRepo} from "../repository/userRepository.js";
import {AppError} from "../middleWares/error.js";
import jwt from "jsonwebtoken";

export async function registerUser(email , password){
    const passwordHash = await bcrypt.hash(password , 12);
    try {
        const result = await createUserRepo(email , passwordHash);
        return result.rows[0];
    } catch (error) {
        if(error.code === "23505"){
            throw new AppError("email already exists" , 409);
        }
        throw error;
    }
}

export async function loginUser(email , password){
    const noramlizedEmail = email.trim().toLowerCase();
    const result = await findUserByEmailRepo(noramlizedEmail);
    if(result.rows.length === 0) {
        throw new AppError("invalid credentials" , 401);
    }
    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password , user.password_hash);
    
    if(!passwordMatches){
        throw new AppError("invalid credentials" , 401);
    }
    const token = jwt.sign({sub : String(user.id)} , process.env.JWT_SECRET , {expiresIn : '4h'});
    return {message : "authentication successful" , token : token ,
                     user : {email: user.email , id: user.id ,
                         created_at : user.created_at}
            };
}