const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getCollection } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { generateToken } = require('../middleware/auth');

// Login route
router.post('/login', asyncHandler(async (req, res) => {
  const { identifier, password, email } = req.body;
  const loginIdentifier = identifier || email;
  
  if (!loginIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: '❌ Username/email and password are required'
    });
  }
  
  const usersCollection = getCollection('users');
  
  // Find user by username or email
  const user = await usersCollection.findOne({ 
    $or: [ 
      { username: loginIdentifier }, 
      { email: loginIdentifier } 
    ]
  });
  
  if (!user) {
    console.log("User not found: " + loginIdentifier);
    return res.status(401).json({ 
      success: false, 
      message: "❌ Invalid credentials. Please check your username and password." 
    });
  }
  
  // Check if password is hashed (starts with $2b$ for bcrypt)
  let passwordMatch = false;
  if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
    // Compare hashed password
    passwordMatch = await bcrypt.compare(password, user.password);
  } else {
    // Plain text password (legacy users)
    passwordMatch = (password === user.password);
  }
  
  if (passwordMatch) {
    // Generate JWT token
    const token = generateToken(user);
    
    console.log("Login successful for: " + loginIdentifier);
    res.json({ 
      success: true, 
      message: "✅ Login successful",
      token: token, // JWT token for authentication
      user: {
        username: user.username,
        email: user.email
      }
    });
  } else {
    console.log("Invalid password for: " + loginIdentifier);
    res.status(401).json({ 
      success: false, 
      message: "❌ Invalid credentials. Please check your password." 
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
  
  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(userIdentifier, 10);
  
  if (username) {
    await usersCollection.insertOne({ 
      username, 
      password: hashedPassword,
      createdAt: new Date()
    });
    res.json({ 
      success: true,
      message: "✅ User added successfully with secure password", 
      username 
    });
  } else {
    await usersCollection.insertOne({ 
      email: userid, 
      password: hashedPassword, 
      username: userid,
      createdAt: new Date()
    });
    res.json({ 
      success: true,
      message: "✅ User added successfully with secure password", 
      userid 
    });
  }
}));

// Verify student exists in student database
router.post('/api/verify-student', asyncHandler(async (req, res) => {
  const { degree, department, batch, name, admissionNumber } = req.body;
  
  if (!department || !admissionNumber) {
    return res.status(400).json({
      success: false,
      message: 'Department and admission number are required'
    });
  }
  
  try {
    // Connect to alumni_network database
    const { MongoClient } = require('mongodb');
    const studentDbUri = process.env.STUDENT_DB_URI || process.env.MONGODB_URI;
    const client = new MongoClient(studentDbUri);
    await client.connect();
    
    const studentDb = client.db('alumni_network');
    // Use preregistered_students collection instead of separate database
    const studentCollection = studentDb.collection('preregistered_students');
    
    // Search for student by admission number (case-insensitive)
    const student = await studentCollection.findOne({
      admissionNumber: { $regex: new RegExp(`^${admissionNumber}$`, 'i') }
    });
    
    await client.close();
    
    if (student) {
      res.json({
        success: true,
        message: 'Student verified',
        student: {
          name: student.name,
          admissionNumber: student.admissionNumber,
          department: student.department,
          batch: student.batch
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Student not found in database. Please check your details or contact admin.'
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying student: ' + error.message
    });
  }
}));

// Register alumni (after verification)
router.post('/api/register-alumni', asyncHandler(async (req, res) => {
  const { 
    degree, department, batch, name, admissionNumber, 
    email, phone, password 
  } = req.body;
  
  // Validate required fields
  if (!email || !password || !admissionNumber) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and admission number are required'
    });
  }
  
  // Sanitize inputs to prevent XSS
  const sanitizeInput = (str) => {
    if (!str) return str;
    return String(str)
      .replace(/[<>]/g, '') // Remove < and >
      .trim();
  };
  
  const sanitizedName = sanitizeInput(name);
  const sanitizedEmail = sanitizeInput(email).toLowerCase();
  const sanitizedAdmissionNumber = sanitizeInput(admissionNumber).toUpperCase();
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return res.status(400).json({
      success: false,
      message: '❌ Invalid email format. Please enter a valid email address.'
    });
  }
  
  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: '❌ Password must be at least 8 characters long.'
    });
  }
  
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: '❌ Password must contain at least one uppercase letter.'
    });
  }
  
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: '❌ Password must contain at least one number.'
    });
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: '❌ Password must contain at least one special character (!@#$%^&* etc).'
    });
  }
  
  const usersCollection = getCollection('users');
  const studentsCollection = getCollection('students');
  
  // Check if admission number already registered
  const existingByAdmission = await studentsCollection.findOne({ 
    $or: [
      { admissionNumber: sanitizedAdmissionNumber },
      { alumni_id: sanitizedAdmissionNumber }
    ]
  });
  
  if (existingByAdmission) {
    return res.status(400).json({
      success: false,
      message: '❌ This admission number is already registered. If you forgot your password, please contact admin.'
    });
  }
  
  // Check if email already registered
  const existingByEmail = await usersCollection.findOne({ 
    email: sanitizedEmail
  });
  
  if (existingByEmail) {
    return res.status(400).json({
      success: false,
      message: '❌ This email is already registered. Please use a different email or login if you already have an account.'
    });
  }
  
  // Hash password before storing (using simple hashing for now)
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user account
  const newUser = {
    username: sanitizedAdmissionNumber,
    email: sanitizedEmail,
    password: hashedPassword,
    createdAt: new Date()
  };
  
  // Create student profile
  const newStudent = {
    alumni_id: sanitizedAdmissionNumber,
    admissionNumber: sanitizedAdmissionNumber,
    name: sanitizedName,
    degree: sanitizeInput(degree),
    department: sanitizeInput(department),
    batch: sanitizeInput(batch),
    contact: sanitizedEmail,
    email: sanitizedEmail,
    phone: sanitizeInput(phone),
    status: 'Active',
    registeredAt: new Date()
  };
  
  // Insert into both collections
  await usersCollection.insertOne(newUser);
  const result = await studentsCollection.insertOne(newStudent);
  
  res.json({
    success: true,
    message: '✅ Registration successful! You can now login with your admission number and password.',
    user: {
      username: sanitizedAdmissionNumber,
      email: sanitizedEmail,
      id: result.insertedId
    }
  });
}));

module.exports = router;
