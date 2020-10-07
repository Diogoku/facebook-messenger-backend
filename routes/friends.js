import express from "express";

// MODELS
import User from "../models/user.js";
import Chat from "../models/chat.js";

// ROUTE
const router = express.Router();

// PUT SEND FRIEND REQUEST
router.put("/request/send", async (req, res) => {
  const body = req.body;
  // verifications before making the request
  // check if both users exits
  const sender = await User.findOne({ facebookId: body.from });
  const receiver = await User.findOne({ facebookId: body.to });
  if (!sender)
    res.send(`Current user with facebookId: ${body.from} does not exists.`);
  if (!receiver) res.send(`User with facebookId: ${body.to} does not exists.`);

  // check if sender has receiver blocked
  if (sender.blockedList.includes(receiver.facebookId))
    res.send(`You have ${receiver.name} blocked.`);
  else {
    // check if sender is blocked by receiver
    if (sender.blockedByList.includes(receiver.facebookId))
      res.send(`You are blocked by ${receiver.name}.`);
    else {
      // check if both users aren't already friends
      if (
        sender.friends.some((friend) => friend.facebookId == body.to) ||
        receiver.friends.some((friend) => friend.facebookId == body.from)
      )
        res.send(
          `Sender, is already friend of reciever facebookId: ${body.to}.`
        );

      // check if sender had already received a friend request from the receiver
      if (sender.friendsRequestsReceived.some((request) => request == body.to))
        res.send(
          `${receiver.name} had already sent you a friend request. Accept/Reject it.`
        );

      // check if sender had already sent a friend request to the receiver (sender can only make one friend request per user)
      if (
        sender.friendsRequestsSent.some(
          (request) => request == receiver.facebookId
        )
      )
        res.send(`You have already sent a friend request to ${receiver.name}.`);
      else {
        // sender send friend request to receiver
        sender.friendsRequestsSent.push(receiver.facebookId);
        // receiver receive friend request from sender
        receiver.friendsRequestsReceived.push(sender.facebookId);

        // update users
        sender.save();
        receiver.save();

        res.status(200).send("Successfully made friend request.");
      }
    }
  }
});

// PUT CANCEL FRIEND REQUEST
router.put("/request/cancel", async (req, res) => {
  const body = req.body;
  // verifications before making the request
  // check if both users exits
  const currentUser = await User.findOne({ facebookId: body.currentUserId });
  const canceledUser = await User.findOne({ facebookId: body.cancelUserId });
  if (!currentUser)
    res.send(`Current user, facebookId: ${body.currentUser} does not exists.`);
  if (!canceledUser)
    res.send(`User with facebookId: ${body.canceledUserId} does not exists.`);

  // remove friend request sent to canceledUser from current user friends request sent, if exits
  const currentUserRemoveIndex = currentUser.friendsRequestsSent.indexOf(
    canceledUser.facebookId
  );
  if (currentUserRemoveIndex > -1) {
    currentUser.friendsRequestsSent.splice(currentUserRemoveIndex, 1);
  } else res.send(`No friend request has been made to ${canceledUser.name}.`);

  // remove friend request canceledUser received from current user, from friends request received list, if exist
  const canceledUserRemoveIndex = canceledUser.friendsRequestsReceived.indexOf(
    currentUser.facebookId
  );
  if (canceledUserRemoveIndex > -1)
    canceledUser.friendsRequestsReceived.splice(canceledUserRemoveIndex, 1);

  // update users
  currentUser.save();
  canceledUser.save();

  res
    .status(200)
    .send(`Successfully removed friend request to ${canceledUser.name}.`);
});

