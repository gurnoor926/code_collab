const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
    input : {
        type : String, 
        required : true,
    },

    output :{
        type : String,
        required : true, 
    },
    
    explanation : {
        type : String,
        default : "",
    },
},
{_id:false}
)

const problemSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    slug:{
        type: String,
        required: true,
        unique: true,
        lowercase:true,
        trim:true,
    },
    description:{
        type: String,
        required: true
    },
    difficulty:{
        type: String,
        enum:["Easy" , "Medium", "Hard"],
        required: true
    },
    category:{
        type: String,
        required: true,
        trim : true
    },
    tags :{
        type : [String],
        default : []
    }, 

    constraints:{
        type: [String],
        required: true
    },
     examples: {
      type: [exampleSchema],
      validate: {
        validator: (examples) => examples.length > 0,
        message: "At least one example is required",
      },
    },
    starterCode:{
        type: Map,
        of: String,
        default : {},
    },
    supportedLanguages:[{
        type: String,
        default: ["javascript", "python", "java", "cpp"],
    }],
    timeLimit:{
        type: Number,
        default: 2,
        min: 1,
    },
    memoryLimit:{
        type: Number,
        default :  256 ,
        min : 16
    },

    isPublished : {
        type : Boolean,
        default: false
    },

    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required:"true"
    },
},
 {
    timestamps: true,
 });

 problemSchema.index({
  title: "text",
  description: "text",
});

problemSchema.index({
  difficulty: 1,
  category: 1,
  isPublished: 1,
});

 module.exports = mongoose.model("Problem", problemSchema);