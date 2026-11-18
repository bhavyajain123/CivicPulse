import mongoose, {Schema, Document} from "mongoose";

export interface IFeedback extends Document{
    userId: mongoose.Types.ObjectId;
    incidentId: mongoose.Types.ObjectId;
    rating:number;
    comment:string;
    status:"pending"| "reviewed";
}

const feedbackSchema= new Schema<IFeedback>(
    {
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    incidentId:{
        type:Schema.Types.ObjectId,
        ref:"Incident",
        required:true
    },
    rating:{
        type:Number,
        required:true,
        min:1,
        max:5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000
    },
     status: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending"
    }
    },{timestamps:true}
);
feedbackSchema.index(
  { userId: 1, incidentId: 1 },
  { unique: true }
);

const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);

export default Feedback;