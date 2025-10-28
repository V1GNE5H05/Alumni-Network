const express = require('express');
const router = express.Router();
const { getCollection } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');

// Login route
router.post('/login', asyncHandler(async (req, res) => {
  const { identifier, password, email } = req.body;
  const loginIdentifier = identifier || email;
  
  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username/email and password are required'
    });
  }
  
  const usersCollection = getCollection('users');
  
  // Try login by username or email
  const user = await usersCollection.findOne({ 
    $or: [ 
      { username: loginIdentifier }, 
      { email: loginIdentifier } 
    ], 
    password 
  });
  
  if (user) {
    console.log("Login successful for: " + loginIdentifier);
    res.json({ 
      success: true, 
      message: "Login successful",
      user: {
        username: user.username,
        email: user.email
      }
    });
  } else {
    console.log("Invalid login attempt for: " + loginIdentifier);
    res.status(401).json({ 
      success: false, 
      message: "Invalid credentials" 
    });
  }
}));

// Add new user (admin only)
router.post('/add-user', asyncHandler(async (req, res) => {
  const { username, userid } = req.body;
  const userIdentifier = username || userid;
  
  if (!userIdentifier) {
    return res.status(400).json({ 
      success: false,
      message: "username/userid required" 
    });
  }
  
  const usersCollection = getCollection('users');
  
  if (username) {
    await usersCollection.insertOne({ 
      username, 
      password: username 
    });
    res.json({ 
      success: true,
      message: "User added", 
      username 
    });
  } else {
    await usersCollection.insertOne({ 
      email: userid, 
      password: userid, 
      username: userid 
    });
    res.json({ 
      success: true,
      message: "User added", 
      userid 
    });
  }
}));

module.exports = router;
