const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true,
        unique: true
    },
    sessionId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Interview",
        required: true,
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    problemId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
        required: true,
    },
    language:{
        type: String,
        required: true
    },
    sourceCode:{
        type: String,
        required: true
    },
    status:{
        type: String,
        enum:["pending" , "running", "accepted" , "wrong-answer" , "time-limit-exceeded" , "runtime-error" , "compilation-error"],
        default: "pending"
    },
    passedTests:{
        type: Number,
        default: 0
    },
    totalTests:{
        type: Number,
        default: 0
    },
    executionTime:{
        type: Number,
        default: 0
    },
    memory:{
        type: Number,
        default: 0
    }
},
{
    timestamps: true,
});
module.exports = mongoose.model("Submission", submissionSchema);