import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/modules/users/user.model";

dotenv.config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);

    const email = "firemember@gmail.com";
    const newPassword = process.env.TEAM_TEMP_PASSWORD;

    if (!newPassword || newPassword.length < 8) {
      throw new Error("Temporary password must be at least 8 characters.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          password: hashedPassword,
          isActive: true
        }
      },
      { new: true }
    );

    if (!user) {
      throw new Error("Response team user not found.");
    }

    console.log("Response team password reset successful.");
    console.log("Account:", user.email);
  } catch (error) {
    console.error("Password reset failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetPassword();