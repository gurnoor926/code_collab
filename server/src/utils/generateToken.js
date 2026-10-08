const jwt = require("jsonwebtoken");

const generateToken = (user) =>{
    return jwt.sign(
        {
            userId : user._id,
            userRole : user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
};

module.exports = generateToken;