const SUPPORTED_LANGUAGES = [
    "javascript",
    "python",
    "cpp",
    "java"
];

const MAX_CODE_BYTES = 50 *1024;
const MAX_STDIN_BYTES = 10 * 1024;

const validateExecutionRequest = (body) =>{
    if(!body|| typeof body !== "object" || Array.isArray(body)){
        return {
            valid :false,
            message: "A valid JSON body is required",
        };
    }

    const {language, code ,stdin =""} = body;

    if(typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language)){
        return {
            valid:false,
            message:"Unsupprted programing language",
        };
    }

    if(typeof code !== "string" || !code.trim()){
        return {
            valid:false,
            message:"Source code is required",
        };
    }

    if(Buffer.byteLength(code,"utf8") > MAX_CODE_BYTES){
        return {
            valid:false,
            message:"Source code exceeds the  KB limit"
        };
    }

    if (typeof stdin !== "string"){
        return {
            valid:false,
            message:"stdin must be a string",
        };
    }

    if(Buffer.byteLength(stdin,"utf8") > MAX_STDIN_BYTES){
        return {
            valid:false,
            message: "Input exceeds the 10 KB limit",
        };
    }

    return {
        valid:true,
        data : {
            language,
            code,
            stdin,
        },
    };
};

module.exports = {
    validateExecutionRequest,
}