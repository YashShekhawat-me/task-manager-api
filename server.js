import app from "./app.js";

// assigning the port
const PORT = process.env.PORT || 3000;
app.listen( PORT , ()=>{
    console.log(`express server running on port ${PORT}`);
});