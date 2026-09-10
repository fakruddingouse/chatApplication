import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        const token = req.headers.token || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - No token provided"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        req.user = user;
        next();

    } catch (error) {
        console.log("FROM MIDDLEWARE: ", error.message);
        return res.status(401).json({
            success: false,
            message: "Unauthorized - Invalid token"
        });
    }
};

// import User from "../models/User.js";
// import jwt from "jsonwebtoken";

// // Middleware to protect routes
// export const protectRoute = async (req, res, next) => {
//     try {
//         const token = req.headers.token;
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.userId).select("-password");
        
//         if (!user) {
//             return res.status(404).json({
//                 success: false, 
//                 message: "User not found"
//             })
//         }
//         req.user = user;
//         next();

//     } catch (error) {
//         console.log("FROM MIDDLEWARE: ", error.message);
//         res.status(500).json({
//             success: false, 
//             message: error.message
//         })
//     }
// }