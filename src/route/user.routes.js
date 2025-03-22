import { Router } from "express";
import {
  LoginUser,
  CurrentUser,
  RegisterUser,
  VerifyUser,
  LogoutUser,
  ResendOtp,
  DeleteUser,
  GoogleLogin,
  GoogleSignup,
} from "../controller/user.js";
import { Auth } from "../middlewares/Auth.js";

const route = Router();

route.post("/signup", RegisterUser);
route.post("/verify", Auth, VerifyUser);
route.post("/login", LoginUser);
route.get("/me", Auth, CurrentUser);
route.get("/logout", Auth, LogoutUser);
route.post("/reset-otp", Auth, ResendOtp);
route.get("/delete", DeleteUser);
route.post("/google-login", GoogleLogin);
route.post("/google-signup", GoogleSignup);

export default route;
