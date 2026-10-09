const User = require("../models/User");
const tokenGenerator = require("../utils/generateToken");

const isPasswordWithinBcryptLimit = (password) => {
    return Buffer.byteLength(password , 'utf8') <= 72;
};


const registerUser = async (req,res)=>{
    try{
        const {name,email,password} = req.body;

        // validation
         if(!name || !email || !password){
            return res.status(400).json({
                success:false,
                message:"Please fill all the fields"});
         }
         // normalize email
        const normalizedEmail = email.trim().toLowerCase();
        // existing user check 
        const existingUser = await User.findOne({email: normalizedEmail});
        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User already exists"
            });
        }

 
        // create new user

        const newUser = new User({
            name,
            email : normalizedEmail,
        });
         
        //check if password is within bcrypt limit
        if(!isPasswordWithinBcryptLimit(password)){
            return res.status(400).json({
                success:false,
                message:"Password is too long. Maximum length is 72 characters"
            });
        }


         // hash password and save user
        await newUser.setPassword(password);
        await newUser.save();

        //token generation
        const token = tokenGenerator(newUser); 

        res.status(201).json({
            success:true,
            message:"User registered successfully",
            token,
            user : {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                avatar: newUser.avatar
            }
        });

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

// login user

const loginUser = async (req,res)=>{
    try{
        const {email,password} = req.body;
        // validation
        if(!email || !password){
            return res.status(400).json({
                success:false,
                message:"Please fill all the fields"
            });

        
        }

        const user = await User.findOne({email});
 
        if(!user){
            return res.status(400).json({
                success:false,
                message:"Invalid email or password"
            });
        }

        if(!isPasswordWithinBcryptLimit(password)){
            return res.status(400).json({
                success:false,
                message:"Password is too long. Maximum length is 72 characters"
            });
        }

        // check password limit
        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid){
            return res.status(400).json({
                success:false,
                message:"Invalid email or password"
            });

        }

        const token = tokenGenerator(user);
        res.status(200).json({
            success:true,
            message:"User logged in successfully",
            token,
            user : {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });
    }
        catch (err) {
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

//get current user
const getCurrentUser =async (req,res) =>{
    try{
        const user = await User.findById(req.user.userId).select("-passwordHash");
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            });
        }
        res.status(200).json({
            success:true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser
};