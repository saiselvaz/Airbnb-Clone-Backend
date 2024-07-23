const mongoose = require('mongoose')

const connectDB = (uri)=>{
    mongoose.set('strictQuery', true);
    mongoose.Promise = global.Promise;
    mongoose.connect(uri,
         { useNewUrlParser: true ,
        useUnifiedTopology:true,})
    .then(()=> console.log('Successfully connected to DB'))
    .catch((err) => console.log(err));
}

module.exports =  connectDB;



