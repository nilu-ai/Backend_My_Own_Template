import { User } from "../model/user.model.js";
import Email from "../utils/Email.js";
import ApiError from "../utils/ApiError.js";
import { OAuth2Client } from "google-auth-library";
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000);
}
const generatetoken = async (_id) => {
  try {
    const user = await User.findById(_id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken;
    await user.save();
    return { accessToken, refreshToken };
  } catch (error) {
    //console.log("Error in Creating the Tokens" ,error);
    throw new ApiError(500, "Error in Creating the Tokens");
  }
};
const RegisterUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name | !email | !username | !password) {
      throw new ApiError(400, "All the Filed should be Required");
    }

    const check = await User.findOne({ $or: [{ email }, { username }] });
    if (check) {
      throw new ApiError(409, "User us presnet this email or username");
    }
    const otp = generateOTP();

    const user = await User.create({
      name,
      email,
      username: username.toLowerCase(),
      password,
      isCodeverifed: otp,
    });

    await Email(otp, email);

    // if(mailsend)

    const checkuser = await User.findById(user._id).select(
      "-passowrd -refreshToken"
    );

    if (!checkuser) {
      throw new ApiError(500, "Some Error while Creating the User");
    }
    //console.log(checkuser);

    const { accessToken, refreshToken } = await generatetoken(checkuser._id);
    const options = {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ checkuser });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      sucess: false,
      message: error.message || "Inter Server Error",
    });
  }
};

const VerifyUser = async (req, res) => {
  try {
    const { otp } = req.body;
    const { email, username } = req.user;
    const user = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });
    if (!user) {
      throw new ApiError(404, "The User not present");
    }
    //console.log(user);

    if (user.isverified) {
      throw new ApiError(400, "The User is Already Verified");
    }

    if (user.isCodeverifed == otp) {
      user.isverified = true;
      user.isCodeverifed = null;
      await user.save();
      return res.status(200).json(["Otp verified Succesfully", { user }]);
    }
    return res.status(401).json("Otp Not verified Succesfully");
  } catch (error) {
    res.status(error.statusCode || 500).json({
      sucess: false,
      message: error.message || "Inter Server Error",
    });
  }
};

const LoginUser = async (req, res) => {
  //console.log("request")
  try {
    const { email, password } = req.body;

    if (!email | !password) {
      throw new ApiError(400, "All Filed Required");
    }

    const loguser = await User.findOne({
      $or: [{ email }, { username: email }],
    }).select(" -refreshToken");
    if (!loguser) {
      throw new ApiError(404, "The User Is not Present");
    }

    //console.log(loguser);

    const check = await loguser.isPasswordCorrect(password);

    if (!check) {
      throw new ApiError(401, "The Password is Wrong");
    }

    const { accessToken, refreshToken } = await generatetoken(loguser._id);
    const checkuser = await User.findById(loguser._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        checkuser: {
          _id: checkuser._id,
          email: checkuser.email,
          name: checkuser.name,
          username: checkuser.username,
          isverified: checkuser.isverified,
          accessToken: accessToken,
        },
      });
  } catch (error) {
    //console.log(error);

    res.status(error.statusCode || 500).json({
      sucess: false,
      message: error.message || "Inter Server Error",
    });
  }
};

const CurrentUser = async (req, res) => {
  try {
    const { accessToken, refreshToken } = await generatetoken(req.user._id);
    const checkuser = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );
    const options = {
      httpOnly: false,
      secure: false,
      sameSite: "none",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({ checkuser });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      sucess: false,
      message: error.message || "Inter Server Error",
    });
  }
};

const LogoutUser = async (req, res) => {
  // console.log("coming");

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
      sucess: false,
      message: error.message || "Inter Server Error",
    });
  }
};

const ResendOtp = async (req, res) => {
  try {
    const { email } = req.user;

    const user = await User.findOne({ email });

    if (user.isverified) {
      throw new ApiError(400, "The OTP IS Alredy VEREFIED");
    }
    const otp = generateOTP();
    await Email(otp, email);
    user.isCodeverifed = otp;
    await user.save();
    return res.status(200).json(`${otp}The OTP IS RESEND SUCCESFULLY`);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      sucess: false,
      message: error.message || "Inter Server Error",
    });
  }
};

const DeleteUser = async (req, res) => {
  try {
    await User.deleteMany({});
    return res
      .status(200)
      .json({ message: "All users have been deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const GoogleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, "The  Token are Not pResent");
    }

    const client = new OAuth2Client(process.env.CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID,
    });

    const { email, sub } = ticket.getPayload();

    let user = await User.findOne({ email, sub }).select(
      "-passowrd -refreshToken"
    );

    if (!user) {
      throw new ApiError(404, "User not found. Please sign up first.");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const options = {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        user,
      });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};


const GoogleSignup = async (req, res) => {
    try {
      const { token,password } = req.body;
  
      if (!token) {
        throw new ApiError(400, "The  Token are Not pResent");
      }
  
      const client =new OAuth2Client(process.env.CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
      });
      const data=ticket.getPayload()
   
        
      const { name,email, sub,picture } = ticket.getPayload();
      const username = email.split('@')[0] + Math.floor(1000 + Math.random() * 9000).toString();

      if (!name | !email | !username | !password) {
        throw new ApiError(400, "All the Filed should be Required");
      }
  
      const check = await User.findOne({ $or: [{ email }, { username },{ sub }] });
      if (check) {
        throw new ApiError(409, "User us presnet this email or username or sub");
      }
      const otp = generateOTP();
  
      const user = await User.create({
        name,
        email,
        username: username.toLowerCase(),
        sub,
        picture,
        isCodeverifed: otp,
        password
      });
  
      await Email(otp, email);
  
      // if(mailsend)
  
      const checkuser = await User.findById(user._id).select(
        "-passowrd -refreshToken"
      );
  
      if (!checkuser) {
        throw new ApiError(500, "Some Error while Creating the User");
      }
      //console.log(checkuser);
  
      const { accessToken, refreshToken } = await generatetoken(checkuser._id);
      const options = {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      };
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({ checkuser });
    } catch (error) {
      res
        .status(error.statusCode || 500)
        .json({ success: false, message: "Server error", error: error.message });
    }
  };
export {
  
  RegisterUser,
  VerifyUser,
  LoginUser,
  CurrentUser,
  LogoutUser,
  ResendOtp,
  DeleteUser,GoogleLogin,
  GoogleSignup,
};
