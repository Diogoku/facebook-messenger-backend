import mongoose from "mongoose";

// Message Model
import { MessageSchema } from "./message.js";

const ChatSchema = mongoose.Schema(
  { conversation: [MessageSchema] },
  { timestamps: true }
);

export default mongoose.model("Chat", ChatSchema);
