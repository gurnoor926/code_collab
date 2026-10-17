const {
    submitCode,
    getSubmissionResult,
} = require("../services/judge0Service");

const {validateExecutionRequest,} = require("../utils/executionValidation");

const runCode = async(req,res) => {
    try{
        const validation = validateExecutionRequest(req.body);

        if(!validation.valid){
            return res.status(400).json({
                success:false,
                message:validation.message,
            });
        }

        const submission = await submitCode(validation.data);

        if(!submission.token){
            return res.status(502).json({
                success:false,
                message:"Judge0 did not return a submission token",
            });
        }

        return res.status(202).json({
            success:true,
            message:"Code submitted successfully",
            data :{
                token:submission.token,
            },
        });
    }catch(error){
        console.error(
            "Judge0 submission error:",
            error.response?.data || error.message
        );

        if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                success: false,
                message: "Judge0 request timed out",
            });
        }

        return res.status(502).json({
            success: false,
            message: "Unable to submit code to Judge0",
        });

    }
};

const getCodeResult = async (req, res) =>{
    try{
        const {token}  = req.params;

        if(
            typeof token !== "string" || 
            !/^[a-f0-9-]{36}$/i.test(token)
        ){
            return res.status(400).json({
                success:false,
                message:"Invalid submission token",
            });
        }

        const result = await getSubmissionResult(token);

        return res.status(200).json({
            success:true,
            data:result,
        });

    }catch(error){
        console.error(
            "Judge0 result error:",
            error.response?.data || error.message
        );

        return res.status(502).json({
            success: false,
            message: "Unable to retrieve the execution result",
        });

    }
};

module.exports = {
    runCode,
    getCodeResult,
}