import mongoose, {Schema} from "mongoose";
const teamSchema= new Schema(
    {
        name:{
            type:String,
            required:true,
            trim:true
        },
        departmentId:{

            type:Schema.Types.ObjectId,
            ref:"Department",
            required:true
        },
        members:[
            {
                type:Schema.Types.ObjectId,
                ref:"User"
            }
        ],
        isAvailable:{
            type:Boolean,
            default:true
        },
          currentLocation: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      },
      updatedAt: {
        type: Date
      }
    }
    },{timestamps:true}
);
const Team= mongoose.model("Team", teamSchema);

export default Team;