// PUT ACCEPT FRIEND REQUEST
router.put("/request/accept", async (req, res) => {
  const body = req.body;
  // verifications before accepting the friend request
  // check if both users exits
  const currentUser = await User.findOne({ facebookId: body.currentUserId });
  const acceptedUser = await User.findOne({ facebookId: body.acceptUserId });
  if (!currentUser)
    res.send(
      `Current user with facebookId: ${body.facebookId} does not exists.`
    );
  if (!acceptedUser)
    res.send(`User with facebookId: ${body.from} does not exists.`);

  // check if current user has a friend request from acceptedUser
  const hasReceivedFriendRequestIndex = currentUser.friendsRequestsReceived.indexOf(
    acceptedUser.facebookId
  );
  if (hasReceivedFriendRequestIndex > -1) {
    // check if acceptedUser sent a friend request to the current user
    const hasSentFriendRequestIndex = acceptedUser.friendsRequestsSent.indexOf(
      currentUser.facebookId
    );
    if (hasSentFriendRequestIndex > -1) {
      // create Chat between the users in question
      const newChat = new Chat();
      // remove from current user the friend request sent by acceptedUser
      currentUser.friendsRequestsReceived.splice(
        hasReceivedFriendRequestIndex,
        1
      );
      // remove from acceptedUser the friend request sent to the current user
      acceptedUser.friendsRequestsSent.splice(hasSentFriendRequestIndex, 1);
      // add friends
      currentUser.friends.push({
        facebookId: acceptedUser.facebookId,
        chatId: newChat.id,
      });
      acceptedUser.friends.push({
        facebookId: currentUser.facebookId,
        chatId: newChat.id,
      });

      // save new chat and update users
      newChat.save();
      currentUser.save();
      acceptedUser.save();
      res.status(200).json({
        chatId: newChat._id,
        msg: `${currentUser.name} and ${acceptedUser.name} are now friends, on Messenger.`,
      });
    } else
      res.send(
        `${acceptedUser.name} did not sent any friend request to ${currentUser.name}.`
      );
  } else {
    res.send(
      `${currentUser.name} did not receive any friend request from ${acceptedUser.name}`
    );
  }
});

// PUT REJECT FRIEND REQUEST
router.put("/request/reject", async (req, res) => {
  const body = req.body;
  // verifications before rejecting the friend request
  // check if both users exits
  const currentUser = await User.findOne({ facebookId: body.currentUserId });
  const rejectedUser = await User.findOne({ facebookId: body.rejectUserId });
  if (!currentUser)
    res.send(
      `Current user with facebookId: ${body.currentUserId} does not exists.`
    );
  if (!rejectedUser)
    res.send(`User with facebookId: ${body.rejectedUserId} does not exists.`);

  // check if user received a friend request from the rejectedUser
  const removeIndex = currentUser.friendsRequestsReceived.indexOf(
    rejectedUser.facebookId
  );
  if (removeIndex > -1) {
    // if yes, remove friend request from user (rejects)
    currentUser.friendsRequestsReceived.splice(removeIndex, 1);
    // remove also friend request sent from rejectedUser (rejected)
    const removeIndexSender = rejectedUser.friendsRequestsSent.indexOf(
      currentUser.facebookId
    );
    if (removeIndexSender > -1)
      rejectedUser.friendsRequestsSent.splice(removeIndexSender, 1);

    // update users
    currentUser.save();
    rejectedUser.save();

    res
      .status(200)
      .send(`${rejectedUser.name} friend request successfully rejected.`);
  } else
    res.send(
      `${currentUser.name} did not received a request from ${rejectedUser.name}.`
    );
});

