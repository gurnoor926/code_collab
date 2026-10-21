const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    problem:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
        required: true,
        index:true,
    },
    input:{
        type: String,
        required: true
    },
    expectedOutput:{
        type: String,
        required: true
    },
    isHidden:{
        type: Boolean,
        default: false
    },
    points:{
        type:Number,
        default:1,
        min:0,
    },
    order:{
        type: Number,
        required: true
    },
    
    isActive: {
        type:Boolean,
        default:true,
    },
},
{
   timestamps:true, 
}
);

testCaseSchema.index({
    problem:1,
    isActive:1,
    order:1,
})
module.exports = mongoose.model("TestCase", testCaseSchema);