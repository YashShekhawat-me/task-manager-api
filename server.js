import app from "./app.js";

// assigning the port
app.listen(process.env.PORT || 3000 , ()=>{
    console.log(`express server running on port ${process.env.PORT || 3000}`);
});