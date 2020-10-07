import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import Pusher from "pusher";
import dotenv from "dotenv";
dotenv.config();

// IMPORT ROUTES
import auth_routes from "./routes/auth_user.js";
import public_users_routes from "./routes/public_users.js";
import friends_routes from "./routes/friends.js";
import chat_routes from "./routes/chat.js";

// APP CONFIG
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// MIDDLEWARE
app.use(express.json());
app.use(cors());

// DB CONFIG
const connection_url = process.env.MONGODB_URL;

mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("Mongo DB connected...");

  const changeStream = mongoose.connection.collection("chats").watch();
  changeStream.on("change", (change) => {
    pusher.trigger("chats", "newChat", {
      change: change,
    });
  });
});

// API ROUTES
app.use("/auth/", auth_routes);
app.use("/publicUsers/", public_users_routes);
app.use("/friends/", friends_routes);
app.use("/chat/", chat_routes);

// APP LISTEN
app.listen(port, () => console.log(`Listening on port: ${port}`));
