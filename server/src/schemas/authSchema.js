const {z} = require('zod');

const registerSchema = z.object({
    name : z
        .string()
        .min(3, {message: "Name must be at least 3 characters long"})
        .trim()
        .max(50, {message: "Name must be at most 50 characters long"}),

    email : z
            .string()
            .email({message: "Invalid email address"})
            .trim()
            .max(100, {message: "Email must be at most 100 characters long"}),
    
    password : z
                .string()
                .min(6, {message: "Password must be at least 6 characters long"})
                .max(72, {message: "Password must be at most 72 characters long"}),
});

const loginSchema = z.object({
    email : z
            .string()
            .email({message: "Invalid email address"})
            .trim(),

    password : z
                .string()
                .min(1, {message: "Password is required"})
                .max(72, {message: "Password is to long"}),
});

module.exports = {
    registerSchema,
    loginSchema
};