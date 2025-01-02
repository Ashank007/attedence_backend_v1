import mongoose from "mongoose";

const AdminSechema = mongoose.Schema({
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    Students:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student"
    }]
},{timestamps:false,versionKey: false});

const Admin = mongoose.model("Admin",AdminSechema);

export default Admin;