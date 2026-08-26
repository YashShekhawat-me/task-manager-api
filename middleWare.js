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