const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true,
        unique: true
    },
    title:{
        type: String,
        required: true
    },
    slug:{
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
        required: true
    },
    difficulty:{
        type: String,
        enum:["easy" , "medium", "hard"],
        required: true
    },
    category:{
        type: String,
        enum:["arrays" , "strings", "linked-lists", "trees", "graphs", "dynamic-programming", "greedy", "sorting", "searching" , "stack", "queue", "hashing", "recursion"],
        required: true
    },
    constraints:{
        type: String,
        required: true
    },
    examples:[{
        type: String,
        required: true
    }],
    starterCode:{
        type: String,
        required: true
    },
    supportedLanguages:[{
        type: String,
        required: true
    }],
    timeLimit:{
        type: Number,
        required: true
    },
    memoryLimit:{
        type: Number,
        required: true
    }
},
 {
    timestamps: true,
 });
 module.exports = mongoose.model("Problem", problemSchema);