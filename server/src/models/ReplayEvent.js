const mongoose = require("mongoose");

const replayEventSchema = new mongoose.Schema(
    {
        interview:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "InterviewSession",
            required: true,
            index:true,
        },

        user :{
            type:mongoose.Schema.Types.ObjectId,
            ref :"User",
            default: null
        }, 

        eventType : {
            type :String, 
            enum :[
                "code_change",
                "language_change",
                "problem_selected",
                "code_execution",
                "interview_started",
                "interview_completed",
                "snapshot",
            ],
            required :true,
        },
       // monotonically increasing sequence within an interview.
        sequence:{
            type : Number,
            required :true,
            min:1,
        },
        //milliseconds elapsed since replay session begin
        elapsedMs :{
            type:Number,
            required:true,
            min : 0,
        },

        //wall - clock event time
        occurredAt : {
            type :Date,
            required :true,
            default: Date.now,
        },

        //optional editor state or event specific information
        payload : {
            type : mongoose.Schema.Types.Mixed,
            default : {},
        },
    },
    {
        timestamps : true,
    }   
);

//support ordered repaly retrival
replayEventSchema.index(
    {interview :1 , sequence :1} ,
    {unique :true}
);

//support time based queries
replayEventSchema.index(
    {
        interview:1,
        elapsedMs :1,
    }
);

module.exports = mongoose.model("ReplayEvent", replayEventSchema);