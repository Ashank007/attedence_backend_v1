import Express from "express"
import { RegisterAdmin,LoginAdmin, Addstudent,UpdateAttendence,getallstudents, getcsv, DeleteStudent } from "../controllers/Admin.controller.js";
import isAuthenticated from "../middleware/isauthenticaed.js";
const AdminRouter = Express.Router();

AdminRouter.post("/register",RegisterAdmin);
AdminRouter.post("/login",LoginAdmin);
AdminRouter.post("/add",isAuthenticated,Addstudent);
AdminRouter.put("/update",UpdateAttendence);
AdminRouter.get("/getallstudents",isAuthenticated,getallstudents);
AdminRouter.get("/getcsv",isAuthenticated,getcsv);
AdminRouter.delete("/delete",isAuthenticated,DeleteStudent);

export default AdminRouter;