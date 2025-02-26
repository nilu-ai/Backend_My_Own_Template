
import mongoose from "mongoose" 
const dbconnect=async()=>{
    try {
        const connectinstance=await mongoose.connect("mongodb://localhost:27017/ecommerse")
        console.log("You DB is Connect and up and Runnnig n host:" ,connectinstance.connection.host)
    } catch (error) {
        console.log("Some Error Occured",error);
        process.exit(1);
        
    }
}

export {dbconnect}