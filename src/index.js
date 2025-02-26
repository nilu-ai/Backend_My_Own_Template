import {app} from "./app.js"
import {dbconnect} from "./db/index.js"

const PORT =process.env.PORT
dbconnect().then(()=>{
    app.listen(PORT,()=>{
        console.log("Server start on PoRT : ",PORT)
    })
})


