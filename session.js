const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session) 

const MAX_AGE = 1000 * 60 * 60 * 24;  // 1 day


// setting up connect-mongodb-session store
const mongoDBstore = new MongoDBStore({
  uri: process.env.MONGODB_URL,
  collection: 'mySessions',
})

const sessionObj = {
    secret: 'a1s2d3f4g5h6',
    name: 'session-id', // cookies name to be put in "key" field in postman
    store: mongoDBstore,
    cookie: {
      maxAge: MAX_AGE, // this is when our cookies will expired and the session will not be valid anymore (user will be log out)
      sameSite: false,
      secure: false, // to turn on just in production
    },
    resave: true,
    saveUninitialized: false,
  }

  module.exports = sessionObj;
