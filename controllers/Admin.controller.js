import ApiResponse from "../utils/ApiResponse.js"
import ApiError from "../utils/ApiError,.js"
import Student from "../models/Student.js"
import Admin from "../models/Admin.js"
import bcrypt from "bcrypt"
import GenerateToken from "../utils/Token.js"
import moment from "moment"
import { Transform  } from "json2csv"
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
const UpdateAttendance = async (req, res) => {
    try {
        const formattedDate = moment().format('YYYY-MM-DD');
        const admin = await req.admin.populate("Students");
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json(new ApiResponse(false, "Valid data is required"));
        }
        const dataMap = new Map(data.map(item => [item.rollnumber, item.record]));
        const bulkOps = admin.Students
            .filter(student => dataMap.has(student.Rollnumber))
            .map(student => {
                const newRecord = dataMap.get(student.Rollnumber);
                const update = {
                    $set: { record: newRecord },
                    $addToSet: { Datepresent: formattedDate } 
                };
                return {
                    updateOne: {
                        filter: { _id: student._id },
                        update
                    }
                };
            });
        if (bulkOps.length === 0) {
            return res.status(404).json(new ApiResponse(false, "No matching students found to update"));
        }
        await Student.bulkWrite(bulkOps);
        res.status(200).json(new ApiResponse(true, "Attendance updated successfully"));
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json(new ApiError(false, error.message));
    }
};

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
const getcsv = async (req, res) => {
    try {
        const formattedDate = moment().format('DD-MM-YYYY');
        const admin = await req.admin.populate('Students');

        if (!admin.Students || admin.Students.length === 0) {
            return res.status(404).json({ success: false, message: "No Students found" });
        }

        const fields = ['Name', 'Rollnumber', 'Record'];
        const opts = { fields };

        const transform = new Transform(opts);
        res.header('Content-Type', 'text/csv');
        res.attachment(`${formattedDate}.csv`);
        res.write(`(${formattedDate})\n\n`);

        admin.Students.forEach((record) => {
            const data = {
                Name: record.Name,
                Rollnumber: record.Rollnumber,
                Record: record.record,
            };
            transform.write(data); 
        });
        transform.pipe(res); 
        transform.end(); 
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
const DeleteStudent = async(req,res)=>{
    try {
        const admin = await req.admin.populate("Students");
        if(!admin.Students){
            return res.status(404).json(new ApiResponse(false,"No Students found"));
        }
        const rollnumber = req.body.rollnumber;  
        let id;
        for(let i=0;i<admin.Students.length;i++){
            if(admin.Students[i].Rollnumber===rollnumber){
                id = admin.Students[i]._id;
                const student = await Student.findByIdAndDelete(id);
                admin.Students.splice(i,1);
                await admin.save();
                return res.status(200).json(new ApiResponse(true,"Student deleted successfully"));
            }
        }
        res.status(404).json(new ApiResponse(false,"Student Not Found"));
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
const MutlipleStudents = async(req,res)=>{
    try {
        const {rollnumber,students} = req.body;
        if(!rollnumber || !students){
            return res.status(400).json(new ApiResponse(false,"Rollnumber and Students array is required"));
        }
        if (rollnumber.length !== students.length) {
            return res.status(400).json(new ApiResponse(false,"Rollnumber and Students array should of equal length"));
        }
        const admin = await req.admin;
        if(!admin.Students){
            return res.status(404).json(new ApiResponse(false,"No Students found"));
        }
        const documents = rollnumber.map((roll, index) => ({
            rollnumber: roll,
            student: students[index],
        }));
        for (let i = 0; i < documents.length; i++) {
            const student = await Student.create({
                Name: documents[i].student,
                Rollnumber: documents[i].rollnumber,
            })
            let id = student._id.toString();
            admin.Students.push(id)
            await admin.save();
          }
        res.status(201).json(new ApiResponse(true,"Students Added Successfully"));
    } catch (error) {
        res.status(500).json(new ApiError(false,error.message));
    }
}
export {RegisterAdmin,LoginAdmin,Addstudent,UpdateAttendence,getallstudents,getcsv,DeleteStudent,MutlipleStudents};