import mongoose from "mongoose";

const stringRequired = { type: String, required: true };

export const MessageSchema = mongoose.Schema(
  {
    from: stringRequired,
    text: stringRequired,
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);
