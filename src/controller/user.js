
import { User } from "../model/user.model.js";
import Email from "../utils/Email.js"

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
        throw new Error("Error in Creating the Tokens");
        
    }
}
const RegisterUser=async(req,res)=>{
    const {name ,email,username ,password}=req.body;

    if(!name | !email |!username | !password){
        return res.json("All the Filed should be Required")
    }

    const check=await User.findOne({$or :[{email},{username}]})
    if(check){
        return res.json("User us presnet this email or username")
    }
    const otp=generateOTP()
    
    const user=await User.create({
        name ,email, username: username.toLowerCase() ,password ,isCodeverifed:otp
    })

    await Email(otp)

    // if(mailsend)

    const checkuser=await User.findById(user._id).select("-passowrd -refreshToken");

    if(!checkuser){
        return res.json("Some Error while Creating the User")
    }
    //console.log(checkuser);
    
    const {accessToken,refreshToken} = await generatetoken(checkuser._id);
    const options = {
        httpOnly: true,
        secure: false, // Set to false if not using HTTPS
        sameSite: "None", // Adjust sameSite attribute
       
    };
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({ checkuser });


}

const VerifyUser =async (req,res)=>{
    const {otp}=req.body;
    const {email,username}=req.user;
    const user = await User.findOne({ $or: [{ email:email }, { username: username }] });
    if(!user){
        return res.status(404).json("The User not present")
    }
    //console.log(user);

    if(user.isverified){
        return res.status(200).json("The User is Already Verified")
    }
    
    if(user.isCodeverifed==otp){
        user.isverified=true;
        user.isCodeverifed=null;
        await user.save();
        return res.status(200).json(["Otp verified Succesfully",{user}])
    }
    return res.status(401).json("Otp Not verified Succesfully")

    
}


const LoginUser=async(req,res)=>{
    const {email ,password}=req.body;

    if(!email | !password ){return res.status(202).json("All Filed Required")}

    const loguser= await User.findOne({$or:[{email},{username:email}]}).select(" -refreshToken")
    if(!loguser) {return res.status(202).json("The User Is not Present")}

    //console.log(loguser);
    
    const check=await loguser.isPasswordCorrect(password);

    if(!check){
        return res.status(403).json("The Password is Wrong")
    }

    const {accessToken,refreshToken} =await generatetoken(loguser._id);
    const checkuser=await User.findById(loguser._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: false, // Set to false if not using HTTPSl
        sameSite: "Lax", // Adjust sameSite attribute
    };
  
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({checkuser})



}

const CurrentUser=async(req,res)=>{
    const {accessToken,refreshToken} =await generatetoken(req.user._id);
    const checkuser=await User.findById(req.user._id).select("-password -refreshToken")
    const options = {
        httpOnly: false,
        secure: false,
        sameSite: "none",
      };
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json({checkuser})
}

const LogoutUser=async(req,res)=>{
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
}

const ResendOtp=async(req,res)=>{
    const {email} =req.user
    
    const user=await User.findOne({email})

    if(user.isverified){
        return res.status(200).json("The OTP IS Alredy VEREFIED")
    }
    const otp=generateOTP()
    await Email(otp)
        user.isCodeverifed=otp
        await user.save()
        return res.status(200).json(`${otp}The OTP IS RESEND SUCCESFULLY`)

}

export {RegisterUser,VerifyUser,LoginUser,CurrentUser,LogoutUser,ResendOtp}