import mongoose,{Schema} from "mongoose";
const userSchema= new Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    firebaseUid: {
  type: String,
  unique: true,
  sparse: true,
  trim: true
},
    password:{
        type:String,
        required:false,
        select:false
    },
    phone:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:["citizen","operator","officer","response_team","admin"],
        default:"citizen"
    },
    departmentId:{
        type:Schema.Types.ObjectId,
        ref:"Department",
        default:null
    },
    isActive:{
        type:Boolean,
        default:true
    },
    
},{timestamps:true}
);

const User= mongoose.model("User", userSchema);

export default User;