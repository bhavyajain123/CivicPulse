import mongoose,{Schema, Document} from "mongoose";
export type NotificationType =
    | "new_incident"
    | "incident_assigned"
    | "incident_in_progress"
    | "incident_resolved";

export interface INotification extends Document{
    userId: mongoose.Types.ObjectId;
    title:string;
    message:string;
    type: NotificationType;
    incidentId?: mongoose.Types.ObjectId;
    isRead:  boolean;
}
const notificationSchema= new Schema<INotification>(
    {
        userId:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        title:{
            type:String,
            required:true,
            trim:true
        },
        message:{
            type:String,
            required:true,
            trim:true

        },
        type:{
            type:String,
            required:true
        },
        incidentId:{
            type:Schema.Types.ObjectId,
            ref:"Incident",
            default:null
        },
        isRead:{
            type:Boolean,
            default:false
        }
    },{timestamps:true}
);

const Notification= mongoose.model<INotification>(
    "Notification",
    notificationSchema
);
export default Notification;