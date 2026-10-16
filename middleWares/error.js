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
    console.log(error);
    if(error instanceof SyntaxError && error.status === 400 && 'body' in error){
        return res.status(400).json({
            message: "Malformed JSON payload. Please verify your syntax",
            successfull: false
        });
    }

    if(error instanceof AppError){
        return res.status(error.status).json({
            message : error.message , 
            successfull : false
        });
    }

    return res.status(500).json({
        message : "internal server error",
        successfull : false
    });
}