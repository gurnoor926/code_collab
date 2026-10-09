const authrizeRoles = (...allowedRoles) =>{
    return (req,res, next) =>{
       console.log("Authenticated user:", req.user); console.log("User role:", req.user?.role); console.log("Allowed roles:", allowedRoles);

        if(!req.user){
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource",
                userRole: req.user.role,
                allowedRoles,
            });
        }

        next();
    };
};

module.exports = authrizeRoles;