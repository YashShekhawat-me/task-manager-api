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
    const {id: rawId} = req.params;
    if(!/^\d+$/.test(rawId)){
        throw new AppError("Task id can only contain digits" , 400);
    }
    const id = Number(rawId);
    if(!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
        throw new AppError("task id should be between 1 & 2147483647" , 400);
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
            throw new AppError("Invalid body properties provided" , 400);
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
    req.body.title = req.body.title.trim();
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

//for query in get all tasks
export function validateCompleteQuery(req , res , next){
    if(req.query.completed === undefined){
        return next();
    } else if(req.query.completed === "true"){
        req.completed = true;
    } else if(req.query.completed === "false"){
        req.completed = false;
    } else {
        throw new AppError("Invalid Query parameters" , 400);
    }
    next();
}

//validate limit for queries
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

//validate offset for queries
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

//validates sort and order
export function validateSortAndOrder(req , res , next){
    if(req.query.sort === undefined && req.query.order === undefined){
        req.sort = "id";
        req.order = "asc";
        return next();
    } else if (req.query.sort === undefined && req.query.order !== undefined){
        throw new AppError("order only allowed with sort" , 400);
    } else {
        if(req.query.sort === "id"){
            req.sort = "id";
        } else if(req.query.sort === "title"){
            req.sort = "title";
        } else {
            throw new AppError("invalid sort argument" , 400);
        }
        if(req.query.order === undefined){
            req.order = "asc";
        } else if(req.query.order === "asc"){
            req.order = "asc";
        } else if(req.query.order === "desc"){
            req.order = "desc";
        } else {
            throw new AppError("invalid order argument" , 400);
        }
    }
    next();
}

export function validateSearch(req ,res, next){
    if(req.query.search === undefined){
        return next();
    } else {
        const search = req.query.search;
        if(typeof search !== "string"){
            throw new AppError("search must be a string" , 400);
        }
        if(search.trim().length === 0){
            throw new AppError("search can not be empty" , 400);
        }
        req.search = search.trim();
    }
    next();
}