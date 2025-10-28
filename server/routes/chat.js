const express = require('express');
const router = express.Router();
const { getCollection } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');

// Get all contacts (alumni) for chat
router.get('/contacts', asyncHandler(async (req, res) => {
  const loggedInUser = req.query.username;
  
  if (!loggedInUser) {
    return res.status(400).json({ 
      success: false,
      message: 'Username required' 
    });
  }
  
  const collection = getCollection('student');
  
  // Get all students except the logged-in user
  const contacts = await collection.find({
    alumni_id: { $ne: loggedInUser }
  }).project({
    alumni_id: 1,
    name: 1,
    department: 1,
    batch: 1
  }).toArray();
  
  res.json(contacts);
}));

// Get all conversations for a user
router.get('/conversations/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  const conversationsCollection = getCollection('conversations');
  
  // Find all conversations where user is a participant
  const conversations = await conversationsCollection.find({
    participants: username
  }).sort({ lastMessageTime: -1 }).toArray();
  
  res.json(conversations);
}));

// Get messages between two users
router.get('/messages/:user1/:user2', asyncHandler(async (req, res) => {
  const { user1, user2 } = req.params;
  const messagesCollection = getCollection('messages');
  
  console.log('Fetching messages between:', user1, 'and', user2);
  
  // Find all messages between these two users
  const messages = await messagesCollection.find({
    $or: [
      { sender: user1, receiver: user2 },
      { sender: user2, receiver: user1 },
      // Also check if user1 or user2 might be stored differently
      { sender: { $regex: new RegExp(user1, 'i') }, receiver: user2 },
      { sender: user1, receiver: { $regex: new RegExp(user2, 'i') } },
      { sender: user2, receiver: { $regex: new RegExp(user1, 'i') } },
      { sender: { $regex: new RegExp(user2, 'i') }, receiver: user1 }
    ]
  }).sort({ timestamp: 1 }).toArray();
  
  console.log('Found messages:', messages.length);
  res.json(messages);
}));

// Send a message
router.post('/send', asyncHandler(async (req, res) => {
  const { sender, receiver, message } = req.body;
  
  if (!sender || !receiver || !message) {
    return res.status(400).json({ 
      success: false,
      message: 'Sender, receiver, and message are required' 
    });
  }
  
  const messagesCollection = getCollection('messages');
  const conversationsCollection = getCollection('conversations');
  
  // Create message document
  const newMessage = {
    sender,
    receiver,
    message: message.trim(),
    timestamp: new Date(),
    read: false
  };
  
  // Insert message
  const result = await messagesCollection.insertOne(newMessage);
  
  // Update or create conversation
  const participants = [sender, receiver].sort();
  
  await conversationsCollection.updateOne(
    { participants },
    {
      $set: {
        participants,
        lastMessage: message.trim(),
        lastMessageTime: new Date(),
        lastSender: sender
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
  
  res.status(201).json({ 
    success: true, 
    message: 'Message sent successfully',
    messageId: result.insertedId,
    data: newMessage
  });
}));

// Get unread message count
router.get('/unread/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  const messagesCollection = getCollection('messages');
  
  const unreadCount = await messagesCollection.countDocuments({
    receiver: username,
    read: false
  });
  
  res.json({ unreadCount });
}));

// Mark messages as read
router.put('/read/:sender/:receiver', asyncHandler(async (req, res) => {
  const { sender, receiver } = req.params;
  const messagesCollection = getCollection('messages');
  
  await messagesCollection.updateMany(
    { sender, receiver, read: false },
    { $set: { read: true } }
  );
  
  res.json({ 
    success: true,
    message: 'Messages marked as read' 
  });
}));

module.exports = router;
