//imports 
// require("dotenv").config();// load enviroment variable from .env file
const express =  require('express');
const mongoose = require('mongoose');
const session = require("express-session");
const URI = "mongodb://127.0.0.1:27017/mydatabase"
// create Express application
const app = express();

const connection = async()=>{
  try{
    await mongoose.connect(URI);
    console.log("MongoDB Connected");
  }
  catch(error){
  console.error("Database conenction failed:",error);
  throw error;}
};
connection();

//Set PORTno. for server
// const PORT = process.env.PORT||8000;
const PORT = 8545;

///middle ware
app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(session({
  secret: "my secret key",
  saveUninitialized: true,
  resave: false,
})
);
app.use((req,res, next)=>{
  res.locals.message = req.session.message;
  delete req.session.messgae;
  next();
});
///set template engine
app.set('view engine','ejs');

//route prefix
app.use("", require("./routes/routes"));
app.listen(PORT,()=>{
    console.log(`Server started at http://localhost:${PORT}}`);
})
