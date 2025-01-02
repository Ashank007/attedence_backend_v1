import mongoose from "mongoose";

const ConnectDb = async ()=>{
   await mongoose.connect(process.env.MONGO_URI,{
    dbName:"Attendenceapp",
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
   }).then(()=>console.log("DataBase Connected Successfully")).catch((e)=>console.log(e));
}
export default ConnectDb;