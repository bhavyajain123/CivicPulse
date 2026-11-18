
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/modules/users/user.model";

dotenv.config();

const listResponseTeams = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    const users = await User.find({
      role: "response_team",
      isActive: true
    }).select("name email");

    console.log("Registered active Response Team users:");

    if (users.length === 0) {
      console.log("No active Response Team users found.");
    }

    users.forEach((user) => {
      console.log({
        name: user.name,
        email: user.email
      });
    });
  } catch (error) {
    console.error("Unable to fetch users:", error);
  } finally {
    await mongoose.disconnect();
  }
};

listResponseTeams();
