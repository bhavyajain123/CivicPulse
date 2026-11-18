import mongoose,{Schema} from "mongoose";
const departmentSchema= new Schema(
    {
        name:{
            type:String,
            required:true,
            unique:true,
            trim:true
        },
        description:{
            type:String,
            required:true
        },
        isActive:{
            type:Boolean,
            default:true
        }
    },{timestamps:true}
);

const Department= mongoose.model("Department", departmentSchema);
export default Department;