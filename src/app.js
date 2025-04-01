import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
const app=express();

app.use(cors({
    origin:process.env.CORS,
    credentials:true,
    methods: ["GET", "PUT", "POST", "DELETE"],
}))

app.use(express.json({limit:"30kb"}))
app.use(express.urlencoded({extended:false}))
app.use(cookieParser())
app.get("/",(req,res)=>{
    res.send("our server are live you can hit any time")
})
import userRouter from "./route/user.routes.js"
app.use("/user",userRouter)

export {app};



