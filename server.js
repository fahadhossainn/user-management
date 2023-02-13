const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path : './config.env'});
const app = require('./app');

const DB_PASSWORD = process.env.DB_PASSWORD;
const DB = process.env.DB;
const PORT = process.env.PORT;




mongoose.connect(DB)
        .then(()=>{
          app.listen(PORT , ()=> {console.log(`Listening for incoming requests on Port ${PORT}...`)});
        })
        .catch(err => console.log('Error Connecting.....'))

