require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const session = require('express-session')
const connectDB = require('./mongodb/connect')
const Router = require('./routers/Routers')
const sessionObj = require('./session')

const app = express()
const port = process.env.PORT || 5000;

const corsOptions = {
  credentials: true,
  origin: ["http://localhost:5173"],
}

//session integration
app.use( session(sessionObj));


app.use(cors(corsOptions))
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads' ));

// ROUTERS
app.use('/', Router)




//Start Server
const startServer = async ()=>{
  try {
      connectDB(process.env.MONGODB_URL);
      app.listen(port, ()=> console.log('Server running on port ',port));
  } catch (error) {
      console.log(error);
  }

}
startServer();

module.exports = app

