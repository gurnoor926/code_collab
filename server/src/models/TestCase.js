const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    id:{
        type: String,
        required: true,
        unique: true
    },
    problemId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
        required: true,
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
    order:{
        type: Number,
        required: true
    }
});
module.exports = mongoose.model("TestCase", testCaseSchema);