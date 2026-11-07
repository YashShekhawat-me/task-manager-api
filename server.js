import app from "./app.js";

// assigning the port
const PORT = process.env.PORT || 3000;

if(!process.env.JWT_SECRET){
    console.log("JWT_SECRET key is not set . Refusing to start !!");
    process.exit(1);
}

app.listen( PORT , ()=>{
    console.log(`express server running on port ${PORT}`);
});