import express from "express";

// MODEL
import User from "../models/user.js";

// ROUTE
const router = express.Router();

// GET ALL USERS (PUBLIC DATA)
router.get("/", (req, res) => {
  User.find()
    .select("name facebookId")
    .lean()
    .then((users) => res.status(200).send(users))
    .catch((err) => res.status(500).send(err));
});

// GET SINGLE USER (PUBLIC DATA)
router.get("/:userId", (req, res) => {
  User.findOne({ facebookId: req.params.userId })
    .select("name facebookId")
    .then((user) => res.status(200).send(user))
    .catch((err) =>
      res.send(`User with facebookId: ${req.params.userId} not found.`)
    );
});

export default router;
