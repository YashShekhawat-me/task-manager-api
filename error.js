//extending error class so we can distinguish between known error and unknown error
//helps in error handelling
export class AppError extends Error{
    constructor(message , status)
    {
        super(message);
        this.status = status;
    }
}

//the actual error handeler takes error as input and sends the error if that is known error
//if the error is unknown senb status 500
export function errorHandeler( error, req, res, next ){
    if(error instanceof AppError){
        return res.status(error.status).json({
            message : error.message , 
            successfull : false
        });
    }
    console.log(error);
    return res.status(500).json({
        message : "internal server error",
        successfull : false
    });
}