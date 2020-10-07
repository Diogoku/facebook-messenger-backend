import express from "express";

// MODEL
import Chat from "../models/chat.js";
import Message from "../models/message.js";

// ROUTE
const router = express.Router();

// GET CHAT ROOM MESSAGES
router.get("/:chatId", (req, res) => {
  const { chatId } = req.params;
  Chat.findById(chatId)
    .select("conversation")
    .lean()
    .then((conversation) => {
      res.send(conversation);
    })
    .catch((err) =>
      res.status(404).send(`Chat room with id: ${chatId} not found.`)
    );
});

// POST ADD MESSAGE TO CHAT
router.post("/:chatId", (req, res) => {
  // extract chat id from request param
  const { chatId } = req.params;
  // extract body from request
  const body = req.body;
  // find chat by id
  Chat.findById(chatId)
    .then((chat) => {
      // create new message
      new Message({
        from: body.from,
        text: body.text,
      })
        .save()
        .then((newMessage) => {
          // add new message to chat conversation
          chat.conversation.push(newMessage);

          // update chat
          chat
            .save()
            .then((updatedChat) =>
              res.status(200).json({
                newMessage: newMessage,
                msg: "Message added successfully.",
              })
            )
            .catch((err) => res.status(500));
        })
        .catch((err) => res.status(500));
    })
    .catch((err) =>
      res.status(404).send(`Chat room with id: ${chatId} not found.`)
    );
});

export default router;
