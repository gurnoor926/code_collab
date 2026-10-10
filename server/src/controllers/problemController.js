const Problem = require("../models/Problem");

const createSlug = (title)=>{
    return title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g,"-")
            .replace(/^-|-$/g,"");
};
// all problems
const getProblems = async (req,res) =>{
    try {
        const page = Math.max(1,Number.parseInt(req.query.page,10)||1);
        const limit = Math.min(50,Math.max(1,Number,parseInt(req.query.limit,10)||10));

        const {difficulty , category ,search} = req.query;

        const filter = {
            isPublished : true,
        }

        if(difficulty){
           const validDifficulties = ["Easy", "Medium" , "Hard"];

           if(!validDifficulties.includes(difficulty)){
            return res.status(400).json({
                success: false,
                message:"Invalid difficulty filter"
            });
           }
           filter.difficulty = difficulty;
        }

        if(category){
            filter.category = {
                $regex: category,
                $options: "i",
            };
        }

        if(search && search.trim()){
            filter.$text = {
                $search : search.trim(),
            };
        }

        const skip = (page - 1) * limit;

        const [problems,total] = await Promise.all([
            Problem.find(filter)
                 .select(
                    "title slug difficulty category tags supportedLanguages createdAt"
                 )
                 .sort({ createdAt: -1})
                  .skip(skip)
                  .limit(limit)
                  .lean(),
            Problem.countDocuments(filter),
        ])

        return res.status(200).json({
            success:true,
            data:problems,
            pagination : {
                total,
                page,
                limit,
                totalPages : Math.ceil(total/limit),
            },
        })

    } catch(error){

        console.error("Get problems error : ", error.message);

        return res.status(500).json({
            success:false,
            message:"Failed to retrive problems"
        });

    }
};

// single problem
const getProblemById = async(req,res) =>{
    try{
       const problem = await Problem.findOne({
        _id:req.params.id,
        isPublished:true,
       })
       .select("-__v")
       .lean();

       if(!problem){
        return res.status(404).json({
            succes:false,
            message:"Problem not found"
        });
       }

       return res.status(200).json({
        sucess:true,
        data:problem
       });


    }catch(error){

        if(error.name === "CastError"){
            return res.status(400).json({
                success:false,
                message:"Invalid problem Id",
            });
        }

        console.error("Get problem error : " , error.message);

        return res.status(500).json({
            success:false,
            message:"Failed to retrieve problem"
        });
                  
    }
};

//  create problems
const createProblem = async (req, res)=>{
    try{
      const slug = createSlug(req.body.title);
console.log("Database:", Problem.db.name);
console.log("Collection:", Problem.collection.name);
console.log("Generated slug:", slug);

const existingProblem = await Problem.findOne({ slug }).lean();

console.log("Existing problem:", existingProblem);
console.log("Total problems:", await Problem.countDocuments({}));

if (existingProblem) {
  return res.status(409).json({
    success: false,
    message: "A problem with this title already exists",
  });
}

      const problem = await Problem.create({
        ...req.body,
        slug,
        createdBy: req.user.userId,
      });

      return res.status(200).json({
        success:true,
        message: "Problem created successfully",
        data:problem,
      });

    }catch(error){

        if(error.code === 11000){
            return res.status(409).json({
                success:false,
                message:"A problem with this title already exists"
            });

        }

        console.error("Create problem error : ",  error.message);

        return res.status(500).json({
            success:false,
            message:"Failed to create problem"
        });

    }
};

// update a problem
const updateProblem = async (req,res)=>{
    try{
      const updates = {...req.body};

      if(updates.title){
        updates.slug = createSlug(updates.title)

        const existingProblem = Problem.findOne({
            slug : updates.slug,
            _id : {$ne:req.params.id},
        });

        if(existingProblem){
            return res.stauts(409).json({
                success:false,
                message:"Another problem already uses this title"
            });
        }
      }

      const problem = await Problem.findByIdAndUpdate(
        req.param.id,
        updates,
        {
            new:true,
            runValidators:true
        }
      );

      if(!problem){
        return res.status(404).json({
            success:false,
            message:"Problem not found"
        });

      }

      return res.status(200).json({
        success:true,
        message:"problem updated successfully",
        data: problem,
      });

    }catch(error){

         if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid problem ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Another problem already uses this title",
      });
    }

    console.error("Update problem error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update problem",
    });

    }
};

//delete problem
const deleteProblem = async (req,res)=>{
    try{
       const problem = await Problem.findByIdAndDelete(req.params.id);

       if(!problem){
        return res.status(404).json({
            success:false,
            message:"Problem not found"
        });

       }

       return res.status(200).json({
        success:true,
        message:"Problem deleted successfully"
       });

    }catch(error){

         if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid problem ID",
      });
    }

    console.error("Delete problem error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to delete problem",
    });

    }
};

module.exports = {
    getProblems,
    getProblemById,
    createProblem,
    updateProblem,
    deleteProblem,
};