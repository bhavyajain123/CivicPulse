import type { DecodedIdToken } from "firebase-admin/auth";
import User from "../users/user.model";

export const findOrLinkFirebaseUser = async (
  decodedToken: DecodedIdToken
) => {
  let user = await User.findOne({
    firebaseUid: decodedToken.uid
  });

  if (user) {
    if (!user.isActive) {
      throw new Error("ACCOUNT_INACTIVE");
    }

    return user;
  }

  
  const email = decodedToken.email?.trim().toLowerCase();

  if (!email || !decodedToken.email_verified) {
    throw new Error("VERIFIED_EMAIL_REQUIRED");
  }

  user = await User.findOne({ email });

  if (!user) {
    return null;
  }

  if (
    user.firebaseUid &&
    user.firebaseUid !== decodedToken.uid
  ) {
    throw new Error("ACCOUNT_ALREADY_LINKED");
  }

  user.firebaseUid = decodedToken.uid;
  await user.save();
  if (!user.isActive) {
    throw new Error("ACCOUNT_INACTIVE");
  }

  return user;
};