import { Router } from "express";
import { LoginUser,CurrentUser, RegisterUser, VerifyUser,LogoutUser ,ResendOtp,DeleteUser,GoogleAuth} from "../controller/user.js";
import {Auth} from "../middlewares/Auth.js";

const route=Router()

route.post("/signup",RegisterUser);
route.post("/verify",Auth,VerifyUser);
route.post("/login",LoginUser)
route.get("/me",Auth,CurrentUser)
route.get("/logout",Auth,LogoutUser)
route.post("/resend",Auth,ResendOtp)
route.delete("/delete",DeleteUser)
route.post("/auth/google",GoogleAuth)



export default route