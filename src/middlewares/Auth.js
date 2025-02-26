
import  jwt  from 'jsonwebtoken';
import { User } from '../model/user.model.js';

export const Auth=async(req,res,next)=>{
    try {
        const token=  req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
        //console.log(token);
        
        if(!token)
        {
            return res.status(401).json("The TOken are not Pesent")
        }
        const {_id}=await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user=await User.findById(_id).select("-password -refreshToken")

        req.user=user;
        next();
    } catch (error) {
        console.log(error);
        
        
    }
}