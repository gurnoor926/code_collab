const mongoose = require('mongoose');

const editorEventSchema = new mongoose.Schema({
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
    eventType:{
        type: String,
        enum:["code-change" , "cursor-move", "selection-change" , "language-change" , "theme-change"],
        required: true
    },
    data:{
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
},
{
timestamps: true,
});
module.exports = mongoose.model("EditorEvent", editorEventSchema)