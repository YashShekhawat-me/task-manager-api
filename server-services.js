export function attachTimeToRequest(req , res , next){
    req.requestTime = new Date();
    next();
}

export function displayOnCli(req , res, next){
    console.log("request recieved:" , req.method , req.url);
    next();
}

export function testTime(req , res){
    res.json({
        time: req.requestTime
    });
}

export function errorTest(req ,res , next){
    const error = new Error("something broke");
    next(error);
}