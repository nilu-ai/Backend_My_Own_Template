
import { User } from "../model/user.model.js";
import Email from "../utils/Email.js"
import ApiError from "../utils/ApiError.js"
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
  }
 const generatetoken=async(_id)=>{
    try {
        const user=await User.findById(_id);
        const accessToken= user.generateAccessToken();
        const refreshToken= user.generateRefreshToken();
        user.refreshToken;
        await user.save();
        return {accessToken,refreshToken};
    } catch (error) {
        console.log("Error in Creating the Tokens" ,error);
        throw new ApiError(500,"Error in Creating the Tokens");
        
    }
}
const RegisterUser=async(req,res)=>{
    try {
        const {name ,email,username ,password}=req.body;
    
        if(!name | !email |!username | !password){
            throw new ApiError(400,"All the Filed should be Required")
        }
    
        const check=await User.findOne({$or :[{email},{username}]})
        if(check){
            throw new ApiError(409,"User us presnet this email or username")
        }
        const otp=generateOTP()
        
        const user=await User.create({
            name ,email, username: username.toLowerCase() ,password ,isCodeverifed:otp
        })
    
        await Email(otp,email)
    
        // if(mailsend)
    
        const checkuser=await User.findById(user._id).select("-passowrd -refreshToken");
    
        if(!checkuser){
            throw new ApiError(500,"Some Error while Creating the User")
        }
        //console.log(checkuser);
        
        const {accessToken,refreshToken} = await generatetoken(checkuser._id);
        const options = {
            httpOnly: true,
            secure: false, 
            sameSite: "Lax",
        };
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({ checkuser });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            sucess:false,
            message:error.message || "Inter Server Error"
        
        })
    }


}

const VerifyUser =async (req,res)=>{
    
    try {
        const {otp}=req.body;
        const {email,username}=req.user;
        const user = await User.findOne({ $or: [{ email:email }, { username: username }] });
        if(!user){
            throw new ApiError(404,"The User not present")
        }
        //console.log(user);
    
        if(user.isverified){
            throw new ApiError(400,"The User is Already Verified")
        }
        
        if(user.isCodeverifed==otp){
            user.isverified=true;
            user.isCodeverifed=null;
            await user.save();
            return res.status(200).json(["Otp verified Succesfully",{user}])
        }
        return res.status(401).json("Otp Not verified Succesfully")
    
    } catch (error) {
        res.status(error.statusCode || 500).json({
            sucess:false,
            message:error.message || "Inter Server Error"
           
        })
    }
    
}


const LoginUser=async(req,res)=>{
    console.log("request")
    try {
        const {email ,password}=req.body;
    
        if(!email | !password ){throw new ApiError(400,"All Filed Required")}
    
        const loguser= await User.findOne({$or:[{email},{username:email}]}).select(" -refreshToken")
        if(!loguser) {throw new ApiError(404,"The User Is not Present")}
    
        //console.log(loguser);
        
        const check=await loguser.isPasswordCorrect(password);
    
        if(!check){
            throw new ApiError(401,"The Password is Wrong")
        }
    
        const {accessToken,refreshToken} =await generatetoken(loguser._id);
        const checkuser=await User.findById(loguser._id).select("-password -refreshToken")
        const options = {
            httpOnly: true,
            secure: false, 
            sameSite: "Lax",
        };
      
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({checkuser})
    
    
    } catch (error) {
        console.log(error);
        
        res.status(error.statusCode || 500).json({
            sucess:false,
            message:error.message || "Inter Server Error"
           
        })
    }

}

const CurrentUser=async(req,res)=>{
   try {
     const {accessToken,refreshToken} =await generatetoken(req.user._id);
     const checkuser=await User.findById(req.user._id).select("-password -refreshToken")
     const options = {
         httpOnly: false,
         secure: false,
         sameSite: "none",
       };
     return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({checkuser})
   } catch (error) {
    res.status(error.statusCode || 500).json({
        sucess:false,
        message:error.message || "Inter Server Error"
       
    })
   }
}

const LogoutUser=async(req,res)=>{
    console.log("coming");
    
 try {
       await User.findByIdAndUpdate(
           req.user._id,
           {
             $unset: {
               refreshToken: 1,
             },
           },
           {
             new: true,
           }
         );
       
         const options = {
           httpOnly: true,
           secure: true,
           sameSite: "none",
         };
       
         return res
           .status(200)
           .clearCookie("accessToken", options)
           .clearCookie("refreshToken", options)
           .json(200, {}, "User logged Out");
 } catch (error) {
    res.status(error.statusCode || 500).json({
        sucess:false,
        message:error.message || "Inter Server Error"
       
    })
 }
}

const ResendOtp=async(req,res)=>{
  try {
      const {email} =req.user
      
      const user=await User.findOne({email})
  
      if(user.isverified){
          throw new ApiError(400,"The OTP IS Alredy VEREFIED")
      }
      const otp=generateOTP()
      await Email(otp,email)
          user.isCodeverifed=otp
          await user.save()
          return res.status(200).json(`${otp}The OTP IS RESEND SUCCESFULLY`)
  
  } catch (error) {
    res.status(error.statusCode || 500).json({
        sucess:false,
        message:error.message || "Inter Server Error"
       
    })
  }
}

const DeleteUser = async (req, res) => {
    try {
        await User.deleteMany({});
        return res.status(200).json({ message: "All users have been deleted successfully" });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}
const GoogleAuth = async (req, res) => {
    try {
        const { email } = req.body;
    
        let user = await User.findOne({ email }).select("-passowrd -refreshToken");
    
        if (!user) {
            throw new ApiError(404, "User not found. Please sign up first.");
        }
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        res.status(200).json({
          _id: user._id,
          email: user.email,
          username: user.username,
        name: user.name,
          isverified:user.isverified,
          accessToken
        });
      } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: "Server error", error: error.message });
      }
}
export {GoogleAuth,RegisterUser,VerifyUser,LoginUser,CurrentUser,LogoutUser,ResendOtp,DeleteUser}