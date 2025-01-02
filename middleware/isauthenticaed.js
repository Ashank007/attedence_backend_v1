import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import ApiError from "../utils/ApiError,.js";
import ApiResponse from "../utils/ApiResponse.js";
const isAuthenticated = async(req,res,next)=>{
    try {
        const token = req.header('Authorization').split(' ')[0];
        if(!token){
            return res.status(401).json(new ApiResponse(false,"Please Login First"));
        }
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json(new ApiResponse(false,"Candidate not Found"));
        }
        const admin = await Admin.findById(decoded.data);
        req.admin = admin;
        next(); 
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
export default isAuthenticated;