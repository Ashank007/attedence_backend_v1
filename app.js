import express from "express"
import cookieParser from "cookie-parser"
import dotenv from "dotenv";
import adminRouter from "./routes/Admin.routes.js";
import ConnectDb from "./config/database.js";
import cors from "cors"
dotenv.config();
ConnectDb();
const app = express();

app.get("/",(req,res)=>{
    res.send("Backend Server is running");
})
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:'*',
    credentials: true,
    methods: "GET, POST, PUT, DELETE, PATCH"  
}))
app.use(express.urlencoded({ extended: true }))
app.use("/api/v1/admin",adminRouter);
export default app;