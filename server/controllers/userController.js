import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs';

// Signup a new user
export const Signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing details"
            })
        }
        const user = await User.findOne({ email });

        if (user) {
            return res.status(409).json({
                success: false, 
                message: "Account already exists"
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id);

        res.status(201).json({
            success: true, 
            userData: newUser, 
            token, 
            message: "Account created successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: error.message
        })
    }
} 

// Controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false, 
                message: "Invalid credentials"
            })
        }

        const token = generateToken(userData._id);

        res.status(200).json({
            success: true, 
            userData,
            token, 
            message: "Login successfull"
        })

    } catch (error) {
        res.status(500).json({
            success: false, 
            message: error.message
        })
    }
} 

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({
        success: true, 
        user: req.user
    });
}

// 2:59:27