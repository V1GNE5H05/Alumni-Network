const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');

// Get all friends for a user
router.get('/:alumniId', asyncHandler(async (req, res) => {
  const friendsCollection = getCollection('friends');
  const { alumniId } = req.params;
  
  // Get all friendships where user is either sender or receiver and status is accepted
  const friends = await friendsCollection.find({
    $or: [
      { senderId: alumniId, status: 'accepted' },
      { receiverId: alumniId, status: 'accepted' }
    ]
  }).toArray();
  
  res.json({ success: true, friends });
}));

// Send friend invitation
router.post('/invite', asyncHandler(async (req, res) => {
  const friendsCollection = getCollection('friends');
  const { senderId, senderName, receiverId, receiverName } = req.body;
  
  if (!senderId || !receiverId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Sender and receiver IDs are required' 
    });
  }
  
  // Check if invitation already exists
  const existing = await friendsCollection.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId }
    ]
  });
  
  if (existing) {
    if (existing.status === 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invitation already pending' 
      });
    }
    if (existing.status === 'accepted') {
      return res.status(400).json({ 
        success: false, 
        message: 'Already friends' 
      });
    }
  }
  
  // Create new invitation
  const invitation = {
    senderId,
    senderName,
    receiverId,
    receiverName,
    status: 'pending',
    createdAt: new Date()
  };
  
  await friendsCollection.insertOne(invitation);
  
  res.json({ 
    success: true, 
    message: 'Friend invitation sent successfully!' 
  });
}));

// Get pending invitations for a user
router.get('/invitations/:alumniId', asyncHandler(async (req, res) => {
  const friendsCollection = getCollection('friends');
  const { alumniId } = req.params;
  
  const invitations = await friendsCollection.find({
    receiverId: alumniId,
    status: 'pending'
  }).sort({ createdAt: -1 }).toArray();
  
  res.json({ success: true, invitations });
}));

// Accept friend invitation
router.post('/accept/:invitationId', asyncHandler(async (req, res) => {
  const friendsCollection = getCollection('friends');
  const { invitationId } = req.params;
  
  if (!ObjectId.isValid(invitationId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid invitation ID' 
    });
  }
  
  const result = await friendsCollection.updateOne(
    { _id: new ObjectId(invitationId) },
    { 
      $set: { 
        status: 'accepted',
        acceptedAt: new Date()
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    return res.status(404).json({ 
      success: false, 
      message: 'Invitation not found' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Friend request accepted!' 
  });
}));

// Reject friend invitation
router.post('/reject/:invitationId', asyncHandler(async (req, res) => {
  const friendsCollection = getCollection('friends');
  const { invitationId } = req.params;
  
  if (!ObjectId.isValid(invitationId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid invitation ID' 
    });
  }
  
  const result = await friendsCollection.deleteOne({ 
    _id: new ObjectId(invitationId) 
  });
  
  if (result.deletedCount === 0) {
    return res.status(404).json({ 
      success: false, 
      message: 'Invitation not found' 
    });
  }
  
  res.json({ 
    success: true, 
    message: 'Friend request rejected' 
  });
}));

// Get friend messages
router.get('/messages/:friendshipId', asyncHandler(async (req, res) => {
  const messagesCollection = getCollection('friend_messages');
  const { friendshipId } = req.params;
  
  const messages = await messagesCollection.find({
    friendshipId
  }).sort({ timestamp: 1 }).toArray();
  
  res.json({ success: true, messages });
}));

// Send message to friend
router.post('/messages', asyncHandler(async (req, res) => {
  const messagesCollection = getCollection('friend_messages');
  const { friendshipId, senderId, senderName, message } = req.body;
  
  if (!friendshipId || !senderId || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields' 
    });
  }
  
  const newMessage = {
    friendshipId,
    senderId,
    senderName,
    message,
    timestamp: new Date(),
    read: false
  };
  
  await messagesCollection.insertOne(newMessage);
  
  res.json({ 
    success: true, 
    message: 'Message sent',
    data: newMessage
  });
}));

module.exports = router;
