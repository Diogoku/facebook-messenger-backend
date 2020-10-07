import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    facebookId: {
      type: String,
      required: true,
      unique: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    friends: [
      {
        facebookId: { type: String, required: true },
        chatId: { type: String, required: true },
      },
    ],
    friendsRequestsReceived: [String],
    friendsRequestsSent: [String],
    blockedList: [String],
    blockedByList: [String],
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
