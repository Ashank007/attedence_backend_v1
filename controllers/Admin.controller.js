import ApiResponse from "../utils/ApiResponse.js"
import ApiError from "../utils/ApiError,.js"
import Student from "../models/Student.js"
import Admin from "../models/Admin.js"
import bcrypt from "bcrypt"
import GenerateToken from "../utils/Token.js"
import moment from "moment"
import { Parser } from "json2csv"
const RegisterAdmin = async(req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email||!password){
            return res.status(404).json(new ApiResponse(false,"Email and Password is required"));
        }
        const admin = await Admin.findOne({email:email});
        if(admin){
            return res.status(409).json(new ApiResponse(false,"Admin already registered"));
        }
        const hasedpassword = await bcrypt.hash(password,10);
        const newadmin = await Admin.create({
            email:email,
            password:hasedpassword,
        })
        res.status(201).json(new ApiResponse(true,"Admin registered successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
const LoginAdmin = async(req,res)=>{
    try {
        const {email,password} = req.body;
        if(!email||!password){
            return res.status(404).json(new ApiResponse(false,"Email and Password is required"));
        }
        const admin = await Admin.findOne({email:email}).select("+password");
        if(!admin){
            return res.status(404).json(new ApiResponse(false,"Admin not found"));
        }
        const isMatch = await bcrypt.compare(password,admin.password);
        if(!isMatch){
            return res.status(401).json(new ApiResponse(false,"Invalid credentials"));
        }
        const token = GenerateToken(admin._id);
        res.json(new ApiResponse(true,token));
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
const Addstudent = async(req,res)=>{
    try {
        const {name,rollnumber} = req.body;
        const admin = await req.admin.populate("Students");
        if(!name||!rollnumber){
            return res.status(400).json(new ApiResponse(false,"Name and RollNumber is Required"));
        }
        for(let i=0;i<admin.Students.length;i++){
            if(admin.Students[i].Rollnumber===rollnumber){
                return res.status(400).json(new ApiResponse(false,"Student Already Exists"));
            }
        }
        const student  =  await Student.create({
            Name:name,
            Rollnumber:rollnumber
        });
        admin.Students.push(student._id);
        await admin.save();
        res.status(201).json(new ApiResponse(true,"Student Created Succesfully"));
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
const UpdateAttendence = async(req,res)=>{
    try {
        const formattedDate = moment().format('YYYY-MM-DD');
        const {data} = req.body;
        for(let i=0;i<data.length;i++)
        {
            const student = await Student.findOne({Rollnumber:data[i].rollnumber});
            student.record = data[i].record;
            if(!student.Datepresent.includes(formattedDate)){
                student.Datepresent.push(formattedDate);
            }
            await student.save();
        }
        res.status(200).json(new ApiResponse(true,"Attendence Success"));
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
const getallstudents = async(req,res)=>{
    try {
        const admin = await req.admin.populate('Students');        
        const student = [];
        for(let i=0;i<admin.Students.length;i++)
        {
            const data = {
                Name:admin.Students[i].Name,
                Rollnumber:admin.Students[i].Rollnumber
            }
            student.push(data);
        }
        res.status(200).json(new ApiResponse(true,student));  
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
const getcsv = async(req,res)=>{
    try {
        const formattedDate = moment().format('DD-MM-YYYY');
        const admin = await req.admin.populate('Students');
        if(!admin.Students){
            return res.status(404).json(new ApiResponse(false,"No Students found"));
        }
        let data = [];
        for(let i=0;i<admin.Students.length;i++){
            const record = admin.Students[i];
            data.push({
                Name:record.Name,
                Rollnumber:record.Rollnumber,
                Record:record.record
            });
        }
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(data);
        const header = `(${formattedDate})\n\n`
        const finalcsv = header+csv;
        res.header('Content-Type', 'text/csv');
        res.attachment(`${formattedDate}.csv`);
        res.send(finalcsv);
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
export {RegisterAdmin,LoginAdmin,Addstudent,UpdateAttendence,getallstudents,getcsv};