import { AppError } from "./error.js";

//auth handeling(currentlly hard coded)
export function auth(req , res , next){
    const token = req.headers.authorization;
    if(token!="secret123")
    {
        return res.status(401).json({
            message: "unauthorized"
        });
    }
    next();
}


//validatinng task id
export function ValidateTaskId(req , res , next){
    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id<=0){
        throw new AppError("Invalid Task Id" , 400);
    }
    req.TaskId = id;

    next()
}


//validating patch body 
export function ValidatePatchBody(req , res , next){
    //checking if body is object and not null is not an array
    if(typeof req.body !== "object" || req.body == null || Array.isArray(req.body)){
        throw new AppError("request body must be an object" , 400);
    }

    const body = req.body;
    const arr = Object.keys(body);
    let isTitleThere = false;
    let isCompletedThere = false;
    for(let num of arr)
    {
        //checking if anything except title or completed is provided
        if(num !== "title" && num !== "completed")
        {
            throw new AppError("Ivalid body properties provided" , 400);
        }
        else
        {
            if(num == "title")
            {
                isTitleThere = true;
            }
            else
            {
                isCompletedThere = true;
            }
        }
    }

    //handeling if user sends {} so it wont get detected
    if(!isTitleThere && !isCompletedThere )
    {
        throw new AppError("no task property provided" , 400)
    }
    

    //if title is there then check if title is valid
    if(isTitleThere){
        const title = req.body.title;
        if(typeof title !== "string" || title.trim().length === 0 || title.trim().length>100){
            throw new AppError("title must be between 1 to 100 character" , 400);
        }
    }

    //if completed property is there check if property is valid 
    if(isCompletedThere){
        const completed = req.body.completed;
        if(typeof completed != "boolean" )
        {
            throw new AppError("completed should have been a boolean value" , 400);
        }
    }

    //if all check passes then passed into next 
    // a valid object will be passed which will contain title or completed or both
    next();
}

//service to validate post body
export function validatePostBody(req , res , next){
    if(typeof req.body !== "object" || req.body == null || Array.isArray(req.body)){
        throw new AppError("request body must be an object" , 400);
    }

    const {title} = req.body;
    
    if(typeof title !== "string" || title.trim().length === 0 || title.trim().length>100){
        throw new AppError("title must be between 1 to 100 character" , 400);
    }
    next();
}

export function validateCompleteQuery(req , res , next){
    if(req.query.completed === undefined){
        throw new AppError("completed not supplied" , 400);
    }
    if(req.query.completed === "true"){
        req.completed = true;
    } else if(req.query.completed === "false"){
        req.completed = false;
    } else {
        throw new AppError("Invalid Query parameters" , 400);
    }
    next();
}
export function validateCompleteQuery1(req , res , next){
    if(req.query.completed === undefined){
        return next();
    }
    if(req.query.completed === "true"){
        req.completed = true;
    } else if(req.query.completed === "false"){
        req.completed = false;
    } else {
        throw new AppError("Invalid Query parameters" , 400);
    }
    next();
}

export function validateLimit(req , res , next){
    if(req.query.limit === undefined){
        req.limit = 20;
        return next();
    }
    const l = Number(req.query.limit);
    if(Number.isNaN(l)){
        throw new AppError("limit should be number" , 400);
    } else if(!Number.isInteger(l)){
        throw new AppError("limit must be an integer" , 400);
    } else if (l <= 0){
        throw new AppError("limit must be positive" , 400);
    }else if(l >100){
        throw new AppError("limit should be less then 100" , 400);
    } else {
        req.limit = l;
    }
    next();
}

export function validateOffset(req, res ,next){
    if(req.query.offset === undefined){
        req.offset = 0;
        return next();
    }
    const o = Number(req.query.offset);
    if(Number.isNaN(o)){
        throw new AppError("offset should be an integer" , 400);
    } else if (!Number.isInteger(o)){
        throw new AppError("offset must be an integer" , 400);
    } else if(o < 0){
        throw new AppError("offset should be greater then or equal to 0" , 400);
    } else {
        req.offset = o;
    }
    next();
}   