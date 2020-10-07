import express from "express";

// MODEL
import User from "../models/user.js";

// ROUTE
const router = express.Router();

// POST LOGIN/REGISTER USER
router.post("/", (req, res) => {
  const body = req.body;
  User.findOne({ facebookId: body.facebookId })
    .select(
      "name facebookId photoUrl friends friendsRequestsReceived friendsRequestsSent blockedList blockedByList"
    )
    .then((user) => {
      if (user) res.status(200).send(user);
      else {
        // create new user
        const newUser = new User({
          name: body.name,
          email: body.email,
          facebookId: body.facebookId,
          photoUrl: body.photoUrl,
          friends: [],
          friendsRequestsRecieved: [],
          friendsRequestsSent: [],
          blockedLIst: [],
          blockedByList: [],
        });
        // SAVE NEW USER
        newUser
          .save()
          .then((newUser) => res.status(201).send(newUser))
          .catch((err) => console.log(err));
      }
    });
});

export default router;
