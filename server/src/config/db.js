const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const dbURI = process.env.MONGO_URI;
const connectDB = async () =>{
    try{
        await mongoose.connect(dbURI);
        console.log('MongoDB connected successfully');
     } catch (error) {
        console.error('MongoDB connection error:', error);
     }
        }
module.exports = connectDB;