
import mongoose from "mongoose" 
const dbconnect=async()=>{
    try {
        const connectinstance=await mongoose.connect(`${process.env.REACT_APP_MONGODB_URL}/${process.env.REACT_APP_DBNAME}`)
        console.log("You DB is Connect and up and Runnnig n host:" ,connectinstance.connection.host)
    } catch (error) {
        console.log("Some Error Occured",error);
        process.exit(1);
        
    }
}

export {dbconnect}