import app from "./app.js";

// assigning the port for render as render uses PORT env var for defining the port
const PORT = process.env.PORT || 3000;

// safe check to only start server if JWT_SECRET is set by maintainers
if(!process.env.JWT_SECRET){
    console.log("JWT_SECRET key is not set . Refusing to start !!");
    process.exit(1);
}


//start a web server and bind the port
app.listen( PORT , ()=>{
    console.log(`express server running on port ${PORT}`);
});