// PUT ADD BLOCKED FRIEND
router.put("/block", async (req, res) => {
  const body = req.body;
  // verifications before rejecting the friend request
  // check if both users exits
  const currentUser = await User.findOne({ facebookId: body.currentUserId });
  const blockedUser = await User.findOne({ facebookId: body.blockUserId });
  if (!currentUser)
    res.send(
      `Current user with facebookId: ${body.currentUserId} does not exists.`
    );
  if (!blockedUser)
    res.send(`User with facebookId: ${body.blockUserId} does not exists.`);

  // check if blockedUser is already blocked
  if (currentUser.blockedList.includes(blockedUser.facebookId)) {
    res.send(`${blockedUser.name} is already blocked.`);
  } else {
    // check if current user is blocked by blockedUser
    if (currentUser.blockedByList.includes(blockedUser.facebookId))
      res.send(`You are already blocked by ${blockedUser.name}.`);
    else {
      // remove one or the other from friend list, if exist
      let currentUserRemoveFriendIndex;
      let blockedUserRemoveFriendIndex;
      currentUser.friends.map((friend, index) => {
        if (friend.facebookId == blockedUser.facebookId) {
          currentUserRemoveFriendIndex = index;
          // delete chat between the two users
          Chat.findOneAndDelete({ _id: friend.chatId }).catch((err) =>
            console.log(err)
          );
          blockedUser.friends.map((friend, index) => {
            if (friend.facebookId == currentUser.facebookId) {
              blockedUserRemoveFriendIndex = index;
            }
          });
        }
      });
      currentUser.friends.splice(currentUserRemoveFriendIndex, 1);
      blockedUser.friends.splice(blockedUserRemoveFriendIndex, 1);

      // remove blocked user from current user friends request sent list, if exist
      const currentUserNewfriendsRequestsSent = currentUser.friendsRequestsSent.filter(
        (request) => request != blockedUser.facebookId
      );
      currentUser.friendsRequestsSent = currentUserNewfriendsRequestsSent;

      // remove current user from blocked user friends request sent list, if exist
      const blockedUserNewfriendsRequestsSent = blockedUser.friendsRequestsSent.filter(
        (request) => request != currentUser.facebookId
      );
      blockedUser.friendsRequestsSent = blockedUserNewfriendsRequestsSent;

      // remove blocked user from current user friends request received list, if exist
      const currentUserNewfriendsRequestsReceived = currentUser.friendsRequestsReceived.filter(
        (request) => request != blockedUser.facebookId
      );
      currentUser.friendsRequestsReceived = currentUserNewfriendsRequestsReceived;

      // remove current user from blocked user friends request received list, if exist
      const blockedUserNewfriendsRequestsReceived = blockedUser.friendsRequestsReceived.filter(
        (request) => request != currentUser.facebookId
      );
      blockedUser.friendsRequestsReceived = blockedUserNewfriendsRequestsReceived;

      // add blocked user to current user blockedList
      currentUser.blockedList.push(blockedUser.facebookId);
      // add current user to blocked user blocked by list
      blockedUser.blockedByList.push(currentUser.facebookId);

      // update users
      currentUser.save();
      blockedUser.save();

      res.status(200).send(`${blockedUser.name} is now blocked.`);
    }
  }
});

// PUT REMOVE FRIEND FROM BLOCKED LIST
router.put("/unblock", async (req, res) => {
  const body = req.body;
  // verifications before rejecting the friend request
  // check if both users exits
  const currentUser = await User.findOne({ facebookId: body.currentUserId });
  const unblockUser = await User.findOne({ facebookId: body.unblockUserId });
  if (!currentUser)
    res.send(
      `Current user with facebookId: ${body.currentUserId} does not exists.`
    );
  if (!unblockUser)
    res.send(`User with facebookId: ${body.unblockUserId} does not exists.`);

  const removeIndex = currentUser.blockedList.indexOf(unblockUser.facebookId);
  const removeIndexBlockedUser = unblockUser.blockedByList.indexOf(
    currentUser.facebookId
  );
  // check if current user has unblockUser blocked
  if (removeIndex > -1) {
    currentUser.blockedList.splice(removeIndex, 1);
    // check if unblockUser was blocked by current user
    if (removeIndexBlockedUser > -1)
      unblockUser.blockedByList.splice(removeIndexBlockedUser, 1);

    // update users
    currentUser.save();
    unblockUser.save();

    res.send(`${unblockUser.name} is no longer blocked.`);
  } else res.send(`${unblockUser.name} is not blocked.`);
});

export default router;
