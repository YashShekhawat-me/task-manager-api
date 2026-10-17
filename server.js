import app from "./app.js";

// assigning the port
app.listen(process.env.PORT || 3000 , ()=>{
    console.log("express server running on port 3000");
});