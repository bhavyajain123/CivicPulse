
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_URI as string
    );

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );

    console.log(
      `Database Name: ${connection.connection.name}`
    );

  } catch (error) {
    console.error("MongoDB Connection Failed:", error);

    process.exit(1);
  }
};

export default connectDB;
