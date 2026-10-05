const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true,
        unique: true
    },
    interviewerId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    candidateId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    sessionCode:{
        type: String,
        required: true,
        unique: true
    },
    status:{
        type: String,
        enum:["waiting" , "active", "paused" , "completed" , "cancelled"],
        default: "waiting"
    },
    problemIds:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem"
    }],
    startTime:{
        type: Date,
        required: true
    },
    endTime:{
        type: Date,
        required: true
    },
    duration:{
        type: Number,
        required: true
    }
},
{
    timestamps: true,
});
module.exports = mongoose.model("Interview", interviewSchema);